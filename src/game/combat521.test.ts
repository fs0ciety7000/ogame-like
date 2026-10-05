import { describe, expect, it } from "vitest";
import { classFactor, COMBAT_RULES, resolveCombat } from "@/game/combat";
import { unitClasses } from "@/game/unitClasses";

const base = { attackerTechLevels: {}, attackerRepairPct: 0, defenderTechLevels: {}, defenderRepairPct: 0, defenderResources: {} };

describe("5.21 rôles par classe et cible prioritaire", () => {
  it("Fort > Moyen > Faible > Fort", () => {
    expect(classFactor({ cls: "heavy" }, { cls: "medium" })).toBeCloseTo(1 + COMBAT_RULES.classEdge);
    expect(classFactor({ cls: "medium" }, { cls: "heavy" })).toBeCloseTo(1 - COMBAT_RULES.classEdge);
    expect(classFactor({ cls: "light" }, { cls: "heavy" })).toBeCloseTo(1 + COMBAT_RULES.classEdge);
    expect(classFactor({ cls: "light" }, { cls: "light" })).toBe(1);
    expect(classFactor({}, { cls: "heavy" })).toBe(1);
    // Avantage propre à l'unité (Batterie anti-essaim).
    expect(classFactor({ cls: "medium", edge: 0.4 }, { cls: "light" })).toBeCloseTo(1.4);
  });

  it("les classes imposées sont respectées", () => {
    const c = unitClasses();
    expect(c.bastion).toBe("heavy");
    expect(c.batterie_essaim).toBe("medium");
    expect(c.vaisseau_atelier).toBe("support");
  });

  it("la cible prioritaire concentre les pertes sur la catégorie visée", () => {
    const fight = (targetPriority?: "defenses" | "ships") =>
      resolveCombat({
        ...base,
        attackerUnits: { fregate: { level: 1, count: 300 } },
        fleet: { fregate: 300 },
        defenderUnits: { canon_plasma: { level: 1, count: 200 }, fregate: { level: 1, count: 200 } },
        homeFleetFactor: 1,
        targetPriority,
      });
    const none = fight();
    const def = fight("defenses");
    const ships = fight("ships");
    expect(def.defenderLosses.canon_plasma ?? 0).toBeGreaterThan(none.defenderLosses.canon_plasma ?? 0);
    expect(ships.defenderLosses.fregate ?? 0).toBeGreaterThan(none.defenderLosses.fregate ?? 0);
  });
});
