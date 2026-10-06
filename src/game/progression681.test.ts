import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent, currentGameContent, validateRules } from "@/game/content";
import { challengePool, computePointsPerTier, generateBudgetTiers, PASS_GEN_RULES, passGenRules, rewardValue, tiersValue } from "@/game/passGen";
import { generatePassSeason, PASS_FINAL_AMBER } from "@/game/passSeasons";
import { seededRandom, worldDigest, type WorldDigest } from "@/game/procedural";
import { defaultPlayerState } from "@/game/defaults";
import type { PassReward } from "@/game/seasonPass";
import type { PlayerState } from "@/types/game";

/* 6.8.1 : passe généré par budget, points par palier calculés, défis pondérés, contrôle par simulation. */

const OCT_20 = Date.UTC(2026, 9, 20, 12);
const digest = (pace?: WorldDigest["passPace"], extra: WorldDigest["weeklyMedian"] = {}): WorldDigest => ({
  monthId: "2026-10",
  observedDays: 20,
  activePlayers: 12,
  weeklyMedian: { victory: 3, contract: 4, spy: 3, market: 3, bounty: 2, warlordWin: 0.5, ...extra },
  totals: {},
  heroes: {},
  episodes: [],
  passMedianTier: 18,
  passTiers: 30,
  passFinishedShare: 0.3,
  chapterShare: 0.4,
  ...(pace ? { passPace: pace } : {}),
});

afterEach(() => applyGameContent({}));

describe("6.8.1 récompenses par budget", () => {
  it("29 paliers dans le budget (±5 %), plafonds du mois respectés, relique au palier 20, jalons doublés", () => {
    const r = passGenRules();
    for (const seed of ["a", "b", "c", "d", "e", "f"]) {
      const { tiers } = generateBudgetTiers(seededRandom(seed), 30);
      expect(tiers).toHaveLength(30);
      expect(tiers[29]).toEqual([]);
      const total = tiersValue(tiers);
      expect(Math.abs(total - r.budgetHours) / r.budgetHours).toBeLessThanOrEqual(0.05);
      const all = tiers.flat();
      const sum = (k: PassReward["kind"], f: (x: PassReward) => number) => all.filter((x) => x.kind === k).reduce((a, x) => a + f(x), 0);
      expect(sum("amber", (x) => (x.kind === "amber" ? x.amount : 0))).toBeLessThanOrEqual(r.caps.amber);
      expect(sum("tokens", (x) => (x.kind === "tokens" ? x.count : 0))).toBeLessThanOrEqual(r.caps.tokens);
      expect(sum("dossier", (x) => (x.kind === "dossier" ? x.count : 0))).toBeLessThanOrEqual(r.caps.dossier);
      expect(all.filter((x) => x.kind === "capsule").length).toBeLessThanOrEqual(r.caps.capsules);
      expect(tiers[19].some((x) => x.kind === "relic" && x.rarity === "rare")).toBe(true);
      for (const t of r.milestones.filter((m) => !r.rareRelicTiers.includes(m))) expect(tiers[t - 1].length).toBe(2);
      // Chaque palier ordinaire a au moins une récompense ; la valeur monte entre le début et la fin.
      for (const t of tiers.slice(0, 29)) expect(t.length).toBeGreaterThan(0);
      const val = (i: number) => tiers[i].reduce((a, x) => a + rewardValue(x), 0);
      expect(val(25) + val(26) + val(27)).toBeGreaterThan(val(0) + val(1) + val(2));
    }
  });

  it("même graine, même passe ; le budget et les plafonds viennent des règles", () => {
    expect(generateBudgetTiers(seededRandom("x"), 30)).toEqual(generateBudgetTiers(seededRandom("x"), 30));
    applyGameContent({ rules: { ...currentGameContent().rules, passGen: { ...PASS_GEN_RULES, budgetHours: 200, caps: { ...PASS_GEN_RULES.caps, amber: 100 } } } });
    const { tiers } = generateBudgetTiers(seededRandom("x"), 30);
    expect(Math.abs(tiersValue(tiers) - 200) / 200).toBeLessThanOrEqual(0.05);
    expect(tiers.flat().reduce((a, x) => a + (x.kind === "amber" ? x.amount : 0), 0)).toBeLessThanOrEqual(100);
  });

  it("le passe de saison garde son dernier palier (commandant, Ambre, cosmétique) ; budget désactivé : ancien gabarit", () => {
    const s = generatePassSeason({ monthId: "2026-11", digest: digest(), existing: [], now: OCT_20 });
    expect(s.tiers[29]).toEqual([{ kind: "commander", id: "s-2026-11" }, { kind: "amber", amount: PASS_FINAL_AMBER }, { kind: "cosmetic" }]);
    expect(Math.abs(tiersValue(s.tiers.slice(0, 29)) - passGenRules().budgetHours)).toBeLessThanOrEqual(passGenRules().budgetHours * 0.05);
    applyGameContent({ rules: { ...currentGameContent().rules, passGen: { ...PASS_GEN_RULES, enabled: false } } });
    const old = generatePassSeason({ monthId: "2026-11", digest: digest(), existing: [], now: OCT_20 });
    expect(old.tiers[9]).toEqual([{ kind: "amber", amount: 40 }, { kind: "production", hours: 4 }]);
  });
});

