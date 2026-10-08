import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent, defaultGameContent, validateGameContent } from "@/game/content";
import type { ChronicleMonth } from "@/game/chronicles";
import { freshTemplates, NARRATIVE_RULES, shiftMonth, templateUsed, validateNarrativeRules, yearArchetypeFor } from "@/game/narrative";
import { generatePassSeason } from "@/game/passSeasons";
import { GENERATOR_VERSION, generateChapter, outdatedChapters, type WorldDigest } from "@/game/procedural";
import { CHRONICLE_GEN_RULES } from "@/game/chronicleGen";

/* 6.14.137 (AU27, lot AP-L10, constats AP-7 et AP-14) : variété narrative. */

const NOW = Date.UTC(2026, 9, 20, 12);
const MEDIAN = { victory: 3, contract: 4, spy: 3, market: 3, bounty: 2, mission: 6, raidRepelled: 1, warlordWin: 0.5, bossAssault: 0.6 };
const digest = (monthId: string): WorldDigest => ({
  monthId,
  observedDays: 20,
  activePlayers: 12,
  weeklyMedian: MEDIAN,
  totals: { victory: 30, spy: 12 },
  heroes: { victory: { pseudo: "Nova", count: 12 }, mission: { pseudo: "Kaz", count: 40 } },
  episodes: [],
  passMedianTier: 18,
  passTiers: 30,
  passFinishedShare: 0.3,
  chapterShare: 0.4,
  passPace: { median: 60, top: 150 },
  allianceSizeMedian: 4,
});

/** Mois enchaînés comme le serveur (chaque mois voit les mois déjà écrits). */
function chain(from: string, n: number): ChronicleMonth[] {
  const out: ChronicleMonth[] = [];
  for (let i = 0; i < n; i++) {
    const m = shiftMonth(from, i);
    out.push(generateChapter({ monthId: m, digest: digest(shiftMonth(m, -1)), existing: [...out], now: NOW }));
  }
  return out;
}
const lines = (ms: ChronicleMonth[]) => ms.flatMap((m) => m.episodes.flatMap((e) => e.lines.map((l) => l.text)));
const distinct = (xs: string[]) => new Set(xs).size / xs.length;

afterEach(() => {
  applyGameContent({});
});

