import { describe, expect, it } from "vitest";
import { championTitle, grantLeagueTitle, leagueStandings, leagueTick, leagueTier, leagueWeekId, leagueWeekLabel, normalizeLeagues, placementTiers, weeklyScore, type LeagueState } from "@/game/leagues";
import type { PlayerState } from "@/types/game";

// Mardi 6 octobre 2026 (UTC) : semaine du lundi 5 octobre.
const TUE = Date.UTC(2026, 9, 6, 12);
const NEXT_MON = Date.UTC(2026, 9, 12, 0, 30);
const entry = (uid: string, xp: number) => ({ uid, pseudo: uid, xp });

describe("divisions du classement de saison", () => {
  it("semaine : lundi 0 h UTC", () => {
    expect(leagueWeekId(TUE)).toBe("2026-10-05");
    expect(leagueWeekId(Date.UTC(2026, 9, 5, 0, 0))).toBe("2026-10-05");
    expect(leagueWeekId(Date.UTC(2026, 9, 4, 23, 59))).toBe("2026-09-28");
    expect(leagueWeekLabel("2026-10-05")).toBe("semaine du 5 oct.");
  });

  it("les anciennes ligues mensuelles repartent de zéro", () => {
    const st = normalizeLeagues({ seasonId: "2026-09", tiers: { a: "or" } });
    expect(st.weekId).toBe("");
    expect(st.tiers).toEqual({});
  });

  it("placement d'entrée par puissance (XP totale), seigneurs exclus", () => {
    const entries = Array.from({ length: 20 }, (_, i) => entry(`p${i}`, 1000 - i * 10));
    const tiers = placementTiers([...entries, { uid: "npc", pseudo: "Seigneur", xp: 999999, npc: "varan" }]);
    expect(tiers.npc).toBeUndefined();
    expect(tiers.p0).toBe("mythique");
    expect(tiers.p1).toBe("diamant");
    expect(tiers.p19).toBe("bronze");
    const counts = Object.values(tiers).reduce<Record<string, number>>((m, t) => ((m[t] = (m[t] ?? 0) + 1), m), {});
    expect(counts).toEqual({ mythique: 1, diamant: 2, platine: 3, or: 4, argent: 5, bronze: 5 });
  });

  it("petit serveur : pas de promotion gratuite, sans XP on démarre en Bronze", () => {
    const tiers = placementTiers([entry("a", 5000), entry("b", 128), entry("c", 0)]);
    expect(tiers.c).toBe("bronze");
    expect(tiers.a).toBe("platine");
    expect(tiers.b).toBe("or");
  });

  it("premier passage : tout le monde est placé et l'XP de départ notée", () => {
    const entries = [entry("a", 500), entry("b", 100)];
    const { state, rewards } = leagueTick(normalizeLeagues(null), entries, TUE);
    expect(state.weekId).toBe("2026-10-05");
    expect(state.base).toEqual({ a: 500, b: 100 });
    expect(leagueTier(state, "a")).toBe("platine");
    expect(rewards).toEqual([]);
    expect(weeklyScore(state, entry("a", 650))).toBe(150);
  });

  it("en cours de semaine : un nouveau venu est placé sans fausser son score", () => {
    const first = leagueTick(normalizeLeagues(null), [entry("a", 500)], TUE).state;
    const { state } = leagueTick(first, [entry("a", 600), entry("z", 10_000)], TUE + 3600_000);
    expect(state.tiers.z).toBeDefined();
    expect(weeklyScore(state, entry("z", 10_000))).toBe(0);
    expect(weeklyScore(state, entry("a", 600))).toBe(100);
  });

  it("clôture du lundi : montées, descentes, inactifs, jetons et titre du premier", () => {
    const st: LeagueState = { version: 2, weekId: "2026-10-05", tiers: { a: "or", b: "or", c: "or", d: "or", e: "or" }, base: { a: 0, b: 0, c: 0, d: 0, e: 0 }, last: null, history: {} };
    const entries = [entry("a", 50), entry("b", 40), entry("c", 30), entry("d", 20), entry("e", 0)];
    const { state, rewards, closedWeekId } = leagueTick(st, entries, NEXT_MON);
    expect(closedWeekId).toBe("2026-10-05");
    expect(state.weekId).toBe("2026-10-12");
    expect(state.tiers.a).toBe("platine");
    expect(state.tiers.c).toBe("or");
    expect(state.tiers.e).toBe("argent");
    expect(state.base.a).toBe(50);
    expect(rewards.find((r) => r.uid === "e")).toBeUndefined();
    const a = rewards.find((r) => r.uid === "a")!;
    expect(a.tokens).toBe(2);
    expect(a.title).toBe(championTitle("or"));
    expect(rewards.find((r) => r.uid === "b")?.title).toBe("");
    expect(state.history.a.at(-1)).toMatchObject({ weekId: "2026-10-05", tier: "or", rank: 1, score: 50, move: "up" });
  });

  it("Mythique ne monte plus, Bronze ne descend pas", () => {
    const st: LeagueState = { version: 2, weekId: "2026-10-05", tiers: { a: "mythique", b: "bronze" }, base: { a: 0, b: 0 }, last: null, history: {} };
    expect(leagueStandings([entry("a", 10)], st, "mythique")[0].zone).toBe("stay");
    expect(leagueStandings([entry("b", 0)], st, "bronze")[0].zone).toBe("stay");
  });

  it("titre de champion : un seul exemplaire, activé s'il n'y en avait pas", () => {
    const p = { titles: [] } as unknown as PlayerState;
    grantLeagueTitle(p, "Champion Or", 1, TUE);
    grantLeagueTitle(p, "Champion Or", 1, NEXT_MON);
    expect(p.titles).toHaveLength(1);
    expect(p.activeTitle).toBe("Champion Or");
  });
});
