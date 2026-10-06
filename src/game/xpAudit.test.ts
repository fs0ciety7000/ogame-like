import { describe, expect, it } from "vitest";
import { applyXpDelta } from "@/game/seasons";
import { achievementXpAlert, activityProfile, auditFlags, battlePairs, bestTotals, ledgerCovers, ledgerSince, ledgerTotals, missionXpCeiling, notifSource, notifXp, percentiles, recordXp } from "@/game/xpAudit";
import type { PlayerState } from "@/types/game";

const HOUR = 3600_000;
const NOW = Date.UTC(2026, 9, 5, 12, 30);

describe("registre d'XP", () => {
  it("cumule par heure et par source, et garde 8 jours", () => {
    const p = { stats: {} } as Pick<PlayerState, "stats">;
    recordXp(p, "mission", 30, NOW - 9 * 24 * HOUR);
    recordXp(p, "mission", 60, NOW - 2 * HOUR);
    recordXp(p, "attack", 40, NOW - 10 * 60_000);
    recordXp(p, "mission", 15, NOW);
    expect(Object.keys(p.stats!.xpHours!)).toHaveLength(2);
    expect(ledgerTotals(p.stats, NOW, HOUR)).toEqual({ total: 55, bySource: { attack: 40, mission: 15 } });
    expect(ledgerTotals(p.stats, NOW, 24 * HOUR).total).toBe(115);
    expect(ledgerSince(p.stats)).toBe(Math.floor((NOW - 2 * HOUR) / HOUR) * HOUR);
  });

  it("est alimenté par chaque gain d'XP, avec sa source", () => {
    const p = { xp: 0, seasonXp: 0, stats: {} } as unknown as PlayerState;
    applyXpDelta(p, 60, NOW, "mission");
    applyXpDelta(p, -20, NOW, "attack");
    expect(p.xp).toBe(40);
    expect(ledgerTotals(p.stats, NOW, HOUR).bySource).toEqual({ mission: 60, attack: -20 });
  });
});

describe("registre ou reconstitution", () => {
  it("ne prend le registre que s'il couvre toute la fenêtre (5.17.2)", () => {
    const ledger = { total: 497, bySource: { mission: 497 } };
    const rebuilt = { total: 54_529, bySource: { mission: 45_361 } };
    const since = Math.floor(NOW / HOUR) * HOUR; // registre ouvert cette heure-ci
    expect(ledgerCovers(since, NOW, 24 * HOUR)).toBe(false);
    expect(bestTotals(ledger, rebuilt, since, NOW, 7 * 24 * HOUR)).toEqual({ totals: rebuilt, source: "notifications" });
    expect(bestTotals(ledger, rebuilt, since, NOW, HOUR).source).toBe("ledger");
    expect(bestTotals(ledger, rebuilt, NOW - 8 * 24 * HOUR, NOW, 7 * 24 * HOUR).source).toBe("ledger");
    expect(bestTotals(ledger, rebuilt, null, NOW, HOUR).source).toBe("notifications");
  });
});

describe("plafond des missions", () => {
  it("vaut 60 XP par heure et par mission relancée sans interruption", () => {
    expect(missionXpCeiling(HOUR)).toBe(960);
    expect(missionXpCeiling(24 * HOUR)).toBe(23_040);
    expect(missionXpCeiling(24 * HOUR, 2)).toBe(46_080);
  });
});

describe("reconstitution depuis les notifications", () => {
  it("lit l'XP du message ou des données", () => {
    expect(notifXp({ message: "Patrouille courte : récompense obtenue (+60 XP)." })).toBe(60);
    expect(notifXp({ message: "Attaque contre Bob (-20 XP)." })).toBe(-20);
    expect(notifXp({ message: "x", data: { xp: 45 } })).toBe(45);
    expect(notifXp({ message: "Recherche terminée" })).toBe(0);
    expect(notifXp({ kind: "system", message: "Ta semaine", data: { xp: 900 } })).toBe(0);
    expect(notifSource({ kind: "mission" })).toBe("mission");
    expect(notifSource({ kind: "combat-defender" })).toBe("defense");
  });
});

