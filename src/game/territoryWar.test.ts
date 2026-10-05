import { describe, expect, it } from "vitest";
import { weekendWindow } from "@/game/events";
import {
  closeTerritoryWar,
  isTerritoryWarActive,
  nextTerritoryWar,
  normalizeTerritoryWar,
  openTerritoryWar,
  scoreHoldHour,
  scoreTerritoryWar,
  sectorLeaders,
  TERRITORY_WAR_RULES,
  territoryWarRewards,
  territoryWarStandings,
  territoryWarWindow,
  validateTerritoryWarRules,
} from "@/game/territoryWar";

const R = TERRITORY_WAR_RULES;
const HOUR = 3600_000;

/** Un samedi midi d'un week-end de guerre (semaine paire). */
function warSaturday(): number {
  const base = Date.UTC(2026, 9, 10, 10); // samedi 10 octobre 2026, 12 h à Paris
  const w = weekendWindow(base);
  return w.week % R.everyWeeks === R.weekOffset ? base : base + 7 * 24 * HOUR;
}

describe("guerre de territoire : calendrier", () => {
  it("ouvre un week-end sur deux, du vendredi 18 h au dimanche 22 h", () => {
    const sat = warSaturday();
    const win = territoryWarWindow(sat)!;
    expect(win).not.toBeNull();
    const w = weekendWindow(sat);
    expect(win.startMs).toBe(w.startMs);
    expect(win.endMs).toBe(w.endMs - 2 * HOUR);
    expect(territoryWarWindow(sat + 7 * 24 * HOUR)).toBeNull();
    expect(territoryWarWindow(win.endMs)).toBeNull();
    expect(territoryWarWindow(win.startMs - 1)).toBeNull();
  });

  it("annonce la prochaine guerre, ou celle en cours", () => {
    const sat = warSaturday();
    const win = territoryWarWindow(sat)!;
    expect(nextTerritoryWar(sat)).toEqual(win);
    expect(nextTerritoryWar(win.startMs - 3 * 24 * HOUR)).toEqual(win);
    const after = nextTerritoryWar(win.endMs + HOUR)!;
    expect(after.startMs).toBeGreaterThan(win.endMs);
    expect(Math.round((after.startMs - win.startMs) / (24 * HOUR))).toBe(14);
  });

  it("se désactive", () => {
    const off = { ...R, enabled: false };
    expect(territoryWarWindow(warSaturday(), off)).toBeNull();
    expect(nextTerritoryWar(warSaturday(), off)).toBeNull();
  });
});

