import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent, currentGameContent, validateRules } from "@/game/content";
import { budgetEpisodeRewards, CHRONICLE_GEN_RULES, chronicleGenRules } from "@/game/chronicleGen";
import { tiersValue } from "@/game/passGen";
import { chapterDifficulty, generateChapter, seededRandom, type WorldDigest } from "@/game/procedural";
import type { ChronicleMonth } from "@/game/chronicles";

/* 6.8.2 : chapitres générés sous réglages (récompenses par budget, objectifs, difficulté) et faction du thème du passe. */

const OCT_20 = Date.UTC(2026, 9, 20, 12);
const digest = (completion = 0.5): WorldDigest => ({
  monthId: "2026-10",
  observedDays: 20,
  activePlayers: 12,
  weeklyMedian: { victory: 3, contract: 4, spy: 3, market: 3, bounty: 2, mission: 6, raidRepelled: 1, warlordWin: 0.5 },
  totals: {},
  heroes: {},
  episodes: [0, 1, 2].map((i) => ({ type: "victory" as const, count: 3, completion, open: true, daysOpen: 10 + i })),
  passMedianTier: 18,
  passTiers: 30,
  passFinishedShare: 0.3,
  chapterShare: 0.4,
});
const gen = (monthId: string, existing: ChronicleMonth[] = [], variant = 0, d = digest()) => generateChapter({ monthId, digest: d, existing, now: OCT_20, variant });
const withRules = (patch: Partial<typeof CHRONICLE_GEN_RULES>) => applyGameContent({ rules: { ...currentGameContent().rules, chronicleGen: { ...CHRONICLE_GEN_RULES, ...patch } } });

afterEach(() => applyGameContent({}));

describe("6.8.2 récompenses des épisodes par budget", () => {
  it("4 récompenses, valeur proche du budget × difficulté, plafonds tenus, pas de jetons", () => {
    const r = chronicleGenRules();
    for (const seed of ["a", "b", "c", "d", "e"])
      for (const diff of [0.7, 1, 1.4]) {
        const eps = budgetEpisodeRewards(seededRandom(seed), diff);
        expect(eps).toHaveLength(4);
        for (const e of eps) expect(e.length).toBeGreaterThan(0);
        const target = r.episodeBudgetHours * diff;
        expect(Math.abs(tiersValue(eps) - target) / target).toBeLessThanOrEqual(0.2);
        const all = eps.flat();
        expect(all.some((x) => x.kind === "tokens")).toBe(false);
        expect(all.reduce((a, x) => a + (x.kind === "amber" ? x.amount : 0), 0)).toBeLessThanOrEqual(r.caps.amber);
        expect(all.filter((x) => x.kind === "capsule").length).toBeLessThanOrEqual(r.caps.capsules);
      }
  });

  it("le reste du chapitre ne change pas de tirage ; gabarit d'avant si désactivé ; récompense du chapitre réglable", () => {
    const a = gen("2026-12");
    withRules({ enabled: false, completionAmber: 45 });
    const b = gen("2026-12");
    expect(b.title).toBe(a.title);
    expect(b.boss.name).toBe(a.boss.name);
    expect(b.episodes.map((e) => e.objective)).toEqual(a.episodes.map((e) => e.objective));
    expect(b.episodes[0].reward).toEqual([{ kind: "amber", amount: 15 }]);
    expect(b.completion?.rewards).toContainEqual({ kind: "amber", amount: 45 });
  });
});

describe("6.8.2 faction du thème du passe", () => {
  it("novembre (« vide ») : la Confrérie ; janvier (« forge ») : Gravhorn ; jamais deux mois de suite", () => {
    expect(gen("2026-11").auto?.archetype).toBe("confrerie");
    expect(gen("2027-01").auto?.archetype).toBe("gravhorn");
    const nov = gen("2026-11");
    const dec = gen("2026-12", [nov]);
    expect(dec.auto?.archetype).toBe("choeur");
    // Le mois précédent avait déjà la faction du thème : tirage au sort, autre faction.
    const again = gen("2027-03", [{ ...nov, id: "2027-02" }]); // « marée » : la Confrérie, déjà là en février
    expect(again.auto?.archetype).not.toBe("confrerie");
    expect(again.auto?.reasons.some((r) => r.includes("déjà là le mois dernier"))).toBe(true);
    withRules({ followPassTheme: false });
    expect(gen("2026-11").auto?.reasons.some((r) => r.includes("thème du passe"))).toBe(false);
  });
});

describe("6.8.2 objectifs et difficulté", () => {
  it("une action à poids 0 ne sort jamais ; bornes de difficulté réglables", () => {
    withRules({ objectiveWeights: { ...CHRONICLE_GEN_RULES.objectiveWeights, spy: 0, market: 0 } });
    for (let v = 0; v < 8; v++) {
      const types = gen("2026-12", [], v).episodes.map((e) => e.objective.type);
      expect(types).not.toContain("spy");
      expect(types).not.toContain("market");
    }
    expect(chapterDifficulty(digest(1)).value).toBe(1.4);
    withRules({ difficultyMax: 1.2, targetCompletion: 0.6 });
    expect(chapterDifficulty(digest(1)).value).toBe(1.2);
    expect(chapterDifficulty(digest(0.6)).value).toBe(1);
  });

  it("validation : faction inconnue, moins de 4 actions, bornes", () => {
    const bad = (patch: object) => validateRules({ ...currentGameContent().rules, chronicleGen: { ...CHRONICLE_GEN_RULES, ...patch } }).join(" ");
    expect(bad({ themeArchetypes: { ...CHRONICLE_GEN_RULES.themeArchetypes, vide: "inconnue" } })).toMatch(/faction « inconnue »/);
    expect(bad({ objectiveWeights: { contract: 1, bounty: 1, raidRepelled: 0, victory: 1, mission: 0, spy: 0, market: 0, warlordWin: 0, bossAssault: 0 } })).toMatch(/au moins 4 actions/);
    expect(bad({ difficultyMin: 1.3 })).toMatch(/difficulté min/);
    expect(bad({})).toBe("");
  });
});
