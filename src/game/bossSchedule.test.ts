import { afterEach, describe, expect, it } from "vitest";
import { bossEndLabel, bossWindows, describeBossSchedule, eveReminderDue, EVENT_RULES, parisRelativeLabel, parisWhenLabel, validateBossSchedule, type BossSchedule } from "@/game/events";
import { endingReminderDue, leviathanWindow, LEVIATHAN_RULES, nextLeviathanStart, rescheduleBoss, type LeviathanState } from "@/game/leviathan";
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

describe("dates précises (v5.10.5)", () => {
  it("s'ajoutent au rendez-vous mensuel, dans l'ordre, ou le remplacent", () => {
    const from = paris("2026-10-01T00:00:00+02:00");
    const d = paris("2026-10-14T20:00:00+02:00");
    const s = sched({ dates: [{ startMs: d, durationHours: 24 }] });
    expect(bossWindows(from, s, 3).map((w) => [w.startMs, !!w.fixed])).toEqual([
      [paris("2026-10-02T18:00:00+02:00"), false],
      [d, true],
      [paris("2026-11-06T18:00:00+01:00"), false],
    ]);
    const only = sched({ enabled: false, dates: [{ startMs: d, durationHours: 24 }] });
    expect(bossWindows(from, only, 3)).toEqual([{ startMs: d, endMs: d + 24 * 3600_000, fixed: true }]);
    expect(describeBossSchedule(only, from)).toBe("à des dates fixées par l'équipe");
  });

  it("Léviathan à date précise : fenêtre ouverte, événement du week-end remplacé", () => {
    const d = paris("2026-10-14T20:00:00+02:00");
    EVENT_RULES.bossDates = [{ startMs: d, durationHours: 24 }];
    expect(leviathanWindow(d + 3600_000)?.id).toBe(`lev-${d}`);
    expect(validateBossSchedule("X", { weekend: "first", startHour: 18, durationHours: 72, dates: [{ startMs: d, durationHours: 24 }, { startMs: d + 3600_000, durationHours: 2 }] })).toContain("X : deux dates précises se chevauchent.");
  });

  it("boss de saison à date précise : identifiant distinct du rendez-vous du mois", () => {
    const d = paris("2026-10-14T20:00:00+02:00");
    SEASON_BOSS_RULES.dates = [{ startMs: d, durationHours: 24 }];
    expect(seasonBossWindow(d + 3600_000)?.id).toBe(`boss-2026-10-d${d}`);
  });
});

describe("rappels des boss (v5.10.5)", () => {
  it("libellés relatifs à l'heure de Paris", () => {
    const now = paris("2026-10-01T12:00:00+02:00");
    expect(parisRelativeLabel(paris("2026-10-01T18:00:00+02:00"), now)).toBe("aujourd'hui à 18 h");
    expect(parisRelativeLabel(paris("2026-10-02T18:00:00+02:00"), now)).toBe("demain à 18 h");
    expect(parisWhenLabel(paris("2026-11-09T18:30:00+01:00"))).toBe("lundi 9 novembre à 18 h 30");
  });

  it("la veille : une seule fois, pas à moins d'une heure", () => {
    const start = paris("2026-10-02T18:00:00+02:00");
    expect(eveReminderDue({ startMs: start }, undefined, start - 30 * 3600_000)).toBe(false);
    expect(eveReminderDue({ startMs: start }, undefined, start - 20 * 3600_000)).toBe(true);
    expect(eveReminderDue({ startMs: start }, start, start - 20 * 3600_000)).toBe(false);
    expect(eveReminderDue({ startMs: start }, undefined, start - 30 * 60_000)).toBe(false);
  });

  it("avant la fin : seulement s'il tient encore, et de nouveau si la fin est repoussée", () => {
    const now = paris("2026-10-04T12:00:00+02:00");
    const st = { id: "lev-x", startMs: now - 48 * 3600_000, endMs: now + 5 * 3600_000, maxHp: 10, hp: 5, status: "active", contributions: {}, endedAtMs: 0, rewarded: false, titleHolder: null, timeline: [] } as LeviathanState;
    expect(endingReminderDue(st, now)).toBe(true);
    expect(endingReminderDue({ ...st, endingNotified: true }, now)).toBe(false);
    expect(endingReminderDue({ ...st, endMs: now + 10 * 3600_000 }, now)).toBe(false);
    expect(endingReminderDue({ ...st, hp: 0, status: "killed" }, now)).toBe(false);
    expect(rescheduleBoss({ ...st, endingNotified: true }, now + 24 * 3600_000, now).endingNotified).toBeUndefined();
  });
});
