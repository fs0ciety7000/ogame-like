import { describe, expect, it } from "vitest";
import { casinoClosesAt, casinoOpen, casinoOpeningId, nextTournamentStart, tournamentEndsAt, tournamentId, jackpotOdds, claimDailyTokens, DEFAULT_CASINO, nextCasinoOpening, evaluateReels, grantTokens, jackpotAmounts, normalizeCasino, normalizeCasinoSettings, playerCasino, recordWin, reelsFor, rollOutcome, validateCasinoSettings, type SpinOutcome } from "@/game/casino";
import type { PlayerState } from "@/types/game";

function seeded(seed: number) {
  let x = seed;
  return () => {
    x = (x * 1664525 + 1013904223) % 4294967296;
    return x / 4294967296;
  };
}

describe("casino", () => {
  it("les rouleaux affichent toujours le résultat tiré", () => {
    const r = seeded(7);
    for (const o of ["jackpot", "star3", "planet3", "bar3", "cherry3", "seven2", "cherry", "lose"] as SpinOutcome[]) {
      for (let i = 0; i < 200; i++) expect(evaluateReels(reelsFor(o, r))).toBe(o);
    }
  });

  it("respecte les probabilités réglées", () => {
    const r = seeded(42);
    const counts: Record<string, number> = {};
    const N = 200_000;
    for (let i = 0; i < N; i++) {
      const o = rollOutcome(DEFAULT_CASINO, r);
      counts[o] = (counts[o] ?? 0) + 1;
    }
    expect(counts.jackpot / N).toBeCloseTo(DEFAULT_CASINO.odds.jackpot, 3);
    expect(counts.cherry / N).toBeCloseTo(DEFAULT_CASINO.odds.cherry, 2);
  });

  it("jeton quotidien une fois par jour, plafonné", () => {
    const OPEN = { ...DEFAULT_CASINO, mode: "open" as const };
    const p = { casino: null } as unknown as PlayerState;
    const now = Date.UTC(2026, 9, 7, 10);
    expect(claimDailyTokens(p, OPEN, now)).toBe(1);
    expect(claimDailyTokens(p, OPEN, now + 3600_000)).toBe(0);
    expect(claimDailyTokens(p, OPEN, now + 24 * 3600_000)).toBe(1);
    grantTokens(p, 50);
    expect(playerCasino(p).tokens).toBe(52);
    expect(claimDailyTokens(p, OPEN, now + 48 * 3600_000)).toBe(0);
  });

  it("gros lot = part du pot ; palmarès", () => {
    expect(jackpotAmounts({ resources: { scrap: 1000, energy: 3 } }, 0.5)).toEqual({ scrap: 500, energy: 1 });
    let st = normalizeCasino(null);
    st = recordWin(st, { uid: "u", pseudo: "Chanceux", atMs: 1, outcome: "jackpot", resources: { scrap: 500 } });
    st = recordWin(st, { uid: "u", pseudo: "Chanceux", atMs: 2, outcome: "lose", resources: {} });
    expect(st.jackpots).toHaveLength(1);
    expect(st.recent).toHaveLength(1);
    expect(st.totalSpins).toBe(2);
  });

  it("valide les réglages", () => {
    expect(validateCasinoSettings(DEFAULT_CASINO)).toEqual([]);
    const bad = normalizeCasinoSettings({ odds: { jackpot: 0.5, cherry: 0.6 } });
    expect(validateCasinoSettings(bad).length).toBeGreaterThan(0);
  });
});

describe("ouverture du casino", () => {
  const sat = Date.UTC(2026, 9, 10, 12); // samedi 10 octobre 2026
  const wed = Date.UTC(2026, 9, 7, 12);
  it("programme : week-ends et créneaux", () => {
    const s = normalizeCasinoSettings({ mode: "scheduled", weekly: null, weekends: true });
    expect(casinoOpen(s, sat)).toBe(true);
    expect(casinoOpen(s, wed)).toBe(false);
    expect(casinoOpeningId(s, sat)).toBe("we-2026-10-10");
    expect(casinoOpeningId(s, sat + 24 * 3600_000)).toBe("we-2026-10-10");
    const next = nextCasinoOpening(s, wed)!;
    expect(new Date(next).toISOString()).toBe("2026-10-09T22:00:00.000Z"); // samedi 0 h à Paris
    const w = normalizeCasinoSettings({ mode: "scheduled", weekly: null, weekends: false, windows: [{ startMs: wed - 1000, endMs: wed + 1000 }] });
    expect(casinoOpen(w, wed)).toBe(true);
    expect(casinoOpen(w, sat)).toBe(false);
  });
  it("ouvert, fermé, et ancien réglage", () => {
    expect(casinoOpen(normalizeCasinoSettings({ mode: "open" }), wed)).toBe(true);
    expect(casinoOpen(normalizeCasinoSettings({ mode: "closed" }), sat)).toBe(false);
    expect(normalizeCasinoSettings({ enabled: false }).mode).toBe("closed");
    expect(validateCasinoSettings(normalizeCasinoSettings({ mode: "scheduled", weekly: null, weekends: false }))).toContainEqual(expect.stringMatching(/Programme vide/));
  });
});

