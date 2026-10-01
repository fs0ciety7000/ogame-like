import { describe, expect, it } from "vitest";
import { activeWarBetween, concludeWar, declareWar, scoreBattle, surrender, WAR_RULES, warSeasonBonuses, warStatusAt, warTreasuryReward, type AllianceWar } from "@/game/wars";
import { allianceStandings } from "@/game/alliances";
import { checkAttackAllowed } from "@/game/pvp";
import type { Alliance } from "@/types/game";

const H = 3600_000;
const NOW = 1_000_000_000;

function alliance(id: string, members: string[], treasury = { scrap: 10_000_000, energy: 10_000_000 }): Alliance {
  return { id, name: `Alliance ${id}`, tag: id.toUpperCase(), createdBy: members[0], members, memberPseudos: {}, roles: {}, treasury } as Alliance;
}
const A = alliance("a", ["a1", "a2", "a3"]);
const B = alliance("b", ["b1", "b2", "b3"]);

function declared(): AllianceWar {
  return { id: "w1", ...declareWar({ actorUid: "a1", actorPseudo: "Nova", own: A, target: B, wars: [], now: NOW }).war };
}

describe("alliance wars", () => {
  it("declaration: rights, size, money, one war at a time, cooldown per pair", () => {
    const out = declareWar({ actorUid: "a1", actorPseudo: "Nova", own: A, target: B, wars: [], now: NOW });
    expect(out.own.treasury?.scrap).toBe(5_000_000);
    expect(out.war.startMs).toBe(NOW + WAR_RULES.prepHours * H);
    expect(out.war.endMs - out.war.startMs).toBe(WAR_RULES.durationHours * H);
    expect(() => declareWar({ actorUid: "a2", actorPseudo: "x", own: A, target: B, wars: [], now: NOW })).toThrow(/fondateur/);
    expect(() => declareWar({ actorUid: "a1", actorPseudo: "x", own: A, target: alliance("c", ["c1", "c2"]), wars: [], now: NOW })).toThrow(/moins de 3/);
    expect(() => declareWar({ actorUid: "a1", actorPseudo: "x", own: alliance("a", ["a1", "a2", "a3"], { scrap: 1, energy: 1 }), target: B, wars: [], now: NOW })).toThrow(/trésor/);
    expect(() => declareWar({ actorUid: "a1", actorPseudo: "x", own: A, target: B, wars: [out.war], now: NOW + H })).toThrow(/déjà en guerre/);
    const ended = { ...out.war, status: "ended" as const, endedAtMs: NOW + 90 * H };
    expect(() => declareWar({ actorUid: "a1", actorPseudo: "x", own: A, target: B, wars: [ended], now: NOW + 100 * H })).toThrow(/trop récente/);
    expect(declareWar({ actorUid: "a1", actorPseudo: "x", own: A, target: B, wars: [ended], now: NOW + 90 * H + 8 * 24 * H }).war.status).toBe("preparing");
  });

  it("phases: preparing, active, then ended; only active wars count", () => {
    const w = declared();
    expect(warStatusAt(w, NOW + H)).toBe("preparing");
    expect(activeWarBetween([w], "a", "b", NOW + H)).toBeNull();
    expect(activeWarBetween([w], "b", "a", w.startMs + H)).toBe(w);
    expect(warStatusAt(w, w.endMs)).toBe("ended");
  });

  it("scores: 3 per attack won + 1 per 10 M loot, 2 per defense won", () => {
    let w = declared();
    const t = w.startMs + H;
    w = scoreBattle(w, "a", "Nova", "Orion", "attacker_win", 25_000_000, t);
    expect(w.scoreAttacker).toBe(3 + 2);
    w = scoreBattle(w, "a", "Nova", "Orion", "defender_win", 0, t);
    expect(w.scoreDefender).toBe(2);
    w = scoreBattle(w, "b", "Orion", "Nova", "attacker_win", 0, t);
    expect(w.scoreDefender).toBe(5);
    expect(scoreBattle(w, "a", "x", "y", "attacker_win", 0, NOW).scoreAttacker).toBe(5); // en préparation : rien
  });

  it("ends on score or by surrender; winner gets treasury and season bonus", () => {
    let w = scoreBattle(declared(), "a", "Nova", "Orion", "attacker_win", 0, NOW + 13 * H);
    const done = concludeWar(w, w.endMs);
    expect(done.winnerId).toBe("a");
    expect(concludeWar({ ...declared() }, declared().endMs).winnerId).toBe("");
    w = surrender(declared(), B, "b1", "Orion", NOW + 20 * H);
    expect(w).toMatchObject({ status: "ended", winnerId: "a", surrenderedBy: "b" });
    expect(() => surrender(declared(), B, "b2", "x", NOW)).toThrow(/fondateur/);
    expect(warTreasuryReward(A).treasury?.scrap).toBe(30_000_000);
    const bonuses = warSeasonBonuses([{ winnerId: "a", seasonId: "2026-10" }], "2026-10");
    const st = allianceStandings([{ allianceId: "a", seasonXp: 1000 }, { allianceId: "b", seasonXp: 1050 }], bonuses);
    expect(st[0]).toMatchObject({ allianceId: "a", score: 1100 });
  });

  it("war shortens the attack cooldown on the same target", () => {
    const ctx = { now: NOW, attackerUid: "x", attackerXp: 1000, defenderUid: "y", defenderXp: 1000, defenderCreatedAtMs: 0, defenderHasAttacked: true, lastAttackOnTargetMs: NOW - 90 * 60_000, lastDefenderDefeatMs: null };
    expect(checkAttackAllowed(ctx).allowed).toBe(false);
    expect(checkAttackAllowed({ ...ctx, attackCooldownMs: WAR_RULES.attackCooldownHours * H }).allowed).toBe(true);
  });
});
