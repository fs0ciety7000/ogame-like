import { describe, expect, it } from "vitest";
import { activePass, addPassPoints, PASS_OVERFLOW, PASS_POINTS, passState } from "@/game/seasonPass";
import { bountyState } from "@/game/bounties";
import { currentSeasonId } from "@/game/seasons";
import type { PlayerState } from "@/types/game";

const NOW = Date.UTC(2026, 9, 7, 10);

function fullPassPlayer(): PlayerState {
  const seasonId = currentSeasonId(NOW);
  const pass = activePass(seasonId);
  const max = pass.tiers.length * pass.pointsPerTier;
  return { uid: "p", resources: {}, stats: {}, seasonPass: { seasonId, points: max, claimed: [], loginDay: "", completed: [], activity: {} } } as unknown as PlayerState;
}

describe("passe terminé → Ambre (5.18)", () => {
  it("convertit un gros gain (épisode des Chroniques) en Ambre quand le passe est au maximum", () => {
    const p = fullPassPlayer();
    const before = bountyState(p).amber;
    const amber = addPassPoints(p, "chronicle", NOW);
    expect(amber).toBe(PASS_POINTS.chronicle * PASS_OVERFLOW.amberPerPoint);
    expect(bountyState(p).amber).toBe(before + amber);
  });

  it("ne convertit pas les petits gains réguliers ni un passe inachevé", () => {
    const p = fullPassPlayer();
    expect(addPassPoints(p, "victory", NOW)).toBe(0);
    const q = fullPassPlayer();
    q.seasonPass = { ...passState(q, NOW), points: 0 };
    expect(addPassPoints(q, "chronicle", NOW)).toBe(0);
    expect(passState(q, NOW).points).toBe(PASS_POINTS.chronicle);
  });
});
