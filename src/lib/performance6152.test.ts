import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { insertPreloadScript, pagePreloadMap, pagePreloadScript, type PreloadChunk } from "../../page-preload-plugin";
import { EARLY_MAX_AGE_MS, earlyOr, takeEarly } from "@/lib/earlyData";
import { GAME_ROUTE_PAGES, gameRoutePage } from "@/lib/gameRoutes";
import { CHRONICLES_ARCHIVE_KEY } from "@/game/chronicles";

/* 6.14.152 (R4 É30-5b, R9 UX-12) : démarrage plus court. Données du démarrage demandées par index.html, code de la page
   ouverte préchargé dès index.html, une seule navigation rendue, fenêtres rares différées. */

const chunk = (fileName: string, imports: string[] = [], extra: Partial<PreloadChunk> = {}): PreloadChunk => ({ type: "chunk", fileName, imports, ...extra });

describe("6.14.152 : préchargement de la page ouverte (index.html)", () => {
  const bundle: Record<string, PreloadChunk> = {
    "assets/index-a.js": chunk("assets/index-a.js", ["assets/vendor-b.js"], { isEntry: true }),
    "assets/vendor-b.js": chunk("assets/vendor-b.js"),
    "assets/GalaxyPage-c.js": chunk("assets/GalaxyPage-c.js", ["assets/index-a.js", "assets/vendor-b.js", "assets/AttackModal-d.js"], { facadeModuleId: "/x/src/pages/GalaxyPage.tsx" }),
    "assets/AttackModal-d.js": chunk("assets/AttackModal-d.js", ["assets/sword-e.js", "assets/index-a.js"]),
    "assets/sword-e.js": chunk("assets/sword-e.js"),
    "assets/CommercePage-f.js": chunk("assets/CommercePage-f.js", ["assets/sword-e.js"], { facadeModuleId: "/x/src/pages/CommercePage.tsx" }),
    "assets/index-g.css": { type: "asset", fileName: "assets/index-g.css" },
  };

  it("page d'abord, puis ses imports transitifs, sans l'entrée ni ses imports, chaque fichier une fois", () => {
    const map = pagePreloadMap(bundle, { galaxie: "GalaxyPage", commerce: "CommercePage", inconnue: "NopePage" });
    const files = (seg: string) => map.routes[seg].map((i) => map.files[i]);
    expect(files("galaxie")[0]).toBe("assets/GalaxyPage-c.js");
    expect(files("galaxie").sort()).toEqual(["assets/AttackModal-d.js", "assets/GalaxyPage-c.js", "assets/sword-e.js"]);
    expect(files("commerce")).toEqual(["assets/CommercePage-f.js", "assets/sword-e.js"]);
    expect(map.files.filter((f) => f === "assets/sword-e.js")).toHaveLength(1);
    expect(map.routes.inconnue).toBeUndefined();
  });

  it("le script précharge la page de l'adresse ouverte, et rien hors du jeu", () => {
    const script = pagePreloadScript(pagePreloadMap(bundle, { galaxie: "GalaxyPage", "": "CommercePage" }));
    const run = (pathname: string) => {
      const added: string[] = [];
      const doc = { createElement: () => ({}) as Record<string, string>, head: { appendChild: (l: Record<string, string>) => added.push(`${l.rel} ${l.href}`) } };
      new Function("location", "document", script)({ pathname }, doc);
      return added;
    };
    expect(run("/game/galaxie")).toEqual(["modulepreload /assets/GalaxyPage-c.js", "modulepreload /assets/AttackModal-d.js", "modulepreload /assets/sword-e.js"]);
    expect(run("/game")).toEqual(["modulepreload /assets/CommercePage-f.js", "modulepreload /assets/sword-e.js"]);
    expect(run("/")).toEqual([]);
    expect(run("/game/inconnue")).toEqual([]);
  });

  it("le script est placé après le bloc d'entrée et avant la feuille de style du jeu", () => {
    const html = `<head>\n<link href="https://fonts.googleapis.com/css2?x" rel="stylesheet" />\n<script type="module" crossorigin src="/assets/index-a.js"></script>\n<link rel="modulepreload" crossorigin href="/assets/vendor-b.js">\n<link rel="stylesheet" crossorigin href="/assets/index-g.css">\n</head>`;
    const out = insertPreloadScript(html, "PRE()");
    expect(out.indexOf("PRE()")).toBeGreaterThan(out.indexOf("vendor-b.js"));
    expect(out.indexOf("PRE()")).toBeLessThan(out.indexOf("index-g.css"));
    expect(insertPreloadScript("<head></head>", "PRE()")).toContain("<script>PRE()</script>");
  });

  it("chaque page de la table existe dans src/pages (même nom d'export)", () => {
    for (const page of new Set(Object.values(GAME_ROUTE_PAGES))) {
      expect(readFileSync(`src/pages/${page}.tsx`, "utf8"), page).toMatch(new RegExp(`export (function|const) ${page}\\b`));
    }
    expect(gameRoutePage("/game/galaxie")).toBe("GalaxyPage");
    expect(gameRoutePage("/game")).toBe("DashboardPage");
    expect(gameRoutePage("/decisions")).toBeUndefined();
  });
});

