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

  it("6.5.1 : emplacements pleins, sens des routes, files de défense, défenses et vaisseaux de classe", () => {
    const a = player("a", "industriel");
    const b = player("b");
    a.units.batterie_aa = { level: 1, count: 30 };
    b.units.batterie_aa = { level: 1, count: 10 };
    b.units.intercepteur = { level: 1, count: 5 };
    a.units.recolteur = { level: 2, count: 7 };
    a.colonies = [
      { id: "a-c1", route: { everyHours: 6, keepPct: 0.5, nextAtMs: NOW, direction: "supply" }, defenseQueue: [{ unitId: "roquette", qty: 1, endTime: 0 }] },
      { id: "a-c2", route: { everyHours: 6, keepPct: 0.2, nextAtMs: NOW } },
    ] as never;
    const fleets = Array.from({ length: 10 }, () => ({ ownerUid: "b", mission: "attack" }));
    const h = balanceHealth({ players: [a, b], reports: [], fleets, builds: {}, alliances: [] }, NOW, 7);
    expect(h.parallel.fullSlotsPct).toBe(50);
    expect(h.colonies).toMatchObject({ colonies: 2, withRoute: 2, supply: 1, queued: 1 });
    expect(h.defenses[0]).toMatchObject({ id: "batterie_aa", total: 40, owners: 2 });
    expect(h.defenses.find((d) => d.id === "intercepteur")).toMatchObject({ total: 5, owners: 1 });
    expect(h.classUnits.find((c) => c.id === "recolteur")).toMatchObject({ total: 7, owners: 1 });
  });
});

