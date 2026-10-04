import { describe, expect, it } from "vitest";
import {
  applyXpDelta,
  currentSeasonId,
  ensureSeasonRollover,
  performSeasonReward,
  previousSeasonId,
  seasonEndMs,
  seasonLabel,
  seasonMonthPhrase,
  seasonRewardFor,
  seasonStandings,
  setActiveTitle,
} from "@/game/seasons";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

const JAN_15_2026 = Date.UTC(2026, 0, 15);
const FEB_1_2026 = Date.UTC(2026, 1, 1);

function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return { ...defaultPlayerState("u1", "Testeur"), ...overrides };
}

describe("currentSeasonId", () => {
  it("formats as YYYY-MM in UTC", () => {
    expect(currentSeasonId(JAN_15_2026)).toBe("2026-01");
    expect(currentSeasonId(FEB_1_2026)).toBe("2026-02");
  });
});

describe("seasonLabel", () => {
  it("renders a human-readable month + year", () => {
    expect(seasonLabel("2026-01")).toBe("Janvier 2026");
    expect(seasonLabel("2026-09")).toBe("Septembre 2026");
  });
});

describe("ensureSeasonRollover", () => {
  it("resets seasonXp when the season changed since the last flush", () => {
    const player = makePlayer({ seasonId: "2025-12", seasonXp: 500 });
    ensureSeasonRollover(player, JAN_15_2026);
    expect(player.seasonId).toBe("2026-01");
    expect(player.seasonXp).toBe(0);
  });

  it("leaves seasonXp untouched within the same season", () => {
    const player = makePlayer({ seasonId: "2026-01", seasonXp: 500 });
    ensureSeasonRollover(player, JAN_15_2026);
    expect(player.seasonXp).toBe(500);
  });
});

describe("applyXpDelta", () => {
  it("increases both the total and the seasonal counters together", () => {
    const player = makePlayer({ xp: 100, seasonId: "2026-01", seasonXp: 100 });
    applyXpDelta(player, 40, JAN_15_2026);
    expect(player.xp).toBe(140);
    expect(player.seasonXp).toBe(140);
  });

  it("never lets either counter go below zero", () => {
    const player = makePlayer({ xp: 10, seasonId: "2026-01", seasonXp: 10 });
    applyXpDelta(player, -50, JAN_15_2026);
    expect(player.xp).toBe(0);
    expect(player.seasonXp).toBe(0);
  });

  it("starts the new season fresh even if the delta is negative", () => {
    const player = makePlayer({ xp: 1000, seasonId: "2025-12", seasonXp: 300 });
    applyXpDelta(player, -20, FEB_1_2026);
    expect(player.seasonId).toBe("2026-02");
    expect(player.xp).toBe(980);
    expect(player.seasonXp).toBe(0);
  });
});

describe("season closing (v1.8)", () => {
  it("keeps the final score when the season rolls over", () => {
    const player = makePlayer({ seasonId: "2025-12", seasonXp: 420 });
    ensureSeasonRollover(player, JAN_15_2026);
    expect(player.lastSeasonId).toBe("2025-12");
    expect(player.lastSeasonXp).toBe(420);
    expect(previousSeasonId(JAN_15_2026)).toBe("2025-12");
    expect(seasonEndMs(JAN_15_2026)).toBe(FEB_1_2026);
  });

  it("ranks by season XP, including players who already rolled over", () => {
    const standings = seasonStandings(
      [
        { uid: "a", pseudo: "A", seasonId: "2025-12", seasonXp: 100, xp: 5 },
        { uid: "b", pseudo: "B", seasonId: "2026-01", seasonXp: 3, lastSeasonId: "2025-12", lastSeasonXp: 300 },
        { uid: "c", pseudo: "C", seasonId: "2025-11", seasonXp: 999 },
        { uid: "d", pseudo: "D", seasonId: "2025-12", seasonXp: 100, xp: 50 },
        { uid: "e", pseudo: "E", seasonId: "2025-12", seasonXp: 0 },
      ],
      "2025-12",
    );
    expect(standings.map((s) => `${s.rank}:${s.uid}`)).toEqual(["1:b", "2:d", "3:a"]);
  });

  it("5.15.4 : champion, 2e-3e au prorata de l'XP, participation pour chaque joueur actif", () => {
    const standings = [
      { rank: 1, seasonXp: 5000 },
      { rank: 2, seasonXp: 3000 },
      { rank: 3, seasonXp: 1000 },
      { rank: 4, seasonXp: 150 },
      { rank: 5, seasonXp: 50 },
    ];
    // 1er : champion + participation.
    expect(seasonRewardFor(1, 5000, "2026-10", standings)).toMatchObject({ title: "Champion du mois d'octobre 2026", tokens: 65, amber: 235, common: 510_000_000 });
    // 2e : 3/4 du lot du podium (3000 / 4000), 3e : 1/4, + participation.
    expect(seasonRewardFor(2, 3000, "2026-10", standings)).toMatchObject({ title: "", tokens: 15 + 37, amber: 35 + 75, common: 10_000_000 + 37_500_000 });
    expect(seasonRewardFor(3, 1000, "2026-11", standings)).toMatchObject({ tokens: 15 + 12, amber: 35 + 25, common: 10_000_000 + 12_500_000 });
    // 4e : participation seulement ; sous le seuil : rien.
    expect(seasonRewardFor(4, 150, "2026-10", standings)).toMatchObject({ tokens: 15, amber: 35, common: 10_000_000, title: "" });
    expect(seasonRewardFor(5, 50, "2026-10", standings)).toBeNull();
    expect(seasonMonthPhrase("2026-11")).toBe("de novembre 2026");
    expect(seasonMonthPhrase("2026-04")).toBe("d'avril 2026");
  });

  it("verse jetons, Ambre, ressources communes et le titre", () => {
    const now = JAN_15_2026;
    const player = makePlayer({ resourcesUpdatedAtMs: now, seasonId: "2026-01" });
    const scrap = player.resources.scrap ?? 0;
    const rare = player.resources.reinforcedSteel ?? 0;
    const reward = seasonRewardFor(1, 800, "2025-12", [{ rank: 1, seasonXp: 800 }])!;
    const out = performSeasonReward(player, defaultQueues(), { seasonId: "2025-12", rank: 1, seasonXp: 800 }, reward, now);
    expect(out.player.resources.scrap).toBeGreaterThanOrEqual(scrap + 510_000_000);
    expect(out.player.resources.reinforcedSteel).toBe(rare);
    expect(out.player.casino?.tokens).toBe(65);
    expect(out.player.bounties?.amber).toBe(235);
    expect(out.player.activeTitle).toBe("Champion du mois de décembre 2025");
    expect(out.notifications.at(-1)?.message).toMatch(/65 jetons du casino, 235 Ambre, .* ressources et le titre/);
    expect(() => setActiveTitle(out.player, "Roi du monde")).toThrow();
    setActiveTitle(out.player, "");
    expect(out.player.activeTitle).toBe("");
  });

  it("récompense d'alliance (heures de production) : titre « de Mois Année » inchangé", () => {
    const now = JAN_15_2026;
    const out = performSeasonReward(makePlayer({ resourcesUpdatedAtMs: now }), defaultQueues(), { seasonId: "2025-12", rank: 1, seasonXp: 800 }, { hours: 4, rare: 0, title: "Alliance championne" }, now);
    expect(out.player.titles?.at(-1)?.label).toBe("Alliance championne de Décembre 2025");
    expect(out.gained.scrap).toBeGreaterThan(0);
  });
});
