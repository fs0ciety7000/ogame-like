import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent, defaultGameContent, validateGameContent } from "@/game/content";
import { DEFAULT_TECHNOLOGIES, techBonus, type TechDef } from "@/game/technologies";
import { COMBAT_RULES } from "@/game/combat";
import { LAIR_LOCATE_RULES } from "@/game/pirates";
import { CLASS_UNIT_RULES } from "@/game/classUnits";
import { COLONY_ROUTE_RULES, COLONY_RULES } from "@/game/colonies";
import { CONTRACT_RULES } from "@/game/contracts";
import { ACHIEVEMENT_GEN_RULES } from "@/game/procedural";

/* 6.7.1 : les chiffres ajoutés en 6.4–6.6 se règlent dans l'administration (Règles) et le moteur les applique. */

afterEach(() => applyGameContent({}));

const extraTech: TechDef = { id: "techX", nom: "X", desc: "", maxLevel: 10, baseCost: { scrap: 1 }, baseTime: 1, prereq: {}, effects: [{ type: "unit_attack", value: 0.1 }] };

describe("6.7.1 : réglages admin", () => {
  it("plafond des technos de combat", () => {
    const d = defaultGameContent();
    applyGameContent({ technologies: [...DEFAULT_TECHNOLOGIES, extraTech], rules: { ...d.rules, combat: { ...d.rules.combat, techCombatCap: 1.2 } } });
    expect(techBonus({ tech5: 10, techX: 10 }, "unit_attack")).toBeCloseTo(1.2);
    applyGameContent({ technologies: [...DEFAULT_TECHNOLOGIES, extraTech] });
    expect(techBonus({ tech5: 10, techX: 10 }, "unit_attack")).toBeCloseTo(1.5);
  });

  it("une techno au niveau max : la limite suit le réglage", () => {
    const d = defaultGameContent();
    const strong = { ...extraTech, id: "techY", maxLevel: 20, effects: [{ type: "unit_attack" as const, value: 0.07 }] };
    expect(validateGameContent({ ...d, technologies: [...d.technologies, strong] }).join(" ")).toMatch(/\+140 %/);
    applyGameContent({ rules: { ...d.rules, combat: { ...d.rules.combat, techCombatCap: 2, techCombatPerTechMax: 1.5 } } });
    expect(validateGameContent({ ...currentContentWith(strong) }).join(" ")).not.toMatch(/\+140 %/);
  });

  it("Traqueur, Localiser, vaisseaux de classe, colonies", () => {
    const d = defaultGameContent();
    applyGameContent({
      rules: {
        ...d.rules,
        combat: { ...d.rules.combat, keshPveBonus: 0.8 },
        pirates: { ...d.rules.pirates, lairLocateMinRepelled: 2, lairLocateCostHours: 6 },
        classes: { ...d.rules.classes, harvesterRecycleBonus: 0.4, scoutExpeditionTime: 0.2 },
        colonies: { ...d.rules.colonies, defenseQueueMax: 8 },
        colonyRoutes: { ...d.rules.colonyRoutes, supplyHomeReservePct: 0.5 },
      },
    });
    expect(COMBAT_RULES.keshPveBonus).toBe(0.8);
    expect(LAIR_LOCATE_RULES.minRepelled).toBe(2);
    expect(LAIR_LOCATE_RULES.costHours).toBe(6);
    expect(CLASS_UNIT_RULES.harvesterRecycleBonus).toBe(0.4);
    expect(CLASS_UNIT_RULES.scoutExpeditionTime).toBe(0.2);
    expect(COLONY_RULES.defenseQueueMax).toBe(8);
    expect(COLONY_ROUTE_RULES.supplyHomeReservePct).toBe(0.5);
    applyGameContent({});
    expect(COMBAT_RULES.keshPveBonus).toBe(0.5);
    expect(COLONY_RULES.defenseQueueMax).toBe(5);
  });

  it("refuse des valeurs hors bornes", () => {
    const d = defaultGameContent();
    const bad = { ...d, rules: { ...d.rules, combat: { ...d.rules.combat, techCombatPerTechMax: 3 }, colonies: { ...d.rules.colonies, defenseQueueMax: 50 } } };
    const errors = validateGameContent(bad).join(" ");
    expect(errors).toMatch(/plafond total/);
    expect(errors).toMatch(/file de défense/);
  });

  it("6.14.108 et 6.14.109 (AP-L4, AP-L5) : paliers de succès générés et objectifs du jour, réglages appliqués champ par champ", () => {
    applyGameContent({ rules: { achievementGen: { cooldownDays: 7 }, dailyContracts: { weights: { win_defense: 2 }, targets: { missions: 3 } } } } as never);
    expect(ACHIEVEMENT_GEN_RULES.cooldownDays).toBe(7);
    expect(ACHIEVEMENT_GEN_RULES.minHolders).toBe(3);
    expect(CONTRACT_RULES.weights.win_defense).toBe(2);
    expect(CONTRACT_RULES.weights.research).toBe(1);
    expect(CONTRACT_RULES.targets.missions).toBe(3);
    expect(CONTRACT_RULES.targets.build_units).toBe(20);
    applyGameContent({});
    expect(CONTRACT_RULES.weights.win_defense).toBe(0.5);
    expect(ACHIEVEMENT_GEN_RULES.cooldownDays).toBe(30);
  });
});

function currentContentWith(t: TechDef) {
  const d = defaultGameContent();
  return { ...d, technologies: [...d.technologies, t], rules: { ...d.rules, combat: { ...d.rules.combat, techCombatCap: 2, techCombatPerTechMax: 1.5 } } };
}
