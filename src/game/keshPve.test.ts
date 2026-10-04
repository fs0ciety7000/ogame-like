import { describe, expect, it } from "vitest";
import { computeFleetPower, homeDefensePower, pveAttackFactor, pveHomeDefenseFactor } from "@/game/combat";
import { KESH_HUNTER_UNIT, KESH_PVE_BONUS } from "@/game/units";

/* v5.9 : le Traqueur Kesh garde ses +50 % d'attaque contre tous les PNJ,
   en attaque (flotte envoyée) comme en défense (vaisseaux à quai). */

const K = KESH_HUNTER_UNIT.id;
const units = { [K]: { level: 1, count: 10 }, fregate: { level: 1, count: 20 }, roquette: { level: 1, count: 30 } };

describe("v5.9 Traqueur Kesh contre les PNJ", () => {
  it("attaque : seule la part des Traqueurs gagne 50 %", () => {
    const fleet = { [K]: 10, fregate: 20 };
    const all = computeFleetPower(units, {}, fleet, ["attack"]);
    const hunters = computeFleetPower(units, {}, { [K]: 10 }, ["attack"]);
    expect(pveAttackFactor(units, {}, fleet)).toBeCloseTo(1 + (KESH_PVE_BONUS * hunters) / all);
    expect(pveAttackFactor(units, {}, { fregate: 20 })).toBe(1);
  });

  it("défense : les Traqueurs à quai renforcent la puissance défensive", () => {
    const factor = pveHomeDefenseFactor(units, {});
    expect(factor).toBeGreaterThan(1);
    // Le surplus vaut 50 % de l'attaque des Traqueurs, avec la part de flotte engagée à domicile.
    const base = homeDefensePower(units, {});
    expect(base * factor).toBeGreaterThan(base);
    expect(pveHomeDefenseFactor({ fregate: { level: 1, count: 20 } }, {})).toBe(1);
  });

  it("sans flotte à quai engagée, pas de bonus en défense", () => {
    expect(pveHomeDefenseFactor(units, {}, 0)).toBe(1);
  });
});
