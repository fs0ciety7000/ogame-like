import { describe, expect, it } from "vitest";
import { closeLeagues, leagueStandings, leagueTier, normalizeLeagues } from "@/game/leagues";

const S = "2026-10";
const entry = (uid: string, xp: number) => ({ uid, pseudo: uid, seasonId: S, seasonXp: xp });

describe("ligues", () => {
  it("normalise et place tout le monde en bronze par défaut", () => {
    const st = normalizeLeagues({ tiers: { a: "or", b: "inconnu" } });
    expect(leagueTier(st, "a")).toBe("or");
    expect(leagueTier(st, "b")).toBe("bronze");
    expect(leagueTier(st, "z")).toBe("bronze");
  });

  it("bronze : le premier cinquième monte, personne ne descend", () => {
    const entries = Array.from({ length: 10 }, (_, i) => entry(`p${i}`, 100 - i));
    const rows = leagueStandings(entries, normalizeLeagues({}), S, "bronze");
    expect(rows.filter((r) => r.zone === "up").map((r) => r.uid)).toEqual(["p0", "p1"]);
    expect(rows.some((r) => r.zone === "down")).toBe(false);
  });

  it("les inactifs descendent et ne sont pas récompensés", () => {
    const st = normalizeLeagues({ tiers: { a: "or", b: "or", c: "or", d: "or", e: "or" } });
    const entries = [entry("a", 50), entry("b", 40), entry("c", 30), entry("d", 20), entry("e", 0)];
    const { state, rewards } = closeLeagues(st, entries, S, "2026-11");
    expect(state.tiers.a).toBe("platine");
    expect(state.tiers.e).toBe("argent");
    expect(state.tiers.c).toBe("or");
    expect(state.seasonId).toBe("2026-11");
    expect(rewards.find((r) => r.uid === "e")).toBeUndefined();
    expect(rewards.find((r) => r.uid === "a")?.hours).toBe(3);
  });

  it("diamant ne monte plus", () => {
    const st = normalizeLeagues({ tiers: { a: "diamant" } });
    const rows = leagueStandings([entry("a", 10)], st, S, "diamant");
    expect(rows[0].zone).toBe("stay");
  });
});
