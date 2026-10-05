import { describe, expect, it } from "vitest";
import { UNITS, unitLevelBonus } from "@/game/units";
import { specLevels, unitDesignation, unitEfficiency, unitRanks, unitSpecAt } from "@/game/unitSpec";

describe("unitSpec", () => {
  const u = UNITS[0];

  it("grows like combat (attack/defense) and flight (speed/cargo × level)", () => {
    expect(unitSpecAt(u, 1)).toEqual({ attack: u.stats.attaque, defense: u.stats.defense, speed: u.stats.vitesse, cargo: u.stats.cargo });
    const s3 = unitSpecAt(u, 3);
    expect(s3.attack).toBe(u.stats.attaque + 2 * unitLevelBonus(u));
    expect(s3.speed).toBe(u.stats.vitesse * 3);
  });

  it("ranks among all units, designations are unique", () => {
    const ranks = unitRanks(u);
    expect(ranks.attack.of).toBe(UNITS.length);
    expect(ranks.attack.rank).toBeGreaterThanOrEqual(1);
    const best = [...UNITS].sort((a, b) => b.stats.attaque - a.stats.attaque)[0];
    expect(unitRanks(best).attack.rank).toBe(1);
    expect(new Set(UNITS.map((x) => unitDesignation(x))).size).toBe(UNITS.length);
  });

  it("efficiency ratios and sampled levels", () => {
    expect(unitEfficiency(u).attackPerK).toBeGreaterThan(0);
    expect(specLevels(5)).toEqual([1, 2, 3, 4, 5]);
    const big = specLevels(40);
    expect(big[0]).toBe(1);
    expect(big[big.length - 1]).toBe(40);
    expect(big.length).toBeLessThanOrEqual(10);
  });
});
