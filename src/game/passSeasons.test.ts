import { beforeEach, describe, expect, it } from "vitest";
import { applyGameContent, validateGameContent, currentGameContent } from "@/game/content";
import { activeLevels, assignCommanders, findCommander, recruitCommander, SEASON_SECONDARY_SHARE, commandersState, grantCommanderXp, xpForLevel } from "@/game/commanders";
import { activePass, addPassPoints, claimPassTier, passState, tierRequirements, trackActivity } from "@/game/seasonPass";
import { CHALLENGE_KEYS, challengeSize, generatePassSeason, generateTierChallenges, monthlyBudget, PASS_FINAL_AMBER, PASS_THEMES, publishPassSeason, upsertPassSeason, validatePassSeasons, type PassSeason } from "@/game/passSeasons";
import { bountyState } from "@/game/bounties";
import { defaultPlayerState } from "@/game/defaults";
import type { WorldDigest } from "@/game/procedural";
import type { PlayerState } from "@/types/game";

const NOV_10 = Date.UTC(2026, 10, 10, 12);

function digest(): WorldDigest {
  return {
    monthId: "2026-10",
    observedDays: 25,
    activePlayers: 20,
    weeklyMedian: { mission: 10, contract: 5, victory: 4, spy: 2, bounty: 2, raidRepelled: 1, bossAssault: 1, warlordWin: 0.2 },
    totals: {},
    heroes: {},
    episodes: [],
    passMedianTier: 18,
    passTiers: 30,
    passFinishedShare: 0.3,
    chapterShare: 0.4,
  };
}

const player = (uid = "p1") => ({ ...defaultPlayerState(uid, uid), createdAt: 0 }) as PlayerState;

beforeEach(() => applyGameContent({}));

