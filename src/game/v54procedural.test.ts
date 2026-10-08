import { beforeEach, describe, expect, it } from "vitest";
import { applyGameContent, currentGameContent, validateGameContent } from "@/game/content";
import { chronicleOf, chronicleState, claimChronicle, chroniclesConfig, recordChronicle } from "@/game/chronicles";
import { activePass, addPassPoints, claimPassTier, passState, PASS_RULES } from "@/game/seasonPass";
import { generateChapter, monthsToGenerate, proposeAchievementTiers, worldDigest, type WorldDigest } from "@/game/procedural";
import { bannerOptions } from "@/game/profile";
import { codexEntries } from "@/game/codex";
import { DEFAULT_ACHIEVEMENTS, checkNewAchievements } from "@/game/achievements";
import { defaultPlayerState } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

const OCT_10 = Date.UTC(2026, 9, 10, 12);
const OCT_25 = Date.UTC(2026, 9, 25, 12);
const APR_02 = Date.UTC(2027, 3, 2, 12);

function player(pseudo: string, now: number): PlayerState {
  const p = { ...defaultPlayerState(pseudo, pseudo), createdAt: now } as PlayerState;
  p.lastActiveMs = now;
  return p;
}

function digest(over: Partial<WorldDigest> = {}): WorldDigest {
  return {
    monthId: "2027-03",
    observedDays: 25,
    activePlayers: 20,
    weeklyMedian: { mission: 10, contract: 5, victory: 2, spy: 1, market: 0.5, bounty: 1, warlordWin: 0.2 },
    totals: { mission: 800, victory: 120 },
    heroes: { victory: { pseudo: "Tartiflex", count: 40 } },
    episodes: [0.9, 0.8, 0.7, 0.6].map((completion) => ({ type: "mission" as const, count: 6, completion, open: true, daysOpen: 10 })),
    passMedianTier: 18,
    passTiers: 30,
    passFinishedShare: 0.5,
    chapterShare: 0.4,
    ...over,
  };
}

beforeEach(() => applyGameContent({}));

describe("v5.4 générateur de chapitres", () => {
  it("écrit un chapitre complet et valide, reproductible", () => {
    const opts = { monthId: "2027-04", digest: digest(), existing: chroniclesConfig().months, now: APR_02 };
    const a = generateChapter(opts);
    expect(generateChapter(opts)).toEqual(a);
    expect(generateChapter({ ...opts, variant: 1 })).not.toEqual(a);
    expect(a.episodes).toHaveLength(4);
    expect(new Set(a.episodes.map((e) => e.objective.type)).size).toBe(4);
    expect(a.episodes.every((e) => e.lines.length >= 2 && e.reward && e.reward.length > 0)).toBe(true);
    expect(a.completion?.title).toBeTruthy();
    expect(a.codex).toHaveLength(2);
    expect(a.codex![1].text).toContain("Tartiflex");
    expect(a.pass?.tiers).toHaveLength(30);
    // Le contenu généré passe la validation de l'administration.
    const content = currentGameContent();
    content.chronicles.months.push(a);
    expect(validateGameContent(content)).toEqual([]);
  });

  it("ignore les épisodes ouverts depuis moins de 5 jours", () => {
    const fresh = digest({ episodes: digest().episodes.map((e) => ({ ...e, completion: 0, daysOpen: 2 })) });
    expect(generateChapter({ monthId: "2027-04", digest: fresh, existing: [], now: APR_02 }).auto!.difficulty).toBe(1);
  });

  it("ajuste la difficulté et le passe selon la réussite des joueurs", () => {
    const easy = generateChapter({ monthId: "2027-04", digest: digest(), existing: [], now: APR_02 });
    const hard = generateChapter({ monthId: "2027-04", digest: digest({ episodes: digest().episodes.map((e) => ({ ...e, completion: 0.1 })), passFinishedShare: 0.02, passMedianTier: 4 }), existing: [], now: APR_02 });
    expect(easy.auto!.difficulty).toBeGreaterThan(1);
    expect(hard.auto!.difficulty).toBeLessThan(1);
    expect(easy.pass!.pointsPerTier).toBeGreaterThan(PASS_RULES.pointsPerTier);
    expect(hard.pass!.pointsPerTier).toBeLessThan(PASS_RULES.pointsPerTier);
    // Missions : médiane 10 par semaine → l'objectif suit l'activité réelle.
    const mission = easy.episodes.find((e) => e.objective.type === "mission");
    if (mission) expect(mission.objective.count).toBeGreaterThanOrEqual(10);
  });

  it("n'écrit que les mois manquants (mois en cours, puis suivant à partir du jour 20)", () => {
    const months = chroniclesConfig().months;
    expect(monthsToGenerate(months, OCT_10, 20)).toEqual([]);
    expect(monthsToGenerate([], OCT_10, 20)).toEqual(["2026-10"]);
    expect(monthsToGenerate([{ id: "2026-10" }], OCT_25, 20)).toEqual(["2026-11"]);
    expect(monthsToGenerate(months, APR_02, 20)).toEqual(["2027-04"]);
  });

  it("mesure l'activité réelle du mois et cite le joueur le plus actif", () => {
    const a = player("Alpha", OCT_25);
    const b = player("Bravo", OCT_25);
    for (let i = 0; i < 12; i++) addPassPoints(a, "mission", OCT_25);
    addPassPoints(b, "mission", OCT_25, 2);
    recordChronicle(b, "spy", OCT_25, 3);
    const d = worldDigest([a, b], OCT_25);
    expect(d.activePlayers).toBe(2);
    expect(d.totals.mission).toBe(14);
    expect(d.totals.spy).toBe(3);
    expect(d.heroes.mission).toEqual({ pseudo: "Alpha", count: 12 });
    expect(d.episodes).toHaveLength(4);
  });
});