describe("guerre de territoire : points par secteur", () => {
  const sat = warSaturday();
  const win = territoryWarWindow(sat)!;

  it("compte les points seulement pendant la guerre", () => {
    let s = openTerritoryWar(win);
    expect(isTerritoryWarActive(s, sat)).toBe(true);
    s = scoreTerritoryWar(s, { sector: 3, allianceId: "a", tag: "AAA", pts: 10, text: "x" }, sat);
    s = scoreTerritoryWar(s, { sector: 3, allianceId: "a", tag: "AAA", pts: 6, text: "y" }, sat);
    expect(s.points["3"].a).toBe(16);
    expect(s.feed).toHaveLength(2);
    const after = scoreTerritoryWar(s, { sector: 3, allianceId: "a", tag: "AAA", pts: 10, text: "z" }, win.endMs);
    expect(after).toBe(s);
    expect(scoreTerritoryWar(s, { sector: 99, allianceId: "a", tag: "AAA", pts: 10, text: "z" }, sat)).toBe(s);
    expect(scoreTerritoryWar(s, { sector: 1, allianceId: "", tag: "", pts: 10, text: "z" }, sat)).toBe(s);
  });

  it("donne les points de contrôle de l'heure aux alliances qui tiennent un secteur", () => {
    let s = openTerritoryWar(win);
    s = scoreHoldHour(s, [{ id: 0, allianceId: "a", tag: "AAA" }, { id: 1, allianceId: "" }, { id: 2, allianceId: "b", tag: "BBB" }], sat);
    expect(s.points["0"].a).toBe(R.points.holdPerHour);
    expect(s.points["1"]).toBeUndefined();
    expect(s.points["2"].b).toBe(R.points.holdPerHour);
    expect(s.tags).toEqual({ a: "AAA", b: "BBB" });
  });

  it("ne compte que les premiers combats entre deux mêmes joueurs", () => {
    let s = openTerritoryWar(win);
    for (let i = 0; i < 5; i++) s = scoreTerritoryWar(s, { sector: 4, allianceId: "a", tag: "A", pts: 6, text: "", pair: "u1>u2" }, sat);
    expect(s.points["4"].a).toBe(6 * R.maxPerPair);
    s = scoreTerritoryWar(s, { sector: 4, allianceId: "a", tag: "A", pts: 6, text: "", pair: "u1>u3" }, sat);
    expect(s.points["4"].a).toBe(6 * (R.maxPerPair + 1));
  });

  it("ne distribue le contrôle qu'une fois par heure", () => {
    let s = openTerritoryWar(win);
    s = scoreHoldHour(s, [{ id: 0, allianceId: "a", tag: "A" }], sat);
    s = scoreHoldHour(s, [{ id: 0, allianceId: "a", tag: "A" }], sat + 10 * 60_000);
    expect(s.points["0"].a).toBe(R.points.holdPerHour);
    s = scoreHoldHour(s, [{ id: 0, allianceId: "a", tag: "A" }], sat + HOUR);
    expect(s.points["0"].a).toBe(2 * R.points.holdPerHour);
  });

  it("garde le fil borné à 40 événements", () => {
    let s = openTerritoryWar(win);
    for (let i = 0; i < 60; i++) s = scoreTerritoryWar(s, { sector: i % 24, allianceId: "a", tag: "A", pts: 1, text: `${i}` }, sat);
    expect(s.feed).toHaveLength(40);
    expect(s.feed.at(-1)!.text).toBe("59");
  });

  it("désigne le meneur de chaque secteur (égalité : personne)", () => {
    let s = openTerritoryWar(win);
    s = scoreTerritoryWar(s, { sector: 0, allianceId: "a", tag: "A", pts: 10, text: "" }, sat);
    s = scoreTerritoryWar(s, { sector: 0, allianceId: "b", tag: "B", pts: 4, text: "" }, sat);
    s = scoreTerritoryWar(s, { sector: 1, allianceId: "a", tag: "A", pts: 6, text: "" }, sat);
    s = scoreTerritoryWar(s, { sector: 1, allianceId: "b", tag: "B", pts: 6, text: "" }, sat);
    s = scoreTerritoryWar(s, { sector: 2, allianceId: "b", tag: "B", pts: 5, text: "" }, sat);
    const l = sectorLeaders(s);
    expect(l).toHaveLength(24);
    expect(l[0]).toMatchObject({ allianceId: "a", tag: "A", points: 10, runnerUp: 4 });
    expect(l[1].allianceId).toBeNull();
    expect(l[2]).toMatchObject({ allianceId: "b", points: 5, runnerUp: 0 });
    expect(l[3]).toMatchObject({ allianceId: null, points: 0 });
    // Classement : secteurs menés d'abord (1 chacun), puis points (a 16, b 15).
    const st = territoryWarStandings(s);
    expect(st.map((r) => r.allianceId)).toEqual(["a", "b"]);
    expect(st[0]).toMatchObject({ sectors: [0], points: 16 });
  });
});

describe("guerre de territoire : clôture et récompenses", () => {
  it("clôt la guerre avec un classement figé", () => {
    const sat = warSaturday();
    let s = openTerritoryWar(territoryWarWindow(sat)!);
    s = scoreTerritoryWar(s, { sector: 5, allianceId: "a", tag: "A", pts: 10, text: "" }, sat);
    const c = closeTerritoryWar(s, sat + HOUR);
    expect(c.status).toBe("closed");
    expect(isTerritoryWarActive(c, sat + HOUR)).toBe(false);
    expect(c.results).toEqual([{ allianceId: "a", tag: "A", sectors: [5], points: 10 }]);
  });

  it("récompense selon les secteurs remportés, avec un titre pour la première alliance", () => {
    const rw = territoryWarRewards([
      { allianceId: "a", tag: "A", sectors: [0, 1, 2, 3, 4, 5, 6], points: 300 },
      { allianceId: "b", tag: "B", sectors: [7, 8], points: 90 },
      { allianceId: "c", tag: "C", sectors: [], points: 20 },
    ]);
    expect(rw.a).toEqual({ tokens: R.rewards.maxTokens + R.rewards.winnerTokens, title: R.rewards.winnerTitle, sectors: 7, rank: 1 });
    expect(rw.b).toEqual({ tokens: 2 * R.rewards.tokensPerSector, title: null, sectors: 2, rank: 2 });
    expect(rw.c).toBeUndefined();
  });
});

describe("guerre de territoire : lecture et réglages", () => {
  it("normalise l'état lu dans la configuration", () => {
    expect(normalizeTerritoryWar(null)).toBeNull();
    expect(normalizeTerritoryWar({ id: "x" })).toBeNull();
    const n = normalizeTerritoryWar({ id: "tw-1", startMs: 1, endMs: 2, status: "bizarre", feed: [{ t: 1 }, null] })!;
    expect(n).toMatchObject({ id: "tw-1", status: "active", points: {}, tags: {} });
    expect(n.feed).toHaveLength(1);
  });

  it("valide les réglages", () => {
    expect(validateTerritoryWarRules(R)).toEqual([]);
    expect(validateTerritoryWarRules({ everyWeeks: 0 })).toHaveLength(1);
    expect(validateTerritoryWarRules({ points: { ...R.points, pvpWin: -1 } })).toHaveLength(1);
    expect(validateTerritoryWarRules({ rewards: { ...R.rewards, maxTokens: -2 } })).toHaveLength(1);
  });
});
