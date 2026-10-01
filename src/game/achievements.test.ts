import { beforeEach, describe, expect, it } from "vitest";
import {
  ACHIEVEMENTS,
  achievementProgress,
  checkNewAchievements,
  DEFAULT_ACHIEVEMENTS,
  METRICS,
  setAchievements,
  validateAchievements,
} from "@/game/achievements";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { flushState } from "@/game/flush";
import { performPlayerAction } from "@/game/actions";
import { bumpStat, parisHour, recordMission } from "@/game/stats";
import type { PlayerState } from "@/types/game";

function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return { ...defaultPlayerState("u1", "Testeur"), ...overrides };
}
const ids = (p: PlayerState) => checkNewAchievements(p).map((a) => a.id);

describe("succès (v2.3)", () => {
  beforeEach(() => setAchievements(structuredClone(DEFAULT_ACHIEVEMENTS)));

  it("has 69 valid achievements, keeping the 8 historical ids", () => {
    expect(ACHIEVEMENTS).toHaveLength(69);
    expect(validateAchievements(DEFAULT_ACHIEVEMENTS)).toEqual([]);
    for (const id of ["first_blood", "veteran", "architect", "expansion", "researcher", "commander", "fleet", "tireless"]) {
      expect(ACHIEVEMENTS.some((a) => a.id === id)).toBe(true);
    }
    for (const a of ACHIEVEMENTS) expect(METRICS[a.metric]).toBeDefined();
  });

  it("returns nothing for a fresh player", () => {
    expect(checkNewAchievements(makePlayer())).toHaveLength(0);
  });

  it("detects newly-met conditions, once", () => {
    expect(ids(makePlayer({ victories: 10, playtimeSeconds: 100_000 }))).toEqual(expect.arrayContaining(["first_blood", "veteran", "tireless"]));
    expect(ids(makePlayer({ victories: 1, unlockedAchievements: ["first_blood"] }))).not.toContain("first_blood");
  });

  it("follows the cumulative stats", () => {
    const p = makePlayer();
    bumpStat(p, "loot", 150_000);
    bumpStat(p, "traded", 2_000_000);
    expect(ids(p)).toEqual(expect.arrayContaining(["raider", "merchant"]));
    const corsair = ACHIEVEMENTS.find((a) => a.id === "corsair")!;
    expect(achievementProgress(corsair, p)).toEqual({ value: 150_000, target: 1_000_000, done: false });
    for (let i = 0; i < 10; i++) recordMission(p, "2026-10-01");
    recordMission(p, "2026-10-02");
    expect(p.stats).toMatchObject({ missions: 11, bestMissionDay: 10, missionDayCount: 1 });
  });

  it("disabled achievements never unlock", () => {
    ACHIEVEMENTS.find((a) => a.id === "first_blood")!.enabled = false;
    expect(ids(makePlayer({ victories: 1 }))).not.toContain("first_blood");
  });

  it("grants XP, production and titles when the server flushes", () => {
    const now = Date.UTC(2026, 9, 1, 12);
    const p = makePlayer({ resourcesUpdatedAtMs: now, victories: 1000 });
    const out = flushState(p, defaultQueues(), now);
    expect(out.player.unlockedAchievements).toEqual(expect.arrayContaining(["first_blood", "eternal_conqueror"]));
    expect(out.player.xp).toBe(10 + 10 + 25 + 60 + 150);
    expect(out.player.titles?.map((t) => t.label)).toContain("Conquérant");
    expect(out.notifications.filter((n) => n.kind === "achievement")).toHaveLength(1); // regroupées
    const again = flushState(out.player, out.queues, now + 1000);
    expect(again.notifications.filter((n) => n.kind === "achievement")).toHaveLength(0);
  });

  it("counts trades and claimed contracts in player actions", () => {
    const now = Date.UTC(2026, 9, 1, 12);
    const p = makePlayer({ resourcesUpdatedAtMs: now });
    p.resources.scrap = 10_000;
    const out = performPlayerAction(p, defaultQueues(), { type: "trade", sellId: "scrap", buyId: "energy", amount: 5000 }, now);
    expect(out.player.stats?.traded).toBe(5000);
  });

  it("knows the Paris hour (summer and winter time)", () => {
    expect(parisHour(Date.UTC(2026, 6, 1, 1))).toBe(3);
    expect(parisHour(Date.UTC(2026, 0, 15, 2))).toBe(3);
  });
});
