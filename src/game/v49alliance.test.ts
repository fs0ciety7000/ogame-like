import { describe, expect, it } from "vitest";
import { ALLIANCE_DAILY_RULES, dailyTreasuryBonus, proposeDaily, startDaily, updateDailyProgress, voteDaily, winningProposal, type DailyMember } from "@/game/allianceDaily";
import { allianceRole, canDiplomacy, setRole } from "@/game/alliances";
import { allianceCalendar } from "@/game/allianceCalendar";
import { parisLocalToUtc } from "@/game/events";
import type { Alliance } from "@/types/game";

// Jeudi 15 octobre 2026, 8 h à Paris (vote ouvert).
const VOTING = parisLocalToUtc(Date.UTC(2026, 9, 15, 8));
const AFTER = parisLocalToUtc(Date.UTC(2026, 9, 15, 11));

const member = (uid: string, active: boolean, stats = {}): DailyMember => ({ uid, active, stats, production4h: { scrap: 4000, energy: 2000 }, fleetPower: 100_000 });

describe("v4.9 : objectifs du jour d'alliance", () => {
  it("3 objectifs proposés, cibles selon les membres actifs", () => {
    const d = proposeDaily("a1", "2026-10-15", [member("u1", true), member("u2", true), member("u3", false)], VOTING);
    expect(d.proposals).toHaveLength(3);
    const t = Object.fromEntries(d.proposals.map((p) => [p.kind, p.target]));
    if (t.missions) expect(t.missions).toBe(ALLIANCE_DAILY_RULES.missionsPerMember * 2);
    if (t.research) expect(t.research).toBe(ALLIANCE_DAILY_RULES.researchPerMember * 2);
    if (t.treasury) expect(t.treasury).toBe(12_000);
    if (t.power) expect(t.power).toBe(6000);
    // Stable pour l'alliance et le jour.
    expect(proposeDaily("a1", "2026-10-15", [member("u1", true)], VOTING).proposals.map((p) => p.kind)).toEqual(d.proposals.map((p) => p.kind));
  });

  it("vote des officiers seulement, entre 6 h et 10 h ; égalité : la première", () => {
    const d = proposeDaily("a1", "2026-10-15", [member("u1", true)], VOTING);
    expect(() => voteDaily(d, "u2", "member", 1, VOTING)).toThrow(/officiers/);
    expect(() => voteDaily(d, "u2", "officer", 1, AFTER)).toThrow(/vote est ouvert/);
    voteDaily(d, "u1", "founder", 2, VOTING);
    voteDaily(d, "u2", "officer", 1, VOTING);
    expect(winningProposal(d)).toBe(1);
    voteDaily(d, "u3", "officer", 2, VOTING);
    expect(winningProposal(d)).toBe(2);
  });

  it("progression depuis le début de l'objectif, atteint puis bonus du trésor", () => {
    const d = proposeDaily("a1", "2026-10-15", [member("u1", true), member("u2", true)], VOTING);
    d.proposals = [{ kind: "missions", target: 8 }, ...d.proposals.slice(1)];
    startDaily(d, [member("u1", true, { missions: 10 }), member("u2", true, { missions: 3 })], AFTER);
    expect(updateDailyProgress(d, [member("u1", true, { missions: 14 }), member("u2", true, { missions: 3 })], AFTER + 1000)).toBe(false);
    expect(d.progress).toBe(4);
    expect(updateDailyProgress(d, [member("u1", true, { missions: 15 }), member("u2", true, { missions: 6 })], AFTER + 2000)).toBe(true);
    expect(d.status).toBe("done");
    expect(Object.keys(d.contributions).sort()).toEqual(["u1", "u2"]);
    expect(dailyTreasuryBonus(d)).toEqual({ scrap: 800, energy: 400 });
  });
});

describe("v4.9 : diplomates", () => {
  const alliance = { id: "a1", createdBy: "f", members: ["f", "a", "b", "c"], roles: {} } as unknown as Alliance;
  it("2 diplomates au plus, droits de diplomatie", () => {
    let al = setRole(alliance, "f", "a", "diplomat");
    al = setRole(al, "f", "b", "diplomat");
    expect(() => setRole(al, "f", "c", "diplomat")).toThrow(/2 diplomates/);
    expect(allianceRole(al, "a")).toBe("diplomat");
    expect(canDiplomacy(allianceRole(al, "a"))).toBe(true);
    expect(canDiplomacy(allianceRole(al, "c"))).toBe(false);
    expect(() => setRole(al, "a", "c", "officer")).toThrow(/fondateur/);
    expect(allianceRole(setRole(al, "f", "a", "member"), "a")).toBe("member");
  });
});

describe("v4.9 : calendrier d'alliance", () => {
  it("rassemble boss, guerres, Gazette et vote du jour, triés par date", () => {
    const events = allianceCalendar({ allianceId: "a1", boss: null, wars: [{ attackerId: "a1", defenderTag: "ZZZ", attackerTag: "AAA", startMs: VOTING + 3600_000, endMs: VOTING + 86400_000 } as never], coalition: null, leviathan: null }, VOTING);
    const kinds = events.map((e) => e.kind);
    expect(kinds).toContain("boss");
    expect(kinds).toContain("war");
    expect(kinds).toContain("gazette");
    expect(kinds).toContain("daily");
    expect(events.map((e) => e.startMs)).toEqual([...events.map((e) => e.startMs)].sort((a, b) => a - b));
  });
});