describe("6.8.1 points par palier calculés", () => {
  it("médian au jour 24, plus actif pas avant le 15, médian jamais après le 28, bornes 25 à 200", () => {
    // 50 points par jour pour le médian, 60 pour le plus actif : le médian décide (50 × 24 / 30 = 40).
    expect(computePointsPerTier({ median: 50, top: 60 }, 30)?.ppt).toBe(40);
    // Plus actif à 80 : 80 × 15 / 30 = 40 → égalité ; à 90 : 45.
    expect(computePointsPerTier({ median: 50, top: 90 }, 30)?.ppt).toBe(45);
    // Plus actif très rapide : le médian finit au plus tard le 28 (50 × 28 / 30 ≈ 46,7 → 45).
    expect(computePointsPerTier({ median: 50, top: 400 }, 30)?.ppt).toBe(45);
    expect(computePointsPerTier({ median: 1, top: 2 }, 30)?.ppt).toBe(25);
    expect(computePointsPerTier({ median: 1000, top: 1000 }, 30)?.ppt).toBe(200);
    expect(computePointsPerTier(undefined, 30)).toBeNull();
    expect(computePointsPerTier({ median: 0, top: 0 }, 30)).toBeNull();
  });

  it("passe d'octobre (PRG-1) : 200 points par jour pour les plus actifs → paliers allongés, simulation dans la cible", () => {
    const s = generatePassSeason({ monthId: "2026-11", digest: digest({ median: 60, top: 200 }), existing: [], now: OCT_20 });
    expect(s.pointsPerTier).toBeGreaterThanOrEqual(55);
    const pace = s.auto!.pace!;
    expect(pace.medianDay).not.toBeNull();
    expect(pace.medianDay!).toBeLessThanOrEqual(passGenRules().latestMedianDay);
    expect(pace.medianDay!).toBeGreaterThanOrEqual(passGenRules().targetMedianDay - 3);
    expect(s.auto!.reasons.some((r) => r.startsWith("Simulation"))).toBe(true);
    expect(s.auto!.reasons.some((r) => r.startsWith("Points par jour mesurés"))).toBe(true);
  });

  it("sans mesure, l'ancien ajustement reste (40 points, ±15 %)", () => {
    const s = generatePassSeason({ monthId: "2026-11", digest: digest(), existing: [], now: OCT_20 });
    expect(s.pointsPerTier).toBe(40);
  });

  it("worldDigest : points par jour, un joueur au dernier palier compté jusqu'au jour où il l'a atteint", () => {
    const mk = (uid: string, points: number, finishedDay?: number): PlayerState => {
      const p = defaultPlayerState(uid, uid) as PlayerState;
      p.lastActiveMs = OCT_20;
      p.seasonPass = { seasonId: "2026-10", points, claimed: [], loginDay: "", completed: [], ...(finishedDay ? { finishedAtMs: Date.UTC(2026, 9, finishedDay, 12) } : {}) } as unknown as PlayerState["seasonPass"];
      return p;
    };
    const d = worldDigest([mk("a", 400), mk("b", 800), mk("c", 1200, 6)], OCT_20);
    // a : 400 / 20 = 20 ; b : 40 ; c : 1200 points atteints le 6 → 200 par jour.
    expect(d.passPace?.median).toBe(40);
    expect(d.passPace?.top).toBe(200);
  });
});

describe("6.8.1 défis des paliers", () => {
  it("poids réglables ; les actions passives seulement si le serveur les pratique", () => {
    const keys = (w: WorldDigest["weeklyMedian"]) => challengePool(w).map((x) => x.key);
    expect(keys({})).not.toContain("raidRepelled");
    expect(keys({})).not.toContain("bossAssault");
    expect(keys({ bossAssault: 1 })).toContain("bossAssault");
    expect(keys({ warlordWin: 0.2 })).not.toContain("warlordWin");
    expect(keys({})).not.toContain("mission");
    const s = generatePassSeason({ monthId: "2026-11", digest: digest(undefined, { bossAssault: 2 }), existing: [], now: OCT_20 });
    const used = new Set(Object.values(s.requirements).flat().map((r) => r.key));
    expect(used.has("bossAssault")).toBe(true);
    expect(used.has("raidRepelled")).toBe(false);
    // Poids à 0 : l'action disparaît des défis.
    applyGameContent({ rules: { ...currentGameContent().rules, passGen: { ...PASS_GEN_RULES, challengeWeights: { ...PASS_GEN_RULES.challengeWeights, spy: 0 } } } });
    const s2 = generatePassSeason({ monthId: "2026-11", digest: digest(), existing: [], now: OCT_20 });
    expect(Object.values(s2.requirements).flat().some((r) => r.key === "spy")).toBe(false);
  });
});

describe("6.8.1 réglages (règle n° 2)", () => {
  it("un réglage partiel garde les autres valeurs ; les incohérences sont refusées", () => {
    const merged = applyGameContent({ rules: { passGen: { caps: { amber: 120 } } } } as never);
    expect(merged.rules.passGen.caps.amber).toBe(120);
    expect(merged.rules.passGen.caps.tokens).toBe(PASS_GEN_RULES.caps.tokens);
    expect(merged.rules.passGen.values.relicRare).toBe(PASS_GEN_RULES.values.relicRare);
    const bad = (patch: object) => validateRules({ ...currentGameContent().rules, passGen: { ...PASS_GEN_RULES, ...patch } }).join(" ");
    expect(bad({ targetTopDay: 26 })).toMatch(/jours cibles/);
    expect(bad({ pointsMin: 300 })).toMatch(/min ≤ max/);
    expect(bad({ milestones: [35] })).toMatch(/hors des paliers/);
    expect(bad({})).toBe("");
  });
});
