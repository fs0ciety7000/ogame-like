import { beforeAll, describe, expect, it } from "vitest";
import { onboardingTotal, PROGRESSION_PROFILES, scaleTier2Costs, simulateAllProfiles, simulateProgression, type ProgressionResult } from "@/game/balance/progressionSim";
import { attackerWinThreshold, budgetDuel } from "@/game/balance/pvpBudget";
import { BUILDINGS } from "@/game/buildings";
import { STREAK_RULES } from "@/game/streak";

/* 6.14.71 (AU27, lot AE-L0) : garde de l'équilibre. Le simulateur de progression tourne sur les règles par défaut ;
   ses repères doivent rester dans les bornes ci-dessous. Un réglage qui les fait sortir change l'équilibre : il passe par
   une proposition (docs/proposals/equilibrage-au27.md) et ces bornes changent dans le même lot (invariant I29).

   Bornes actuelles = mesure de 6.14.72 (marge d'environ ±20 %). Le lot AE-L2 (second palier ×4, comptoir) les déplacera
   vers les cibles du GDD §2 : 1re Ascension J35–50 (actif), J60–90 (moyen), après J120 (occasionnel). */
const ASCENSION_BOUNDS: Record<string, [number, number]> = {
  actif: [8, 13],
  moyen: [15, 23],
  occasionnel: [38, 56],
  quotidien: [26, 40],
};

let results: Record<string, ProgressionResult>;

beforeAll(() => {
  results = Object.fromEntries(simulateAllProfiles().map((r) => [r.profile, r]));
});

describe("AE-L0 : simulateur de progression", () => {
  it("est déterministe", () => {
    const a = simulateProgression(PROGRESSION_PROFILES.occasionnel, { days: 20 });
    const b = simulateProgression(PROGRESSION_PROFILES.occasionnel, { days: 20 });
    expect(b).toEqual(a);
    expect(a.snapshots.map((s) => s.day)).toEqual([1, 3, 7, 14]);
  });

  it("verse la prise en main à J0 (récompenses des étapes réunies)", () => {
    const total = onboardingTotal();
    expect(total.scrap).toBeGreaterThan(0);
    expect(total.reinforcedSteel).toBeGreaterThan(0);
  });

  it("1re Ascension dans les bornes de chaque profil (I29)", () => {
    for (const [id, [lo, hi]] of Object.entries(ASCENSION_BOUNDS)) {
      const day = results[id].ascensionDay;
      expect(day, id).not.toBeNull();
      expect(day!, id).toBeGreaterThanOrEqual(lo);
      expect(day!, id).toBeLessThanOrEqual(hi);
    }
    // Plus on joue, plus on avance.
    expect(results.actif.ascensionDay!).toBeLessThan(results.moyen.ascensionDay!);
    expect(results.moyen.ascensionDay!).toBeLessThan(results.occasionnel.ascensionDay!);
  });

  it("J1 reste rapide : extracteurs au moins niveau 6 pour l'actif, et aucune session sans action la première semaine", () => {
    const j1 = results.actif.snapshots.find((s) => s.day === 1)!;
    expect(Math.min(...j1.extractors)).toBeGreaterThanOrEqual(6);
    for (const r of Object.values(results)) expect(r.deadSessionsPct.early, r.profile).toBe(0);
  });

  it("AE-3 (6.14.72) : le coffre du 7e jour reste sous 24 h de production du joueur quotidien", () => {
    const chest = results.quotidien.firstChest!;
    expect(chest).not.toBeNull();
    expect(chest.common).toBe(((STREAK_RULES.chest.common[0] + STREAK_RULES.chest.common[1]) / 2) * 4);
    expect(chest.hoursOfProduction).toBeLessThanOrEqual(24);
    // Ancien coffre : 465 h de production et un stock 9 fois au-dessus de l'entrepôt.
    expect(chest.maxStockAfter).toBeLessThan(chest.storageCap * 2);
    // L'occasionnel n'atteint jamais le 7e jour.
    expect(results.occasionnel.firstChest).toBeNull();
  });

  it("mesure la production perdue et l'origine des gains", () => {
    for (const r of Object.values(results)) {
      expect(r.lostPct).toBeGreaterThanOrEqual(0);
      expect(r.lostPct).toBeLessThanOrEqual(100);
      const total = Object.values(r.incomeShareFromJ14).reduce((a, b) => a + b, 0);
      expect(total).toBeGreaterThan(99);
      expect(total).toBeLessThan(101);
    }
  });

  it("scaleTier2Costs multiplie le second palier puis le rend tel quel", () => {
    const b = BUILDINGS.find((x) => x.upgrade.tier2)!;
    const before = structuredClone(b.upgrade.tier2!);
    const restore = scaleTier2Costs(4);
    expect(b.upgrade.tier2!.baseCost.scrap).toBe((before.baseCost.scrap ?? 0) * 4);
    restore();
    expect(b.upgrade.tier2).toEqual(before);
  });
});

describe("AE-L0 : JcJ à budget égal", () => {
  it("AE-6 (6.14.72) : le défenseur mixte tient jusqu'à ×0,85 au moins de sa dépense, des défenses seules jusqu'à ×2", () => {
    expect(attackerWinThreshold("mixed")).toBeGreaterThanOrEqual(0.85);
    expect(attackerWinThreshold("defenses")).toBeGreaterThanOrEqual(2);
  });

  it("à dépense égale, l'attaquant paie plus cher qu'avant (pertes ≥ 30 %)", () => {
    const d = budgetDuel(1, "mixed");
    expect(d.attackerLoss).toBeGreaterThanOrEqual(0.3);
  });
});
