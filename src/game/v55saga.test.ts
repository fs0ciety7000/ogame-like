import { beforeEach, describe, expect, it } from "vitest";
import { applyGameContent } from "@/game/content";
import { defaultPlayerState } from "@/game/defaults";
import { addPassPoints } from "@/game/seasonPass";
import { ALLIANCE_SAGA_RULES, generateAllianceSaga, readAllianceSaga, sagaPoints, sagaStandings } from "@/game/allianceSaga";
import type { WorldDigest } from "@/game/procedural";
import type { PlayerState } from "@/types/game";

const NOW = Date.UTC(2026, 9, 10, 12);
const digest = (over: Partial<WorldDigest> = {}): WorldDigest => ({
  monthId: "2026-10",
  observedDays: 10,
  activePlayers: 12,
  weeklyMedian: { mission: 10, victory: 3, contract: 5, spy: 2, market: 1, bounty: 1, raidRepelled: 1 },
  totals: {},
  heroes: {},
  episodes: [],
  passMedianTier: 5,
  passTiers: 30,
  passFinishedShare: 0,
  chapterShare: 0,
  allianceSizeMedian: 4,
  ...over,
});
const member = (id: string): PlayerState => ({ ...defaultPlayerState(id, id), createdAt: NOW, lastActiveMs: NOW }) as PlayerState;

beforeEach(() => applyGameContent({}));

describe("v5.5 saga d'alliance", () => {
  it("trois objectifs communs, calibrés sur l'activité et la taille des alliances, reproductibles", () => {
    const a = generateAllianceSaga("2026-10", digest(), 1, NOW);
    expect({ ...generateAllianceSaga("2026-10", digest(), 1, NOW + 1000), generatedAtMs: NOW }).toEqual(a);
    expect(a.objectives).toHaveLength(ALLIANCE_SAGA_RULES.objectives);
    const mission = generateAllianceSaga("2026-10", digest({ weeklyMedian: { mission: 10, victory: 10, contract: 10, spy: 10, market: 10, bounty: 10, raidRepelled: 10, warlordWin: 10 } }), 1, NOW).objectives[0];
    expect(mission.count).toBe(Math.round(10 * ALLIANCE_SAGA_RULES.weeks * 4 * ALLIANCE_SAGA_RULES.share));
    expect(a.winnerTitle).toContain("octobre 2026");
  });

  it("classement : somme de l'activité du mois des membres, 100 points par objectif, plafond à 200", () => {
    const saga = { ...generateAllianceSaga("2026-10", digest(), 1, NOW), objectives: [{ type: "mission" as const, count: 10 }, { type: "victory" as const, count: 4 }, { type: "spy" as const, count: 5 }] };
    const a1 = member("a1"), a2 = member("a2"), b1 = member("b1");
    for (let i = 0; i < 6; i++) addPassPoints(a1, "mission", NOW);
    for (let i = 0; i < 6; i++) addPassPoints(a2, "mission", NOW);
    addPassPoints(b1, "victory", NOW, 20);
    const rows = sagaStandings(saga, [
      { id: "A", name: "Alpha", tag: "ALP", members: [a1, a2] },
      { id: "B", name: "Bravo", tag: "BRV", members: [b1] },
    ], NOW);
    expect(rows.map((r) => [r.allianceId, r.rank, r.points])).toEqual([["B", 1, 200], ["A", 2, 120]]);
    expect(sagaPoints(saga, [100, 0, 0])).toBe(200);
  });

  it("état illisible : valeurs vides", () => {
    expect(readAllianceSaga("x")).toEqual({ sagas: [], standing: null, closed: [] });
  });
});

describe("6.14.147 (AU28, AP-L6) : saga alignée sur le chapitre du mois", () => {
  const chapter = (archetype: string) => ({ auto: { archetype } as never, boss: { name: "Le Grand Brasier", title: "", image: "/assets/chronicles/auto/confrerie-boss-2.webp", emblem: "", fallbackImage: "", lore: "" } });

  it("faction, boss et image du chapitre ; tirage d'avant sans chapitre ou réglage décoché", () => {
    const s = generateAllianceSaga("2027-03", digest(), 1, NOW, { chapter: chapter("confrerie") });
    expect(s.bossName).toBe("Le Grand Brasier");
    expect(s.image).toBe("/assets/chronicles/auto/confrerie-boss-2.webp");
    expect(s.lore).toContain("le Grand Brasier");
    const free = generateAllianceSaga("2027-03", digest(), 1, NOW, { chapter: null });
    ALLIANCE_SAGA_RULES.followChapter = false;
    try {
      expect(generateAllianceSaga("2027-03", digest(), 1, NOW, { chapter: chapter("confrerie") })).toEqual(free);
    } finally {
      ALLIANCE_SAGA_RULES.followChapter = true;
    }
  });

  it("un titre ne revient pas avant noRepeatMonths mois ; objectifs inchangés", () => {
    const titles: string[] = [];
    for (let m = 1; m <= 24; m++) {
      const id = `2027-${String(((m - 1) % 12) + 1).padStart(2, "0")}${m > 12 ? "b" : ""}`;
      titles.push(generateAllianceSaga(id, digest(), 1, NOW, { chapter: null, recentTitles: titles }).title);
    }
    for (let i = 0; i < titles.length; i++) for (let k = 1; k <= ALLIANCE_SAGA_RULES.noRepeatMonths; k++) if (i - k >= 0) expect(titles[i], `mois ${i}`).not.toBe(titles[i - k]);
    const a = generateAllianceSaga("2027-03", digest(), 1, NOW, { chapter: null });
    const b = generateAllianceSaga("2027-03", digest(), 1, NOW, { chapter: null, recentTitles: [a.title] });
    expect(b.title).not.toBe(a.title);
    expect(b.objectives).toEqual(a.objectives);
  });
});