describe("6.7.1 : casino ouvert en permanence, tournoi du mercredi", () => {
  const H = 3600_000;
  // Mercredi 7 octobre 2026, 18 h à Paris = 16 h UTC (heure d'été).
  const wed18 = Date.UTC(2026, 9, 7, 16);
  const sat = Date.UTC(2026, 9, 10, 12);
  it("par défaut : ouvert tout le temps, tournoi du mercredi 18 h au jeudi 23 h 59", () => {
    const s = DEFAULT_CASINO;
    expect(s.mode).toBe("open");
    expect(casinoOpen(s, sat)).toBe(true);
    expect(tournamentId(s, wed18 - 1)).toBeNull();
    expect(tournamentId(s, wed18)).toBe("t-2026-10-07");
    expect(tournamentId(s, wed18 + 29 * H)).toBe("t-2026-10-07");
    expect(tournamentId(s, wed18 + 30 * H)).toBeNull();
    expect(tournamentEndsAt(s, wed18 + H)).toBe(wed18 + 30 * H);
    expect(nextTournamentStart(s, wed18 + 31 * H)).toBe(wed18 + 7 * 24 * H);
    expect(validateCasinoSettings(s)).toEqual([]);
  });
  it("à l'heure d'hiver aussi (18 h à Paris = 17 h UTC)", () => {
    const wedWinter = Date.UTC(2026, 10, 4, 17);
    expect(tournamentId(DEFAULT_CASINO, wedWinter)).toBe("t-2026-11-04");
    expect(tournamentId(DEFAULT_CASINO, wedWinter - 1)).toBeNull();
  });
  it("casino fermé : pas de tournoi ; programmé : le tournoi ne compte que pendant une ouverture", () => {
    expect(tournamentId({ ...DEFAULT_CASINO, mode: "closed" }, wed18 + H)).toBeNull();
    const window = normalizeCasinoSettings({ mode: "scheduled", windows: [{ startMs: wed18 + 2 * H, endMs: wed18 + 4 * H }] });
    expect(tournamentId(window, wed18 + H)).toBeNull();
    expect(tournamentId(window, wed18 + 3 * H)).toBe("t-2026-10-07");
    expect(tournamentEndsAt(window, wed18 + 3 * H)).toBe(wed18 + 4 * H);
  });
  it("ouverture chaque semaine (programme) et anciens réglages : l'ouverture choisie par l'équipe ne bouge pas", () => {
    const weekly = normalizeCasinoSettings({ mode: "scheduled", weekly: { day: 2, hour: 20, hours: 4 }, weekends: false });
    expect(casinoOpeningId(weekly, Date.UTC(2026, 9, 6, 19))).toBe("k-2026-10-06");
    expect(casinoClosesAt(weekly, Date.UTC(2026, 9, 6, 19))).toBe(Date.UTC(2026, 9, 6, 22));
    const old = normalizeCasinoSettings({ mode: "scheduled", weekends: true });
    expect(old.mode).toBe("scheduled");
    expect(old.weekends).toBe(true);
    expect(old.weekly).toBeNull();
    expect(old.tournamentWeekly).toEqual({ day: 3, hour: 18, hours: 30 });
    expect(normalizeCasinoSettings({ tournamentWeekly: null }).tournamentWeekly).toBeNull();
  });
});

describe("v5.14.2 : chances du 7-7-7", () => {
  it("formule exacte : 425 jetons en moyenne à 0,2 % (cerise 15 %), 170 à 0,5 %, et la simulation tombe d'accord", () => {
    const old = jackpotOdds({ odds: { ...DEFAULT_CASINO.odds, jackpot: 0.002 } });
    expect(old.meanTokens).toBeCloseTo(425, 0);
    expect(old.medianTokens).toBe(295);
    const now = jackpotOdds(DEFAULT_CASINO);
    expect(DEFAULT_CASINO.odds.jackpot).toBe(0.005);
    expect(DEFAULT_CASINO.jackpotShare).toBe(0.9);
    expect(now.meanTokens).toBeCloseTo(170, 0);
    expect(now.within(100)).toBeGreaterThan(0.44);
    expect(now.within(100)).toBeLessThan(0.45);
    // Monte-Carlo avec le vrai tirage.
    let seed = 1;
    const rnd = () => {
      seed = (seed * 48271) % 2147483647;
      return seed / 2147483647;
    };
    let tokens = 0;
    let hits = 0;
    while (hits < 2000) {
      tokens += 1;
      for (;;) {
        const o = rollOutcome(DEFAULT_CASINO, rnd);
        if (o === "jackpot") hits += 1;
        if (o !== "cherry") break;
      }
    }
    expect(tokens / hits).toBeGreaterThan(160);
    expect(tokens / hits).toBeLessThan(180);
  });

  it("le gros lot verse 90 % de chaque ressource du pot", () => {
    expect(jackpotAmounts({ resources: { scrap: 1_000_000, energy: 333 } }, DEFAULT_CASINO.jackpotShare)).toEqual({ scrap: 900_000, energy: 299 });
  });
});
