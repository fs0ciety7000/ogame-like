import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TECH_ART, TECH_CODEX_IMAGE, techImage } from "@/game/technologies";
import { DEFAULT_RELICS, relicImage } from "@/game/relics";
import { catalogEntryFor, DEFAULT_SEASON_CATALOG } from "@/game/seasonCatalog";
import { SEASON_PORTRAITS, SEASON_THEME_ART, seasonThemeImage } from "@/game/passSeasons";
import { ARCHETYPES, AUTO_ART_2, autoBossImage } from "@/game/procedural";
import { empireClasses } from "@/game/empireClass";

/* 6.14.26 : illustrations intégrées (docs/illustrations.md). Une image marquée intégrée, ou une techno de TECH_ART, a son
   fichier dans public/assets : sinon la carte ou la fiche du Codex afficherait une image cassée. */

const slots = (JSON.parse(readFileSync("scripts/illustrations.json", "utf8")) as { slots: { id: string; target: string; done: string | null }[] }).slots;

describe("6.14.26 : illustrations intégrées", () => {
  it("chaque image intégrée a son fichier", () => {
    const missing = slots.filter((s) => s.done && !existsSync(s.target)).map((s) => s.id);
    expect(missing).toEqual([]);
  });

  it("chaque techno de TECH_ART a son illustration, les autres gardent l'image provisoire", () => {
    for (const id of TECH_ART) expect(existsSync(`public/assets/technologies/${id}.webp`), id).toBe(true);
    expect(techImage({ id: "tech11" })).toBe("/assets/technologies/tech11.webp");
    expect(techImage({ id: "tech-sans-image" })).toBe(TECH_CODEX_IMAGE);
    expect(techImage({ id: "tech11", image: "/assets/autre.webp" })).toBe("/assets/autre.webp");
  });

  it("identifiants uniques, une seule cible par image", () => {
    expect(new Set(slots.map((s) => s.id)).size).toBe(slots.length);
    expect(new Set(slots.map((s) => s.target)).size).toBe(slots.length);
  });
});

/* 6.14.36 : une annonce illustrée n'est publiée qu'une fois son image produite (page /img) et poussée. */
describe("6.14.36 : annonces et illustrations", () => {
  const src = readFileSync("src/components/game/Announcement.tsx", "utf8");
  const block = src.slice(src.indexOf("export const ANNOUNCEMENTS_ALL"), src.indexOf("export const ANNOUNCEMENTS: Announcement[]"));
  const entries = block.split(/\n {2}\{\n/).slice(1);

  it("une annonce attend son image tant qu'elle n'est pas intégrée, puis pointe sur le fichier", () => {
    const checked: string[] = [];
    for (const e of entries) {
      const slotId = /artSlot: "([^"]+)"/.exec(e)?.[1];
      if (!slotId) continue;
      const slot = slots.find((s) => s.id === slotId);
      expect(slot, slotId).toBeTruthy();
      const pending = /pendingArt: true/.test(e);
      expect(pending, `${slotId} : drapeau pendingArt`).toBe(!slot!.done);
      expect(e, slotId).toContain(`art: "${slot!.target.replace(/^public/, "")}"`);
      checked.push(slotId);
    }
    expect(checked).toContain("annonce-6.14");
  });
});

/* 6.14.118 (É30-7, AJ-15) : chaque relique et chaque classe d'empire a sa ligne dans illustrations.json (prompt, format, détourage),
   et chaque relique a sa propre image : `illustrations.py --missing` et la page /img voient alors toute image à refaire. */
describe("6.14.118 : reliques et classes dans l'atelier d'illustrations", () => {
  const full = (JSON.parse(readFileSync("scripts/illustrations.json", "utf8")) as { slots: { id: string; group: string; target: string; cutout: boolean; prompt: string }[] }).slots;

  it("chaque relique par défaut a une ligne qui vise son image, détourée, avec un prompt", () => {
    for (const t of DEFAULT_RELICS) {
      const target = `public${relicImage(t.id)}`;
      const slot = full.find((s) => s.target === target);
      expect(slot, t.id).toBeTruthy();
      expect(slot!.group, t.id).toBe("Reliques");
      expect(slot!.cutout, t.id).toBe(true);
      expect(slot!.prompt, t.id).toMatch(/--ar 1:1/);
      expect(existsSync(target), `${t.id} : image provisoire ou définitive en place`).toBe(true);
    }
  });

  it("deux reliques n'ont jamais la même image", () => {
    const paths = DEFAULT_RELICS.map((t) => relicImage(t.id));
    expect(new Set(paths).size).toBe(paths.length);
    const hashes = paths.map((p) => createHash("md5").update(readFileSync(`public${p}`)).digest("hex"));
    expect(new Set(hashes).size).toBe(hashes.length);
  });

  it("chaque classe d'empire a sa ligne", () => {
    for (const c of empireClasses()) expect(full.some((s) => s.id === `classe-${c.id}`), c.id).toBe(true);
  });
});

