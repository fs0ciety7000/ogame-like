import { describe, expect, it } from "vitest";
import { checkPrereqs, findTech, getTechCost, getTechTime, TECHNOLOGIES, type TechDef } from "@/game/technologies";
import { ownedBlueprints } from "@/game/units";

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

describe("v5.9 plan d'unité requis", () => {
  // Techno ajoutée depuis l'administration qui améliore le Traqueur Kesh (unité à plan).
  const kesh: TechDef = {
    id: "tech_kesh",
    nom: "Traqueur Kesh",
    desc: "",
    maxLevel: 20,
    baseCost: { scrap: 1 },
    baseTime: 1,
    effects: [{ type: "unlock_next_level", target: "traqueur_kesh" }, { type: "unit_attack" }],
    prereq: { tech1: 1 },
  };

  it("bloque la techno tant que le plan n'est pas acheté", () => {
    const check = checkPrereqs(kesh, { tech1: 5 });
    expect(check.valid).toBe(false);
    expect(check.list.find((r) => r.kind === "plan")).toMatchObject({ nom: "Plan : Traqueur Kesh", valide: false });
  });

  it("la débloque une fois le plan possédé, avec les autres prérequis", () => {
    expect(checkPrereqs(kesh, { tech1: 5 }, ownedBlueprints({ bounties: { owned: ["blueprint"] } })).valid).toBe(true);
    expect(checkPrereqs(kesh, { tech1: 0 }, ["traqueur_kesh"]).valid).toBe(false);
  });

  it("ne change rien aux technos sans unité à plan", () => {
    const tech13 = findTech("tech13")!;
    expect(checkPrereqs(tech13, { tech10: 5, tech7: 1, tech1: 14 }).valid).toBe(true);
    expect(checkPrereqs(tech13, {}).list.every((r) => r.kind === "tech")).toBe(true);
  });

  it("seul le plan acheté au Comptoir compte", () => {
    expect(ownedBlueprints({})).toEqual([]);
    expect(ownedBlueprints({ bounties: { owned: ["title"] } })).toEqual([]);
  });
});
