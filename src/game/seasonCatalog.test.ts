import { describe, expect, it } from "vitest";
import { CATALOG_START, catalogEntryFor, catalogIndex, illustrationPrompt, portraitPrompt, SEASON_CATALOG, THEME_PRIMARY, THEME_ROTATION } from "@/game/seasonCatalog";
import { generatePassSeason, PASS_THEMES, publishPassSeason, validatePassSeasons, type PassSeason } from "@/game/passSeasons";
import { COMMANDER_ROLES, RARE_ROLES } from "@/game/commanders";
import { nextMonthId } from "@/game/passSeasons";

const digest = { monthId: "x", observedDays: 25, activePlayers: 20, weeklyMedian: {}, totals: {}, heroes: {}, episodes: [], passMedianTier: 18, passTiers: 30, passFinishedShare: 0.3, chapterShare: 0.4 };

describe("v5.14 catalogue des saisons", () => {
  it("36 saisons : douze thèmes × trois ans, chacun présent au générateur", () => {
    expect(SEASON_CATALOG).toHaveLength(36);
    for (const theme of THEME_ROTATION) {
      expect(PASS_THEMES.some((t) => t.id === theme)).toBe(true);
      expect(SEASON_CATALOG.filter((e) => e.theme === theme).map((e) => e.year).sort()).toEqual([1, 2, 3]);
    }
  });

  it("douze rôles principaux, et 36 commandants aux effets tous différents", () => {
    expect(new Set(Object.values(THEME_PRIMARY)).size).toBe(12);
    expect([...new Set(Object.values(THEME_PRIMARY))].sort()).toEqual([...COMMANDER_ROLES].sort());
    const pairs = SEASON_CATALOG.map((e) => `${THEME_PRIMARY[e.theme]}+${e.commander.secondary}`);
    expect(new Set(pairs).size).toBe(36);
    for (const e of SEASON_CATALOG) expect(e.commander.secondary).not.toBe(THEME_PRIMARY[e.theme]);
    expect(new Set(SEASON_CATALOG.map((e) => e.commander.name)).size).toBe(36);
    expect(new Set(SEASON_CATALOG.map((e) => e.name)).size).toBe(36);
    // Chaque rôle rare se débloque au moins trois fois en trois ans (rôle principal).
    for (const r of RARE_ROLES) expect(SEASON_CATALOG.filter((e) => THEME_PRIMARY[e.theme] === r)).toHaveLength(3);
  });

  it("rotation mensuelle : un thème différent chaque mois, boucle tous les trois ans", () => {
    expect(catalogIndex(CATALOG_START)).toBe(0);
    let m = CATALOG_START;
    const seen: string[] = [];
    for (let i = 0; i < 40; i++) {
      const e = catalogEntryFor(m);
      if (seen.length) expect(e.theme).not.toBe(seen[seen.length - 1]);
      seen.push(e.theme);
      m = nextMonthId(m);
    }
    expect(catalogEntryFor("2029-11")).toBe(catalogEntryFor(CATALOG_START));
    expect(catalogEntryFor("2027-11").year).toBe(2);
    expect(catalogEntryFor("2026-12").theme).toBe("hiver");
  });

  it("chaque saison a ses deux prompts, et le passe généré reprend le catalogue", () => {
    for (const e of SEASON_CATALOG) {
      expect(portraitPrompt(e, "#fff")).toContain(e.commander.name);
      expect(illustrationPrompt(e, "#fff")).toMatch(/--ar 16:9/);
    }
    let m = CATALOG_START;
    const seasons: PassSeason[] = [];
    for (let i = 0; i < 36; i++) {
      const s = generatePassSeason({ monthId: m, digest: { ...digest, monthId: m }, existing: seasons, now: 0 });
      const e = catalogEntryFor(m);
      expect(s.theme.name).toBe(e.name);
      expect(s.commander.name).toBe(e.commander.name);
      expect(s.commander.primary).toBe(THEME_PRIMARY[e.theme]);
      expect(s.theme.prompt).toContain("16:9");
      seasons.push(publishPassSeason(s, 0));
      m = nextMonthId(m);
    }
    expect(validatePassSeasons({ seasons })).toEqual([]);
  });
});
