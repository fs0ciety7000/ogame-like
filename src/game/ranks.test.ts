import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_RANKS, getRank, getRankIndex, getRankLabel, getRankProgress, RANKS, setRanks, validateRanks } from "@/game/ranks";
import { applyGameContent, defaultGameContent, validateGameContent } from "@/game/content";

describe("rangs (v2.2)", () => {
  afterEach(() => setRanks(structuredClone(DEFAULT_RANKS)));

  it("has 28 ranks from 0 to 420 000 XP, strictly increasing", () => {
    expect(RANKS).toHaveLength(28);
    expect(RANKS[0]).toMatchObject({ id: "non_classe", xp: 0 });
    expect(RANKS.at(-1)).toMatchObject({ id: "elite", xp: 420_000 });
    RANKS.slice(1).forEach((r, i) => expect(r.xp).toBeGreaterThan(RANKS[i].xp));
    expect(validateRanks(DEFAULT_RANKS)).toEqual([]);
  });

  it("maps XP to ranks", () => {
    expect(getRankLabel(0)).toBe("Non classé");
    expect(getRankLabel(99)).toBe("Non classé");
    expect(getRankLabel(100)).toBe("Fer III");
    expect(getRankLabel(6_918)).toBe("Argent I");
    expect(getRankLabel(240_000)).toBe("Grand Maître");
    expect(getRankLabel(10_000_000)).toBe("Élite");
    expect(getRank(1_500)).toMatchObject({ family: "Bronze", image: "/assets/ranks/bronze2.webp" });
    expect(getRankProgress(3_600)).toMatchObject({ current: "Argent III", next: "Argent II", nextXp: 4_200, percent: 50 });
    expect(getRankProgress(500_000)).toMatchObject({ next: null, percent: 100 });
  });

  it("is editable as game content, sorted by XP", () => {
    const content = defaultGameContent();
    applyGameContent({ ranks: [content.ranks[2], { ...content.ranks[0] }, { ...content.ranks[1], xp: 50 }] });
    expect(RANKS.map((r) => r.id)).toEqual(["non_classe", "fer3", "fer2"]);
    expect(getRankIndex(60)).toBe(1);
    applyGameContent({});
    expect(RANKS).toHaveLength(28);
  });

  it("rejects invalid ranks", () => {
    const bad = [{ ...DEFAULT_RANKS[1], id: "Bad Id" }, { ...DEFAULT_RANKS[2], xp: 100 }];
    const errors = validateRanks(bad);
    expect(errors.some((e) => e.includes("invalide"))).toBe(true);
    expect(errors.some((e) => e.includes("0 XP"))).toBe(true);
    expect(errors.some((e) => e.includes("même XP"))).toBe(true);
    expect(validateGameContent({ ...defaultGameContent(), ranks: bad }).length).toBeGreaterThan(0);
  });
});
