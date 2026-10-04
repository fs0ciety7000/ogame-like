import { describe, expect, it } from "vitest";
import { bossRecap, normalizeLeviathan, type LeviathanState } from "@/game/leviathan";
import { normalizeAllianceBoss } from "@/game/allianceBoss";

const base: LeviathanState = {
  id: "lev-1",
  startMs: 0,
  endMs: 48 * 3600_000,
  maxHp: 1000,
  hp: 0,
  status: "killed",
  contributions: {
    a: { pseudo: "Alpha", damage: 600, assaults: 3, lastLaunchMs: 0 },
    b: { pseudo: "Bravo", damage: 300, assaults: 2, lastLaunchMs: 0 },
    c: { pseudo: "Charlie", damage: 100, assaults: 1, lastLaunchMs: 0 },
    d: { pseudo: "Delta", damage: 0, assaults: 0, lastLaunchMs: 0 },
  },
  endedAtMs: 30 * 3600_000,
  rewarded: true,
  titleHolder: null,
  timeline: [],
  rewards: { b: { gain: { metal: 5000 }, relic: "Soute pliée (rare)" } },
};

describe("bossRecap", () => {
  it("résume le combat et la ligne du joueur", () => {
    const r = bossRecap(base, "b");
    expect(r.won).toBe(true);
    expect(r.durationMs).toBe(30 * 3600_000);
    expect(r.totalDamage).toBe(1000);
    expect(r.participants).toBe(3);
    expect(r.assaults).toBe(6);
    expect(r.hpDealtPct).toBe(1);
    expect(r.top.map((t) => t.uid)).toEqual(["a", "b", "c"]);
    expect(r.top[0].share).toBeCloseTo(0.6);
    expect(r.mine).toEqual({ rank: 2, damage: 300, assaults: 2, share: 0.3 });
    expect(r.reward?.relic).toBe("Soute pliée (rare)");
  });

  it("gère un non-participant et un boss retiré", () => {
    const r = bossRecap({ ...base, status: "failed", hp: 250, endedAtMs: 0 }, "zzz", 2);
    expect(r.won).toBe(false);
    expect(r.durationMs).toBe(48 * 3600_000);
    expect(r.hpDealtPct).toBe(0.75);
    expect(r.top).toHaveLength(2);
    expect(r.mine).toBeNull();
    expect(r.reward).toBeNull();
  });

  it("les normaliseurs gardent les récompenses", () => {
    expect(normalizeLeviathan(base)?.rewards?.b?.gain?.metal).toBe(5000);
    const ab = normalizeAllianceBoss({ ...base, weekId: "2026-10-05", bossId: "x", launchedBy: "a", cost: {} });
    expect(ab?.rewards?.b?.relic).toBe("Soute pliée (rare)");
  });
});
