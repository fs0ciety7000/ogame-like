import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent, defaultGameContent, validateGameContent } from "@/game/content";
import { DEFAULT_TECHNOLOGIES, describeTechEffect, techBonus, techEffects, techReductionFactor, type TechDef } from "@/game/technologies";
import { getProductionRatesPerSecond } from "@/game/production";
import { getStorageCapacity } from "@/game/buildings";
import { getFleetUpkeep, protectedAmount, ECONOMY_RULES } from "@/game/economy";
import { fleetCargoCapacity } from "@/game/combat";
import { findUnit, getUnitBuildTime, UNIT_TO_TECH } from "@/game/units";
import { allianceFlightFactor } from "@/game/alliances";
import { counterEspionage } from "@/game/espionage";
import { flushState } from "@/game/flush";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import type { Buildings } from "@/types/game";

const NOW = 1_700_000_000_000;

/** Ajoute une techno de test aux technos par défaut. */
function withTech(tech: Partial<TechDef> & { id: string }) {
  const t: TechDef = { nom: tech.id, desc: "", maxLevel: 10, baseCost: { scrap: 1 }, baseTime: 1, prereq: {}, ...tech };
  applyGameContent({ technologies: [...DEFAULT_TECHNOLOGIES, t] });
}

afterEach(() => applyGameContent({}));

describe("effets des technologies (v2.6)", () => {
  it("convertit l'ancien format en liste d'effets, sans changer les bonus", () => {
    expect(techEffects(DEFAULT_TECHNOLOGIES.find((t) => t.id === "tech3")!)).toEqual([{ type: "energy_efficiency" }]);
    expect(techEffects(DEFAULT_TECHNOLOGIES.find((t) => t.id === "tech6")!)).toEqual([{ type: "unlock_buildings" }]);
    expect(techBonus({ tech3: 4 }, "energy_efficiency")).toBeCloseTo(0.4);
    expect(validateGameContent(defaultGameContent())).toEqual([]);
  });

  it("cumule plusieurs effets, filtre par ressource et plafonne les réductions", () => {
    withTech({
      id: "x",
      effects: [
        { type: "resource_production", target: "scrap", value: 0.2 },
        { type: "research_time", value: 0.1 },
        { type: "energy_efficiency", value: 0.05 },
      ],
    });
    expect(techBonus({ x: 3 }, "resource_production", "scrap")).toBeCloseTo(0.6);
    expect(techBonus({ x: 3 }, "resource_production", "nano")).toBe(0);
    expect(techBonus({ x: 3, tech3: 2 }, "energy_efficiency")).toBeCloseTo(0.35);
    expect(techReductionFactor({ x: 10 }, "research_time")).toBeCloseTo(0.25); // 100 % → plafond 75 %
  });

  it("branche chaque effet dans le moteur", () => {
    withTech({
      id: "x",
      effects: [
        { type: "resource_production", target: "scrap", value: 0.5 },
        { type: "storage_capacity", value: 0.5 },
        { type: "protected_storage", value: 0.1 },
        { type: "fleet_upkeep", value: 0.5 },
        { type: "cargo_capacity", value: 1 },
        { type: "unit_time", value: 0.5 },
        { type: "fleet_speed", value: 0.2 },
        { type: "counter_spy", value: 2 },
      ],
    });
    const lv = { x: 1 };
    const player = defaultPlayerState("u1", "T");
    const buildings: Buildings = { ...player.buildings, entrepot: { level: 3, unlocked: true } };

    const base = getProductionRatesPerSecond(player.buildings, {});
    expect(getProductionRatesPerSecond(player.buildings, lv).scrap).toBe(Math.floor((base.scrap ?? 0) * 1.5));
    expect(getProductionRatesPerSecond(player.buildings, lv).energy).toBe(base.energy);

    expect(getStorageCapacity(buildings, lv)).toBe(Math.floor(getStorageCapacity(buildings) * 1.5));
    // Règle de capacité (avant l'activation de la règle en heures, 5.32).
    expect(protectedAmount(buildings, "scrap", lv, undefined, undefined, Date.UTC(2026, 0, 1))).toBe(Math.floor(getStorageCapacity(buildings, lv) * (ECONOMY_RULES.protectedStoragePct + 0.1)));

    const units = { chasseur: { level: 2, count: 10 } };
    expect(getFleetUpkeep(units, lv)).toBeCloseTo(getFleetUpkeep(units) * 0.5);
    expect(fleetCargoCapacity(units, { chasseur: 10 }, lv)).toBe(fleetCargoCapacity(units, { chasseur: 10 }) * 2);

    const unit = findUnit("chasseur")!;
    expect(getUnitBuildTime(unit, lv)).toBe(Math.max(1, Math.round(getUnitBuildTime(unit) * 0.5)));
    expect(allianceFlightFactor(null, lv)).toBeCloseTo(0.8);
    expect(counterEspionage({ techLevels: lv, units: {} }) - counterEspionage({ techLevels: {}, units: {} })).toBe(2);
  });

  it("débloque les bâtiments et l'unité désignés par la techno", () => {
    withTech({ id: "x", maxLevel: 3, effects: [{ type: "unlock_buildings", targets: ["entrepot"] }, { type: "unlock_next_level", target: "cargo" }] });
    expect(UNIT_TO_TECH.cargo).toBe("x");
    const player = { ...defaultPlayerState("u1", "T"), resourcesUpdatedAtMs: NOW };
    player.buildings = { ...player.buildings, entrepot: { level: 0, unlocked: false } };
    const queues = { ...defaultQueues(), activeResearches: [{ id: "x", endTime: NOW - 1 }] };
    const { player: after } = flushState(player, queues, NOW);
    expect(after.techLevels.x).toBe(1);
    expect(after.buildings.entrepot.unlocked).toBe(true);
    expect(after.units.cargo.level).toBe(1);
  });

  it("valide cibles et bornes, et décrit les effets", () => {
    const c = defaultGameContent();
    c.technologies = [
      ...c.technologies,
      { id: "bad", nom: "Bad", desc: "", maxLevel: 5, baseCost: {}, baseTime: 1, prereq: {}, effects: [{ type: "resource_production" }, { type: "fleet_speed", value: 0.9 }, { type: "unlock_buildings", targets: ["nope"] }] },
    ];
    const errors = validateGameContent(c);
    expect(errors.some((e) => e.includes("ressource visée"))).toBe(true);
    expect(errors.some((e) => e.includes("entre 0 et 0.5"))).toBe(true);
    expect(errors.some((e) => e.includes("« nope » inexistant"))).toBe(true);
    expect(describeTechEffect({ type: "fleet_speed", value: 0.05 }, 4)).toBe("−20 % de temps de vol");
    expect(describeTechEffect({ type: "resource_production", target: "scrap" }, 2, { resource: () => "ferraille" })).toBe("+20 % de production de ferraille");
  });
});
