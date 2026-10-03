import { describe, expect, it } from "vitest";
import { applyGameContent } from "@/game/content";
import { balanceSnapshot, periodRaidRepelPct, pushSnapshot, rollingPvpWinPct, type BalanceSnapshot } from "@/game/balance/history";
import { allProposals, type LiveBalance } from "@/game/balance/diagnostics";

const NOW = Date.UTC(2026, 9, 3, 12);
const DAY = 86_400_000;

function live(over: Partial<LiveBalance> = {}): LiveBalance {
  return {
    generatedAt: NOW,
    activePlayers: 10,
    players: [{ pseudo: "A", attack: 100, defense: 50, shieldPct: 0, defenseBonusPct: 0, attackPlacesUsed: 80, attackPlaces: 100, defensePlacesUsed: 0, defensePlaces: 0, productionPerHour: 1000, outage: false, fullStorage: 0 }],
    unitPlaces: [],
    pvp: { battles: 0, attackerWinPct: 0, windowDays: 30 },
    warlordBattles: { battles: 0, attackerWinPct: 0 },
    factions: [{ id: "varan", name: "Varan", raidsWon: 9, raidsLost: 1, repelledPct: 90, lairsTaken: 0, lairsOpen: 0 }],
    warlords: [{ pseudo: "Zhar", power: 500 }],
    bestDefense: 50,
    bestAttack: 100,
    ...over,
  };
}

const snap = (day: number, wins: number, battles: number, raidsWon = 0, raidsLost = 0, lairs = 0): BalanceSnapshot => ({
  day: new Date(NOW - (30 - day) * DAY).toISOString().slice(0, 10),
  atMs: NOW - (30 - day) * DAY,
  activePlayers: 10,
  pvpBattles: battles,
  pvpAttackerWins: wins,
  warlordBattles: 0,
  warlordAttackerWins: 0,
  raidsWon,
  raidsLost,
  lairsTaken: lairs,
  medianProduction: 1000,
  avgHangarAttack: 0.8,
  bestDefense: 50,
  bestAttack: 100,
  topWarlord: 500,
  homeDefenseBonus: 0.15,
});

describe("v5.5 historique d'équilibrage", () => {
  it("photo du jour : combats des dernières 24 h seulement, cumuls de raids, hangars", () => {
    const s = balanceSnapshot(
      live(),
      [
        { attackerUid: "a", defenderUid: "b", outcome: "attacker_win", timestamp: NOW - 1000 },
        { attackerUid: "a", defenderUid: "b", outcome: "defender_win", timestamp: NOW - 2000 },
        { attackerUid: "npc_z", defenderUid: "b", outcome: "attacker_win", timestamp: NOW - 3000 },
        { attackerUid: "a", defenderUid: "b", outcome: "attacker_win", timestamp: NOW - 2 * DAY },
      ],
      NOW,
    );
    expect(s).toMatchObject({ day: "2026-10-03", pvpBattles: 2, pvpAttackerWins: 1, warlordBattles: 1, raidsWon: 9, raidsLost: 1, avgHangarAttack: 0.8, topWarlord: 500 });
  });

  it("une photo par jour, 180 jours au plus", () => {
    let h: BalanceSnapshot[] = [];
    for (let d = 0; d < 200; d++) h = pushSnapshot(h, { ...snap(0, 0, 0), day: new Date(NOW + d * DAY).toISOString().slice(0, 10) });
    expect(h).toHaveLength(180);
    h = pushSnapshot(h, { ...h.at(-1)!, pvpBattles: 7 });
    expect(h).toHaveLength(180);
    expect(h.at(-1)!.pvpBattles).toBe(7);
  });

  it("tendance JcJ sur 7 jours : propose le bonus à domicile +0,05 au-delà de 65 %", () => {
    applyGameContent({});
    const h = Array.from({ length: 10 }, (_, i) => snap(i, 7, 10));
    expect(rollingPvpWinPct(h)).toEqual({ pct: 70, battles: 70 });
    const p = allProposals(live({ history: h })).find((x) => x.id === "pvp-attack");
    expect(p?.proposal).toBe("Bonus à domicile 0,15 → 0,20.");
    expect(allProposals(live({ history: Array.from({ length: 10 }, (_, i) => snap(i, 6, 10)) })).some((x) => x.id === "pvp-attack")).toBe(false);
  });

  it("raids repoussés sur la période et repaires intouchés depuis 14 jours", () => {
    const h = Array.from({ length: 15 }, (_, i) => snap(i, 0, 0, i * 9, i));
    expect(periodRaidRepelPct(h, 7)).toEqual({ pct: 90, raids: 70 });
    expect(allProposals(live({ history: h })).some((x) => x.id === "lairs-untouched")).toBe(true);
  });
});
