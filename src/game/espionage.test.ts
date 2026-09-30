import { describe, expect, it } from "vitest";
import {
  buildSpyReportData,
  counterEspionage,
  detectionChance,
  espionageLevel,
  resolveSpyArrival,
  spyScore,
  spyTier,
  spyTravelSeconds,
} from "@/game/espionage";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

const NOW = 1_800_000_000_000;
function player(uid: string, patch: Partial<PlayerState> = {}): PlayerState {
  return { ...defaultPlayerState(uid, uid.toUpperCase()), resourcesUpdatedAtMs: NOW, ...patch } as PlayerState;
}

describe("espionage score", () => {
  it("counts the Espionage tech and sentinels at home", () => {
    expect(espionageLevel(player("a", { techLevels: { tech20: 4 } }))).toBe(4);
    expect(counterEspionage(player("b", { techLevels: { tech20: 2 }, units: { sentinelle: { level: 1, count: 250 } } }))).toBe(4);
  });

  it("adds log2 of the probe count", () => {
    expect(spyScore(3, 3, 1)).toBe(0);
    expect(spyScore(3, 3, 4)).toBe(2);
    expect(spyScore(2, 5, 64)).toBe(3);
  });

  it("maps scores to report tiers", () => {
    expect(spyTier(-0.5)).toBe(0);
    expect(spyTier(0)).toBe(1);
    expect(spyTier(2)).toBe(2);
    expect(spyTier(5.9)).toBe(3);
    expect(spyTier(6)).toBe(4);
  });

  it("clamps the detection chance", () => {
    expect(detectionChance(5, 5)).toBeCloseTo(0.1);
    expect(detectionChance(5, 7)).toBeCloseTo(0.3);
    expect(detectionChance(9, 0)).toBe(0.05);
    expect(detectionChance(0, 20)).toBe(0.9);
  });

  it("flies probes fast", () => {
    expect(spyTravelSeconds(40, 20)).toBe(120);
  });
});

describe("spy reports", () => {
  const target = () =>
    player("tgt", {
      techLevels: { tech20: 1 },
      units: { chasseur: { level: 2, count: 30 }, roquette: { level: 1, count: 5 } },
    });

  it("only reveals what the tier allows", () => {
    const low = buildSpyReportData(target(), defaultQueues(), [], 1, NOW);
    expect(low.resources).toBeDefined();
    expect(low.units).toBeUndefined();
    const mid = buildSpyReportData(target(), defaultQueues(), [], 2, NOW);
    expect(mid.units?.chasseur).toEqual({ level: 2, count: 30 });
    expect(mid.defenses?.roquette?.count).toBe(5);
    expect(mid.buildings).toBeUndefined();
    const full = buildSpyReportData(target(), defaultQueues(), [], 4, NOW);
    expect(full.techLevels?.tech20).toBe(1);
    expect(full.fleets).toEqual([]);
    expect(buildSpyReportData(target(), defaultQueues(), [], 0, NOW)).toEqual({});
  });

  it("warns the target only when the probes are caught", () => {
    const base = { now: NOW, spy: player("spy", { techLevels: { tech20: 3 } }), spyQueues: defaultQueues(), target: target(), targetQueues: defaultQueues(), targetFleets: [], probes: 8 };
    const hidden = resolveSpyArrival({ ...base, random: () => 0.99 });
    expect(hidden.detected).toBe(false);
    expect(hidden.targetNotifications).toHaveLength(0);
    expect(hidden.report.tier).toBe(3); // 3 − 1 + log2(8) = 5
    expect(hidden.report.data?.buildings).toBeDefined();
    const caught = resolveSpyArrival({ ...base, random: () => 0 });
    expect(caught.detected).toBe(true);
    expect(caught.targetNotifications[0].kind).toBe("spy-detected");
    expect(caught.targetNotifications[0].message).toContain("SPY");
    expect(caught.report.data?.resources).toBeDefined(); // le rapport part quand même
  });
});
