import { describe, expect, it } from "vitest";
import { capDefenderXpLoss, checkAttackAllowed, computeCombatXp, PVP_RULES, type AttackContext } from "@/game/pvp";

describe("computeCombatXp", () => {
  it("attacker win: scales with the defender's strength (farming the weak pays little)", () => {
    expect(computeCombatXp("attacker_win", 1000, 1000).attackerXp).toBe(40);
    expect(computeCombatXp("attacker_win", 1000, 10).attackerXp).toBe(4); // plancher ×0,1
    expect(computeCombatXp("attacker_win", 1000, 5000).attackerXp).toBe(80); // plafond ×2
  });

  it("defender beaten: narrow loss costs more than being crushed (−20 .. −5)", () => {
    expect(computeCombatXp("attacker_win", 1100, 1000).defenderXp).toBe(-18);
    expect(computeCombatXp("attacker_win", 2000, 1000).defenderXp).toBe(-10);
    expect(computeCombatXp("attacker_win", 100000, 1000).defenderXp).toBe(-5);
  });

  it("defender win: +20 .. +60 depending on the attacker's strength; attacker −20", () => {
    const xp = computeCombatXp("defender_win", 1000, 1000);
    expect(xp.attackerXp).toBe(-20);
    expect(xp.defenderXp).toBe(40);
    expect(computeCombatXp("defender_win", 1, 1000).defenderXp).toBe(20);
    expect(computeCombatXp("defender_win", 900, 500).defenderXp).toBe(60);
  });

  it("draw: +5 each", () => {
    expect(computeCombatXp("draw", 10, 10)).toEqual({ attackerXp: 5, defenderXp: 5 });
  });
});

describe("capDefenderXpLoss", () => {
  it("never lets a defender lose more than the daily cap", () => {
    expect(capDefenderXpLoss(-20, 0)).toBe(-20);
    expect(capDefenderXpLoss(-20, 50)).toBe(-10);
    expect(capDefenderXpLoss(-20, PVP_RULES.defenseXpLossCapPer24h)).toBe(-0);
    expect(capDefenderXpLoss(30, 60)).toBe(30);
  });
});

describe("checkAttackAllowed", () => {
  const NOW = 1_800_000_000_000;
  const base: AttackContext = {
    now: NOW,
    attackerUid: "a",
    attackerXp: 1000,
    defenderUid: "d",
    defenderXp: 1000,
    defenderCreatedAtMs: NOW - 30 * 24 * 3600 * 1000,
    defenderHasAttacked: false,
    lastAttackOnTargetMs: null,
    lastDefenderDefeatMs: null,
  };

  it("allows a normal attack", () => {
    expect(checkAttackAllowed(base).allowed).toBe(true);
  });

  it("blocks attacking yourself", () => {
    expect(checkAttackAllowed({ ...base, defenderUid: "a" }).reason).toBe("self");
  });

  it("protects newbies for 72h unless they attacked someone", () => {
    const newbie = { ...base, defenderCreatedAtMs: NOW - 3600 * 1000 };
    expect(checkAttackAllowed(newbie).reason).toBe("newbie");
    expect(checkAttackAllowed({ ...newbie, defenderHasAttacked: true }).allowed).toBe(true);
  });

  it("shields a defender for 1h after a defeat", () => {
    expect(checkAttackAllowed({ ...base, lastDefenderDefeatMs: NOW - 30 * 60 * 1000 }).reason).toBe("shield");
    expect(checkAttackAllowed({ ...base, lastDefenderDefeatMs: NOW - 61 * 60 * 1000 }).allowed).toBe(true);
  });

  it("enforces a 2h cooldown per attacker/target pair", () => {
    const check = checkAttackAllowed({ ...base, lastAttackOnTargetMs: NOW - 3600 * 1000 });
    expect(check.reason).toBe("cooldown");
    expect(check.until).toBe(NOW + 3600 * 1000);
  });

  it("gives NPC targets no player protection at all (5.17.2)", () => {
    const npc = { ...base, defenderIsWarlord: true };
    expect(checkAttackAllowed({ ...npc, defenderCreatedAtMs: NOW - 60_000 }).allowed).toBe(true);
    expect(checkAttackAllowed({ ...npc, defenderVacationUntilMs: NOW + 3600_000 }).allowed).toBe(true);
    expect(checkAttackAllowed({ ...npc, lastDefenderDefeatMs: NOW - 60_000 }).allowed).toBe(true);
    expect(checkAttackAllowed({ ...npc, defenderShieldUntilMs: NOW + 3600_000 }).allowed).toBe(true);
    expect(checkAttackAllowed({ ...npc, defenderAscendedAtMs: NOW - 60_000 }).allowed).toBe(true);
  });

  it("lets a strong player attack a warlord whatever the XP gap (5.17.2)", () => {
    expect(checkAttackAllowed({ ...base, attackerXp: 400_000, defenderXp: 9000, defenderIsWarlord: true }).allowed).toBe(true);
    // Le délai entre deux attaques reste dû.
    expect(checkAttackAllowed({ ...base, attackerXp: 400_000, defenderXp: 9000, defenderIsWarlord: true, lastAttackOnTargetMs: NOW - 60_000 }).reason).toBe("cooldown");
  });

  it("forbids attacking a player with less than a third of your XP (once past the floor)", () => {
    expect(checkAttackAllowed({ ...base, attackerXp: 3000, defenderXp: 900 }).reason).toBe("too_weak");
    expect(checkAttackAllowed({ ...base, attackerXp: 400, defenderXp: 0 }).allowed).toBe(true);
  });
});
