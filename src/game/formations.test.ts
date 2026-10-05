import { describe, expect, it } from "vitest";
import { resolveCombat } from "@/game/combat";
import { formationEffects, postureEffects, setPosture } from "@/game/formations";
import { defaultPlayerState } from "@/game/defaults";
import type { PlayerState, Units } from "@/types/game";

const atk: Units = { chasseur: { level: 1, count: 100 }, cargo: { level: 1, count: 100 } };
const def: Units = { roquette: { level: 1, count: 300 }, fregate: { level: 1, count: 100 } };
const base = { attackerUnits: atk, attackerTechLevels: {}, attackerRepairPct: 0, fleet: { chasseur: 100, cargo: 100 }, defenderUnits: def, defenderTechLevels: {}, defenderRepairPct: 0, defenderResources: { scrap: 10_000_000 } };

describe("formations", () => {
  it("assault hits harder and loses more, cautious the opposite, raid carries more", () => {
    const neutral = resolveCombat(base);
    const assault = resolveCombat({ ...base, ...formationEffects("assault") });
    const cautious = resolveCombat({ ...base, ...formationEffects("cautious") });
    const raid = resolveCombat({ ...base, ...formationEffects("raid") });
    // 5.18 : le bonus d'attaque joue sur les dégâts infligés à chaque tour.
    const firstHit = (r: typeof neutral) => r.rounds?.[0]?.attackerDamage ?? 0;
    expect(firstHit(assault)).toBeCloseTo(firstHit(neutral) * 1.1);
    expect(firstHit(cautious)).toBeCloseTo(firstHit(neutral) * 0.9);
    expect(firstHit(raid)).toBeCloseTo(firstHit(neutral) * 0.85);
    expect(cautious.attackerLossPercent).toBeLessThan(assault.attackerLossPercent);
    // +30 % de cale, un peu rognés par des pertes plus lourdes (attaque −15 %).
    expect(raid.cargoCapacity).toBeGreaterThan(neutral.cargoCapacity * 1.1);
  });

  it("bunker shields the docked ships and boosts defenses; riposte engages more ships", () => {
    const standard = resolveCombat(base);
    const bunker = resolveCombat({ ...base, ...postureEffects("bunker") });
    const riposte = resolveCombat({ ...base, ...postureEffects("riposte") });
    expect(bunker.defenderLosses.fregate ?? 0).toBe(0);
    expect(riposte.defenderPower).toBeGreaterThan(standard.defenderPower);
    expect(postureEffects("bunker", true)).toEqual({ defenseFactor: 1, homeFleetFactor: 1 });
  });

  it("posture changes at most once per hour", () => {
    const p = { ...defaultPlayerState("u", "u"), createdAt: null } as unknown as PlayerState;
    expect(setPosture(p, "bunker", 1000)).toBe("bunker");
    expect(() => setPosture(p, "riposte", 2000)).toThrow(/min/);
    expect(setPosture(p, "riposte", 1000 + 3600_000)).toBe("riposte");
    expect(() => setPosture(p, "nope", 0)).toThrow(/inconnue/);
  });
});
