import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent, defaultGameContent, validateRules } from "@/game/content";
import { seasonPayoutSummary, SEASON_RULES } from "@/game/seasons";
import { STREAK_RULES, streakReward, streakWeekSummary } from "@/game/streak";
import { defaultPlayerState } from "@/game/defaults";

/* 5.15.9 : série de connexion réglable depuis l'admin + aperçus avant / après. */

afterEach(() => {
  applyGameContent({});
});

describe("série de connexion réglable", () => {
  it("les réglages enregistrés remplacent ceux du code (coffre fusionné)", () => {
    applyGameContent({ rules: { streak: { dailyTokens: 5, amberDay6: 50, chest: { amber: [10, 20] } } } as never });
    expect(STREAK_RULES.dailyTokens).toBe(5);
    expect(STREAK_RULES.amberDay6).toBe(50);
    expect(STREAK_RULES.chest.amber).toEqual([10, 20]);
    // Bornes non fournies : celles par défaut.
    expect(STREAK_RULES.chest.tokens).toEqual([1, 25]);
    const p = defaultPlayerState("u1", "Test");
    expect(streakReward(p, 6).amber).toBe(50);
    expect(streakReward(p, 3).tokens).toBe(5);
  });

  it("une liste d'heures invalide garde les 7 jours par défaut", () => {
    applyGameContent({ rules: { streak: { hours: [1, 2] } } as never });
    expect(STREAK_RULES.hours).toHaveLength(7);
  });

  it("revenir au contenu par défaut restaure les valeurs du code", () => {
    applyGameContent({ rules: { streak: { dailyTokens: 9 } } as never });
    applyGameContent({});
    expect(STREAK_RULES.dailyTokens).toBe(2);
  });

  it("validation : 7 jours, bornes du coffre dans l'ordre", () => {
    const d = defaultGameContent().rules;
    expect(validateRules({ streak: d.streak })).toEqual([]);
    expect(validateRules({ streak: { ...d.streak, hours: [1, 2, 3] } }).join(" ")).toMatch(/7 durées/);
    expect(validateRules({ streak: { ...d.streak, chest: { ...d.streak.chest, amber: [300, 50] } } }).join(" ")).toMatch(/minimum ≤ maximum/);
  });
});

describe("aperçus admin", () => {
  it("semaine de série : jetons quotidiens + coffre moyen", () => {
    const w = streakWeekSummary(STREAK_RULES);
    expect(w.tokens).toBe(2 * 7 + 13);
    expect(w.amber).toBe(35 + 175);
    expect(w.hours).toBe(18.5);
  });

  it("clôture de saison : champion + podium + participation de chacun", () => {
    expect(seasonPayoutSummary(SEASON_RULES, 20)).toEqual({ tokens: 50 + 50 + 20 * 15, amber: 200 + 100 + 20 * 35, common: 500_000_000 + 50_000_000 + 20 * 10_000_000 });
    expect(seasonPayoutSummary(SEASON_RULES, 1).tokens).toBe(50 + 15);
    expect(seasonPayoutSummary(SEASON_RULES, 0).tokens).toBe(0);
  });
});
