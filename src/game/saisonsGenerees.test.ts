import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent, defaultGameContent, validateGameContent } from "@/game/content";
import { shiftMonth } from "@/game/narrative";
import { generatePassSeason } from "@/game/passSeasons";
import { CATALOG_START, catalogCycle, catalogEntryFor, DEFAULT_SEASON_CATALOG, DEFAULT_THEME_PRIMARY, SEASON_GEN_RULES, validateSeasonGenRules } from "@/game/seasonCatalog";
import type { WorldDigest } from "@/game/procedural";

/* 6.14.139 (AU27, lot AP-L12, constat AP-8, Q-AP5) : catalogue des saisons au-delà de 36 mois. */

const NOW = Date.UTC(2029, 9, 20, 12);
const months = (n: number) => Array.from({ length: n }, (_, i) => shiftMonth(CATALOG_START, i));
const digest = (monthId: string): WorldDigest => ({
  monthId,
  observedDays: 20,
  activePlayers: 12,
  weeklyMedian: { victory: 3, contract: 4, spy: 3, market: 3, bounty: 2, mission: 6 },
  totals: {},
  heroes: {},
  episodes: [],
  passMedianTier: 18,
  passTiers: 30,
  passFinishedShare: 0.3,
  chapterShare: 0.4,
  passPace: { median: 60, top: 150 },
  allianceSizeMedian: 4,
});

afterEach(() => {
  applyGameContent({});
});

describe("6.14.139 : saisons générées au-delà du cycle écrit", () => {
  it("48 mois puis 96 : aucun nom de saison, aucun commandant, aucune paire de rôles répétés", () => {
    applyGameContent({});
    for (const n of [48, 96]) {
      const entries = months(n).map(catalogEntryFor);
      expect(new Set(entries.map((e) => e.name)).size, `${n} mois : noms`).toBe(n);
      expect(new Set(entries.map((e) => e.commander.name)).size, `${n} mois : commandants`).toBe(n);
      const pairs = entries.map((e) => `${DEFAULT_THEME_PRIMARY[e.theme]}+${e.commander.secondary}`);
      expect(new Set(pairs).size, `${n} mois : paires de rôles`).toBe(n);
      for (const e of entries) expect(e.commander.secondary).not.toBe(DEFAULT_THEME_PRIMARY[e.theme]);
    }
    // Commandants : 240 mois sans homonyme (20 ans).
    expect(new Set(months(240).map((m) => catalogEntryFor(m).commander.name)).size).toBe(240);
  });

  it("les 36 mois écrits ne changent pas ; après, une saison générée qui prolonge la saison du même rang", () => {
    applyGameContent({});
    expect(catalogCycle()).toBe(36);
    const written = months(36).map(catalogEntryFor);
    expect(written).toEqual(months(36).map((_, i) => DEFAULT_SEASON_CATALOG.find((e) => e.id === written[i].id)));
    const nov29 = catalogEntryFor("2029-11");
    expect(nov29).toMatchObject({ id: "vide_4", theme: "vide", year: 4, generatedFrom: "vide_1" });
    expect(nov29.name.startsWith("L'Appel du Vide : ")).toBe(true);
    expect(nov29.synopsis).toContain(DEFAULT_SEASON_CATALOG[0].synopsis);
    expect(nov29.commander.look).toMatch(/woman|man/);
    expect(catalogEntryFor("2029-11")).toEqual(nov29);
    // Retour arrière : le catalogue reboucle.
    SEASON_GEN_RULES.enabled = false;
    expect(catalogEntryFor("2029-11")).toEqual(catalogEntryFor("2026-11"));
  });

  it("passe d'un mois généré : thème, nom et commandant de la saison générée ; passes du cycle écrit inchangés", () => {
    applyGameContent({});
    const pass = (m: string) => generatePassSeason({ monthId: m, digest: digest(shiftMonth(m, -1)), existing: [], now: NOW });
    const p = pass("2029-11");
    expect(p.theme.id).toBe("vide");
    expect(p.theme.name).toBe(catalogEntryFor("2029-11").name);
    expect(p.commander.name).toBe(catalogEntryFor("2029-11").commander.name);
    expect(p.commander.name).not.toBe(pass("2026-11").commander.name);
    expect(p.auto?.reasons.join(" ")).toMatch(/saison générée au-delà du cycle/);
    const before = pass("2027-03");
    SEASON_GEN_RULES.enabled = false;
    expect(pass("2027-03")).toEqual(before);
  });

  it("une année écrite dans l'admin repousse la génération (cycle de 48)", () => {
    const year4 = DEFAULT_SEASON_CATALOG.filter((e) => e.year === 1).map((e) => ({ ...e, id: `${e.theme}_4`, year: 4, name: `${e.name} (écrite, année 4)` }));
    applyGameContent({ seasonCatalog: [...DEFAULT_SEASON_CATALOG, ...year4] } as never);
    expect(catalogCycle()).toBe(48);
    expect(catalogEntryFor("2029-11").name).toBe("L'Appel du Vide (écrite, année 4)");
    expect(catalogEntryFor("2030-11").generatedFrom).toBe("vide_1");
    expect(catalogEntryFor("2030-11").year).toBe(5);
  });

  it("réglages lus dans la règle et validés", () => {
    applyGameContent({ rules: { seasonGen: { subtitles: ["la Seule"] } } } as never);
    expect(catalogEntryFor("2029-11").name).toBe("L'Appel du Vide : la Seule");
    expect(validateSeasonGenRules({ subtitles: [], firstNames: { f: ["A"], m: [] }, roleTitles: { admiral: ["Amiral"] } } as never)).toHaveLength(3);
    const d = defaultGameContent();
    expect(validateGameContent({ ...d, rules: { ...d.rules, seasonGen: { ...SEASON_GEN_RULES, lastNames: [] } } } as never).join(" ")).toMatch(/lastNames/);
  });
});
