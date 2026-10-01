import { describe, expect, it } from "vitest";
import { chestReward, claimContract, contractDay, ensureContracts, recordContract, rerollContract, streakBonus } from "@/game/contracts";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { performPlayerAction } from "@/game/actions";
import { ECONOMY_RULES, missionRewards, rareRewardScale } from "@/game/economy";
import { MISSIONS } from "@/game/missions";
import type { PlayerState } from "@/types/game";

const DAY = 24 * 3600 * 1000;
const T0 = Date.parse("2026-10-01T10:00:00Z");

function player(patch: Partial<PlayerState> = {}): PlayerState {
  return { ...defaultPlayerState("u1", "U1"), createdAtMs: T0 - 30 * DAY, resourcesUpdatedAtMs: T0, ...patch } as PlayerState;
}

function completeAll(p: PlayerState, now: number) {
  const state = ensureContracts(p, now);
  for (const c of state.items) {
    recordContract(p, c.type, c.target, now);
  }
  return state.items.map((c) => claimContract(p, c.id, now));
}

describe("daily contracts", () => {
  it("draws 3 distinct contracts per day, the same on every call", () => {
    const a = ensureContracts(player(), T0);
    expect(a.items).toHaveLength(3);
    expect(new Set(a.items.map((c) => c.type)).size).toBe(3);
    expect(ensureContracts(player(), T0 + 3600_000).items.map((c) => c.type)).toEqual(a.items.map((c) => c.type));
    expect(a.day).toBe(contractDay(T0));
  });

  it("tracks progress, refuses early claims and pays once", () => {
    const p = player();
    const [c] = ensureContracts(p, T0).items;
    expect(() => claimContract(p, c.id, T0)).toThrow(/pas encore/);
    recordContract(p, c.type, c.target + 99, T0);
    expect(p.contracts!.items[0].progress).toBe(c.target);
    const res = claimContract(p, c.id, T0);
    expect(Object.keys(res.reward)).toContain("xp");
    expect(() => claimContract(p, c.id, T0)).toThrow(/déjà/);
  });

  it("builds a streak on consecutive days, resets after a missed day, and opens a chest every 7 days", () => {
    const p = player();
    let chests = 0;
    for (let d = 0; d < 7; d++) {
      const results = completeAll(p, T0 + d * DAY);
      if (results.some((r) => r.chest)) chests++;
      expect(p.contracts!.streak).toBe(d + 1);
    }
    expect(chests).toBe(1);
    expect(streakBonus(p.contracts!.streak)).toBe(0.5);
    // Deux jours plus tard : série perdue.
    ensureContracts(p, T0 + 9 * DAY);
    expect(p.contracts!.streak).toBe(0);
    expect(chestReward(p).xp).toBeGreaterThan(0);
  });

  it("allows one reroll per day", () => {
    const p = player();
    const [c] = ensureContracts(p, T0).items;
    const next = rerollContract(p, c.id, T0);
    expect(next.type).not.toBe(c.type);
    expect(p.contracts!.items.map((i) => i.type)).not.toContain(c.type);
    expect(() => rerollContract(p, p.contracts!.items[1].id, T0)).toThrow(/déjà relancé/);
  });

  it("counts game actions: research launch and resources spent", () => {
    const p = player({ resources: { ...player().resources, scrap: 1e6, energy: 1e6 } });
    const q = defaultQueues();
    p.contracts = { day: contractDay(T0), streak: 0, lastCompletedDay: null, rerolled: false, items: [
      { id: "a", type: "research", target: 1, progress: 0, claimed: false },
      { id: "b", type: "spend", target: 100, progress: 0, claimed: false },
      { id: "c", type: "upgrade_building", target: 1, progress: 0, claimed: false },
    ] };
    const out = performPlayerAction(p, q, { type: "research", techId: "tech1" }, T0);
    const items = out.player.contracts!.items;
    expect(items.find((i) => i.id === "a")!.progress).toBe(1);
    expect(items.find((i) => i.id === "b")!.progress).toBe(100);
    expect(items.find((i) => i.id === "c")!.progress).toBe(0);
  });
});

describe("indexed mission rewards", () => {
  it("pays at least 1.5 × duration of production for common resources, and scales rares with development", () => {
    const early = player();
    const late = player();
    for (const id of Object.keys(late.buildings)) late.buildings[id] = { level: 10, unlocked: true };
    const forage = MISSIONS.forage_profond;
    expect(missionRewards(forage, early).scrap).toBe(forage.reward.scrap); // début de partie : récompense fixe
    expect(missionRewards(forage, late).scrap).toBe(Math.floor(1.5 * forage.duration * 500));
    const acier = MISSIONS.recuperation_acier;
    expect(missionRewards(acier, late).reinforcedSteel).toBeGreaterThan(acier.reward.reinforcedSteel * 2);
    expect(missionRewards(acier, late).xp).toBe(acier.reward.xp);
  });
});

describe("rare rewards indexed on production", () => {
  it("uses production per hour / reference when it beats the development scale, never less", () => {
    const late = player();
    for (const id of Object.keys(late.buildings)) late.buildings[id] = { level: 10, unlocked: true };
    const ref = ECONOMY_RULES.missionRareProductionRef;
    try {
      ECONOMY_RULES.missionRareProductionRef = 0;
      const development = rareRewardScale(late);
      const acier = MISSIONS.recuperation_acier;
      const base = missionRewards(acier, late).reinforcedSteel;
      expect(base).toBe(Math.floor(acier.reward.reinforcedSteel * development));
      ECONOMY_RULES.missionRareProductionRef = 1000; // 500/s = 1,8 M/h → ×1800
      expect(rareRewardScale(late)).toBeCloseTo(1800);
      expect(missionRewards(acier, late).reinforcedSteel).toBe(acier.reward.reinforcedSteel * 1800);
      expect(chestReward(late).reinforcedSteel).toBe(1500 * 1800);
      ECONOMY_RULES.missionRareProductionRef = 1e12; // production négligeable : plancher = développement
      expect(missionRewards(acier, late).reinforcedSteel).toBe(base);
    } finally {
      ECONOMY_RULES.missionRareProductionRef = ref;
    }
  });
});
