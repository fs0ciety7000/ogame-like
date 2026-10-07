import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent, defaultGameContent, validateGameContent } from "@/game/content";
import { BUILDINGS, defaultBuildings, getUnitCapacity, withMissingBuildings } from "@/game/buildings";
import { UNIT_BASE_STATS, OFFENSIVE_UNITS, UNIT_TO_TECH } from "@/game/units";
import { MISSIONS } from "@/game/missions";
import { PVP_RULES } from "@/game/pvp";
import { flushState } from "@/game/flush";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";

afterEach(() => applyGameContent({}));

describe("game content", () => {
  it("default content is valid", () => {
    expect(validateGameContent(defaultGameContent())).toEqual([]);
  });

  it("applies modified units: combat stats and categories are derived from the unit sheet", () => {
    const content = defaultGameContent();
    content.units.find((u) => u.id === "chasseur")!.stats.attaque = 999;
    content.units.push({ ...content.units[0], id: "croiseur", name: "Croiseur", unlockTech: "tech10" });
    applyGameContent({ units: content.units });
    expect(UNIT_BASE_STATS.chasseur.attack).toBe(999);
    expect(OFFENSIVE_UNITS).toContain("croiseur");
    expect(UNIT_TO_TECH.croiseur).toBe("tech10");
  });

  it("a new building is added to existing players with its default state", () => {
    const content = defaultGameContent();
    content.buildings.push({ ...content.buildings[5], id: "hangar_lourd", name: "Hangar lourd", unlockedByTech: "tech6" });
    applyGameContent({ buildings: content.buildings });
    expect(BUILDINGS.some((b) => b.id === "hangar_lourd")).toBe(true);
    expect(defaultBuildings().hangar_lourd).toEqual({ level: 1, unlocked: false });
    const old = { extracteur_ferraille: { level: 3, unlocked: true } };
    expect(withMissingBuildings(old).hangar_lourd).toBeDefined();
    // Deux hangars d'attaque niveau 1 : capacités additionnées.
    expect(getUnitCapacity({ hangar_attaque: { level: 1, unlocked: true }, hangar_lourd: { level: 1, unlocked: true } }, "attack")).toBe(4000);
  });

  it("unlock_buildings effect unlocks every building linked to the tech", () => {
    const player = { ...defaultPlayerState("u", "U"), resourcesUpdatedAtMs: 1000 };
    const queues = { ...defaultQueues(), activeResearches: [{ id: "tech6", endTime: 500 }] };
    const { player: after } = flushState(player, queues, 1000);
    expect(after.buildings.hangar_attaque.unlocked).toBe(true);
    expect(after.buildings.hangar_defense.unlocked).toBe(true);
  });

  it("applies missions and rules, missing sections fall back to defaults", () => {
    const content = defaultGameContent();
    applyGameContent({
      missions: [{ ...content.missions[0], key: "nouvelle", name: "Nouvelle" }],
      rules: { ...content.rules, pvp: { ...content.rules.pvp, shieldAfterDefeatMs: 5 } },
    });
    expect(Object.keys(MISSIONS)).toEqual(["nouvelle"]);
    expect(PVP_RULES.shieldAfterDefeatMs).toBe(5);
    applyGameContent({});
    // 6.14.72 (AU27, AE-7) : bouclier de 3 h par défaut.
    expect(PVP_RULES.shieldAfterDefeatMs).toBe(10_800_000);
    expect(Object.keys(MISSIONS).length).toBeGreaterThan(1);
  });

  it("reports broken references, duplicates and prerequisite cycles", () => {
    const content = defaultGameContent();
    content.units[0].unlockTech = "tech_inexistante";
    content.missions.push({ ...content.missions[0] });
    content.technologies.find((t) => t.id === "tech1")!.prereq = { tech9: 1 };
    const errors = validateGameContent(content).join("\n");
    expect(errors).toMatch(/tech_inexistante/);
    expect(errors).toMatch(/en double/);
    expect(errors).toMatch(/cycle/);
  });
});
