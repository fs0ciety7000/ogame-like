import { describe, expect, it } from "vitest";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import {
  ALLIANCE_BOSS_RULES,
  allianceBossCost,
  allianceBossOfWeek,
  allianceBossRefund,
  allianceWeekId,
  callAllianceBoss,
  checkAllianceBossLaunch,
  grantAllianceBossReward,
  normalizeAllianceBoss,
} from "@/game/allianceBoss";
import { resolveLeviathanAssault } from "@/game/leviathan";
import { compileGazette, gazetteDue, gazetteNumber, gazettePublishAt, gazetteState, publishGazette } from "@/game/gazette";
import { isOnline, lastActivity } from "@/game/retention";
import { PASS_POINTS, passState } from "@/game/seasonPass";
import { performLaunch } from "@/game/fleets";
import type { Alliance, PlayerState } from "@/types/game";

const NOW = Date.UTC(2026, 9, 14, 10); // mercredi 14 octobre 2026
const H = 3600_000;

function player(uid: string): PlayerState {
  const p = defaultPlayerState(uid, uid) as PlayerState;
  p.createdAtMs = NOW - 30 * 24 * H;
  p.resourcesUpdatedAtMs = NOW;
  p.buildings.extracteur_ferraille = { level: 10, unlocked: true };
  p.buildings.reacteur_instable = { level: 10, unlocked: true };
  p.units.chasseur = { level: 3, count: 500 };
  p.allianceId = "al1";
  return p;
}

function alliance(members: PlayerState[]): Alliance {
  return { id: "al1", name: "Test", tag: "TST", createdBy: members[0].uid, members: members.map((m) => m.uid), memberPseudos: Object.fromEntries(members.map((m) => [m.uid, m.pseudo])), roles: { [members[1].uid]: "officer" }, treasury: { scrap: 1e12, energy: 1e12, nano: 1e12, data: 1e12 } };
}

describe("v4.6 alliance boss", () => {
  it("weeks start on Monday (Paris) and rotate three bosses", () => {
    expect(allianceWeekId(NOW)).toBe("2026-10-12");
    // Dimanche 23 h 30 à Paris = encore la même semaine.
    expect(allianceWeekId(Date.UTC(2026, 9, 18, 21, 30))).toBe("2026-10-12");
    expect(allianceWeekId(Date.UTC(2026, 9, 18, 22, 30))).toBe("2026-10-19");
    const ids = new Set([0, 1, 2].map((w) => allianceBossOfWeek(NOW + w * 7 * 24 * H).id));
    expect(ids.size).toBe(3);
  });

  it("is called by the founder or an officer, once a week, paid by the treasury", () => {
    const members = [player("a"), player("b"), player("c")];
    const al = alliance(members);
    expect(() => callAllianceBoss(al, null, members, members, "c", NOW)).toThrow(/fondateur et les officiers/);
    const cost = allianceBossCost(members);
    expect(cost.scrap).toBeGreaterThan(0);
    const before = al.treasury!.scrap!;
    // v5.14.2 : en alternance avec le boss mondial.
    expect(() => callAllianceBoss(structuredClone(al), null, members, members, "b", NOW, { endMs: NOW + 3600_000 })).toThrow(/boss mondial/);
    const st = callAllianceBoss(al, null, members, members, "b", NOW);
    expect(al.treasury!.scrap).toBe(before - cost.scrap!);
    expect(st.endMs - st.startMs).toBe(ALLIANCE_BOSS_RULES.durationHours * H);
    expect(st.maxHp).toBeGreaterThanOrEqual(ALLIANCE_BOSS_RULES.minHp);
    expect(() => callAllianceBoss(al, st, members, members, "a", NOW + H)).toThrow(/déjà été appelé/);
    const poor = { ...alliance(members), treasury: {} };
    expect(() => callAllianceBoss(poor, null, members, members, "a", NOW)).toThrow(/trésor/);
    expect(normalizeAllianceBoss(JSON.parse(JSON.stringify(st)))).toEqual(st);
  });

  it("assaults every 4 h, 20 min flight, rewards by share, refund when killed", () => {
    const members = [player("a"), player("b"), player("c")];
    const al = alliance(members);
    let st = callAllianceBoss(al, null, members, members, "a", NOW);
    st = { ...st, maxHp: 1000, hp: 1000 };
    st = checkAllianceBossLaunch(st, "a", "a", NOW);
    expect(() => checkAllianceBossLaunch(st, "a", "a", NOW + H)).toThrow(/Prochain assaut/);
    const launched = performLaunch({ mission: "allianceboss", now: NOW, owner: members[0], ownerQueues: defaultQueues(), fleet: { chasseur: 10 } } as Parameters<typeof performLaunch>[0]);
    expect(launched.fleet.targetUid).toBe("allianceboss:al1");
    expect(launched.fleet.arriveAtMs - NOW).toBe(ALLIANCE_BOSS_RULES.flightMinutes * 60_000);
    // a : 970 dégâts, c : 30 (3 %, sous le seuil de 5 %).
    st = { ...st, ...resolveLeviathanAssault(st, members[2], { chasseur: 1 }, "balanced", NOW + 10).state };
    st = { ...st, contributions: { ...st.contributions, c: { ...st.contributions.c, damage: 30 } } };
    st = { ...st, hp: 970 };
    const hit = resolveLeviathanAssault(st, members[0], { chasseur: 500 }, "balanced", NOW + 20);
    expect(hit.killed).toBe(true);
    st = { ...st, ...hit.state };
    const top = grantAllianceBossReward(st, members[0], NOW, () => 0.1);
    expect(top.points).toBe(PASS_POINTS.allianceBoss);
    expect(top.relic).toBeTruthy();
    expect(Object.keys(top.gain).length).toBeGreaterThan(0);
    const small = grantAllianceBossReward(st, members[2], NOW);
    expect(small).toMatchObject({ points: PASS_POINTS.allianceBossTry, gain: {} });
    expect(grantAllianceBossReward(st, members[1], NOW).points).toBe(0);
    expect(passState(members[0], NOW).points).toBeGreaterThanOrEqual(PASS_POINTS.allianceBoss);
    const refund = allianceBossRefund(st);
    expect(refund.scrap).toBe(Math.floor(st.cost.scrap! * ALLIANCE_BOSS_RULES.refundPct));
    expect(allianceBossRefund({ ...st, status: "failed" })).toEqual({});
  });
});

