import { afterEach, describe, expect, it } from "vitest";
import { FLEET_RULES, fleetSlotBlocker, fleetSlots } from "@/game/fleets";
import { applyGameContent, defaultGameContent } from "@/game/content";
import { ALLIANCE_RULES } from "@/game/alliances";

/* 5.33 (proposals/flottes-emplacements.md) : emplacements de flotte. */

const owner = { buildings: {} } as never;

afterEach(() => applyGameContent({}));

describe("emplacements de flotte", () => {
  it("10 emplacements par défaut, réglables", () => {
    expect(fleetSlots(owner)).toBe(10);
    expect(FLEET_RULES.slotsBase).toBe(10);
  });

  it("refuse le 11e départ, accepte sous la limite", () => {
    expect(fleetSlotBlocker(owner, "attack", 9)).toBeNull();
    expect(fleetSlotBlocker(owner, "attack", 10)).toMatch(/emplacements de flotte sont pris \(10 \/ 10\)/);
    expect(fleetSlotBlocker(owner, "recycle", 12)).not.toBeNull();
  });

  it("sondes et expéditions ne comptent pas", () => {
    expect(fleetSlotBlocker(owner, "spy", 50)).toBeNull();
    expect(fleetSlotBlocker(owner, "expedition", 50)).toBeNull();
  });

  it("sans compte du serveur, pas de contrôle (simulateur, anciens appels)", () => {
    expect(fleetSlotBlocker(owner, "attack", undefined)).toBeNull();
  });
});

describe("contenu personnalisé des alliances", () => {
  it("garde « Quartiers fédérés » quand l'admin a modifié la liste des recherches", () => {
    const base = defaultGameContent().rules.alliances;
    applyGameContent({ rules: { alliances: { ...base, researches: base.researches.filter((r) => r.id !== "quartiers") } } } as never);
    expect(ALLIANCE_RULES.researches.some((r) => r.id === "quartiers")).toBe(true);
  });
});
