import { describe, expect, it } from "vitest";
import { addContribution, type Challenge, CHALLENGE_RULES, CHALLENGE_TYPES, challengeMetrics, challengeRewardees, grantChallengeReward, pickChallengeType, startChallenge, weekWindow } from "@/game/challenges";
import { defaultPlayerState } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

const MON = Date.UTC(2026, 9, 5, 10); // lundi 5 octobre 2026

describe("weekly challenges", () => {
  it("covers Monday to Monday (UTC)", () => {
    const w = weekWindow(Date.UTC(2026, 9, 8, 23));
    expect(new Date(w.startMs).toISOString()).toBe("2026-10-05T00:00:00.000Z");
    expect(w.endMs - w.startMs).toBe(7 * 86_400_000);
    expect(w.id).toBe("wk-2026-10-05");
  });

  it("scales the target with active players and never repeats the previous type", () => {
    const ch = startChallenge(MON, 12);
    expect(ch.target).toBe(CHALLENGE_TYPES[ch.type].perActive * 12);
    expect(pickChallengeType("wk-2026-10-05", pickChallengeType("wk-2026-10-05"))).not.toBe(pickChallengeType("wk-2026-10-05"));
  });

  it("rewards participants above 1 % when the goal is met, title to the top", () => {
    let ch: Challenge = { ...startChallenge(MON, 2), type: "missions", target: 100 };
    ch = addContribution(ch, "a", "A", 90, MON + 1000);
    ch = addContribution(ch, "b", "B", 20, MON + 1000);
    ch = addContribution(ch, "c", "C", 0.5, MON + 1000);
    expect(ch.total).toBe(110.5);
    expect(challengeRewardees(ch)).toEqual(["a", "b"]);
    const a = { ...defaultPlayerState("a", "A") } as PlayerState;
    const gain = grantChallengeReward(ch, a);
    expect(gain.reinforcedSteel).toBe(CHALLENGE_RULES.tiers[0].rare);
    expect(a.activeTitle).toBe(CHALLENGE_RULES.title);
    const b = { ...defaultPlayerState("b", "B") } as PlayerState;
    grantChallengeReward(ch, b);
    expect(b.activeTitle).not.toBe(CHALLENGE_RULES.title);
    expect(challengeRewardees({ ...ch, total: 50 })).toEqual([]);
  });

  it("reads the tracked counters from the player", () => {
    const m = challengeMetrics({ stats: { missions: 4, unitsBuilt: 10, marketVolume: 500, expeditions: 1 }, pirates: { varan: { repelled: 2 }, gravhorn: { repelled: 1 } } } as never);
    expect(m).toEqual({ raids: 3, missions: 4, units: 10, market: 500, expeditions: 1 });
  });
});
