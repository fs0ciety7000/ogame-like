import { describe, expect, it } from "vitest";
import { computeFleetPower, getShieldPercent, resolveCombat, unitStat } from "@/game/combat";
import { defaultBuildings } from "@/game/buildings";
import { UNIT_BASE_STATS } from "@/game/units";
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
    // +5 par niveau au-dessus de 1 => base + 2*5
    expect(unitStat(units, noTech, "chasseur", "attack")).toBeCloseTo(UNIT_BASE_STATS.chasseur.attack + 10);
  });

  it("uses the unit's own gain per level (Étoile Noire : +1 700)", () => {
    const units = unitsWith({ etoile_noire: { level: 10, count: 1 }, sentinelle: { level: 10, count: 1 } });
    expect(unitStat(units, noTech, "etoile_noire", "attack")).toBe(500 + 9 * 1700);
    expect(unitStat(units, noTech, "etoile_noire", "defense")).toBe(500 + 9 * 1700);
    expect(unitStat(units, noTech, "sentinelle", "attack")).toBe(120 + 9 * 5);
  });

  it("applies the lab attack/defense bonuses (tech5 / tech2)", () => {
    const units = unitsWith({ chasseur: { level: 1, count: 1 } });
    const boosted = unitStat(units, { tech5: 3 }, "chasseur", "attack");
    expect(boosted).toBeCloseTo(UNIT_BASE_STATS.chasseur.attack * 1.3);
  });
});

describe("computeFleetPower", () => {
  it("sums power across a chosen fleet, ignoring units not sent", () => {
    const units = unitsWith({
      chasseur: { level: 1, count: 50 },
      fregate: { level: 1, count: 50 },
    });
    const power = computeFleetPower(units, noTech, { chasseur: 2 }, ["attack"]);
    expect(power).toBeCloseTo(UNIT_BASE_STATS.chasseur.attack * 2);
  });
});

function baseCombatParams() {
  return {
    attackerUnits: unitsWith({ chasseur: { level: 1, count: 100 } }),
    attackerTechLevels: noTech,
    attackerRepairPct: 0,
    fleet: { chasseur: 10 } as Record<string, number>,
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

  it("grants loot only when the attacker wins outright (8 % rares, 10 % communes)", () => {
    const params = baseCombatParams();
    params.attackerUnits = unitsWith({ chasseur: { level: 1, count: 100 }, cargo: { level: 1, count: 1000 } });
    params.fleet = { chasseur: 10, cargo: 1000 };
    params.defenderResources = { reinforcedSteel: 1000, scrap: 5000 };
    const result = resolveCombat(params);
    expect(result.outcome).toBe("attacker_win");
    expect(result.loot?.reinforcedSteel).toBe(80);
    expect(result.loot?.scrap).toBe(500);
  });

  it("limits the loot to the cargo capacity of the surviving fleet", () => {
    const params = baseCombatParams(); // 10 chasseurs niveau 1, cargaison 5 chacun
    params.defenderResources = { scrap: 1_000_000, reinforcedSteel: 1000 };
    const result = resolveCombat(params);
    const total = Object.values(result.loot ?? {}).reduce((a, b) => a + (b ?? 0), 0);
    expect(result.cargoCapacity).toBeGreaterThan(0);
    expect(total).toBeLessThanOrEqual(result.cargoCapacity);
    // Réduction proportionnelle : les deux ressources sont pillées.
    expect(result.loot?.scrap).toBeGreaterThan(result.loot?.reinforcedSteel ?? 0);
  });

  it("fills a small cargo hold completely despite rounding across many resources", () => {
    const params = baseCombatParams();
    params.fleet = { chasseur: 1 };
    params.defenderUnits = {};
    params.defenderResources = { scrap: 90000, energy: 90000, nano: 90000, data: 90000, reinforcedSteel: 500, cyberModule: 500, syntheticNanites: 500, aiFragment: 500 };
    const result = resolveCombat(params);
    const total = Object.values(result.loot ?? {}).reduce((a, b) => a + (b ?? 0), 0);
    expect(result.cargoCapacity).toBeGreaterThan(0);
    expect(total).toBe(result.cargoCapacity);
  });

  it("repair percentage reduces effective (permanent) losses without changing the raw loss rate", () => {
    // Grosse flotte pour que les pertes brutes (5% arrondis) soient non nulles.
    // Défense de taille comparable : les pertes ne sont pas plafonnées à ~0.
    const params = {
      ...baseCombatParams(),
      attackerUnits: unitsWith({ chasseur: { level: 1, count: 200 } }),
      fleet: { chasseur: 200 },
      defenderUnits: unitsWith({ roquette: { level: 1, count: 500 } }),
    };
    const noRepair = resolveCombat(params);
    const withRepair = resolveCombat({ ...params, attackerRepairPct: 0.5 });

    const lostNoRepair = noRepair.attackerLosses.chasseur ?? 0;
    const lostWithRepair = withRepair.attackerLosses.chasseur ?? 0;
    expect(lostWithRepair).toBeLessThan(lostNoRepair);
    expect(withRepair.attackerRecovered.chasseur).toBeGreaterThan(0);
  });

  it("a tiny attack cannot wipe a share of a big defense (losses capped by enemy power)", () => {
    const params = baseCombatParams();
    params.attackerUnits = unitsWith({ drone_recuperateur: { level: 1, count: 1 } });
    params.fleet = { drone_recuperateur: 1 };
    params.defenderUnits = unitsWith({ roquette: { level: 1, count: 10000 } });
    const result = resolveCombat(params);
    expect(result.outcome).toBe("defender_win");
    expect(result.defenderLosses.roquette ?? 0).toBe(0);
    expect(result.defenderLossPercent).toBeLessThan(0.001);
  });

  it("never loses more than the fleet actually sent", () => {
    const params = baseCombatParams();
    params.fleet = { chasseur: 3 };
    const result = resolveCombat(params);
    const lost = (result.attackerLosses.chasseur ?? 0) + (result.attackerRecovered.chasseur ?? 0);
    expect(lost).toBeLessThanOrEqual(3);
  });
});