describe("6.14.152 : données du démarrage demandées par index.html", () => {
  // Tests sous Node : une fenêtre minimale le temps du test.
  const g = globalThis as unknown as { window?: Window };
  beforeEach(() => {
    g.window = {} as Window;
  });
  afterEach(() => {
    delete g.window;
  });

  it("une réponse anticipée est reprise une seule fois, pour le bon compte, tant qu'elle est récente", async () => {
    const now = Date.now();
    g.window!.__cosmicEarly = { at: now, uid: "u1", players: Promise.resolve({ id: "u1" }), content: Promise.resolve([]) };
    expect(takeEarly("players", "u2", now)).toBeNull();
    await expect(takeEarly("players", "u1", now)).resolves.toEqual({ id: "u1" });
    expect(takeEarly("players", "u1", now)).toBeNull();
    expect(takeEarly("content", undefined, now + EARLY_MAX_AGE_MS + 1)).toBeNull();
    expect(takeEarly("queues", "u1", now)).toBeNull();
  });

  it("une réponse anticipée en échec repasse par le chemin habituel", async () => {
    const failed = Promise.reject(new Error("401"));
    failed.catch(() => undefined);
    g.window!.__cosmicEarly = { at: Date.now(), uid: "u1", queues: failed };
    await expect(earlyOr("queues", "u1", async () => "sdk")).resolves.toBe("sdk");
    await expect(earlyOr("queues", "u1", async () => "sdk2")).resolves.toBe("sdk2");
  });

  it("index.html lit les mêmes données que le jeu, avant la feuille de style des polices", () => {
    const html = readFileSync("index.html", "utf8");
    const early = html.indexOf("window.__cosmicEarly = early");
    expect(early).toBeGreaterThan(0);
    expect(early).toBeLessThan(html.indexOf("fonts.googleapis.com/css2"));
    // Même filtre que contentService (archive des Chroniques exclue), même clé de session que le SDK.
    expect(html).toContain(`key != "${CHRONICLES_ARCHIVE_KEY}"`);
    expect(readFileSync("src/services/contentService.ts", "utf8")).toContain("key != \"${CHRONICLES_ARCHIVE_KEY}\"");
    expect(html).toContain('localStorage.getItem("pocketbase_auth")');
    expect(html).toContain('"/api/collections/players/records/"');
    expect(html).toContain('"/api/collections/queues/records/"');
  });
});

describe("6.14.152 : coque allégée au démarrage", () => {
  it("une seule navigation rendue selon la largeur, menu en une fois, fenêtres rares différées", () => {
    const nav = readFileSync("src/components/layout/NavBar.tsx", "utf8");
    expect(nav).toContain("{desktop !== false && <Sidebar />}");
    expect(nav).toContain("{desktop !== true && <MobileTabBar />}");
    expect(nav.match(/navReady && navGroups/g)).toHaveLength(2);
    const shell = readFileSync("src/components/layout/AppShell.tsx", "utf8");
    expect(shell).toMatch(/\{extrasOn && \(\s*<Suspense fallback=\{null\}>\s*<RankUpCelebration \/>/);
  });
});
