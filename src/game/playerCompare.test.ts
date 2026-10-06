import { describe, expect, it } from "vitest";
import { compareRows, compareScore, type CompareSide } from "@/game/playerCompare";

const base: CompareSide = { xp: 100, seasonXp: 10, ascensions: 0, colonies: 0, victories: 3, defeats: 1, missions: 5, expeditions: 1, achievements: 2, titles: 0, warsWon: 0, bounties: 0, bossKills: 0, bestSeasonRank: null, seasonsPlayed: 0 };

describe("comparateur de joueurs", () => {
  it("désigne le meilleur, y compris quand moins c'est mieux", () => {
    const rows = compareRows({ ...base, defeats: 1, bestSeasonRank: 3 }, { ...base, xp: 200, defeats: 4, bestSeasonRank: 1 }, 0);
    const by = Object.fromEntries(rows.map((r) => [r.key, r.winner]));
    expect(by.xp).toBe("b");
    expect(by.defeats).toBe("a");
    expect(by.bestSeasonRank).toBe("b");
    expect(by.missions).toBe("tie");
  });
  it("ignore une ligne sans valeur des deux côtés", () => {
    const rows = compareRows(base, { ...base, victories: 0, defeats: 0 }, 0);
    expect(rows.find((r) => r.key === "winRate")?.winner).toBeNull();
    expect(rows.find((r) => r.key === "bestSeasonRank")?.winner).toBeNull();
  });
  it("compte les lignes gagnées", () => {
    const rows = compareRows(base, { ...base, xp: 1 }, 0);
    expect(compareScore(rows)).toEqual({ a: 1, b: 0 });
  });
});