describe("6.14.138 (AU27, lot AP-L11) : illustrations de saison", () => {
  const full = (JSON.parse(readFileSync("scripts/illustrations.json", "utf8")) as { slots: { id: string; group: string; target: string; cutout: boolean; prompt: string; done: string | null }[] }).slots;
  const month = (i: number) => {
    const k = 2026 * 12 + 10 + i;
    return `${Math.floor(k / 12)}-${String((k % 12) + 1).padStart(2, "0")}`;
  };

  it("chaque saison du catalogue a l'illustration de son thème : année 1 (thème), années 2 et 3 (ligne propre)", () => {
    for (const e of DEFAULT_SEASON_CATALOG) {
      const target = e.year === 1 ? `public/assets/pass/theme-${e.theme}.webp` : `public/assets/pass/theme-${e.theme}-${e.year}.webp`;
      const slot = full.find((s) => s.target === target);
      expect(slot, e.id).toBeTruthy();
      expect(slot!.prompt, e.id).toContain(e.scene);
      expect(slot!.prompt, e.id).toMatch(/--ar 16:9/);
    }
  });

  it("chaque commandant des 36 saisons a sa ligne de portrait (prompt de son apparence)", () => {
    for (let i = 0; i < 36; i++) {
      const m = month(i);
      const e = catalogEntryFor(m);
      const slot = full.find((s) => s.target === `public/assets/commanders/s-${m}.webp`);
      expect(slot, m).toBeTruthy();
      expect(slot!.prompt, m).toContain(e.commander.look);
    }
  });

  it("chaque archétype des Chroniques a la ligne de son second boss", () => {
    for (const a of ARCHETYPES) expect(full.some((s) => s.target === `public/assets/chronicles/auto/${a.id}-boss-2.webp` && /--ar 21:9/.test(s.prompt)), a.id).toBe(true);
  });

  it("image provisoire en place tant que le rendu manque ; une image déclarée a son fichier", () => {
    for (const id of SEASON_THEME_ART) {
      const [, theme, year] = /^(.+)_(\d+)$/.exec(id)!;
      expect(existsSync(`public/assets/pass/theme-${theme}-${year}.webp`), id).toBe(true);
    }
    for (const id of AUTO_ART_2) expect(existsSync(`public/assets/chronicles/auto/${id}-boss-2.webp`), id).toBe(true);
    for (const m of SEASON_PORTRAITS) expect(existsSync(`public/assets/commanders/s-${m}.webp`), m).toBe(true);
    // Sans rendu : l'image du thème, l'image unique du boss, le portrait du rôle (portrait vide).
    const vide2 = DEFAULT_SEASON_CATALOG.find((e) => e.id === "vide_2")!;
    expect(seasonThemeImage(vide2, "/assets/pass/theme-vide.webp")).toBe(SEASON_THEME_ART.includes("vide_2") ? "/assets/pass/theme-vide-2.webp" : "/assets/pass/theme-vide.webp");
    expect(seasonThemeImage({ ...vide2, image: "/assets/x.webp" }, "/assets/pass/theme-vide.webp")).toBe("/assets/x.webp");
    const cartel = ARCHETYPES.find((a) => a.id === "cartel")!;
    expect(autoBossImage(cartel, cartel.bossNames[1])).toBe(AUTO_ART_2.includes("cartel") ? "/assets/chronicles/auto/cartel-boss-2.webp" : "/assets/chronicles/auto/cartel-boss.webp");
    expect(autoBossImage(cartel, cartel.bossNames[0])).toBe("/assets/chronicles/auto/cartel-boss.webp");
  });

  it("le générateur choisit l'image de l'année et le second boss une fois branchés", () => {
    const art = SEASON_THEME_ART as string[];
    const art2 = AUTO_ART_2;
    const savedArt = [...art];
    const savedArt2 = [...art2];
    try {
      art.splice(0, art.length, "vide_2");
      art2.splice(0, art2.length, "cartel");
      const vide2 = DEFAULT_SEASON_CATALOG.find((e) => e.id === "vide_2")!;
      expect(seasonThemeImage(vide2, "/assets/pass/theme-vide.webp")).toBe("/assets/pass/theme-vide-2.webp");
      // Saison générée (année 5, prolonge vide_2) : même image.
      expect(seasonThemeImage({ ...vide2, id: "vide_5", year: 5, generatedFrom: "vide_2" }, "/assets/pass/theme-vide.webp")).toBe("/assets/pass/theme-vide-2.webp");
      const cartel = ARCHETYPES.find((a) => a.id === "cartel")!;
      expect(autoBossImage(cartel, cartel.bossNames[1])).toBe("/assets/chronicles/auto/cartel-boss-2.webp");
      expect(autoBossImage(cartel, cartel.bossNames[2])).toBe("/assets/chronicles/auto/cartel-boss.webp");
    } finally {
      art.splice(0, art.length, ...savedArt);
      art2.splice(0, art2.length, ...savedArt2);
    }
  });
});
