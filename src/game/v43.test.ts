import { afterEach, describe, expect, it } from "vitest";
import { defaultPlayerState } from "@/game/defaults";
import {
  bossEmblems,
  chronicleOf,
  chronicleState,
  claimChronicle,
  grantSeasonBossReward,
  recordChronicle,
  SEASON_BOSS_RULES,
  seasonBossSchedule,
  seasonBossWindow,
  spawnSeasonBoss,
  unlockedEpisodes,
} from "@/game/chronicles";
import { bossWindows } from "@/game/events";
import { leviathanSchedule } from "@/game/leviathan";

/** v5.14.2 : le rendez-vous mensuel d'avant l'alternance (repli quand elle est décochée). */
function monthly<T>(fn: () => T): T {
  // 6.7 : `weekday: null` garde l'ancien rythme (vendredi du week-end choisi) ; le mardi est testé dans calendrier67.test.ts.
  const saved = { alternate: SEASON_BOSS_RULES.alternate, durationHours: SEASON_BOSS_RULES.durationHours, weekday: SEASON_BOSS_RULES.weekday };
  Object.assign(SEASON_BOSS_RULES, { alternate: false, durationHours: 53, weekday: null });
  try {
    return fn();
  } finally {
    Object.assign(SEASON_BOSS_RULES, saved);
  }
}
import { addPassPoints, defaultSeasonPassConfig, PASS_POINTS, PASS_RULES, PASS_TIERS, passState, setSeasonPass } from "@/game/seasonPass";
import { emblemOptions } from "@/game/profile";
import { performPlayerAction } from "@/game/actions";
import { defaultQueues } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

// Mardi 13 octobre 2026, midi à Paris : épisodes 1 et 2 ouverts.
const OCT13 = Date.UTC(2026, 9, 13, 10);

function player(uid = "u1"): PlayerState {
  const p = defaultPlayerState(uid, uid) as PlayerState;
  p.createdAtMs = OCT13 - 30 * 86400_000;
  p.resourcesUpdatedAtMs = OCT13;
  return p;
}

