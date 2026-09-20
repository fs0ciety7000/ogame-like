import { describe, expect, it } from "vitest";
import { canAffordAll, getTradeRate } from "@/game/resources";

describe("getTradeRate", () => {
  it("is 0.01 when trading a common resource for a rare one", () => {
    expect(getTradeRate("scrap", "reinforcedSteel")).toBe(0.01);
  });

  it("is 50 when trading a rare resource for a common one", () => {
    expect(getTradeRate("reinforcedSteel", "scrap")).toBe(50);
  });

  it("is 1 for same-rarity trades (not a real offer, just a safe default)", () => {
    expect(getTradeRate("scrap", "energy")).toBe(1);
    expect(getTradeRate("reinforcedSteel", "cyberModule")).toBe(1);
  });
});

describe("canAffordAll", () => {
  const resources = { scrap: 100, energy: 50, nano: 0, data: 0, reinforcedSteel: 0, cyberModule: 0, syntheticNanites: 0, aiFragment: 0 };

  it("is true when every cost is covered", () => {
    expect(canAffordAll(resources, { scrap: 100, energy: 50 })).toBe(true);
  });

  it("is false when any single cost isn't covered", () => {
    expect(canAffordAll(resources, { scrap: 101 })).toBe(false);
  });

  it("treats a missing resource in cost as free", () => {
    expect(canAffordAll(resources, {})).toBe(true);
  });
});
