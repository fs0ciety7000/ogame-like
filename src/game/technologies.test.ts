import { describe, expect, it } from "vitest";
import { checkPrereqs, findTech, getTechCost, getTechTime, TECHNOLOGIES } from "@/game/technologies";

describe("findTech", () => {
  it("finds every declared technology", () => {
    for (const t of TECHNOLOGIES) {
      expect(findTech(t.id)).toBe(t);
    }
  });
});

describe("getTechCost / getTechTime", () => {
  const tech1 = findTech("tech1")!;

  it("level 1 cost equals the base cost", () => {
    expect(getTechCost(tech1, 1)).toEqual(tech1.baseCost);
  });

  it("cost and time grow with level", () => {
    const costL5 = getTechCost(tech1, 5);
    expect(costL5.scrap).toBeGreaterThan(tech1.baseCost.scrap);
    expect(getTechTime(tech1, 5)).toBeGreaterThan(tech1.baseTime);
  });

  it("uses the technology's own growth factor when set (tech1 vs default)", () => {
    const tech3 = findTech("tech3")!; // pas de costGrowth custom -> facteur par défaut
    const growth1 = getTechCost(tech1, 3).scrap / getTechCost(tech1, 2).scrap;
    const growth3 = getTechCost(tech3, 3).scrap / getTechCost(tech3, 2).scrap;
    // Comparaison approximative : les coûts sont arrondis (floor) à chaque
    // niveau, donc le ratio observé s'écarte légèrement du facteur exact.
    expect(growth1).toBeCloseTo(tech1.costGrowth!, 1);
    expect(Math.abs(growth1 - growth3)).toBeGreaterThan(0.5);
  });
});

describe("checkPrereqs", () => {
  it("has no prereqs for a root technology", () => {
    const tech1 = findTech("tech1")!;
    expect(checkPrereqs(tech1, {}).valid).toBe(true);
  });

  it("is invalid when a prereq level is missing", () => {
    const tech9 = findTech("tech9")!; // prereq: { tech1: 1 }
    const result = checkPrereqs(tech9, {});
    expect(result.valid).toBe(false);
    expect(result.list[0]).toMatchObject({ id: "tech1", requis: 1, actuel: 0, valide: false });
  });

  it("is valid once every prereq level is reached", () => {
    const tech9 = findTech("tech9")!;
    expect(checkPrereqs(tech9, { tech1: 1 }).valid).toBe(true);
    expect(checkPrereqs(tech9, { tech1: 5 }).valid).toBe(true);
  });

  it("handles multiple prereqs (all must be satisfied)", () => {
    const tech5 = findTech("tech5")!; // prereq: { tech1: 2, tech3: 2 }
    expect(checkPrereqs(tech5, { tech1: 2, tech3: 1 }).valid).toBe(false);
    expect(checkPrereqs(tech5, { tech1: 2, tech3: 2 }).valid).toBe(true);
  });
});