describe("v4.3 chronicles", () => {
  it("one episode a week (1st, 8th, 15th, 22nd), three months written", () => {
    expect(chronicleOf(OCT13)?.title).toBe("La Liste");
    expect(chronicleOf(Date.UTC(2026, 11, 3))?.title).toBe("Le Silence d'hiver");
    expect(chronicleOf(Date.UTC(2027, 0, 3))?.title).toBe("Le Dégel");
    expect(chronicleOf(Date.UTC(2027, 3, 3))).toBeNull();
    expect(unlockedEpisodes(Date.UTC(2026, 9, 2, 10))).toBe(1);
    expect(unlockedEpisodes(OCT13)).toBe(2);
    expect(unlockedEpisodes(Date.UTC(2026, 9, 22, 10))).toBe(4);
  });

  it("actions count for open episodes only, through the pass sources too", () => {
    const p = player();
    recordChronicle(p, "spy", OCT13, 2);
    // Épisode 2 : « Gagne 3 combats » — compté via les points de passe.
    addPassPoints(p, "victory", OCT13, 5);
    // Épisode 4 (contrats) pas encore ouvert : rien.
    addPassPoints(p, "contract", OCT13, 4);
    const st = chronicleState(p, OCT13);
    expect(st.progress).toEqual([2, 3, 0, 0]);
    expect(() => claimChronicle(p, 0, OCT13)).toThrow(/pas encore atteint/);
    expect(() => claimChronicle(p, 3, OCT13)).toThrow(/pas encore ouvert/);
    const before = passState(p, OCT13).points;
    claimChronicle(p, 1, OCT13);
    expect(passState(p, OCT13).points).toBe(before + PASS_POINTS.chronicle);
    expect(() => claimChronicle(p, 1, OCT13)).toThrow(/déjà/);
    // Action de jeu côté serveur.
    recordChronicle(p, "spy", OCT13, 1);
    performPlayerAction(p, defaultQueues(), { type: "chronicleClaim", episode: 0 }, OCT13);
    // Nouveau mois : remis à zéro, les sceaux gardés.
    p.chronicle = { ...chronicleState(p, OCT13), emblems: ["2026-10"] };
    expect(chronicleState(p, Date.UTC(2026, 10, 2)).progress).toEqual([0, 0, 0, 0]);
    expect(chronicleState(p, Date.UTC(2026, 10, 2)).emblems).toEqual(["2026-10"]);
  });

  it("season boss (monthly fallback): last weekend of the month, Friday 18:00 to Sunday 23:00 (Paris)", () => monthly(() => {
    const w = seasonBossWindow(Date.UTC(2026, 9, 30, 20), false)!;
    expect(w.monthId).toBe("2026-10");
    expect(new Date(w.startMs).toISOString()).toBe("2026-10-30T17:00:00.000Z");
    expect(new Date(w.endMs).toISOString()).toBe("2026-11-01T22:00:00.000Z");
    expect(seasonBossWindow(OCT13, false)).toBeNull();
    expect(seasonBossWindow(OCT13, true)?.startMs).toBe(w.startMs);
    // Pas de chronique en avril 2027 : pas de boss.
    expect(seasonBossWindow(Date.UTC(2027, 3, 30, 20), false)).toBeNull();
  }));

  it("v5.14.2 : season boss every week, alternating with the world boss, never at the same time", () => {
    const now = Date.UTC(2026, 9, 5);
    const world = bossWindows(now, leviathanSchedule(), 12);
    const season = bossWindows(now, seasonBossSchedule(), 12);
    expect(season.length).toBeGreaterThanOrEqual(8);
    for (const s of season) {
      expect(s.endMs - s.startMs).toBe(48 * 3600_000);
      for (const w of world) expect(s.endMs <= w.startMs || s.startMs >= w.endMs).toBe(true);
    }
    // Un combat par apparition : identifiants distincts.
    const ids = new Set(season.slice(0, 6).map((s) => seasonBossWindow(s.startMs + 1000, false)?.id));
    expect(ids.size).toBe(6);
  });

  it("rewards: pass points for all, title and unique sceau if killed, epic relic for the podium", () => monthly(() => {
    const w = seasonBossWindow(Date.UTC(2026, 9, 30, 20), false)!;
    const state = spawnSeasonBoss(w, []);
    const players = ["a", "b", "c", "d"].map((uid) => player(uid));
    const contributions = Object.fromEntries(players.map((p, i) => [p.uid, { pseudo: p.uid, damage: 1000 - i * 100, assaults: 1, lastLaunchMs: w.startMs }]));
    const now = Date.UTC(2026, 9, 31, 12);
    const failed = grantSeasonBossReward({ ...state, contributions, status: "failed" }, players[0], now);
    expect(failed).toMatchObject({ points: PASS_POINTS.seasonBoss, title: null, emblem: false });
    const killed = { ...state, contributions, status: "killed" as const };
    const top = grantSeasonBossReward(killed, players[1], now, () => 0.1);
    expect(top.title).toBe("Pourfendeur du Vaisseau-Liste");
    expect(top.relic).toBeTruthy();
    expect(players[1].relics?.items[0].rarity).toMatch(/epic|legendary/);
    const fourth = grantSeasonBossReward(killed, players[3], now);
    expect(fourth.relic).toBeUndefined();
    expect(bossEmblems(players[3]).find((b) => b.id === "boss:2026-10")?.unlocked).toBe(true);
    expect(emblemOptions(players[3]).find((o) => o.id === "boss:2026-10")?.unlocked).toBe(true);
    expect(grantSeasonBossReward(killed, player("nobody"), now).points).toBe(0);
  }));
});

describe("v4.3 admin-editable pass", () => {
  afterEach(() => setSeasonPass(null));

  it("tiers and points come from the content section", () => {
    setSeasonPass({ points: { ...defaultSeasonPassConfig().points, contract: 25 }, tiers: [[{ kind: "amber", amount: 5 }], [{ kind: "cosmetic" }]] });
    expect(PASS_POINTS.contract).toBe(25);
    expect(PASS_TIERS).toHaveLength(2);
    expect(PASS_RULES.tiers).toBe(2);
    setSeasonPass(null);
    expect(PASS_TIERS).toHaveLength(30);
    expect(PASS_POINTS.contract).toBe(10);
  });
});