describe("v4.6 presence", () => {
  it("online for 5 minutes, presence wins over server updates", () => {
    expect(isOnline(NOW - 4 * 60_000, NOW)).toBe(true);
    expect(isOnline(NOW - 6 * 60_000, NOW)).toBe(false);
    expect(lastActivity({ lastActiveMs: NOW - H, resourcesUpdatedAtMs: NOW })).toBe(NOW - H);
  });
});

describe("v4.6 gazette", () => {
  it("is due on Monday from 9:00 (Paris), once per week", () => {
    const monday8 = Date.UTC(2026, 9, 12, 6); // 8 h à Paris
    const monday9 = Date.UTC(2026, 9, 12, 7); // 9 h à Paris
    expect(gazettePublishAt(monday8)).toBe(monday9);
    const st = gazetteState(null);
    expect(gazetteDue(st, monday8)).toBe(false);
    expect(gazetteDue(st, monday9)).toBe(true);
    expect(gazetteDue({ ...st, lastWeekId: "2026-10-12" }, NOW)).toBe(false);
  });

  it("compiles the week's news and keeps 8 issues", () => {
    const now = Date.UTC(2026, 9, 12, 7);
    const since = now - 7 * 24 * H;
    const issue = compileGazette(
      {
        now,
        sinceMs: since,
        players: [
          { uid: "a", pseudo: "Alpha", xp: 5000, createdAtMs: now - 2 * 24 * H },
          { uid: "b", pseudo: "Bravo", xp: 9000 },
        ],
        xpSnapshot: { a: 1000, b: 8500 },
        bosses: [{ name: "Le Léviathan", status: "killed", endedAtMs: now - H, top: ["Alpha", "Bravo"] }],
        vendettas: [{ warlordName: "Zhar'Kesh", ownerPseudo: "Bravo", won: true, finishedAtMs: now - 3 * H }],
        wars: [{ attackerTag: "AAA", defenderTag: "BBB", winnerTag: "BBB", endedAtMs: now - 5 * H }],
        raids: [
          { attackerPseudo: "Alpha", defenderPseudo: "Bravo", loot: 1_200_000, timestamp: now - 6 * H },
          { attackerPseudo: "Bravo", defenderPseudo: "Alpha", loot: 50, timestamp: since - H },
        ],
        warlords: [{ name: "Brannoc", power: 2e6 }, { name: "Zhar'Kesh", power: 9e6 }],
      },
      3,
    );
    expect(issue.headline).toMatch(/Léviathan tombe/);
    expect(issue.number).toBe(3);
    const text = JSON.stringify(issue.sections);
    expect(text).toContain("Alpha : +4 000 XP");
    expect(text).toContain("1,2 M ressources");
    expect(text).toContain("[BBB] remporte la guerre contre [AAA]");
    expect(text).toContain("Zhar'Kesh aligne 9 M");
    expect(text).toContain("Bienvenue");
    let st = gazetteState(null);
    for (let i = 0; i < 10; i++) st = publishGazette(st, { ...issue, id: `x${i}`, weekId: `w${i}` }, [{ uid: "a", xp: 5000 }]);
    expect(st.issues).toHaveLength(8);
    expect(st.issues[0].id).toBe("x9");
    expect(st.xpSnapshot).toEqual({ a: 5000 });
    expect(gazetteNumber(999)).toBe("999");
    expect(gazetteNumber(2_500_000_000)).toBe("2,5 Md");
  });
});
