import { describe, expect, it } from "vitest";
import {
  applyBuildingDiscount,
  BUILDINGS,
  defaultBuildings,
  findBuilding,
  getBuildingUpgradeCost,
  getBuildingUpgradeTime,
  getRepairPercent,
  getUnitCapacity,
  productionPerSecond,
} from "@/game/buildings";

describe("findBuilding / defaultBuildings", () => {
  it("finds every building declared in BUILDINGS", () => {
    for (const b of BUILDINGS) {
      expect(findBuilding(b.id)).toBe(b);
    }
  });

  it("returns undefined for an unknown id", () => {
    expect(findBuilding("does_not_exist")).toBeUndefined();
  });

  it("starts with only the scrap extractor unlocked", () => {
    const buildings = defaultBuildings();
    expect(buildings.extracteur_ferraille.unlocked).toBe(true);
    expect(buildings.reacteur_instable.unlocked).toBe(false);
    expect(buildings.atelier_reparation.unlocked).toBe(false);
  });
});

describe("productionPerSecond", () => {
  it("is 0 at level 0", () => {
    expect(productionPerSecond("extracteur_ferraille", 0)).toBe(0);
  });

  it("increases monotonically with level", () => {
    const rates = Array.from({ length: 10 }, (_, i) => productionPerSecond("extracteur_ferraille", i + 1));
    for (let i = 1; i < rates.length; i++) {
      expect(rates[i]).toBeGreaterThan(rates[i - 1]);
    }
  });
});

describe("getBuildingUpgradeCost / getBuildingUpgradeTime", () => {
  const extractor = findBuilding("extracteur_ferraille")!;
  const atelier = findBuilding("atelier_reparation")!;
  const hangar = findBuilding("hangar_attaque")!;

  it("scaled buildings cost more and take longer at higher levels", () => {
    const costL2 = getBuildingUpgradeCost(extractor, 2);
    const costL9 = getBuildingUpgradeCost(extractor, 9);
    expect(costL9.scrap!).toBeGreaterThan(costL2.scrap!);
    expect(getBuildingUpgradeTime(extractor, 9)).toBeGreaterThan(getBuildingUpgradeTime(extractor, 2));
  });

  it("level 1 is instant (no upgrade time)", () => {
    expect(getBuildingUpgradeTime(extractor, 1)).toBe(0);
  });

  it("atelier cost is expressed in nano/data, not scrap/energy", () => {
    const cost = getBuildingUpgradeCost(atelier, 3);
    expect(cost.nano).toBeGreaterThan(0);
    expect(cost.data).toBeGreaterThan(0);
    expect(cost.scrap).toBeUndefined();
  });

  it("hangar cost is scrap/energy and scales up", () => {
    const cost = getBuildingUpgradeCost(hangar, 5);
    expect(cost.scrap).toBeGreaterThan(hangar.cost.scrap!);
    expect(cost.energy).toBeGreaterThan(hangar.cost.energy!);
  });
});

describe("applyBuildingDiscount", () => {
  it("leaves cost untouched when discount is 0", () => {
    const cost = { scrap: 1000, energy: 500 };
    expect(applyBuildingDiscount(cost, 0)).toEqual(cost);
  });

  it("reduces every numeric field proportionally", () => {
    const cost = { scrap: 1000, energy: 500 };
    const discounted = applyBuildingDiscount(cost, 0.25);
    expect(discounted.scrap).toBe(750);
    expect(discounted.energy).toBe(375);
  });

  it("never goes negative", () => {
    const discounted = applyBuildingDiscount({ scrap: 10 }, 5);
    expect(discounted.scrap).toBe(0);
  });
});

describe("getRepairPercent", () => {
  it("is clamped between 0 and 50%", () => {
    expect(getRepairPercent(defaultBuildings())).toBeCloseTo(0.05);
    const maxed = defaultBuildings();
    maxed.atelier_reparation.level = 20; // au-delà du niveau max théorique
    expect(getRepairPercent(maxed)).toBe(0.5);
  });
});

describe("getUnitCapacity", () => {
  it("is 0 with no hangar built", () => {
    const buildings = defaultBuildings();
    buildings.hangar_attaque.level = 0;
    expect(getUnitCapacity(buildings, "attack")).toBe(0);
  });

  it("scales linearly with hangar level (2000 per level)", () => {
    const buildings = defaultBuildings();
    buildings.hangar_defense.level = 3;
    expect(getUnitCapacity(buildings, "defense")).toBe(6000);
  });
});
