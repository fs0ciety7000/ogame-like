import { describe, expect, it } from "vitest";
import { performAttack, type AttackInput } from "@/game/attack";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

const NOW = 1_800_000_000_000;
const OLD = NOW - 30 * 24 * 3600 * 1000;

function player(uid: string, patch: Partial<PlayerState>): PlayerState {
  return { ...defaultPlayerState(uid, uid.toUpperCase()), createdAtMs: OLD, resourcesUpdatedAtMs: NOW, ...patch };
}

function input(patch: Partial<AttackInput> = {}): AttackInput {
  return {
    now: NOW,
    attackerUid: "att",
    attacker: player("att", { xp: 1000, units: { chasseur: { level: 1, count: 100 } } }),
    attackerQueues: defaultQueues(),
    defenderUid: "def",
    defender: player("def", { xp: 1000, units: { roquette: { level: 1, count: 10 } } }),
    fleet: { chasseur: 50 },
    lastAttackOnTargetMs: null,
    defenderXpLostLast24h: 0,
    ...patch,
  };
}

describe("performAttack", () => {
  it("resolves a winning attack: losses, victory, XP for both sides in the report", () => {
    const out = performAttack(input());
    if (!out.ok) throw new Error(out.message);
    expect(out.combat.outcome).toBe("attacker_win");
    expect(out.attacker.victories).toBe(1);
    expect(out.report.attackerXpDelta).toBeGreaterThan(0);
    expect(out.report.defenderXpDelta).toBeLessThan(0);
    expect(out.report.defenderProcessed).toBe(false);
    expect(out.attacker.xp).toBe(1000 + out.report.attackerXpDelta!);
    expect(out.notifications.some((n) => n.kind === "combat-attacker")).toBe(true);
  });

  it("refuses protected targets and sends back the reason", () => {
    const shielded = performAttack(input({ defender: player("def", { xp: 1000, lastDefeatAtMs: NOW - 10 * 60 * 1000 }) }));
    expect(shielded).toMatchObject({ ok: false });
    expect(!shielded.ok && shielded.message).toMatch(/bouclier/);

    const cooldown = performAttack(input({ lastAttackOnTargetMs: NOW - 60 * 1000 }));
    expect(!cooldown.ok && cooldown.message).toMatch(/récemment/);
  });

  it("refuses a fleet the attacker doesn't own", () => {
    const out = performAttack(input({ fleet: { chasseur: 500 } }));
    expect(!out.ok && out.message).toMatch(/plus assez/);
    expect(performAttack(input({ fleet: { chasseur: 0 } })).ok).toBe(false);
    const defensive = performAttack(input({ fleet: { roquette: 5 } }));
    expect(!defensive.ok && defensive.message).toMatch(/unités d'attaque/);
  });

  it("caps the defender's XP loss over 24h", () => {
    const out = performAttack(input({ defenderXpLostLast24h: 60 }));
    if (!out.ok) throw new Error(out.message);
    expect(out.report.defenderXpDelta).toBe(-0);
  });
});
