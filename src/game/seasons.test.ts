import { describe, expect, it } from "vitest";
import { applyXpDelta, currentSeasonId, ensureSeasonRollover, seasonLabel } from "@/game/seasons";
import { defaultPlayerState } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

const JAN_15_2026 = Date.UTC(2026, 0, 15);
const FEB_1_2026 = Date.UTC(2026, 1, 1);

function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return { ...defaultPlayerState("u1", "Testeur"), ...overrides };
}

describe("currentSeasonId", () => {
  it("formats as YYYY-MM in UTC", () => {
    expect(currentSeasonId(JAN_15_2026)).toBe("2026-01");
    expect(currentSeasonId(FEB_1_2026)).toBe("2026-02");
  });
});

describe("seasonLabel", () => {
  it("renders a human-readable month + year", () => {
    expect(seasonLabel("2026-01")).toBe("Janvier 2026");
    expect(seasonLabel("2026-09")).toBe("Septembre 2026");
  });
});

describe("ensureSeasonRollover", () => {
  it("resets seasonXp when the season changed since the last flush", () => {
    const player = makePlayer({ seasonId: "2025-12", seasonXp: 500 });
    ensureSeasonRollover(player, JAN_15_2026);
    expect(player.seasonId).toBe("2026-01");
    expect(player.seasonXp).toBe(0);
  });

  it("leaves seasonXp untouched within the same season", () => {
    const player = makePlayer({ seasonId: "2026-01", seasonXp: 500 });
    ensureSeasonRollover(player, JAN_15_2026);
    expect(player.seasonXp).toBe(500);
  });
});

describe("applyXpDelta", () => {
  it("increases both the total and the seasonal counters together", () => {
    const player = makePlayer({ xp: 100, seasonId: "2026-01", seasonXp: 100 });
    applyXpDelta(player, 40, JAN_15_2026);
    expect(player.xp).toBe(140);
    expect(player.seasonXp).toBe(140);
  });

  it("never lets either counter go below zero", () => {
    const player = makePlayer({ xp: 10, seasonId: "2026-01", seasonXp: 10 });
    applyXpDelta(player, -50, JAN_15_2026);
    expect(player.xp).toBe(0);
    expect(player.seasonXp).toBe(0);
  });

  it("starts the new season fresh even if the delta is negative", () => {
    const player = makePlayer({ xp: 1000, seasonId: "2025-12", seasonXp: 300 });
    applyXpDelta(player, -20, FEB_1_2026);
    expect(player.seasonId).toBe("2026-02");
    expect(player.xp).toBe(980);
    expect(player.seasonXp).toBe(0);
  });
});