describe("v1.6 combat balance", () => {
  it("adds the home bonus and lets ships at home support the defense", () => {
    const params = baseCombatParams();
    params.defenderUnits = unitsWith({ roquette: { level: 1, count: 10 } });
    const without = resolveCombat(params);
    params.defenderUnits = unitsWith({ roquette: { level: 1, count: 10 }, chasseur: { level: 1, count: 100 } });
    const withShips = resolveCombat(params);
    expect(without.defenderPower).toBeCloseTo(10 * 60 * 1.15);
    expect(withShips.defenderPower).toBeCloseTo((10 * 60 + 100 * 255 * 0.1) * 1.15);
  });

  it("shield absorbs part of the attack", () => {
    const params = baseCombatParams();
    const plain = resolveCombat(params);
    const shielded = resolveCombat({ ...params, defenderShieldPct: 0.15 });
    expect(shielded.attackerPower).toBeCloseTo(plain.attackerPower * 0.85);
    expect(shielded.shieldPercent).toBe(0.15);
  });

  it("rebuilds 60 % of destroyed defenses; ships at home only use the workshop", () => {
    const params = baseCombatParams();
    params.fleet = { chasseur: 100 };
    params.attackerUnits = unitsWith({ chasseur: { level: 1, count: 100 } });
    params.defenderUnits = unitsWith({ roquette: { level: 1, count: 100 }, fregate: { level: 1, count: 1000 } });
    const r = resolveCombat(params);
    expect(r.outcome).toBe("attacker_win");
    const rawRoquette = (r.defenderLosses.roquette ?? 0) + (r.defenderRecovered.roquette ?? 0);
    expect(r.defenderRebuilt?.roquette).toBe(Math.floor(rawRoquette * 0.6));
    // Frégates à quai : 10 % du taux de pertes, pas de reconstruction.
    const rawFregate = (r.defenderLosses.fregate ?? 0) + (r.defenderRecovered.fregate ?? 0);
    expect(rawFregate).toBe(Math.floor(1000 * r.defenderLossPercent * 0.1));
    expect(r.defenderRebuilt?.fregate).toBeUndefined();
  });

  it("derives the shield from the defense hangar level", () => {
    const b = defaultBuildings();
    b.hangar_defense = { level: 10, unlocked: true };
    expect(getShieldPercent(b)).toBeCloseTo(0.075);
    b.hangar_defense.level = 40;
    expect(getShieldPercent(b)).toBe(0.15);
  });
});
