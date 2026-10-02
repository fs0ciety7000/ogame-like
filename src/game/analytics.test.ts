import { describe, expect, it } from "vitest";
import { computeGameStats } from "@/game/analytics";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

const NOW = 1_800_000_000_000;
const DAY = 24 * 3600_000;

function player(pseudo: string, patch: Partial<PlayerState> = {}): PlayerState {
  return { ...defaultPlayerState(pseudo, pseudo), createdAtMs: NOW - 30 * DAY, resourcesUpdatedAtMs: NOW, ...patch } as PlayerState;
}

describe("computeGameStats", () => {
  const players = [
    player("A", { xp: 50, playtimeSeconds: 3600 }),
    player("B", { xp: 2500, resourcesUpdatedAtMs: NOW - 3 * DAY, techLevels: { tech1: 2 }, units: { chasseur: { level: 1, count: 10 } } }),
    player("C", { xp: 700, resourcesUpdatedAtMs: NOW - 10 * DAY, createdAtMs: NOW - 2 * DAY }),
  ];
  const q = defaultQueues();
  q.activeMissions.push({ key: "patrouille_courte", endTime: NOW + 1000 });
  const reports = [
    { attackerPseudo: "B", defenderPseudo: "A", outcome: "attacker_win" as const, timestamp: NOW - DAY / 2, loot: { scrap: 90, energy: 10 } },
    { attackerPseudo: "B", defenderPseudo: "C", outcome: "defender_win" as const, timestamp: NOW - 2 * DAY, loot: null },
    { attackerPseudo: "A", defenderPseudo: "B", outcome: "draw" as const, timestamp: NOW - 20 * DAY, loot: null },
  ];
  const s = computeGameStats(players, [q, defaultQueues()], reports, NOW);

  it("counts players and activity", () => {
    expect(s.players).toMatchObject({ total: 3, active24h: 1, active7d: 2, new7d: 1, medianXp: 700 });
    expect(s.players.topXp[0]).toEqual({ pseudo: "B", xp: 2500 });
    expect(s.players.ranks.reduce((a, r) => a + r.count, 0)).toBe(3);
  });

  it("summarises combat over the window only", () => {
    expect(s.combat.attacks).toBe(2);
    expect(s.combat.outcomes).toEqual({ attacker_win: 1, defender_win: 1, draw: 0 });
    expect(s.combat.avgLoot).toBe(100);
    expect(s.combat.topAttackers[0]).toEqual({ pseudo: "B", count: 2 });
    expect(s.combat.perDay).toHaveLength(7);
    expect(s.combat.perDay.reduce((a, d) => a + d.count, 0)).toBe(2);
  });

  it("reports content usage and insights", () => {
    expect(s.technologies.find((t) => t.id === "tech1")?.researchedPct).toBeCloseTo(33.3);
    expect(s.units.find((u) => u.id === "chasseur")).toMatchObject({ total: 10 });
    expect(s.missions[0]).toMatchObject({ key: "patrouille_courte", running: 1 });
    expect(s.insights.some((i) => i.includes("personne n'a recherchées"))).toBe(true);
  });
});

describe("endgame balance stats", () => {
  it("tracks endgame techs, rare production and new units in combat", () => {
    const base = defaultPlayerState("x", "x");
    const rich = player("Vito", {
      techLevels: { tech21: 3, tech24: 1 },
      buildings: { ...base.buildings, fonderie_quantique: { level: 2, unlocked: true } },
      units: { croiseur_nova: { level: 1, count: 40 } },
    });
    const q = defaultQueues();
    q.activeResearches.push({ id: "tech22", endTime: NOW + 1000 });
    const reports = [
      { attackerUid: "Vito", attackerPseudo: "Vito", defenderPseudo: "A", outcome: "attacker_win" as const, timestamp: NOW - DAY, loot: null, attackerFleet: { croiseur_nova: 40 } },
      { attackerUid: "Vito", attackerPseudo: "Vito", defenderPseudo: "B", outcome: "defender_win" as const, timestamp: NOW - DAY, loot: null, attackerFleet: { croiseur_nova: 10 } },
    ];
    const s = computeGameStats([rich, player("A")], [q], reports, NOW).endgame;
    expect(s.players).toBe(1);
    expect(s.techs.find((t) => t.id === "tech21")).toMatchObject({ researchers: 1, avgLevel: 3, leaders: ["Vito (3)"] });
    expect(s.techs.find((t) => t.id === "tech22")).toMatchObject({ researchers: 0, inProgress: 1 });
    expect(s.buildings.find((b) => b.id === "fonderie_quantique")).toMatchObject({ builders: 1, avgLevel: 2, resource: "reinforcedSteel", perHour: 3600 });
    expect(s.units.find((u) => u.id === "croiseur_nova")).toMatchObject({ owners: 1, total: 40, attacks: 2, winPct: 50 });
  });
});
