import { describe, expect, it } from "vitest";
import { computeFleetPower, resolveCombat, unitStat } from "@/game/combat";
import type { TechLevels, Units } from "@/types/game";

const noTech: TechLevels = {};

function unitsWith(entries: Record<string, { level: number; count: number }>): Units {
  return entries;
}

describe("unitStat", () => {
  it("is 0 for a unit that hasn't been unlocked (level 0)", () => {
    expect(unitStat(unitsWith({ chasseur: { level: 0, count: 0 } }), noTech, "chasseur", "attack")).toBe(0);
  });

  it("adds +5 per level above 1 to the base stat", () => {
    const units = unitsWith({ chasseur: { level: 3, count: 1 } });
    // base attack 105, +5 per level above 1 => 105 + 2*5 = 115
    expect(unitStat(units, noTech, "chasseur", "attack")).toBeCloseTo(115);
  });

  it("applies the lab attack/defense bonuses (tech5 / tech2)", () => {
    const units = unitsWith({ chasseur: { level: 1, count: 1 } });
    const boosted = unitStat(units, { tech5: 3 }, "chasseur", "attack");
    expect(boosted).toBeCloseTo(105 * 1.3);
  });
});

describe("computeFleetPower", () => {
  it("sums power across a chosen fleet, ignoring units not sent", () => {
    const units = unitsWith({
      chasseur: { level: 1, count: 50 },
      fregate: { level: 1, count: 50 },
    });
    const power = computeFleetPower(units, noTech, { chasseur: 2 }, ["attack"]);
    expect(power).toBeCloseTo(105 * 2);
  });
});

function baseCombatParams() {
  return {
    attackerUnits: unitsWith({ chasseur: { level: 1, count: 100 } }),
    attackerTechLevels: noTech,
    attackerRepairPct: 0,
    fleet: { chasseur: 10 },
    defenderUnits: unitsWith({ roquette: { level: 1, count: 1 } }),
    defenderTechLevels: noTech,
    defenderRepairPct: 0,
    defenderResources: {},
  };
}

describe("resolveCombat", () => {
  it("attacker wins when clearly stronger, and loses only a small fraction of its fleet", () => {
    const result = resolveCombat(baseCombatParams());
    expect(result.outcome).toBe("attacker_win");
    expect(result.attackerLossPercent).toBeLessThan(result.defenderLossPercent);
  });

  it("defender wins when clearly stronger", () => {
    const params = baseCombatParams();
    params.fleet = { chasseur: 1 };
    params.defenderUnits = unitsWith({ canon_plasma: { level: 10, count: 500 } });
    const result = resolveCombat(params);
    expect(result.outcome).toBe("defender_win");
    expect(result.loot).toBeNull();
  });

  it("grants loot only when the attacker wins outright", () => {
    const params = baseCombatParams();
    params.defenderResources = { reinforcedSteel: 1000 };
    const result = resolveCombat(params);
    expect(result.outcome).toBe("attacker_win");
    expect(result.loot?.reinforcedSteel).toBe(80); // 8% de 1000
  });

  it("repair percentage reduces effective (permanent) losses without changing the raw loss rate", () => {
    // Grosse flotte pour que les pertes brutes (5% arrondis) soient non nulles.
    const params = { ...baseCombatParams(), fleet: { chasseur: 200 } };
    const noRepair = resolveCombat(params);
    const withRepair = resolveCombat({ ...params, attackerRepairPct: 0.5 });

    const lostNoRepair = noRepair.attackerLosses.chasseur ?? 0;
    const lostWithRepair = withRepair.attackerLosses.chasseur ?? 0;
    expect(lostWithRepair).toBeLessThan(lostNoRepair);
    expect(withRepair.attackerRecovered.chasseur).toBeGreaterThan(0);
  });

  it("never loses more than the fleet actually sent", () => {
    const params = baseCombatParams();
    params.fleet = { chasseur: 3 };
    const result = resolveCombat(params);
    const lost = (result.attackerLosses.chasseur ?? 0) + (result.attackerRecovered.chasseur ?? 0);
    expect(lost).toBeLessThanOrEqual(3);
  });
});