describe("6.14.137 : banques de textes et anti-répétition", () => {
  it("12 mois : au moins 90 % de répliques distinctes (avant : 56 %), titres d'épisode tous distincts", () => {
    applyGameContent({});
    const after = chain("2026-11", 12);
    expect(distinct(lines(after))).toBeGreaterThanOrEqual(0.9);
    const titles = after.flatMap((m) => m.episodes.map((e) => e.title));
    expect(new Set(titles).size).toBe(titles.length);
    NARRATIVE_RULES.enabled = false;
    expect(distinct(lines(chain("2026-11", 12)))).toBeLessThan(0.7);
  });

  it("graine stable ; titre, boss, objectifs et récompenses inchangés par les banques", () => {
    applyGameContent({});
    const a = generateChapter({ monthId: "2026-12", digest: digest("2026-11"), existing: [], now: NOW });
    expect(generateChapter({ monthId: "2026-12", digest: digest("2026-11"), existing: [], now: NOW })).toEqual(a);
    NARRATIVE_RULES.enabled = false;
    const b = generateChapter({ monthId: "2026-12", digest: digest("2026-11"), existing: [], now: NOW });
    expect([a.title, a.boss.name, a.completion?.title, a.auto?.archetype]).toEqual([b.title, b.boss.name, b.completion?.title, b.auto?.archetype]);
    expect(a.episodes.map((e) => [e.objective, e.reward])).toEqual(b.episodes.map((e) => [e.objective, e.reward]));
    expect(a.title).toBe("Le Contre-Chant");
  });

  it("titres de réserve pris seulement quand ceux de la faction ont servi : 60 mois, première répétition repoussée", () => {
    applyGameContent({});
    const firstRepeat = (ms: ChronicleMonth[]) => {
      const seen = new Set<string>();
      for (const m of ms) {
        if (seen.has(m.title)) return m.id;
        seen.add(m.title);
      }
      return null;
    };
    const after = chain("2026-11", 60);
    NARRATIVE_RULES.enabled = false;
    const before = chain("2026-11", 60);
    // L'année 1 ne change pas de titre (réserve inutilisée tant que les 4 titres d'origine restent ; la faction par année ne
    // change qu'à partir de novembre 2027).
    expect(after.slice(0, 12).map((m) => m.title)).toEqual(before.slice(0, 12).map((m) => m.title));
    expect(firstRepeat(before)).toBe("2028-06");
    expect((firstRepeat(after) ?? "9999") > "2030-01").toBe(true);
    expect(new Set(after.map((m) => m.title)).size).toBeGreaterThan(new Set(before.map((m) => m.title)).size + 20);
  });

  it("faction par thème et par année du catalogue (Q-AP7) ; année 1 inchangée", () => {
    applyGameContent({});
    const base = CHRONICLE_GEN_RULES.themeArchetypes;
    expect(yearArchetypeFor("vide", 1, base)).toBe("confrerie");
    expect(yearArchetypeFor("vide", 2, base)).toBe("meute");
    expect(yearArchetypeFor("vide", 3, base)).toBe("culte");
    expect(yearArchetypeFor("vide", 4, base)).toBe("confrerie");
    // Novembre 2027 (vide, année 2) : la Meute ; novembre 2026 (année 1) : la Confrérie, comme avant.
    expect(generateChapter({ monthId: "2027-11", digest: digest("2027-10"), existing: [], now: NOW }).auto?.archetype).toBe("meute");
    expect(generateChapter({ monthId: "2026-11", digest: digest("2026-10"), existing: [], now: NOW }).auto?.archetype).toBe("confrerie");
    // Chaque thème change de faction d'une année à l'autre, et deux mois de suite n'ont jamais la même.
    const rotation = Object.keys(base);
    for (const t of rotation) expect(new Set([1, 2, 3].map((y) => yearArchetypeFor(t, y, base))).size, t).toBe(3);
  });

  it("répliques des jalons du passe : année 1 inchangée, l'année 2 ne répète plus l'année 1", () => {
    applyGameContent({});
    const pass = (m: string) => generatePassSeason({ monthId: m, digest: digest(shiftMonth(m, -1)), existing: [], now: NOW });
    const y1 = pass("2026-11").scenario.milestones.flatMap((x) => x.lines.map((l) => l.text));
    const y2 = pass("2027-11").scenario.milestones.flatMap((x) => x.lines.map((l) => l.text));
    const y3 = pass("2028-11").scenario.milestones.flatMap((x) => x.lines.map((l) => l.text));
    expect(y2.filter((t) => y1.includes(t))).toEqual([]);
    expect(y3.filter((t) => y1.includes(t) || y2.includes(t))).toEqual([]);
    NARRATIVE_RULES.enabled = false;
    expect(pass("2026-11").scenario.milestones.flatMap((x) => x.lines.map((l) => l.text))).toEqual(y1);
  });

  it("mois écrits inchangés : version du générateur non montée, aucun chapitre écrit à régénérer", () => {
    applyGameContent({});
    expect(GENERATOR_VERSION).toEqual({ chapter: 3, pass: 3 });
    const written = chain("2026-11", 3).map((m) => ({ ...m, auto: { ...m.auto!, generator: 3 } }));
    expect(outdatedChapters(written, NOW)).toEqual([]);
  });

  it("gabarits reconnus dans les textes remplis ; repli sur toute la liste quand tout a servi", () => {
    expect(templateUsed("{villain} refait surface, {pseudo}. Et pas les mains vides : {boss} quitte son chantier.", ["Kor refait surface, {pseudo}. Et pas les mains vides : le Casino-Forteresse quitte son chantier."])).toBe(true);
    expect(templateUsed("Chaque empire a un prix. Je viens chercher le tien.", ["Chaque empire a un prix (bis)."])).toBe(false);
    expect(freshTemplates(["a", "b"], ["A"])).toEqual(["b"]);
    expect(freshTemplates(["a"], ["A"])).toEqual(["a"]);
  });

  it("réglages lus dans la règle et validés (admin)", () => {
    applyGameContent({ rules: { narrative: { villainTaunts: ["Seule réplique."] } } } as never);
    expect(NARRATIVE_RULES.villainTaunts).toEqual(["Seule réplique."]);
    expect(NARRATIVE_RULES.hooks).toHaveLength(4);
    const m = generateChapter({ monthId: "2026-12", digest: digest("2026-11"), existing: [], now: NOW });
    expect(m.episodes[0].lines[0].text).toBe("Seule réplique.");
    expect(validateNarrativeRules({ actTitles: [["a"]], heroLines: ["sans héros"], yearArchetypes: { "2": { vide: "inconnu" }, "12": {} }, noRepeatMonths: -1 } as never, ["confrerie"])).toHaveLength(5);
    const d = defaultGameContent();
    expect(validateGameContent({ ...d, rules: { ...d.rules, narrative: { ...NARRATIVE_RULES, villainTaunts: [] } } } as never).join(" ")).toMatch(/réplique du méchant/);
  });
});
