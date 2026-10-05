import { beforeAll, describe, expect, it } from "vitest";
import { applyGameContent } from "@/game/content";
import { claimDailyMission, dailyMissions, dailyTasksFor, DAILY_RULES } from "@/game/dailyMissions";
import { defaultPlayerState } from "@/game/defaults";
import { playerCasino } from "@/game/casino";
import { trackActivity } from "@/game/seasonPass";
import type { PlayerState } from "@/types/game";

/* 5.15.12 : missions du jour. */

const DAY = Date.UTC(2026, 9, 14, 10);

function player(): PlayerState {
  const p = defaultPlayerState("u1", "u1") as PlayerState;
  p.createdAtMs = DAY - 30 * 86400_000;
  return p;
}

describe("missions du jour", () => {
  beforeAll(() => applyGameContent({}));

  it("trois tâches distinctes, les mêmes pour un même jour", () => {
    const a = dailyTasksFor("2026-10-14");
    expect(a).toHaveLength(3);
    expect(new Set(a.map((t) => t.key)).size).toBe(3);
    expect(dailyTasksFor("2026-10-14")).toEqual(a);
  });

  it("progression, réclamation et bonus aux trois", () => {
    const p = player();
    const tasks = dailyMissions(p, DAY).tasks;
    expect(() => claimDailyMission(p, 0, DAY)).toThrow(/Pas encore/);
    for (const t of tasks) trackActivity(p, t.key, DAY, t.count);
    const before = playerCasino(p).tokens;
    expect(claimDailyMission(p, 0, DAY)).toEqual({ tokens: DAILY_RULES.tokensPerTask, bonus: false });
    expect(() => claimDailyMission(p, 0, DAY)).toThrow(/déjà/);
    claimDailyMission(p, 1, DAY);
    expect(claimDailyMission(p, 2, DAY)).toEqual({ tokens: DAILY_RULES.tokensPerTask + DAILY_RULES.allBonusTokens, bonus: true });
    expect(playerCasino(p).tokens - before).toBe(3 * DAILY_RULES.tokensPerTask + DAILY_RULES.allBonusTokens);
    expect(dailyMissions(p, DAY).allClaimed).toBe(true);
  });

  it("le lendemain, tout repart de zéro", () => {
    const p = player();
    const t = dailyMissions(p, DAY).tasks[0];
    trackActivity(p, t.key, DAY, t.count);
    const next = dailyMissions(p, DAY + 86400_000);
    expect(next.tasks.every((x) => x.progress === 0 && !x.claimed)).toBe(true);
  });
});
