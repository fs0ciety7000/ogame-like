import { describe, expect, it } from "vitest";
import { COMBAT_RULES, computeFleetPower, getShieldPercent, resolveCombat, unitStat } from "@/game/combat";
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

  it("uses the unit's own gain per level (Étoile Noire : +900)", () => {
    const units = unitsWith({ etoile_noire: { level: 10, count: 1 }, sentinelle: { level: 10, count: 1 } });
    expect(unitStat(units, noTech, "etoile_noire", "attack")).toBe(4000 + 9 * 900);
    expect(unitStat(units, noTech, "etoile_noire", "defense")).toBe(4000 + 9 * 900);
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

  it("grants loot only when the attacker wins outright (8 % rares, 30 % communes, 6.2)", () => {
    const params = baseCombatParams();
    params.attackerUnits = unitsWith({ chasseur: { level: 1, count: 100 }, cargo: { level: 1, count: 1000 } });
    params.fleet = { chasseur: 10, cargo: 1000 };
    params.defenderResources = { reinforcedSteel: 1000, scrap: 5000 };
    const result = resolveCombat(params);
    expect(result.outcome).toBe("attacker_win");
    expect(result.loot?.reinforcedSteel).toBe(80);
    expect(result.loot?.scrap).toBe(1500);
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
  it("adds the home bonus and lets half of the ships at home support the defense", () => {
    const params = baseCombatParams();
    params.defenderUnits = unitsWith({ roquette: { level: 1, count: 10 } });
    const without = resolveCombat(params);
    params.defenderUnits = unitsWith({ roquette: { level: 1, count: 10 }, chasseur: { level: 1, count: 100 } });
    const withShips = resolveCombat(params);
    // Puissance affichée : attaque + résistance, bonus à domicile compris.
    const roq = UNIT_BASE_STATS.roquette;
    const ch = UNIT_BASE_STATS.chasseur;
    expect(without.defenderPower).toBeCloseTo(10 * (roq.attack + roq.defense) * 1.15);
    expect(withShips.defenderPower).toBeCloseTo((10 * (roq.attack + roq.defense) + 100 * 0.5 * (ch.attack + ch.defense)) * 1.15);
  });

  it("shield reduces the damage the defense takes", () => {
    const params = { ...baseCombatParams(), fleet: { chasseur: 40 }, attackerUnits: unitsWith({ chasseur: { level: 1, count: 40 } }), defenderUnits: unitsWith({ canon_plasma: { level: 1, count: 300 } }) };
    const plain = resolveCombat(params);
    const shielded = resolveCombat({ ...params, defenderShieldPct: 0.15 });
    expect(shielded.rounds?.[0].attackerDamage).toBeCloseTo((plain.rounds?.[0].attackerDamage ?? 0) * 0.85);
    expect(shielded.rounds?.[0].defenderHp).toBeGreaterThan(plain.rounds?.[0].defenderHp ?? 1);
    expect(shielded.shieldPercent).toBe(0.15);
  });

  it("rebuilds 60 % of destroyed defenses; ships at home only use the workshop", () => {
    const params = baseCombatParams();
    params.fleet = { chasseur: 400 };
    params.attackerUnits = unitsWith({ chasseur: { level: 1, count: 400 } });
    params.defenderUnits = unitsWith({ roquette: { level: 1, count: 100 }, fregate: { level: 1, count: 300 } });
    const r = resolveCombat(params);
    expect(r.outcome).toBe("attacker_win");
    const rawRoquette = (r.defenderLosses.roquette ?? 0) + (r.defenderRecovered.roquette ?? 0);
    expect(rawRoquette).toBeGreaterThan(0);
    expect(r.defenderRebuilt?.roquette).toBe(Math.floor(rawRoquette * 0.6));
    // Frégates à quai : engagées à moitié (la moitié au plus est touchée), pas de reconstruction.
    const rawFregate = (r.defenderLosses.fregate ?? 0) + (r.defenderRecovered.fregate ?? 0);
    expect(rawFregate).toBeGreaterThan(0);
    expect(rawFregate).toBeLessThanOrEqual(150);
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

describe("5.18 combat en tours", () => {
  const duel = (attackers: number, defenders: number, extra: Partial<Parameters<typeof resolveCombat>[0]> = {}) =>
    resolveCombat({
      ...baseCombatParams(),
      attackerUnits: unitsWith({ chasseur: { level: 1, count: attackers } }),
      fleet: { chasseur: attackers },
      defenderUnits: unitsWith({ canon_plasma: { level: 1, count: defenders } }),
      ...extra,
    });

  it("plays rounds, at most maxRounds, and reports the remaining hit points", () => {
    const r = duel(100, 120);
    expect(r.rounds?.length).toBeGreaterThan(0);
    expect(r.rounds!.length).toBeLessThanOrEqual(COMBAT_RULES.maxRounds);
    const last = r.rounds![r.rounds!.length - 1];
    expect(r.attackerLossPercent).toBeCloseTo(1 - last.attackerHp);
    expect(r.defenderLossPercent).toBeCloseTo(1 - last.defenderHp);
  });

  it("the attacker retreats once half of its hit points are gone (30 % in cautious formation)", () => {
    const fortress = { defenderUnits: unitsWith({ lance_gravitationnelle: { level: 1, count: 6 } }) };
    const r = duel(40, 0, fortress);
    expect(r.outcome).toBe("defender_win");
    expect(r.retreated).toBe(true);
    expect(r.attackerLossPercent).toBeGreaterThanOrEqual(COMBAT_RULES.retreatAt);
    expect(r.attackerLossPercent).toBeLessThan(1);
    const cautious = duel(40, 0, { ...fortress, retreatAt: COMBAT_RULES.cautiousRetreatAt });
    expect(cautious.retreated).toBe(true);
    expect(cautious.attackerLossPercent).toBeLessThan(r.attackerLossPercent);
  });

  it("a clearly stronger attacker wins in few rounds with light losses", () => {
    const r = duel(400, 50);
    expect(r.outcome).toBe("attacker_win");
    expect(r.rounds!.length).toBeLessThanOrEqual(2);
    expect(r.attackerLossPercent).toBeLessThan(0.15);
  });

  it("ships at home fight back: none in Bunker, all of them in Riposte", () => {
    const params = { ...baseCombatParams(), fleet: { chasseur: 200 }, attackerUnits: unitsWith({ chasseur: { level: 1, count: 200 } }), defenderUnits: unitsWith({ canon_plasma: { level: 1, count: 50 }, fregate: { level: 1, count: 400 } }) };
    const bunker = resolveCombat({ ...params, homeFleetFactor: 0 });
    const standard = resolveCombat(params);
    const riposte = resolveCombat({ ...params, homeFleetFactor: COMBAT_RULES.riposteHomeFleet });
    expect(bunker.defenderLosses.fregate ?? 0).toBe(0);
    expect(bunker.attackerLossPercent).toBeLessThan(standard.attackerLossPercent);
    expect(standard.attackerLossPercent).toBeLessThan(riposte.attackerLossPercent);
  });

  it("the loss factor of a formation applies to the attacker's losses after the battle", () => {
    const plain = duel(150, 100);
    const assault = duel(150, 100, { attackerLossFactor: 1.15 });
    expect(assault.outcome).toBe(plain.outcome);
    expect(assault.attackerLossPercent).toBeCloseTo(Math.min(1, plain.attackerLossPercent * 1.15));
  });

  it("NPC forces (power only) fight as a mirrored fleet of that power", () => {
    const params = { ...baseCombatParams(), fleet: { chasseur: 200 }, attackerUnits: unitsWith({ chasseur: { level: 1, count: 200 } }), defenderUnits: {} };
    const fleetAttack = computeFleetPower(params.attackerUnits, noTech, params.fleet, ["attack"]);
    expect(resolveCombat({ ...params, defenderPowerOverride: fleetAttack * 0.5 }).outcome).toBe("attacker_win");
    expect(resolveCombat({ ...params, defenderPowerOverride: fleetAttack * 1.5 }).outcome).toBe("defender_win");
    // Raid PNJ contre une base : même logique dans l'autre sens.
    const base = { ...baseCombatParams(), fleet: {}, defenderUnits: unitsWith({ canon_plasma: { level: 1, count: 200 } }) };
    expect(resolveCombat({ ...base, attackerPowerOverride: 100 }).outcome).toBe("defender_win");
    expect(resolveCombat({ ...base, attackerPowerOverride: 200 * 105 * 1.15 * 2 }).outcome).toBe("attacker_win");
  });
});

describe("6.2 (lot M) : pillage en surcharge", () => {
  it("la soute de pillage vaut lootCargoFactor × la soute des survivants", () => {
    const params = baseCombatParams();
    params.defenderResources = { scrap: 1_000_000_000 };
    const result = resolveCombat(params);
    const total = Object.values(result.loot ?? {}).reduce((a, b) => a + (b ?? 0), 0);
    expect(COMBAT_RULES.lootCargoFactor).toBe(2);
    expect(total).toBe(result.cargoCapacity);
    const saved = COMBAT_RULES.lootCargoFactor;
    COMBAT_RULES.lootCargoFactor = 1;
    const single = resolveCombat(baseCombatParams());
    COMBAT_RULES.lootCargoFactor = saved;
    expect(result.cargoCapacity).toBe(single.cargoCapacity * 2);
  });
});
