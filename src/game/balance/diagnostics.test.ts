import { describe, expect, it } from "vitest";
import { allProposals, computeLiveBalance, liveFindings, staticFindings } from "@/game/balance/diagnostics";
import { defaultPlayerState } from "@/game/defaults";
import { setUnits, UNITS } from "@/game/units";
import type { PlayerState } from "@/types/game";

const NOW = Date.UTC(2026, 9, 5);

function player(name: string, units: PlayerState["units"]): PlayerState {
  const p = defaultPlayerState(name, name) as PlayerState;
  p.units = units;
  p.lastActiveMs = NOW - 3_600_000;
  return p;
}

describe("outil d'équilibrage", () => {
  it("le contenu actuel ne présente aucun problème critique", () => {
    expect(staticFindings().filter((p) => p.severity === "critical")).toEqual([]);
  });

  it("repère une unité piège et propose un nombre de places", () => {
    const original = [...UNITS];
    try {
      setUnits(original.map((u) => (u.id === "sentinelle" ? { ...u, hangarSpace: 25 } : u)));
      const trap = staticFindings().find((p) => p.id === "trap-sentinelle");
      expect(trap?.severity).toBe("critical");
      expect(trap?.proposal).toMatch(/Places de hangar 25 → \d+/);
    } finally {
      setUnits(original);
    }
  });

  it("agrège les joueurs réels et propose un réglage quand l'attaquant gagne trop souvent", () => {
    const players = [player("A", { sentinelle: { level: 5, count: 100 } }), player("B", { batterie_aa: { level: 5, count: 50 } })];
    const reports = Array.from({ length: 30 }, (_, i) => ({ attackerUid: "A", defenderUid: "B", outcome: i < 27 ? "attacker_win" : "defender_win", timestamp: NOW - i * 3_600_000 })) as never;
    const live = computeLiveBalance(players, [], reports, NOW);
    expect(live.activePlayers).toBe(2);
    expect(live.pvp).toMatchObject({ battles: 30, attackerWinPct: 90 });
    expect(live.players[0].attackPlacesUsed + live.players[1].attackPlacesUsed).toBe(100);
    expect(liveFindings(live).map((p) => p.id)).toContain("pvp-attack");
    expect(allProposals(live)[0].severity).not.toBe("info");
  });
});
