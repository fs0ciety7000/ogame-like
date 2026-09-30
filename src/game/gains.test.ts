import { describe, expect, it } from "vitest";
import { discreteGains } from "@/game/gains";
import { defaultPlayerState } from "@/game/defaults";
import { computeElapsedProduction } from "@/game/production";
import type { PlayerState } from "@/types/game";

const T0 = 1_800_000_000_000;

function state(patch: Partial<PlayerState> = {}): PlayerState {
  return { ...defaultPlayerState("u", "U"), resourcesUpdatedAtMs: T0, ...patch } as PlayerState;
}

describe("discreteGains", () => {
  it("ignores normal production", () => {
    const prev = state();
    const produced = computeElapsedProduction(prev.buildings, prev.techLevels, 20);
    const next = state({
      resourcesUpdatedAtMs: T0 + 20_000,
      resources: { ...prev.resources, scrap: prev.resources.scrap + (produced.scrap ?? 0) },
    });
    expect(discreteGains(prev, next)).toEqual({});
  });

  it("detects a one-off reward on top of production", () => {
    const prev = state();
    const produced = computeElapsedProduction(prev.buildings, prev.techLevels, 20);
    const next = state({
      resourcesUpdatedAtMs: T0 + 20_000,
      resources: { ...prev.resources, scrap: prev.resources.scrap + (produced.scrap ?? 0) + 800, aiFragment: 3 },
    });
    expect(discreteGains(prev, next)).toEqual({ scrap: 800, aiFragment: 3 });
  });

  it("ignores spending", () => {
    const prev = state({ resources: { ...state().resources, scrap: 5000 } });
    const next = state({ resources: { ...prev.resources, scrap: 100 } });
    expect(discreteGains(prev, next)).toEqual({});
  });
});
