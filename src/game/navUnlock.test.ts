import { afterEach, describe, expect, it } from "vitest";
import { newPlayerProfile } from "@/game/actions";
import { GUIDE_STEPS } from "@/game/advancedGuide";
import { applyGameContent } from "@/game/content";
import { ONBOARDING_STEPS } from "@/game/onboarding";
import { PVP_RULES } from "@/game/pvp";
import { RANKS } from "@/game/ranks";
import {
  moonPanelVisible,
  NAV_ALWAYS_VISIBLE,
  NAV_SHOW_ALL_OFF,
  NAV_SHOW_ALL_ON,
  NAV_SIGNALS,
  NAV_UNLOCK_RULES,
  navClosedPages,
  navCondition,
  navMarkId,
  NAV_PAGE_LABELS,
  ACHIEVEMENT_PAGES,
  achievementClosedPage,
  navOpeningNotice,
  navAlwaysMenuCount,
  navPreview,
  navOpenPages,
  navPageOpen,
  navPath,
  navStatus,
  nextNavOpening,
  OBJECTIVE_PAGES,
  type NavContext,
} from "@/game/navUnlock";
import type { PlayerState } from "@/types/game";

/* 6.14.74 (DP-L1) : ouverture progressive du menu, invariant I30. */

const NAVBAR = import.meta.glob("../components/layout/NavBar.tsx", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const SOURCES = import.meta.glob(["./*.ts", "!./*.test.ts"], { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const APP = import.meta.glob("../App.tsx", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

/** Entrées du menu (barre latérale, pied de barre et palette) lues dans `NavBar.tsx`. */
function menuEntries(): string[] {
  const src = Object.values(NAVBAR)[0];
  const out: string[] = [];
  const re = /\{\s*to:\s*"([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) out.push(m[1]);
  return [...new Set(out)];
}

const FROM = NAV_UNLOCK_RULES.newAccountsFrom;
const xpOf = (id: string) => RANKS.find((r) => r.id === id)!.xp;

function fresh(over: Partial<PlayerState> = {}, now = FROM + 3_600_000): PlayerState {
  const { player } = newPlayerProfile("u1", "Recrue", now);
  return { ...player, ...over };
}
const ctx = (over: Partial<NavContext> = {}): NavContext => ({ now: FROM + 3_600_000, ...over });

/** Ce que montre le menu (hors palette, hors Ascension avant la 1re, hors concours) : même règle que `useHiddenRoutes`. */
function visibleMenu(p: PlayerState, c: NavContext): string[] {
  const closed = new Set(navClosedPages(p, c));
  const legacyHidden = new Set(["/game/ascension", "/game/concours", "/game/formules", "/game/palmares"]);
  return menuEntries().filter((to) => !closed.has(to) && !legacyHidden.has(to));
}

afterEach(() => applyGameContent({}));

describe("6.14.74 ouverture progressive du menu (I30)", () => {
  it("garde : chaque entrée du menu a une règle navUnlock ou est toujours visible", () => {
    const always = new Set<string>(NAV_ALWAYS_VISIBLE);
    const missing = menuEntries().filter((to) => !NAV_UNLOCK_RULES.pages[to] && !always.has(to));
    expect(missing).toEqual([]);
    // Et une règle ne vise pas une page qui n'existe plus au menu.
    expect(Object.keys(NAV_UNLOCK_RULES.pages).filter((page) => !menuEntries().includes(page))).toEqual([]);
  });

  it("compte neuf à J0 : 13 entrées (7 + pied de barre), le reste caché", () => {
    const p = fresh();
    expect(navStatus(p, ctx())).toBe("progressive");
    const menu = visibleMenu(p, ctx());
    expect(menu).toEqual(["/game", "/game/ordres", "/game/ressources", "/game/batiments", "/game/unites", "/game/labo", "/game/messages", "/game/profil", "/game/nouveautes", "/game/annonces", "/game/signalements", "/bible", "/devblog"]);
    expect(menu.length).toBeLessThanOrEqual(15);
    expect(navClosedPages(p, ctx()).length).toBe(Object.keys(NAV_UNLOCK_RULES.pages).length);
  });

  it("chaque page s'ouvre au plus tard à son rang plafond", () => {
    for (const [page, rule] of Object.entries(NAV_UNLOCK_RULES.pages)) {
      if (!rule.rank) continue;
      const before = fresh({ xp: Math.max(0, xpOf(rule.rank) - 1) });
      const at = fresh({ xp: xpOf(rule.rank), ...(rule.requires?.includes("inAlliance") ? { allianceId: "a1" } : {}) });
      expect(navPageOpen(before, page, ctx()), `${page} avant ${rule.rank}`).toBe(false);
      expect(navPageOpen(at, page, ctx()), `${page} à ${rule.rank}`).toBe(true);
    }
  });

  it("Or III (avec une alliance et les extracteurs au niveau des projets de prestige) : tout est ouvert", () => {
    // 6.14.85 (RL-2) : Prestige n'a pas de rang plafond, seulement sa condition (4 extracteurs au niveau requis).
    const extractors = (p: PlayerState) => {
      for (const id of ["extracteur_ferraille", "reacteur_instable", "extracteur_nanocomposants", "archives_fracturees"]) p.buildings[id] = { ...p.buildings[id], unlocked: true, level: 10 };
      return p;
    };
    const p = extractors(fresh({ xp: xpOf("or3"), allianceId: "a1" }));
    expect(navClosedPages(p, ctx())).toEqual([]);
    expect(nextNavOpening(p, ctx())).toBeNull();
    // Sans alliance, seule la Guerre de territoire reste fermée.
    expect(navClosedPages(extractors(fresh({ xp: xpOf("or3") })), ctx())).toEqual(["/game/guerre-territoire"]);
    // Extracteurs en dessous : Prestige reste fermé, quel que soit le rang, et sa condition se lit.
    expect(navClosedPages(fresh({ xp: xpOf("or3"), allianceId: "a1" }), ctx())).toEqual(["/game/prestige"]);
    expect(navCondition("/game/prestige")).toMatch(/extracteurs/);
  });

  it("une page ouverte ne se referme jamais : marque nav: ou astuce tip: déjà vue", () => {
    const p = fresh({ announcementsSeen: [navMarkId("/game/casino"), "tip:commerce"] });
    expect(navPageOpen(p, "/game/casino", ctx())).toBe(true);
    expect(navPageOpen(p, "/game/commerce", ctx())).toBe(true);
    expect(navPageOpen(p, "/game/seigneurs", ctx())).toBe(false);
    expect(navMarkId("/game/statistiques?onglet=lune")).toBe("nav:statistiques");
  });

  it("un danger ouvre Galaxie, Combats et Menaces sur-le-champ", () => {
    const dangerPages = ["/game/galaxie", "/game/combats", "/game/menaces"];
    // Flotte hostile en approche (raid scripté de Varan compris), rapport reçu, combat subi, ultimatum.
    const cases: [string, PlayerState, NavContext][] = [
      ["flotte hostile", fresh(), ctx({ hostileIncoming: true })],
      ["rapport reçu", fresh(), ctx({ reportReceived: true })],
      ["raid scripté lancé", fresh({ onboarding: { claimed: [], tutorialRaid: "sent" } }), ctx()],
      ["défaite", fresh({ defeats: 1, lastDefeatAtMs: FROM }), ctx()],
      ["ultimatum", fresh({ stats: { ultimatums: 1 } }), ctx()],
    ];
    for (const [label, p, c] of cases) for (const page of dangerPages) expect(navPageOpen(p, page, c), `${label} → ${page}`).toBe(true);
    // Un contact de seigneur ouvre sa page.
    expect(navPageOpen(fresh(), "/game/seigneurs", ctx({ warlordContact: true }))).toBe(true);
  });

  it("fin de la protection de débutant : Combats et Menaces s'ouvrent", () => {
    const created = FROM + 1;
    const p = fresh({ createdAtMs: created });
    expect(navPageOpen(p, "/game/combats", { now: created + PVP_RULES.newbieProtectionMs - 1 })).toBe(false);
    expect(navPageOpen(p, "/game/combats", { now: created + PVP_RULES.newbieProtectionMs })).toBe(true);
    expect(navPageOpen(p, "/game/menaces", { now: created + PVP_RULES.newbieProtectionMs })).toBe(true);
  });

  it("signaux d'usage : première unité, colonie proche, alliance, relique, lune", () => {
    expect(navPageOpen(fresh({ units: { drone_recuperateur: { level: 1, count: 0 } } }), "/game/missions", ctx())).toBe(true);
    expect(navPageOpen(fresh({ allianceId: "a1" }), "/game/alliance", ctx())).toBe(true);
    expect(navPageOpen(fresh({ allianceId: "a1" }), "/game/guerre-territoire", ctx())).toBe(false);
    expect(navPageOpen(fresh({ allianceId: "a1" }), "/game/guerre-territoire", ctx({ allianceAtWar: true }))).toBe(true);
    expect(navPageOpen(fresh(), "/game/guerre-territoire", ctx({ allianceAtWar: true })), "jamais sans alliance").toBe(false);
    expect(navPageOpen(fresh({ moonPity: 0.1 }), "/game/statistiques", ctx())).toBe(true);
    expect(navPageOpen(fresh({ colonies: [{} as never] }), "/game/colonies", ctx())).toBe(true);
    expect(navPageOpen(fresh({ bounties: { amber: 5 } as never }), "/game/portefeuille", ctx())).toBe(true);
    expect(navPageOpen(fresh({ stats: { marketTrades: 1 } }), "/game/commerce", ctx())).toBe(true);
  });

  it("garde : chaque signal de NAV_SIGNALS est lu par navSignals", () => {
    const src = SOURCES["./navUnlock.ts"];
    const body = src.slice(src.indexOf("export function navSignals"), src.indexOf("export function navStepReached"));
    for (const s of NAV_SIGNALS) expect(body.includes(`out.add("${s}")`), s).toBe(true);
    // Et chaque signal cité par une règle existe.
    for (const [page, rule] of Object.entries(NAV_UNLOCK_RULES.pages)) for (const s of [...(rule.signals ?? []), ...(rule.requires ?? [])]) expect((NAV_SIGNALS as readonly string[]).includes(s), `${page} : ${s}`).toBe(true);
  });

  it("Prise en main : l'étape en cours ne vise jamais une page fermée", () => {
    for (let i = 0; i < ONBOARDING_STEPS.length; i++) {
      const step = ONBOARDING_STEPS[i];
      const p = fresh({ onboarding: { claimed: ONBOARDING_STEPS.slice(0, i).map((s) => s.id) } });
      expect(navPageOpen(p, navPath(step.to), ctx()), `${step.id} → ${step.to}`).toBe(true);
    }
  });

  it("Carnet du commandant : l'étape en cours ne vise jamais une page fermée", () => {
    for (let i = 0; i < GUIDE_STEPS.length; i++) {
      const step = GUIDE_STEPS[i];
      const p = fresh({ xp: xpOf("fer2"), onboarding: { claimed: ONBOARDING_STEPS.map((s) => s.id), advanced: GUIDE_STEPS.slice(0, i).map((s) => s.id) } });
      expect(navPageOpen(p, navPath(step.to), ctx()), `${step.id} → ${step.to}`).toBe(true);
    }
  });

  it("comptes existants (Q103) : créés avant la date et à Fer II, ils voient tout sans écriture", () => {
    const veteran = fresh({ createdAtMs: FROM - 1, xp: xpOf("fer2") });
    expect(navStatus(veteran, ctx())).toBe("veteran");
    expect(navClosedPages(veteran, ctx())).toEqual([]);
    expect(veteran.announcementsSeen ?? []).toEqual([]);
    // Date de création absente : ancien compte.
    expect(navStatus(fresh({ createdAtMs: undefined, xp: xpOf("fer2") }), ctx())).toBe("veteran");
    // Ancien compte encore sous Fer II : ouverture progressive.
    expect(navStatus(fresh({ createdAtMs: FROM - 1, xp: xpOf("fer2") - 1 }), ctx())).toBe("progressive");
    // Compte neuf au-delà de Fer II : progressif aussi (le rang a ouvert ses pages).
    expect(navStatus(fresh({ xp: xpOf("fer2") }), ctx())).toBe("progressive");
  });

  it("admin, « Tout afficher » et `enabled` à faux rendent l'ancien menu", () => {
    const p = fresh();
    expect(navClosedPages(p, ctx({ admin: true }))).toEqual([]);
    const on = fresh({ announcementsSeen: [NAV_SHOW_ALL_ON] });
    expect(navStatus(on, ctx())).toBe("showAll");
    expect(navClosedPages(on, ctx())).toEqual([]);
    const off = fresh({ announcementsSeen: [NAV_SHOW_ALL_ON, NAV_SHOW_ALL_OFF] });
    expect(navStatus(off, ctx())).toBe("progressive");
    applyGameContent({ rules: { navUnlock: { enabled: false } } } as never);
    expect(navStatus(p, ctx())).toBe("disabled");
    expect(navOpenPages(p, ctx()).size).toBe(Object.keys(NAV_UNLOCK_RULES.pages).length);
  });

  it("réglage partiel dans l'admin : une page change, les autres restent", () => {
    applyGameContent({ rules: { navUnlock: { pages: { "/game/casino": { rank: "fer3" } } } } } as never);
    expect(NAV_UNLOCK_RULES.pages["/game/casino"].rank).toBe("fer3");
    expect(NAV_UNLOCK_RULES.pages["/game/galaxie"].step).toBe("spy");
    expect(NAV_UNLOCK_RULES.veteranRank).toBe("fer2");
    expect(navPageOpen(fresh({ xp: xpOf("fer3") }), "/game/casino", ctx())).toBe(true);
    applyGameContent({});
    expect(NAV_UNLOCK_RULES.pages["/game/casino"].rank).toBe("argent3");
  });

  it("prochaine ouverture : Galaxie et Alliance à Fer III, condition lisible", () => {
    const next = nextNavOpening(fresh({ xp: 40 }), ctx());
    expect(next).toMatchObject({ pages: ["/game/galaxie", "/game/alliance"], rankId: "fer3", xp: 40, targetXp: 100 });
    expect(navCondition("/game/commerce")).toBe("S'ouvre à Bronze III ou avec ton premier échange au marché");
    expect(navCondition("/game/guerre-territoire")).toMatch(/il faut une alliance/);
  });

  it("panneau Lune : seulement avec une lune, une réserve de pitié ou le chapitre « Ta lune » du Carnet", () => {
    expect(moonPanelVisible(fresh())).toBe(false);
    expect(moonPanelVisible(fresh({ moonPity: 0.2 }))).toBe(true);
    expect(moonPanelVisible(fresh({ moon: { bornAtMs: 1 } as never }))).toBe(true);
    const moonStep = GUIDE_STEPS.findIndex((s) => s.chapter === "moon");
    const atMoon = fresh({ xp: xpOf("fer2"), onboarding: { claimed: ONBOARDING_STEPS.map((s) => s.id), advanced: GUIDE_STEPS.slice(0, moonStep).map((s) => s.id) } });
    expect(moonPanelVisible(atMoon)).toBe(true);
  });

  it("objectifs du passe et des Chroniques : chaque page visée est au menu", () => {
    const entries = menuEntries();
    for (const [key, page] of Object.entries(OBJECTIVE_PAGES)) expect(entries.includes(page), key).toBe(true);
  });

  it("masquer sans bloquer : ni les actions ni les routes ne lisent l'ouverture du menu", () => {
    expect(SOURCES["./actions.ts"]).not.toMatch(/navUnlock/);
    expect(Object.values(APP)[0]).not.toMatch(/navUnlock|navPageOpen/);
  });
});

describe("6.14.79 (DP-L4) notification « Nouveau : … » et mémoire des pages annoncées", () => {
  it("libellés : chaque page réglée a le nom de son entrée du menu", () => {
    const src = Object.values(NAVBAR)[0];
    for (const page of Object.keys(NAV_UNLOCK_RULES.pages)) {
      const m = new RegExp(`to: "${page.replace(/[/-]/g, "\\$&")}",[^}]*label: "([^"]+)"`).exec(src);
      expect(m?.[1], page).toBe(NAV_PAGE_LABELS[page]);
    }
  });

  it("première lecture : les pages déjà ouvertes sont notées en silence ; puis une seule notification par palier", () => {
    const p = fresh({ xp: 120 });
    // Compte d'avant le lot (mémoire absente) : Galaxie et Alliance, déjà ouvertes à Fer III, ne sont pas annoncées.
    expect(navOpeningNotice(p, ctx())).toBeNull();
    expect(p.stats?.navAnnounced).toEqual(["/game/galaxie", "/game/alliance"]);
    expect(navOpeningNotice(p, ctx())).toBeNull();
    // Fer II : une notification qui cite toutes les pages du palier, avec un lien vers la première.
    p.xp = xpOf("fer2");
    const n = navOpeningNotice(p, ctx());
    expect(n).toMatchObject({ kind: "system", link: "/game/missions", read: false });
    expect(n!.title).toBe("Nouveau : Missions, Combats, Menaces, Classement, Succès, Passe, Primes, Classe d'empire et Journal");
    expect(n!.message).toMatch(/Tu as atteint Fer II/);
    // Pas deux fois.
    expect(navOpeningNotice(p, ctx())).toBeNull();
  });

  it("compte neuf : rien à J0, puis un danger annonce Galaxie, Combats, Menaces et Primes ensemble", () => {
    const p = fresh();
    expect(navOpeningNotice(p, ctx())).toBeNull();
    expect(p.stats?.navAnnounced).toEqual([]);
    p.onboarding = { claimed: [], tutorialRaid: "sent" };
    const n = navOpeningNotice(p, ctx());
    expect(n?.title).toBe("Nouveau : Galaxie, Combats, Menaces et Primes");
    expect(n?.message).toMatch(/menace/);
  });

  it("fin de la protection de débutant : Combats et Menaces, avec son texte", () => {
    const created = FROM + 1;
    const p = fresh({ createdAtMs: created });
    expect(navOpeningNotice(p, { now: created + 1000 })).toBeNull();
    const n = navOpeningNotice(p, { now: created + PVP_RULES.newbieProtectionMs });
    expect(n?.title).toBe("Nouveau : Combats et Menaces");
    expect(n?.message).toMatch(/protection de débutant est finie/);
  });

  it("page visitée (marque nav:) : notée sans notification ; page annoncée : reste ouverte (I30)", () => {
    const p = fresh({ stats: { navAnnounced: [] }, announcementsSeen: [navMarkId("/game/casino")] });
    expect(navOpeningNotice(p, ctx())).toBeNull();
    expect(p.stats?.navAnnounced).toEqual(["/game/casino"]);
    // Une page annoncée ne se referme pas, même si son déclencheur disparaît (alliance quittée, XP retirée).
    const q = fresh({ stats: { navAnnounced: ["/game/alliance"] } });
    expect(navPageOpen(q, "/game/alliance", ctx())).toBe(true);
  });

  it("ancien compte, admin, menu désactivé : rien n'est écrit ; « Tout afficher » : mémoire en silence", () => {
    const veteran = fresh({ createdAtMs: FROM - 1, xp: xpOf("or3") });
    expect(navOpeningNotice(veteran, ctx())).toBeNull();
    expect(veteran.stats?.navAnnounced).toBeUndefined();
    const admin = fresh({ xp: xpOf("fer2") });
    expect(navOpeningNotice(admin, ctx({ admin: true }))).toBeNull();
    expect(admin.stats?.navAnnounced).toBeUndefined();
    const all = fresh({ xp: xpOf("fer2"), stats: { navAnnounced: [] }, announcementsSeen: [NAV_SHOW_ALL_ON] });
    expect(navOpeningNotice(all, ctx())).toBeNull();
    expect(all.stats?.navAnnounced?.length).toBeGreaterThan(5);
    applyGameContent({ rules: { navUnlock: { enabled: false } } } as never);
    const off = fresh({ xp: xpOf("fer2"), stats: { navAnnounced: [] } });
    expect(navOpeningNotice(off, ctx())).toBeNull();
    expect(off.stats?.navAnnounced).toEqual([]);
  });

  it("garde : le serveur appelle la notification dans la transaction de l'action, avant l'enregistrement (I24)", () => {
    const pb = import.meta.glob("../../pocketbase/pb_hooks/cosmic.pb.js", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
    const route = Object.values(pb)[0];
    const i = route.indexOf("db.navOpeningNotice(");
    expect(i).toBeGreaterThan(route.indexOf("game.performPlayerAction("));
    expect(i).toBeLessThan(route.indexOf("db.savePlayer(txApp, game, loaded, out.player"));
    const entry = import.meta.glob("../server/hooksEntry.ts", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
    expect(Object.values(entry)[0]).toMatch(/navOpeningNotice/);
  });
});

describe("6.14.80 (DP-L5) admin : aperçu d'un compte neuf et section dédiée", () => {
  const ADMIN = import.meta.glob(["../pages/admin/panels.tsx", "../pages/admin/NavUnlockRulesFields.tsx"], { query: "?raw", import: "default", eager: true }) as Record<string, string>;

  it("aperçu : 13 entrées à J0, puis le rang, l'alliance et le danger ouvrent leurs pages", () => {
    expect(navAlwaysMenuCount()).toBe(13);
    const j0 = navPreview({ rankId: "non_classe" }, FROM);
    expect(j0.status).toBe("progressive");
    expect(j0.menuEntries).toBe(13);
    expect(j0.next?.rankId).toBe("fer3");
    expect(navPreview({ rankId: "fer2" }, FROM).open.map((o) => o.page)).toEqual(expect.arrayContaining(["/game/galaxie", "/game/missions", "/game/journal"]));
    const or3 = navPreview({ rankId: "or3" }, FROM);
    // 6.14.85 (RL-2) : Prestige s'ouvre par sa seule condition (extracteurs), jamais par le rang.
    expect(or3.closed.map((c) => c.page)).toEqual(["/game/guerre-territoire", "/game/prestige"]);
    expect(or3.closed[0].condition).toMatch(/il faut une alliance/);
    expect(navPreview({ rankId: "or3", alliance: true }, FROM).closed.map((c) => c.page)).toEqual(["/game/prestige"]);
    expect(navPreview({ rankId: "non_classe", danger: true }, FROM).open.map((o) => o.page)).toEqual(expect.arrayContaining(["/game/galaxie", "/game/combats", "/game/menaces"]));
    expect(navPreview({ rankId: "non_classe", hoursSinceSignup: 72 }, FROM).open.map((o) => o.page)).toEqual(["/game/combats", "/game/menaces"]);
  });

  it("aperçu avec un brouillon : appliqué au calcul, puis les règles en vigueur reviennent intactes", () => {
    const before = structuredClone(NAV_UNLOCK_RULES);
    const draft = { ...NAV_UNLOCK_RULES, pages: { ...NAV_UNLOCK_RULES.pages, "/game/casino": { rank: "non_classe" } } };
    expect(navPreview({ rankId: "non_classe" }, FROM, draft).open.map((o) => o.page)).toEqual(["/game/casino"]);
    expect(navPreview({ rankId: "non_classe" }, FROM, { ...NAV_UNLOCK_RULES, enabled: false }).status).toBe("disabled");
    expect(NAV_UNLOCK_RULES).toEqual(before);
  });

  it("la section « Ouverture du menu » est montée dans Admin → Règles et règle chaque champ du groupe", () => {
    const panels = ADMIN["../pages/admin/panels.tsx"];
    const fields = ADMIN["../pages/admin/NavUnlockRulesFields.tsx"];
    expect(panels).toMatch(/<NavUnlockRulesFields rules=\{rules\} setRules=\{setRules\} \/>/);
    for (const key of Object.keys(NAV_UNLOCK_RULES).filter((k) => k !== "pages")) expect(fields, key).toMatch(new RegExp(`set\\(\\{ ${key}:`));
    for (const key of ["rank", "step", "signals", "requires"]) expect(fields, key).toMatch(new RegExp(`setPage\\(page, \\{ ${key}:`));
  });
});

describe("6.14.81 (DP-L6) succès d'un système fermé", () => {
  it("chaque mesure listée existe et vise une page du menu progressif", async () => {
    const { METRICS } = await import("@/game/achievements");
    for (const [metric, page] of Object.entries(ACHIEVEMENT_PAGES)) {
      expect(metric in METRICS, metric).toBe(true);
      expect(NAV_UNLOCK_RULES.pages[page], `${metric} → ${page}`).toBeTruthy();
    }
  });

  it("compte neuf : un succès de combat est « À découvrir » ; un succès de construction garde sa progression", () => {
    const closed = new Set(navClosedPages(fresh(), ctx()));
    expect(achievementClosedPage("victories", closed)).toBe("/game/galaxie");
    expect(achievementClosedPage("buildingLevels", closed)).toBeNull();
    expect(achievementClosedPage("victories", new Set())).toBeNull();
  });
});
