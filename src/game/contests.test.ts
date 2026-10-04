import { describe, expect, it } from "vitest";
import { defaultPlayerState } from "@/game/defaults";
import { contestPhase, contestPrizes, contestPurse, contestScore, normalizeContests, pruneContests, refreshContest, validateContest, type Contest } from "@/game/contests";
import type { PlayerState } from "@/types/game";

const NOW = Date.UTC(2026, 9, 10, 12);
const H = 3600_000;

function player(uid: string, victories: number): PlayerState {
  const p = { ...defaultPlayerState(uid, uid), createdAt: null } as unknown as PlayerState;
  p.uid = uid;
  p.pseudo = uid.toUpperCase();
  p.victories = victories;
  return p;
}

const base = (patch: Partial<Contest> = {}): Contest => ({
  id: "c1",
  title: "Les conquérants",
  description: "",
  metric: "victories",
  startMs: NOW - H,
  endMs: NOW + 24 * H,
  potShare: 0.5,
  places: [0.5, 0.3, 0.2],
  status: "running",
  baselines: {},
  standings: [],
  updatedAtMs: 0,
  ...patch,
});

describe("concours du pot commun (v5.10.5)", () => {
  it("validation", () => {
    expect(validateContest(base(), NOW)).toEqual([]);
    expect(validateContest(base({ title: " ", endMs: NOW - 1, potShare: 0.95, places: [0.7, 0.5] }), NOW)).toHaveLength(4);
  });

  it("score = progression depuis la valeur de départ ; classement relevé", () => {
    let c = refreshContest(base(), [player("a", 10), player("b", 4)], NOW);
    expect(c.baselines).toEqual({ a: 10, b: 4 });
    expect(c.standings).toEqual([]);
    c = refreshContest(c, [player("a", 13), player("b", 9), player("c", 50)], NOW + H);
    expect(contestScore(c, player("a", 13))).toBe(3);
    expect(c.standings.map((s) => [s.uid, s.score])).toEqual([
      ["b", 5],
      ["a", 3],
    ]);
    expect(c.baselines.c).toBe(50);
  });

  it("prix : part du pot répartie entre les places", () => {
    const c = base({ standings: [{ uid: "b", pseudo: "B", score: 5 }, { uid: "a", pseudo: "A", score: 3 }] });
    const purse = contestPurse(c, { resources: { scrap: 1000, energy: 10 } });
    expect(purse).toEqual({ scrap: 500, energy: 5 });
    expect(contestPrizes(c, purse)).toEqual([
      { uid: "b", pseudo: "B", rank: 1, score: 5, resources: { scrap: 250, energy: 2 } },
      { uid: "a", pseudo: "A", rank: 2, score: 3, resources: { scrap: 150, energy: 1 } },
    ]);
  });

  it("phases, normalisation et ménage", () => {
    expect(contestPhase(base({ status: "scheduled", startMs: NOW + H }), NOW)).toBe("scheduled");
    expect(contestPhase(base(), NOW + 25 * H)).toBe("ending");
    expect(normalizeContests({ list: [base(), { id: "x", metric: "inconnu" }] }).list).toHaveLength(1);
    const many = Array.from({ length: 30 }, (_, i) => base({ id: `d${i}`, status: "done", endMs: NOW - i * H }));
    expect(pruneContests([base({ id: "open" }), ...many])[0].id).toBe("open");
    expect(pruneContests([base({ id: "open" }), ...many])).toHaveLength(20);
  });
});
