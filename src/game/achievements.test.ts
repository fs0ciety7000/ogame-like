import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS, checkNewAchievements } from "@/game/achievements";
import { defaultPlayerState } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return { ...defaultPlayerState("u1", "Testeur"), ...overrides };
}

describe("checkNewAchievements", () => {
  it("returns nothing for a fresh player", () => {
    expect(checkNewAchievements(makePlayer())).toHaveLength(0);
  });

  it("detects a newly-met condition", () => {
    const player = makePlayer({ victories: 1 });
    const result = checkNewAchievements(player);
    expect(result.map((a) => a.id)).toContain("first_blood");
  });

  it("does not return an already-unlocked achievement", () => {
    const player = makePlayer({ victories: 1, unlockedAchievements: ["first_blood"] });
    const result = checkNewAchievements(player);
    expect(result.map((a) => a.id)).not.toContain("first_blood");
  });

  it("can return several newly-met achievements at once", () => {
    const player = makePlayer({ victories: 10, playtimeSeconds: 100_000 });
    const ids = checkNewAchievements(player).map((a) => a.id);
    expect(ids).toContain("first_blood");
    expect(ids).toContain("veteran");
    expect(ids).toContain("tireless");
  });

  it("every achievement id is unique", () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
