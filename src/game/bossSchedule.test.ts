import { afterEach, describe, expect, it } from "vitest";
import { bossEndLabel, bossWindows, describeBossSchedule, EVENT_RULES, validateBossSchedule, type BossSchedule } from "@/game/events";
import { leviathanWindow, LEVIATHAN_RULES, nextLeviathanStart, rescheduleBoss, type LeviathanState } from "@/game/leviathan";
import { SEASON_BOSS_RULES, seasonBossWindow } from "@/game/chronicles";

/* v5.10.4 : occurrence des boss mensuels réglable dans l'administration. */

const paris = (iso: string) => new Date(iso).getTime();
const sched = (patch: Partial<BossSchedule> = {}): BossSchedule => ({ enabled: true, weekend: "first", startHour: 18, durationHours: 72, ...patch });
const saved = { ev: { ...EVENT_RULES }, lev: { ...LEVIATHAN_RULES }, sb: { ...SEASON_BOSS_RULES } };

afterEach(() => {
  Object.assign(EVENT_RULES, saved.ev);
  Object.assign(LEVIATHAN_RULES, saved.lev);
  Object.assign(SEASON_BOSS_RULES, saved.sb);
});

describe("bossWindows", () => {
  it("premier, troisième et dernier week-end d'octobre 2026 (vendredis 2, 16 et 30)", () => {
    const from = paris("2026-10-01T00:00:00+02:00");
    expect(bossWindows(from, sched())[0].startMs).toBe(paris("2026-10-02T18:00:00+02:00"));
    expect(bossWindows(from, sched({ weekend: "third" }))[0].startMs).toBe(paris("2026-10-16T18:00:00+02:00"));
    // Heure d'hiver depuis le 25 octobre : le vendredi 30 est à +01:00.
    const start = paris("2026-10-30T20:00:00+01:00");
    expect(bossWindows(from, sched({ weekend: "last", startHour: 20, durationHours: 51 }))[0]).toEqual({ startMs: start, endMs: start + 51 * 3600_000 });
  });

  it("garde la fenêtre en cours, enchaîne les mois, et rien si désactivé", () => {
    const during = paris("2026-10-04T12:00:00+02:00");
    const [cur, next] = bossWindows(during, sched(), 2);
    expect(cur.startMs).toBe(paris("2026-10-02T18:00:00+02:00"));
    expect(next.startMs).toBe(paris("2026-11-06T18:00:00+01:00"));
    expect(bossWindows(during, sched({ enabled: false }), 2)).toEqual([]);
  });

  it("libellés et validation", () => {
    expect(bossEndLabel({ startHour: 18, durationHours: 72 })).toBe("lundi 18 h");
    expect(bossEndLabel({ startHour: 18, durationHours: 53 })).toBe("dimanche 23 h");
    expect(describeBossSchedule(sched({ weekend: "last", durationHours: 53 }))).toBe("le dernier week-end de chaque mois, du vendredi 18 h au dimanche 23 h");
    expect(validateBossSchedule("X", { weekend: "fifth" as never, startHour: 25, durationHours: 0 })).toHaveLength(3);
  });
});

describe("Léviathan et boss de saison suivent les règles", () => {
  it("le Léviathan déplacé au deuxième week-end, à 20 h", () => {
    EVENT_RULES.bossWeekend = "second";
    LEVIATHAN_RULES.startHour = 20;
    const from = paris("2026-10-01T00:00:00+02:00");
    expect(nextLeviathanStart(from)).toBe(paris("2026-10-09T20:00:00+02:00"));
    expect(leviathanWindow(paris("2026-10-03T12:00:00+02:00"))).toBeNull();
    expect(leviathanWindow(paris("2026-10-10T12:00:00+02:00"))?.id).toBe(`lev-${paris("2026-10-09T20:00:00+02:00")}`);
  });

  it("par défaut, identifiants inchangés (combats déjà en base)", () => {
    expect(leviathanWindow(paris("2026-10-03T12:00:00+02:00"))?.id).toBe("lev-1790956800000");
  });

  it("boss de saison désactivé : plus de fenêtre", () => {
    SEASON_BOSS_RULES.enabled = false;
    expect(seasonBossWindow(paris("2026-10-20T00:00:00+02:00"), true)).toBeNull();
  });

  it("fin d'un combat déplacée par l'équipe", () => {
    const now = paris("2026-10-03T12:00:00+02:00");
    const st = { id: "lev-x", startMs: now - 3600_000, endMs: now + 3600_000, maxHp: 10, hp: 5, status: "active", contributions: {}, endedAtMs: 0, rewarded: false, titleHolder: null, timeline: [] } as LeviathanState;
    expect(rescheduleBoss(st, now + 48 * 3600_000, now).endMs).toBe(now + 48 * 3600_000);
    expect(() => rescheduleBoss(st, now + 60_000, now)).toThrow();
    expect(() => rescheduleBoss({ ...st, status: "killed" }, now + 48 * 3600_000, now)).toThrow();
  });
});
