import { describe, expect, it } from "vitest";
import { cleanFleet, simulateAgainstReport, simulateLair, simulateRaid, simulateSandbox } from "@/game/simulator";
import { defaultPlayerState } from "@/game/defaults";
import { FACTIONS } from "@/game/pirates";
import type { PlayerState } from "@/types/game";

const attacker = { units: { chasseur: { level: 1, count: 100 }, cargo: { level: 1, count: 10 } }, techLevels: {} };

describe("cleanFleet", () => {
  it("keeps positive attack units only", () => {
    expect(cleanFleet({ chasseur: 3.7, roquette: 10, cargo: 0, fregate: -2 })).toEqual({ chasseur: 3 });
  });
});

describe("simulateSandbox", () => {
  it("is deterministic and gives the factor needed to win", () => {
    const def = { units: { roquette: { level: 1, count: 1000 } }, techLevels: {} };
    const a = simulateSandbox(attacker, { chasseur: 100 }, def);
    const b = simulateSandbox(attacker, { chasseur: 100 }, def);
    expect(a.combat).toEqual(b.combat);
    expect(a.combat.outcome).toBe("defender_win");
    expect(a.winFactor).toBeGreaterThan(1);
    expect(a.attackerXp).toBe(-20);
  });

  it("wins against an empty base and loots within cargo", () => {
    const res = simulateSandbox(attacker, { chasseur: 10, cargo: 10 }, { units: {}, techLevels: {}, resources: { scrap: 1_000_000 } });
    expect(res.combat.outcome).toBe("attacker_win");
    expect(res.winFactor).toBeLessThanOrEqual(1);
    expect(res.combat.loot?.scrap ?? 0).toBeLessThanOrEqual(res.combat.cargoCapacity);
  });
});

describe("simulateAgainstReport", () => {
  it("needs at least the forces tier", () => {
    expect(simulateAgainstReport({ ...attacker, buildings: {} }, { chasseur: 1 }, { tier: 1, data: { resources: { scrap: 10 } } })).toBeNull();
  });

  it("notes the missing intel on a tier-2 report", () => {
    const res = simulateAgainstReport({ ...attacker, buildings: {} }, { chasseur: 100 }, { tier: 2, data: { units: {}, defenses: { roquette: { count: 10, level: 1 } }, resources: { scrap: 5000 } } });
    expect(res).not.toBeNull();
    expect(res!.combat.outcome).toBe("attacker_win");
    expect(res!.notes.length).toBeGreaterThan(1);
  });
});

describe("factions", () => {
  const player = { ...defaultPlayerState("u1", "Nova"), createdAt: null } as unknown as PlayerState;
  player.units = { chasseur: { level: 5, count: 50 } };
  const faction = FACTIONS[0];

  it("simulates a lair assault and a raid", () => {
    const lair = simulateLair(player, { chasseur: 50 }, faction);
    expect(["attacker_win", "defender_win", "draw"]).toContain(lair.combat.outcome);
    const raid = simulateRaid(player, faction, 0);
    expect(raid.combat.attackerPower).toBeGreaterThan(0);
  });
});