describe("v5.4 chapitre généré en jeu", () => {
  function withGenerated(): void {
    const month = generateChapter({ monthId: "2027-04", digest: digest(), existing: chroniclesConfig().months, now: APR_02 });
    month.episodes.forEach((e) => (e.objective.count = 1));
    const content = currentGameContent();
    applyGameContent({ chronicles: { months: [...content.chronicles.months, month] } });
  }

  it("récompenses d'épisode, titre, bannière et fiches de Codex", () => {
    withGenerated();
    const now = Date.UTC(2027, 3, 25, 12);
    const p = player("Charlie", now);
    const month = chronicleOf(now)!;
    month.episodes.forEach((e) => recordChronicle(p, e.objective.type, now, 1));
    const amberBefore = p.bounties?.amber ?? 0;
    let last = { points: 0, gained: [] as string[], chapter: false };
    for (let i = 0; i < 4; i++) last = claimChronicle(p, i, now, () => 0.5);
    expect(last.chapter).toBe(true);
    expect(chronicleState(p, now).chapters).toEqual(["2027-04"]);
    expect(p.titles?.some((t) => t.label === month.completion!.title)).toBe(true);
    expect((p.bounties?.amber ?? 0) > amberBefore).toBe(true);
    expect(bannerOptions(p).find((b) => b.id === "chapter:2027-04")?.unlocked).toBe(true);
    expect(codexEntries(p, new Set(), now).some((e) => e.id === "lore:2027-04:archives")).toBe(true);
    expect(checkNewAchievements(p).some((a) => a.id === "chapter_reader")).toBe(true);
  });

  it("6.8.0 : un seul passe par mois — dès novembre 2026, le passe du chapitre n'est plus lu (passe de saison ou passe commun)", () => {
    withGenerated();
    const month = chroniclesConfig().months.find((m) => m.id === "2027-04")!;
    expect(month.pass).toBeTruthy();
    expect(activePass("2027-04").pointsPerTier).toBe(PASS_RULES.pointsPerTier);
    const now = Date.UTC(2027, 3, 25, 12);
    const p = player("Delta", now);
    p.seasonPass = { ...passState(p, now), points: PASS_RULES.pointsPerTier };
    const gained = claimPassTier(p, 1, now);
    expect(gained.length).toBeGreaterThan(0);
    expect(passState(p, now).claimed).toEqual([1]);
  });
});

describe("v5.4 paliers de succès générés", () => {
  it("ajoute le palier suivant quand un joueur atteint le dernier", () => {
    const now = OCT_25;
    // 6.14.108 (AP-L4) : 3 détenteurs au moins (achievementGen.minHolders).
    const ps = ["Echo", "Delta", "Kilo"].map((n) => {
      const p = player(n, now);
      p.victories = 1500;
      return p;
    });
    const out = proposeAchievementTiers(DEFAULT_ACHIEVEMENTS, ps, now);
    const v = out.find((o) => o.def.metric === "victories");
    expect(v?.def.threshold).toBe(1500);
    expect(v?.def.id).toBe("eternal_conqueror_auto1");
    expect(v?.def.tier).toBe("legendaire");
    expect(validateGameContent({ ...currentGameContent(), achievements: [...DEFAULT_ACHIEVEMENTS, v!.def] })).toEqual([]);
    // Personne au dernier palier : rien de proposé.
    expect(proposeAchievementTiers(DEFAULT_ACHIEVEMENTS, [player("Foxtrot", now)], now).find((o) => o.def.metric === "victories")).toBeUndefined();
  });
});
