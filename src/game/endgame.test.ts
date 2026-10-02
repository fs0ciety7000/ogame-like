import { describe, expect, it } from "vitest";
import { BUILDINGS, LOCKABLE_BUILDINGS } from "@/game/buildings";
import { getShieldPercent } from "@/game/combat";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { flushState } from "@/game/flush";
import { getProductionRatesPerSecond } from "@/game/production";
import { findUnit } from "@/game/units";
import { checkPrereqs, findTech } from "@/game/technologies";
import type { PlayerState } from "@/types/game";

const NOW = Date.UTC(2026, 9, 7, 12);

function player(): PlayerState {
  const p = { ...defaultPlayerState("u", "Fin"), createdAt: null } as unknown as PlayerState;
  p.resourcesUpdatedAtMs = NOW;
  return p;
}

describe("contenu de fin de partie (v3.6)", () => {
  it("adds five technologies placed between the Plasma cannon / Interceptor and the Black Star", () => {
    for (const id of ["tech21", "tech22", "tech23", "tech24", "tech25"]) expect(findTech(id), id).toBeDefined();
    expect(checkPrereqs(findTech("tech24")!, { tech1: 17, tech18: 5, tech11: 6, tech21: 2 }).valid).toBe(true);
    expect(checkPrereqs(findTech("tech24")!, { tech1: 17, tech18: 5, tech11: 6 }).valid).toBe(false);
    expect(findUnit("croiseur_nova")?.unlockTech).toBe("tech24");
    expect(findUnit("lance_gravitationnelle")?.category).toBe("defense");
  });

  it("unlocks the buildings and the units from the lab", () => {
    const p = player();
    p.techLevels = { tech21: 0, tech24: 0 };
    const q = { ...defaultQueues(), activeResearches: [{ id: "tech21", endTime: NOW + 1 }, { id: "tech24", endTime: NOW + 2 }] };
    const out = flushState(p, q, NOW + 10).player;
    expect(out.buildings.fonderie_quantique).toMatchObject({ unlocked: true, level: 1 });
    expect(out.units.croiseur_nova.level).toBe(1);
    // Les bâtiments débloqués par une techno ne sont pas « à débloquer » (succès, prise en main).
    expect(LOCKABLE_BUILDINGS).not.toContain("fonderie_quantique");
  });

  it("produces rare resources, unbounded by the warehouse", () => {
    const p = player();
    p.buildings = { ...p.buildings, fonderie_quantique: { level: 10, unlocked: true }, synthetiseur_neuronal: { level: 1, unlocked: true } };
    const rates = getProductionRatesPerSecond(p.buildings, {});
    expect(rates.reinforcedSteel).toBe(10);
    expect(rates.aiFragment).toBe(1);
    const out = flushState({ ...p, resourcesUpdatedAtMs: NOW - 3600_000 }, defaultQueues(), NOW).player;
    expect(out.resources.reinforcedSteel).toBe(36_000);
  });

  it("adds the shield generator beyond the hangar cap", () => {
    const hangar = BUILDINGS.find((b) => b.effect?.type === "hangar" && b.effect.category === "defense")!.id;
    const maxed = { [hangar]: { level: 20, unlocked: true } };
    expect(getShieldPercent(maxed)).toBeCloseTo(0.15);
    expect(getShieldPercent({ ...maxed, generateur_bouclier: { level: 10, unlocked: true } })).toBeCloseTo(0.2);
    expect(getShieldPercent({ ...maxed, generateur_bouclier: { level: 4, unlocked: false } })).toBeCloseTo(0.15); // verrouillé
  });
});
