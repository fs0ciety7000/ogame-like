import { describe, expect, it } from "vitest";
import { applySpin, bossTokens, casinoClosesAt, casinoWeek, challengeTokens, DEFAULT_CASINO, giveTitle, normalizeCasino, normalizeCasinoSettings, playerCasino, removeTitle, rollTournament, scoreSpin, tournamentRanking, tournamentResult } from "@/game/casino";
import { describePassReward, grantPassReward, validateSeasonPass } from "@/game/seasonPass";
import type { PlayerState } from "@/types/game";

const player = (uid = "p1") => ({ uid, pseudo: uid, resources: {}, titles: [] }) as unknown as PlayerState;
// Samedi 3 octobre 2026, 14 h à Paris.
const SAT = Date.UTC(2026, 9, 3, 12);

describe("casino : jetons, tournoi, bilan", () => {
  it("réglages : récompenses par défaut et bornes", () => {
    const s = normalizeCasinoSettings({ rewards: { bossWin: 500, tournament: [9, -2], tournamentTitle: "  " } });
    expect(s.rewards.bossWin).toBe(100);
    expect(s.rewards.tournament).toEqual([9, 0]);
    expect(s.rewards.tournamentTitle).toBe(DEFAULT_CASINO.rewards.tournamentTitle);
    expect(normalizeCasinoSettings({}).rewards).toEqual(DEFAULT_CASINO.rewards);
  });

  it("jetons des boss et des défis", () => {
    const s = DEFAULT_CASINO;
    expect(bossTokens(s, true, 0)).toBe(s.rewards.bossWin + s.rewards.bossTop);
    expect(bossTokens(s, true, 1)).toBe(s.rewards.bossWin + Math.floor(s.rewards.bossTop / 2));
    expect(bossTokens(s, true, 3)).toBe(s.rewards.bossWin);
    expect(bossTokens(s, false, 0)).toBe(s.rewards.bossFail);
    expect(challengeTokens(s, -1)).toBe(0);
    expect(challengeTokens(s, 0)).toBe(1);
    expect(challengeTokens(s, 5)).toBe(2);
  });

  it("passe : palier de jetons", () => {
    const p = player();
    expect(grantPassReward(p, { kind: "tokens", count: 3 }, "s1", SAT)).toBe(describePassReward({ kind: "tokens", count: 3 }));
    expect(playerCasino(p).tokens).toBe(3);
    expect(validateSeasonPass({ tiers: [[{ kind: "tokens", count: 0 }]] })).toHaveLength(1);
  });

  it("tirage : jeton dépensé, cerise rendue, bilan de la semaine", () => {
    const p = player();
    p.casino = { tokens: 2 } as never;
    applySpin(p, "cherry", {}, SAT);
    expect(playerCasino(p).tokens).toBe(2);
    applySpin(p, "star3", { metal: 100 } as never, SAT);
    const w = casinoWeek(p, SAT);
    expect(playerCasino(p).tokens).toBe(1);
    expect(w).toMatchObject({ spins: 2, wins: 2, points: 31 });
    expect(w.resources).toEqual({ metal: 100 });
    // La semaine suivante repart de zéro.
    expect(casinoWeek(p, SAT + 7 * 86_400_000).spins).toBe(0);
  });

  it("tournoi : ouverture, points, clôture et podium", () => {
    let st = normalizeCasino({ settings: { mode: "scheduled", weekly: null, tournamentWeekly: null, weekends: true } });
    st = rollTournament(st, SAT).state;
    expect(st.tournament?.id).toMatch(/^we-/);
    st = scoreSpin(st, "a", "Alpha", "star3");
    st = scoreSpin(st, "b", "Bravo", "jackpot");
    st = scoreSpin(st, "c", "Charlie", "lose");
    expect(tournamentRanking(st.tournament).map((r) => r.uid)).toEqual(["b", "a", "c"]);
    // Lundi : le week-end est fini, le tournoi se clôture.
    const monday = SAT + 2 * 86_400_000;
    const rolled = rollTournament(st, monday);
    expect(rolled.closed?.id).toBe(st.tournament?.id);
    expect(rolled.state.tournament).toBeNull();
    const res = tournamentResult(rolled.closed!, st.settings, monday);
    expect(res.titleUid).toBe("b");
    expect(res.podium.map((x) => x.tokens)).toEqual([5, 3, 0]); // 0 point : pas de jetons
  });

  it("fermeture : fin du week-end à Paris", () => {
    const closes = casinoClosesAt({ ...DEFAULT_CASINO, mode: "scheduled", weekly: null, weekends: true }, SAT)!;
    // Lundi 00 h à Paris = dimanche 22 h UTC (heure d'été).
    expect(new Date(closes).toISOString()).toBe("2026-10-04T22:00:00.000Z");
    expect(casinoClosesAt({ ...DEFAULT_CASINO, mode: "open" }, SAT)).toBeNull();
  });

  it("titres : donné sans doublon, retiré proprement", () => {
    const p = player();
    giveTitle(p, "As du casino", "casino:x", true);
    giveTitle(p, "As du casino", "casino:y", true);
    expect(p.titles).toHaveLength(1);
    expect(p.activeTitle).toBe("As du casino");
    removeTitle(p, "As du casino");
    expect(p.titles).toHaveLength(0);
    expect(p.activeTitle).toBeUndefined();
  });
});
