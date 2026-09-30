import { describe, expect, it } from "vitest";
import {
  applyXpDelta,
  currentSeasonId,
  ensureSeasonRollover,
  performSeasonReward,
  previousSeasonId,
  seasonEndMs,
  seasonLabel,
  seasonRewardFor,
  seasonStandings,
  setActiveTitle,
} from "@/game/seasons";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
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

describe("season closing (v1.8)", () => {
  it("keeps the final score when the season rolls over", () => {
    const player = makePlayer({ seasonId: "2025-12", seasonXp: 420 });
    ensureSeasonRollover(player, JAN_15_2026);
    expect(player.lastSeasonId).toBe("2025-12");
    expect(player.lastSeasonXp).toBe(420);
    expect(previousSeasonId(JAN_15_2026)).toBe("2025-12");
    expect(seasonEndMs(JAN_15_2026)).toBe(FEB_1_2026);
  });

  it("ranks by season XP, including players who already rolled over", () => {
    const standings = seasonStandings(
      [
        { uid: "a", pseudo: "A", seasonId: "2025-12", seasonXp: 100, xp: 5 },
        { uid: "b", pseudo: "B", seasonId: "2026-01", seasonXp: 3, lastSeasonId: "2025-12", lastSeasonXp: 300 },
        { uid: "c", pseudo: "C", seasonId: "2025-11", seasonXp: 999 },
        { uid: "d", pseudo: "D", seasonId: "2025-12", seasonXp: 100, xp: 50 },
        { uid: "e", pseudo: "E", seasonId: "2025-12", seasonXp: 0 },
      ],
      "2025-12",
    );
    expect(standings.map((s) => `${s.rank}:${s.uid}`)).toEqual(["1:b", "2:d", "3:a"]);
  });

  it("rewards by rank, with participation above the XP threshold", () => {
    expect(seasonRewardFor(1, 10)).toMatchObject({ hours: 24, rare: 500, title: "Champion" });
    expect(seasonRewardFor(3, 10)).toMatchObject({ hours: 16, title: "Podium" });
    expect(seasonRewardFor(10, 10)).toMatchObject({ hours: 8, title: "Élite" });
    expect(seasonRewardFor(11, 150)).toMatchObject({ hours: 2, rare: 0, title: "" });
    expect(seasonRewardFor(11, 50)).toBeNull();
  });

  it("pays the reward and grants a title", () => {
    const now = JAN_15_2026;
    const player = makePlayer({ resourcesUpdatedAtMs: now, seasonId: "2026-01" });
    const before = player.resources.reinforcedSteel ?? 0;
    const out = performSeasonReward(player, defaultQueues(), { seasonId: "2025-12", rank: 1, seasonXp: 800 }, seasonRewardFor(1, 800)!, now);
    expect(out.player.resources.reinforcedSteel).toBe(before + 500);
    expect(out.gained.scrap).toBeGreaterThan(0);
    expect(out.player.activeTitle).toBe("Champion de Décembre 2025");
    expect(out.notifications.at(-1)?.kind).toBe("season");
    expect(() => setActiveTitle(out.player, "Roi du monde")).toThrow();
    setActiveTitle(out.player, "");
    expect(out.player.activeTitle).toBe("");
  });
});
