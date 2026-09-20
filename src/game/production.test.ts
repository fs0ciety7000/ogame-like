import { describe, expect, it } from "vitest";
import { computeElapsedProduction, getProductionBonus, getProductionRatesPerSecond } from "@/game/production";
import { defaultBuildings } from "@/game/buildings";
import type { Buildings } from "@/types/game";

describe("getProductionBonus", () => {
  it("is 0 without tech3", () => {
    expect(getProductionBonus({})).toBe(0);
  });

  it("is +10% per tech3 level", () => {
    expect(getProductionBonus({ tech3: 4 })).toBeCloseTo(0.4);
  });
});

describe("getProductionRatesPerSecond", () => {
  it("only produces scrap by default (only the scrap extractor is unlocked)", () => {
    const rates = getProductionRatesPerSecond(defaultBuildings(), {});
    expect(rates.scrap).toBe(2); // niveau 1
    expect(rates.energy).toBeUndefined();
    expect(rates.nano).toBeUndefined();
  });

  it("produces energy once the reactor is unlocked", () => {
    const buildings: Buildings = { ...defaultBuildings(), reacteur_instable: { level: 3, unlocked: true } };
    const rates = getProductionRatesPerSecond(buildings, {});
    expect(rates.energy).toBe(7); // table niveau 3
  });

  it("does not produce for a lockable building at level > 0 but still locked", () => {
    const buildings: Buildings = { ...defaultBuildings(), reacteur_instable: { level: 5, unlocked: false } };
    const rates = getProductionRatesPerSecond(buildings, {});
    expect(rates.energy).toBeUndefined();
  });

  it("applies the tech3 production bonus", () => {
    const withBonus = getProductionRatesPerSecond(defaultBuildings(), { tech3: 10 });
    expect(withBonus.scrap).toBe(4); // floor(2 * 2.0)
  });
});

describe("computeElapsedProduction", () => {
  it("returns nothing for 0 elapsed seconds", () => {
    expect(computeElapsedProduction(defaultBuildings(), {}, 0)).toEqual({});
  });

  it("scales linearly with elapsed time (offline catch-up)", () => {
    const gains = computeElapsedProduction(defaultBuildings(), {}, 3600); // 1h hors-ligne
    expect(gains.scrap).toBe(2 * 3600);
  });
});
