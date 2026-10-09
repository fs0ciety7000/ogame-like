import { describe, expect, it } from "vitest";
import {
  applyBuildingDiscount,
  BUILD_COST_RULES,
  BUILD_TIME_RULES,
  buildingImage,
  getStorageCapacity,
  visualTier,
  withMissingBuildings,
  BUILDINGS,
  defaultBuildings,
  effectiveBuildingLevel,
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
    expect(cost.scrap).toBeGreaterThan(hangar.upgrade.baseCost.scrap!);
    expect(cost.energy).toBeGreaterThan(hangar.upgrade.baseCost.energy!);
  });

  it("reproduces exactly the historical per-building formulas", () => {
    // Anciennes formules codées en dur (avant le passage aux données).
    const geo = (base: number, target: number, steps: number, exp: number) =>
      Math.floor(base * Math.pow(Math.pow(target / base, 1 / steps), exp));
    // 6.14.167 (S9) : ancienne pente des extracteurs, pente adoucie coupée (`buildCost.enabled`) ; hangars et Atelier inchangés.
    const steep = { ...BUILD_COST_RULES, enabled: false };
    for (let lvl = 2; lvl <= 10; lvl++) {
      expect(getBuildingUpgradeCost(extractor, lvl, steep)).toEqual({
        scrap: geo(50, 2_500_000, 9, lvl - 1),
        energy: geo(20, 1_800_000, 9, lvl - 1),
      });
      expect(getBuildingUpgradeCost(hangar, lvl)).toEqual({
        scrap: geo(300, 5_000_000, 9, lvl - 1),
        energy: geo(150, 7_500_000, 9, lvl - 1),
      });
      expect(getBuildingUpgradeCost(atelier, lvl)).toEqual({
        nano: geo(1000, 10_000_000, 8, lvl - 2),
        data: geo(1000, 9_500_000, 8, lvl - 2),
      });
      // 6.14.159 (RD-1) : ancienne formule linéaire, courbe du départ coupée (`buildTime.enabled`).
      const linear = { ...BUILD_TIME_RULES, enabled: false };
      expect(getBuildingUpgradeTime(extractor, lvl, linear)).toBe((lvl - 1) * 600);
      expect(getBuildingUpgradeTime(hangar, lvl, linear)).toBe((lvl - 1) * 900);
      expect(getBuildingUpgradeTime(atelier, lvl, linear)).toBe((lvl - 1) * 1200);
    }
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

describe("effectiveBuildingLevel", () => {
  it("counts locked buildings as level 0", () => {
    const buildings = defaultBuildings();
    const total = BUILDINGS.reduce((sum, b) => sum + effectiveBuildingLevel(buildings, b.id), 0);
    expect(total).toBe(2); // l'extracteur de ferraille et l'entrepôt sont débloqués d'office
    buildings.atelier_reparation = { level: 3, unlocked: true };
    expect(effectiveBuildingLevel(buildings, "atelier_reparation")).toBe(3);
  });
});

describe("getRepairPercent", () => {
  it("is 0 while the workshop is locked", () => {
    expect(getRepairPercent(defaultBuildings())).toBe(0);
  });

  it("gives 5 % per level up to 50 % at level 10, then 2 % per level up to 70 %", () => {
    const at = (level: number) => {
      const b = defaultBuildings();
      b.atelier_reparation = { level, unlocked: true };
      return getRepairPercent(b);
    };
    expect(at(1)).toBeCloseTo(0.05);
    expect(at(10)).toBeCloseTo(0.5);
    expect(at(15)).toBeCloseTo(0.6);
    expect(at(20)).toBeCloseTo(0.7);
    expect(at(40)).toBeCloseTo(0.7); // plafonné
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

describe("levels 11 to 20", () => {
  const extractor = () => findBuilding("extracteur_ferraille")!;

  it("keeps the historical costs and times of levels 1 to 10", () => {
    // Même formule qu'avant (arrondi inférieur de 2,5 M et 1,8 M), pente adoucie coupée ; 6.14.167 : ×2,5 par niveau dès le 5.
    expect(getBuildingUpgradeCost(extractor(), 10, { ...BUILD_COST_RULES, enabled: false })).toEqual({ scrap: 2_499_999, energy: 1_799_999 });
    expect(getBuildingUpgradeCost(extractor(), 10)).toEqual({ scrap: 449_707, energy: 218_750 });
    expect(getBuildingUpgradeCost(extractor(), 2)).toEqual({ scrap: 166, energy: 71 });
    expect(getBuildingUpgradeTime(extractor(), 10)).toBe(9 * 600);
  });

  it("uses the second tier from level 11: rare resources, 3 h to 12 h", () => {
    expect(getBuildingUpgradeCost(extractor(), 11)).toEqual({ scrap: 5_000_000, energy: 3_000_000, reinforcedSteel: 20_000 });
    const top = getBuildingUpgradeCost(extractor(), 20);
    expect(top.scrap).toBeCloseTo(500_000_000, -3);
    expect(top.reinforcedSteel).toBeCloseTo(2_000_000, -2);
    expect(getBuildingUpgradeTime(extractor(), 11)).toBe(3 * 3600);
    expect(getBuildingUpgradeTime(extractor(), 20)).toBe(12 * 3600);
    expect(productionPerSecond("extracteur_ferraille", 10)).toBe(500);
    expect(productionPerSecond("extracteur_ferraille", 20)).toBe(4657);
  });

  it("picks visual tiers and tier images", () => {
    expect([1, 5, 9, 10, 15, 20].map(visualTier)).toEqual([0, 5, 5, 10, 15, 20]);
    const b = { ...extractor(), tierImages: { 10: "/x10.webp" } };
    expect(buildingImage(b, 9)).toBe(b.image);
    expect(buildingImage(b, 17)).toBe("/x10.webp");
  });
});

describe("storage", () => {
  it("grows 1.6× per level from 2 M", () => {
    const b = defaultBuildings();
    expect(getStorageCapacity(b)).toBe(3_200_000);
    b.entrepot.level = 10;
    expect(getStorageCapacity(b)).toBe(Math.floor(2_000_000 * 1.6 ** 10));
  });

  it("starts a newly added warehouse at the level that already holds the biggest stock", () => {
    const b = defaultBuildings();
    delete (b as Record<string, unknown>).entrepot;
    const filled = withMissingBuildings(b, { scrap: 150_000_000, energy: 10 });
    expect(getStorageCapacity(filled)).toBeGreaterThanOrEqual(150_000_000);
    expect(filled.entrepot.level).toBe(10);
    expect(withMissingBuildings(b).entrepot.level).toBe(1);
  });
});