describe("v5.13 passes de saison procéduraux", () => {
  it("écrit un brouillon complet, reproductible, avec commandant et Ambre au dernier palier", () => {
    const opts = { monthId: "2026-11", digest: digest(), existing: [], now: NOV_10 };
    const s = generatePassSeason(opts);
    expect(generatePassSeason(opts)).toEqual(s);
    expect(s.status).toBe("draft");
    expect(s.tiers).toHaveLength(30);
    expect(s.tiers[29]).toEqual([{ kind: "commander", id: "s-2026-11" }, { kind: "amber", amount: PASS_FINAL_AMBER }, { kind: "cosmetic" }]);
    expect(Object.keys(s.requirements)).toHaveLength(30);
    expect(s.scenario.milestones.map((m) => m.tier)).toEqual([0, 10, 20, 30]);
    expect(s.commander.primary).not.toBe(s.commander.secondary);
    expect(s.commander.prompt).toContain(s.commander.name);
    expect(validatePassSeasons({ seasons: [publishPassSeason(s, NOV_10)] })).toEqual([]);
    // Une autre variante change le tirage.
    expect(generatePassSeason({ ...opts, variant: 3 })).not.toEqual(s);
  });

  it("ne répète pas les trois derniers thèmes", () => {
    let seasons: PassSeason[] = [];
    for (const id of ["2026-11", "2026-12", "2027-01", "2027-02", "2027-03", "2027-04"]) {
      const s = generatePassSeason({ monthId: id, digest: digest(), existing: seasons, now: NOV_10 });
      expect(seasons.slice(-3).map((x) => x.theme.id)).not.toContain(s.theme.id);
      seasons = [...seasons, s];
    }
    expect(PASS_THEMES.length).toBeGreaterThanOrEqual(8);
  });

  it("v5.14.1 : un défi par palier, jamais le même, de plus en plus lourd, un mois d'activité par action", () => {
    let seed = 7;
    const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const d = { weeklyMedian: { victory: 6, contract: 10, mission: 12 } };
    const req = generateTierChallenges(rng, ["victory", "raidRepelled", "bounty"], d, 30);
    const sigs = new Set<string>();
    const last: Record<string, number> = {};
    const totals: Record<string, number> = {};
    for (let t = 1; t <= 30; t++) {
      const list = req[String(t)];
      expect(list).toHaveLength(challengeSize(t));
      // Actions jouables à la demande, distinctes dans le palier et différentes du palier précédent.
      for (const r of list) expect(CHALLENGE_KEYS).toContain(r.key);
      expect(new Set(list.map((r) => r.key)).size).toBe(list.length);
      if (t > 1) for (const r of list) expect(req[String(t - 1)].map((x) => x.key)).not.toContain(r.key);
      // Jamais deux fois le même défi ; une action qui revient ne demande jamais moins.
      const sig = list.map((r) => `${r.key}:${r.count}`).sort().join("|");
      expect(sigs.has(sig)).toBe(false);
      sigs.add(sig);
      for (const r of list) {
        expect(r.count).toBeGreaterThanOrEqual(last[r.key] ?? 1);
        last[r.key] = r.count;
        totals[r.key] = (totals[r.key] ?? 0) + r.count;
      }
    }
    expect(challengeSize(1)).toBe(1);
    expect(challengeSize(30)).toBe(3);
    // Contenu d'un mois : chaque action demande au moins un mois d'activité médiane.
    for (const k of CHALLENGE_KEYS) expect(totals[k]).toBeGreaterThanOrEqual(monthlyBudget(k, d) - 2);
    expect(monthlyBudget("victory", d)).toBe(26);
    // Les derniers paliers pèsent plus que les premiers.
    const weight = (t: number) => req[String(t)].reduce((a, r) => a + r.count, 0);
    expect(weight(29) + weight(30)).toBeGreaterThan(3 * (weight(1) + weight(2)));
  });

  it("publié : remplace le passe du mois, verrouille les paliers à prérequis et donne le commandant", () => {
    const s = publishPassSeason(generatePassSeason({ monthId: "2026-11", digest: digest(), existing: [], now: NOV_10 }), NOV_10);
    // Un brouillon ne s'applique pas.
    applyGameContent({ passSeasons: { seasons: [{ ...s, status: "draft" }] } });
    expect(activePass("2026-11").requirements).toBeUndefined();
    expect(findCommander(s.commander.id)).toBeUndefined();
    applyGameContent({ passSeasons: upsertPassSeason({ seasons: [] }, s) });
    expect(validateGameContent(currentGameContent())).toEqual([]);
    expect(activePass("2026-11").pointsPerTier).toBe(s.pointsPerTier);
    const def = findCommander(s.commander.id)!;
    expect(def.season?.seasonId).toBe("2026-11");
    expect(() => recruitCommander(player(), def.id, () => {}, "amber")).toThrow(/dernier palier/);

    const p = player();
    addPassPoints(p, "seasonBoss", NOV_10, 100);
    // v5.14.1 : un défi par palier, relevé un palier à la fois.
    const reqs = (t: number) => s.requirements[String(t)];
    const tierRequirementsOf = (t: number) => tierRequirements(p, t, NOV_10);
    expect(() => claimPassTier(p, 1, NOV_10)).toThrow(/verrouillé/);
    // Une action du palier 2 ne compte pas tant que le défi du palier 1 n'est pas relevé.
    const other = reqs(2).find((r) => !reqs(1).some((x) => x.key === r.key))!;
    trackActivity(p, other.key, NOV_10, 50);
    expect(passState(p, NOV_10).cleared ?? []).toEqual([]);
    expect(() => claimPassTier(p, 2, NOV_10)).toThrow(/paliers précédents/);
    for (let t = 1; t <= 30; t++) {
      // Le surplus ne passe pas au palier suivant : chaque palier repart de zéro.
      for (const r of reqs(t)) trackActivity(p, r.key, NOV_10, r.count + 5);
      expect(passState(p, NOV_10).cleared).toContain(t);
      if (t < 30) {
        const next = tierRequirementsOf(t + 1);
        expect(next?.status).toBe("active");
        expect(next?.reqs.every((r) => r.done === 0)).toBe(true);
        claimPassTier(p, t, NOV_10);
      }
    }
    const amber = bountyState(p).amber;
    const gained = claimPassTier(p, 30, NOV_10);
    expect(gained[0]).toContain(def.name);
    expect(bountyState(p).amber).toBe(amber + PASS_FINAL_AMBER);
    expect(commandersState(p).roster[def.id]).toBeDefined();
    expect(passState(p, NOV_10).claimed).toHaveLength(30);
  });

  it("commandant de saison : bonus du rôle principal, moitié du second, XP du rôle principal", () => {
    const s = publishPassSeason(generatePassSeason({ monthId: "2026-11", digest: digest(), existing: [], now: NOV_10 }), NOV_10);
    applyGameContent({ passSeasons: { seasons: [s] } });
    const p = player();
    p.commanders = { roster: { [s.commander.id]: { xp: xpForLevel(10) } }, active: [], movedAtMs: {}, dossiers: 0 } as never;
    assignCommanders(p, [s.commander.id], NOV_10);
    const lv = activeLevels(p);
    expect(lv[s.commander.primary]).toBe(10);
    expect(lv[s.commander.secondary]).toBe(10 * SEASON_SECONDARY_SHARE);
    grantCommanderXp(p, s.commander.primary, 50);
    expect(commandersState(p).roster[s.commander.id].xp).toBe(xpForLevel(10) + 50);
    // Le passe retiré du catalogue : l'officier reste dans l'état-major (sans effet) jusqu'à son retour.
    applyGameContent({});
    expect(commandersState(p).roster[s.commander.id]).toBeDefined();
    expect(activeLevels(p)[s.commander.primary]).toBe(0);
  });
});
