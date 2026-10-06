import { describe, expect, it } from "vitest";
import { BUILDINGS } from "@/game/buildings";
import { defaultPlayerState } from "@/game/defaults";
import { balanceHealth, median } from "@/game/balance/health";
import type { PlayerState } from "@/types/game";

/* 6.0.1 (lot K) : santé de l'équilibre. */

const NOW = Date.UTC(2026, 9, 20, 12);

function player(uid: string, cls?: string): PlayerState {
  const p = { ...defaultPlayerState(uid, uid), createdAt: null } as unknown as PlayerState;
  for (const b of BUILDINGS) p.buildings[b.id] = { level: 10, unlocked: true };
  for (const k of Object.keys(p.resources)) (p.resources as Record<string, number>)[k] = 1e8;
  p.resourcesUpdatedAtMs = NOW;
  if (cls) p.empireClass = { id: cls as "industriel", chosenAtMs: NOW, changes: 0 };
  return p;
}

describe("santé de l'équilibre", () => {
  it("médiane", () => {
    expect(median([])).toBe(0);
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it("agrège abri, butin, parallèle, alliances, routes et classes", () => {
    const a = player("a", "industriel");
    const b = player("b", "seigneur");
    const c = player("c");
    const h = balanceHealth(
      {
        players: [a, b, c],
        reports: [
          { attackerUid: "a", defenderUid: "b", outcome: "attacker_win", timestamp: NOW - 3_600_000, lootTotal: 2_000_000 },
          { attackerUid: "b", defenderUid: "a", outcome: "defender_win", timestamp: NOW - 3_600_000 },
          { attackerUid: "a", defenderUid: "c", outcome: "attacker_win", timestamp: NOW - 30 * 86_400_000, lootTotal: 9e9 },
        ],
        fleets: [
          { ownerUid: "a", mission: "attack" },
          { ownerUid: "a", mission: "recycle" },
          { ownerUid: "a", mission: "spy" },
          { ownerUid: "b", mission: "expedition" },
        ],
        builds: { a: 3, b: 1 },
        alliances: [{ members: ["a", "b"] }, { members: ["c"] }],
      },
      NOW,
      7,
    );
    expect(h.pvp.avgLoot).toBe(2_000_000);
    expect(h.pvp.battlesPerDay).toBeCloseTo(2 / 7, 1);
    expect(h.parallel.fleetsMax).toBe(2);
    expect(h.parallel.buildsMax).toBe(3);
    expect(h.parallel.buildsMedian).toBe(1);
    expect(h.alliances.sizes).toEqual([2, 1]);
    expect(h.classes.none).toBe(1);
    expect(h.classes.rows.find((r) => r.id === "industriel")?.players).toBe(1);
    expect(h.exposure.stockHours).toBeGreaterThan(0);
    expect(h.salvage.maxPct).toBeGreaterThanOrEqual(h.salvage.avgPct);
  });
});
