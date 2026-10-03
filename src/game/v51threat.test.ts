import { describe, expect, it } from "vitest";
import { attackPowerShown, type Fleet } from "@/game/fleets";
import { threatEstimate } from "@/game/threat";
import { defaultPlayerState } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

function player(units: PlayerState["units"]): PlayerState {
  return { ...defaultPlayerState("me", "Moi"), units } as PlayerState;
}

const fleet = (power: number | null, units: Record<string, number> = {}) => ({ id: "f", mission: "attack", targetUid: "me", units, power }) as unknown as Fleet;

describe("v5.1 comparatif attaque / défense", () => {
  it("compare la puissance annoncée à la défense de la planète", () => {
    const me = player({ roquette: { level: 1, count: 500 } });
    const weak = threatEstimate(fleet(10), me);
    expect(weak.defense).toBeGreaterThan(0);
    expect(weak.verdict).toBe("safe");
    expect(weak.estimated).toBe(false);
    expect(threatEstimate(fleet(weak.defense * 10), me).verdict).toBe("danger");
    expect(threatEstimate(fleet(weak.defense), me).verdict).toBe("close");
  });

  it("évalue avec tes niveaux une flotte sans puissance connue", () => {
    const me = player({ chasseur: { level: 1, count: 0 } });
    const t = threatEstimate(fleet(null, { chasseur: 100 }), me);
    expect(t.estimated).toBe(true);
    expect(t.attack).toBeGreaterThan(0);
  });

  it("la puissance affichée suit la composition vue par le défenseur", () => {
    const attacker = player({ chasseur: { level: 3, count: 100 } });
    expect(attackPowerShown(attacker, { chasseur: 50 })).toBe(attackPowerShown(attacker, { chasseur: 100 }) / 2);
  });
});
