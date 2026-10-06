import { describe, expect, it } from "vitest";
import { bossWindows, describeBossSchedule, EVENT_RULES, parisOffsetMs } from "@/game/events";
import { leviathanSchedule } from "@/game/leviathan";
import { SEASON_BOSS_RULES, seasonBossSchedule, seasonBossWindow } from "@/game/chronicles";
import { casinoWeeklyWindows, DEFAULT_CASINO } from "@/game/casino";

/* 6.7 (lot V, calendrier-semaine.md) : boss de la chronique le mardi 18 h (48 h), tournoi du casino le mercredi
   18 h (30 h), événement du week-end le vendredi : trois rendez-vous serveur qui ne commencent jamais le même jour. */

const H = 3600_000;
const parisDow = (ms: number) => new Date(ms + parisOffsetMs(ms)).getUTCDay();
const parisHour = (ms: number) => new Date(ms + parisOffsetMs(ms)).getUTCHours();

function withRules<T>(patch: { bossWeekly?: boolean; season?: Partial<typeof SEASON_BOSS_RULES> }, fn: () => T): T {
  const savedEv = EVENT_RULES.bossWeekly;
  const savedSb = { ...SEASON_BOSS_RULES };
  if (patch.bossWeekly !== undefined) EVENT_RULES.bossWeekly = patch.bossWeekly;
  Object.assign(SEASON_BOSS_RULES, patch.season ?? {});
  try {
    return fn();
  } finally {
    EVENT_RULES.bossWeekly = savedEv;
    Object.assign(SEASON_BOSS_RULES, savedSb);
  }
}

describe("6.7 : rendez-vous de la semaine", () => {
  it("défauts : boss de la chronique le mardi 18 h pour 48 h, casino le mercredi 18 h pour 30 h", () => {
    expect(SEASON_BOSS_RULES.weekday).toBe(2);
    expect(SEASON_BOSS_RULES.durationHours).toBe(48);
    expect(DEFAULT_CASINO.weekly).toEqual({ day: 3, hour: 18, hours: 30 });
    expect(DEFAULT_CASINO.weekends).toBe(false);
  });

  it("boss mondial mensuel (week-end) : le boss de la chronique tombe le dernier mardi du mois", () =>
    withRules({ bossWeekly: false }, () => {
      const now = Date.UTC(2026, 9, 2);
      const list = bossWindows(now, seasonBossSchedule(), 4);
      expect(list.length).toBe(4);
      for (const w of list) {
        expect(parisDow(w.startMs)).toBe(2);
        expect(parisHour(w.startMs)).toBe(18);
        expect(w.endMs - w.startMs).toBe(48 * H);
        // Dernier mardi : une semaine plus tard, on change de mois.
        const local = new Date(w.startMs + parisOffsetMs(w.startMs));
        expect(new Date(local.getTime() + 7 * 24 * H).getUTCMonth()).not.toBe(local.getUTCMonth());
      }
      expect(new Date(list[0].startMs).toISOString()).toBe("2026-10-27T17:00:00.000Z");
      expect(seasonBossWindow(list[0].startMs + H)?.monthId).toBe("2026-10");
      expect(describeBossSchedule(seasonBossSchedule(), now)).toBe("le dernier mardi de chaque mois, de 18 h au jeudi 18 h");
    }));

  it("boss mondial en rotation : mardi 18 h quand il tient, autant de combats qu'avant, jamais en même temps", () => {
    const now = Date.UTC(2026, 9, 5);
    const world = bossWindows(now, leviathanSchedule(), 14);
    const season = bossWindows(now, seasonBossSchedule(), 12);
    const before = withRules({ season: { weekday: null } }, () => bossWindows(now, seasonBossSchedule(), 12));
    // Même nombre d'apparitions sur la période qu'avec l'ancien placement.
    const until = Math.min(season[season.length - 1].startMs, before[before.length - 1].startMs);
    expect(season.filter((w) => w.startMs <= until).length).toBe(before.filter((w) => w.startMs <= until).length);
    expect(season.filter((w) => parisDow(w.startMs) === 2).length).toBeGreaterThanOrEqual(6);
    for (const s of season) for (const w of world) expect(s.endMs <= w.startMs || s.startMs >= w.endMs).toBe(true);
  });

  it("invariant I16 : boss de la chronique, tournoi et événement du week-end ne commencent jamais le même jour", () =>
    withRules({ bossWeekly: false }, () => {
      const now = Date.UTC(2026, 9, 1);
      const seasonDays = new Set(bossWindows(now, seasonBossSchedule(), 6).map((w) => parisDow(w.startMs)));
      const casinoDays = new Set(casinoWeeklyWindows(DEFAULT_CASINO, now).map((w) => parisDow(w.startMs)));
      const weekendEvent = 5; // vendredi 18 h (weekendWindow)
      for (const d of seasonDays) {
        expect(casinoDays.has(d)).toBe(false);
        expect(d).not.toBe(weekendEvent);
      }
      expect(casinoDays.has(weekendEvent)).toBe(false);
    }));

  it("réglage absent (null) : ancien rythme, vendredi du dernier week-end", () =>
    withRules({ bossWeekly: false, season: { weekday: null } }, () => {
      const [w] = bossWindows(Date.UTC(2026, 9, 1), seasonBossSchedule(), 1);
      expect(parisDow(w.startMs)).toBe(5);
    }));
});
