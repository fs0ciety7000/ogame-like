import { describe, expect, it } from "vitest";
import { computeFleetPower, fleetPowerBreakdown } from "@/game/combat";
import { defaultPlayerState } from "@/game/defaults";
import { OFFENSIVE_UNITS } from "@/game/units";
import type { PlayerState } from "@/types/game";

/* 6.9.9 : détail de la puissance d'une flotte dans la fenêtre d'attaque. */

describe("6.9.9 détail de la puissance d'une flotte", () => {
  it("la somme du détail vaut la puissance de la flotte, triée par contribution, quantités nulles écartées", () => {
    const p = defaultPlayerState("u", "u") as PlayerState;
    const ids = OFFENSIVE_UNITS.slice(0, 3);
    ids.forEach((id, i) => (p.units[id] = { ...(p.units[id] ?? {}), level: 1 + i, count: 50 } as PlayerState["units"][string]));
    const fleet = { [ids[0]]: 10, [ids[1]]: 3, [ids[2]]: 0 };
    const rows = fleetPowerBreakdown(p.units, p.techLevels, fleet);
    expect(rows.map((r) => r.id)).not.toContain(ids[2]);
    const sum = rows.reduce((a, r) => a + r.power, 0);
    expect(sum).toBeCloseTo(computeFleetPower(p.units, p.techLevels, fleet, ["attack"]), 6);
    for (let i = 1; i < rows.length; i++) expect(rows[i - 1].power).toBeGreaterThanOrEqual(rows[i].power);
    expect(fleetPowerBreakdown(p.units, p.techLevels, {})).toEqual([]);
  });
});
