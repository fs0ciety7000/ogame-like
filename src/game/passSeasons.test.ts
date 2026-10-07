import { beforeEach, describe, expect, it } from "vitest";
import { applyGameContent, validateGameContent, currentGameContent } from "@/game/content";
import { activeLevels, assignCommanders, findCommander, recruitCommander, OFFICER_TUNING_RULES, commandersState, grantCommanderXp, xpForLevel } from "@/game/commanders";
import { activePass, addPassPoints, claimPassTier, passState, tierRequirements, trackActivity } from "@/game/seasonPass";
import { CHALLENGE_KEYS, challengeSize, hasFullChallenges, regenerateChallenges, generatePassSeason, generateTierChallenges, monthlyBudget, PASS_REWARD_RULES, PASS_THEMES, publishPassSeason, upsertPassSeason, validatePassSeasons, type PassSeason } from "@/game/passSeasons";
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
    expect(s.tiers[29]).toEqual([{ kind: "commander", id: "s-2026-11" }, { kind: "amber", amount: PASS_REWARD_RULES.finalAmber }, { kind: "cosmetic" }]);
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
    // 6.14.58 (Q-AP3) : sur un serveur mesuré, une action de médiane nulle n'entre plus dans les défis : toutes sont mesurées ici.
    const d = { weeklyMedian: { victory: 6, contract: 10, mission: 12, spy: 3, market: 3, bounty: 2 } };
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
    for (const k of CHALLENGE_KEYS.filter((x) => x !== "warlordWin")) expect(totals[k]).toBeGreaterThanOrEqual(monthlyBudget(k, d) - 2);
    // Personne ne bat de seigneur de guerre : pas de défi qui en demande.
    expect(totals.warlordWin).toBeUndefined();
    const withWarlords = generateTierChallenges(rng, ["victory"], { weeklyMedian: { ...d.weeklyMedian, warlordWin: 1 } }, 30);
    expect(Object.values(withWarlords).flat().some((r) => r.key === "warlordWin")).toBe(true);
    expect(monthlyBudget("victory", d)).toBe(26);
    // Les derniers paliers pèsent plus que les premiers.
    const weight = (t: number) => req[String(t)].reduce((a, r) => a + r.count, 0);
    expect(weight(29) + weight(30)).toBeGreaterThan(3 * (weight(1) + weight(2)));
  });

  it("v5.14.2 : un ancien passe (prérequis aux paliers 10, 20, 30) reçoit un défi par palier, le reste inchangé", () => {
    const s = generatePassSeason({ monthId: "2026-11", digest: digest(), existing: [], now: NOV_10 });
    const old = { ...s, requirements: { "10": { key: "victory", count: 3 }, "20": { key: "bounty", count: 4 }, "30": { key: "contract", count: 9 } } } as unknown as PassSeason;
    expect(hasFullChallenges(old)).toBe(false);
    const next = regenerateChallenges(old, digest());
    expect(hasFullChallenges(next)).toBe(true);
    expect({ ...next, requirements: undefined }).toEqual({ ...old, requirements: undefined });
    expect(CHALLENGE_KEYS).not.toContain("mission");
    expect(Object.values(next.requirements).flat().some((r) => r.key === "mission")).toBe(false);
  });

  it("5.15.4 : défis cumulés (totaux du mois) : une action compte pour tous les paliers, toujours dans l'ordre", () => {
    const s = publishPassSeason(generatePassSeason({ monthId: "2026-11", digest: digest(), existing: [], now: NOV_10 }), NOV_10);
    expect(s.challengeMode).toBe("cumulative");
    applyGameContent({ passSeasons: { seasons: [s] } });
    const p = player();
    addPassPoints(p, "seasonBoss", NOV_10, 100);
    // Seuils d'une même action jamais en baisse.
    const last: Record<string, number> = {};
    for (let t = 1; t <= 30; t++)
      for (const r of s.requirements[String(t)]) {
        expect(r.count).toBeGreaterThanOrEqual(last[r.key] ?? 1);
        last[r.key] = r.count;
      }
    // Toutes les actions du mois d'un coup : tous les paliers relevés, rien n'est perdu.
    const max: Record<string, number> = {};
    Object.values(s.requirements).flat().forEach((r) => (max[r.key] = Math.max(max[r.key] ?? 0, r.count)));
    // Rien que l'action du palier 1 : le palier 1 tombe, pas plus loin que là où une autre action manque.
    trackActivity(p, s.requirements["1"][0].key, NOV_10, s.requirements["1"][0].count);
    expect(tierRequirements(p, 1, NOV_10)?.status).toBe("cleared");
    for (const [k, n] of Object.entries(max)) trackActivity(p, k, NOV_10, n);
    for (let t = 1; t <= 30; t++) expect(tierRequirements(p, t, NOV_10)?.status).toBe("cleared");
    for (let t = 1; t <= 30; t++) claimPassTier(p, t, NOV_10);
    expect(passState(p, NOV_10).claimed).toHaveLength(30);
  });

  it("publié : remplace le passe du mois, verrouille les paliers à prérequis et donne le commandant", () => {
    // Passe à l'ancien format (un palier à la fois, compteur remis à zéro) : celui d'octobre 2026.
    const s = { ...publishPassSeason(generatePassSeason({ monthId: "2026-11", digest: digest(), existing: [], now: NOV_10 }), NOV_10), challengeMode: undefined };
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
    expect(bountyState(p).amber).toBe(amber + PASS_REWARD_RULES.finalAmber);
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
    expect(lv[s.commander.secondary]).toBe(10 * OFFICER_TUNING_RULES.seasonSecondaryShare);
    grantCommanderXp(p, s.commander.primary, 50);
    expect(commandersState(p).roster[s.commander.id].xp).toBe(xpForLevel(10) + 50);
    // Le passe retiré du catalogue : l'officier reste dans l'état-major (sans effet) jusqu'à son retour.
    applyGameContent({});
    expect(commandersState(p).roster[s.commander.id]).toBeDefined();
    expect(activeLevels(p)[s.commander.primary]).toBe(0);
  });
});