describe("rythme d'activité", () => {
  it("compte les heures actives et la plus longue série", () => {
    const ts = [0, 1, 2, 5, 6].map((h) => NOW - h * HOUR);
    const a = activityProfile(ts, NOW, 24 * HOUR);
    expect(a.activeHours).toBe(5);
    expect(a.longestStreak).toBe(3);
    expect(a.byHour).toHaveLength(24);
  });
});

describe("adversaires", () => {
  it("regroupe les combats par adversaire, avec l'XP rapportée", () => {
    const r = [
      { attackerUid: "u", defenderUid: "v", defenderPseudo: "Vic", outcome: "attacker_win", timestamp: 1, attackerXpDelta: 40 },
      { attackerUid: "u", defenderUid: "v", defenderPseudo: "Vic", outcome: "attacker_win", timestamp: 2, attackerXpDelta: 40 },
      { attackerUid: "v", attackerPseudo: "Vic", defenderUid: "u", outcome: "defender_win", timestamp: 3, defenderXpDelta: 50 },
      { attackerUid: "w", defenderUid: "u", outcome: "draw", timestamp: 4, defenderXpDelta: 5 },
      { attackerUid: "x", defenderUid: "y", outcome: "draw", timestamp: 5 },
    ];
    const pairs = battlePairs(r, "u");
    expect(pairs[0]).toEqual({ uid: "v", pseudo: "Vic", attacks: 2, defenses: 1, xp: 130 });
    expect(pairs).toHaveLength(2);
  });
});

describe("signaux d'alerte", () => {
  const base = { now: NOW, xp: 1000, createdAtMs: NOW - 30 * 24 * HOUR, xp24h: 300, missionXp24h: 200 };

  it("rien à signaler pour un joueur ordinaire", () => {
    expect(auditFlags(base)).toEqual([]);
  });

  it("signale le compte test, les missions au-delà du plafond et une moyenne impossible", () => {
    const f = auditFlags({ ...base, testMode: true, missionXp24h: 50_000, xp: 5_000_000 });
    expect(f.map((x) => x.id)).toEqual(expect.arrayContaining(["test-mode", "mission-cap"]));
    expect(f[0].severity).toBe("high");
    const g = auditFlags({ ...base, xp: 2_000_000 });
    expect(g.map((x) => x.id)).toContain("lifetime");
  });

  it("signale l'activité 24 h/24, l'écart aux autres joueurs et les combats répétés", () => {
    const f = auditFlags({
      ...base,
      xp24h: 9000,
      missionXp24h: 17_000,
      activeHours24h: 23,
      longestStreak7d: 40,
      p90_24h: 800,
      median24h: 200,
      pairs: [{ uid: "v", pseudo: "Vic", attacks: 8, defenses: 2, xp: 400 }],
      adminActions: 2,
    });
    expect(f.map((x) => x.id)).toEqual(["mission-near-cap", "always-on", "streak", "outlier", "pair-v", "admin"]);
  });

  it("calcule médiane et 90e centile", () => {
    expect(percentiles([5, 1, 3, 2, 4, 6, 7, 8, 9, 10])).toEqual({ median: 5, p90: 10 });
    expect(percentiles([])).toEqual({ median: 0, p90: 0 });
  });
});


describe("5.26.2 : alerte XP de succès", () => {
  it("signale une XP de succès forte et majoritaire sur 24 h", () => {
    const now = 100 * 3600_000;
    const h = Math.floor(now / 3600_000);
    expect(achievementXpAlert({ xpHours: { [h]: { achievement: 2500, mission: 500 } } } as never, now)).toMatchObject({ xp: 2500, total: 3000 });
    expect(achievementXpAlert({ xpHours: { [h]: { achievement: 2500, mission: 5000 } } } as never, now)).toBeNull();
    expect(achievementXpAlert({ xpHours: { [h]: { achievement: 500 } } } as never, now)).toBeNull();
    expect(achievementXpAlert({ xpHours: { [h - 30]: { achievement: 9000 } } } as never, now)).toBeNull();
  });
});
