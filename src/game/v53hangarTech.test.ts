import { afterEach, describe, expect, it } from "vitest";
import { getUnitCapacity } from "@/game/buildings";
import { describeTechEffect, setTechnologies, TECHNOLOGIES, validateTechEffect } from "@/game/technologies";

const original = [...TECHNOLOGIES];
afterEach(() => setTechnologies(original));

describe("v5.3 technologie de capacité des hangars", () => {
  it("augmente seulement le hangar visé, de 5 % par niveau par défaut", () => {
    setTechnologies([...original, { ...original[0], id: "tech_hangar_atk", effects: [{ type: "hangar_capacity", target: "attack" }] }]);
    const buildings = { hangar_attaque: { level: 20, unlocked: true }, hangar_defense: { level: 20, unlocked: true } };
    expect(getUnitCapacity(buildings, "attack")).toBe(40_000);
    expect(getUnitCapacity(buildings, "attack", { tech_hangar_atk: 10 })).toBe(60_000);
    expect(getUnitCapacity(buildings, "defense", { tech_hangar_atk: 10 })).toBe(40_000);
  });

  it("exige un hangar visé et se décrit lisiblement", () => {
    const refs = { resources: new Set<string>(), unitIds: new Set<string>(), buildingIds: new Set<string>() };
    expect(validateTechEffect("T", { type: "hangar_capacity" }, refs)).toHaveLength(1);
    expect(validateTechEffect("T", { type: "hangar_capacity", target: "defense" }, refs)).toHaveLength(0);
    expect(describeTechEffect({ type: "hangar_capacity", target: "defense" }, 10)).toBe("+50 % de capacité des hangars de défense");
  });
});
