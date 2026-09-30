import { describe, expect, it } from "vitest";
import {
  completeFleetReturn,
  distanceBetween,
  fleetProgress,
  fleetSpeed,
  launchFleet,
  patrolEnergyCost,
  patrolTurnaround,
  performLaunch,
  recallFleet,
  travelSeconds,
  type Fleet,
} from "@/game/fleets";
import { performAttack } from "@/game/attack";
import { findUnit } from "@/game/units";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

const NOW = 1_800_000_000_000;
function player(uid: string, patch: Partial<PlayerState> = {}): PlayerState {
  return { ...defaultPlayerState(uid, uid.toUpperCase()), createdAtMs: NOW - 30 * 864e5, resourcesUpdatedAtMs: NOW, xp: 1000, ...patch } as PlayerState;
}

describe("fleet travel", () => {
  it("uses the slowest ship and the map distance", () => {
    const units = { chasseur: { level: 1, count: 10 }, cargo: { level: 1, count: 10 } };
    expect(fleetSpeed(units, { chasseur: 5 })).toBe(8);
    expect(fleetSpeed(units, { chasseur: 5, cargo: 1 })).toBe(3);
    expect(travelSeconds(50, 5)).toBe((5 + 30) * 60);
    const d = distanceBetween("a", "b");
    expect(d).toBeGreaterThan(0);
    expect(d).toBeLessThanOrEqual(Math.SQRT2 * 100);
    expect(distanceBetween("a", "b")).toBe(distanceBetween("b", "a"));
  });
});

describe("launch, arrival, return", () => {
  const attacker = () => player("att", { units: { chasseur: { level: 1, count: 100 }, cargo: { level: 1, count: 20 } } });
  const defender = () => player("def", { units: { roquette: { level: 1, count: 10 } }, resources: { ...player("x").resources, scrap: 5_000_000 } });

  it("removes the ships from the base and warns the defender", () => {
    const out = launchFleet({ now: NOW, attacker: attacker(), defender: defender(), fleet: { chasseur: 60, cargo: 20 }, lastAttackOnTargetMs: null });
    expect(out.attacker.units.chasseur.count).toBe(40);
    expect(out.fleet.arriveAtMs).toBeGreaterThan(NOW + 5 * 60 * 1000 - 1);
    expect(out.defenderNotifications[0].kind).toBe("fleet");
    expect(() => launchFleet({ now: NOW, attacker: attacker(), defender: defender(), fleet: { chasseur: 500 }, lastAttackOnTargetMs: null })).toThrow(/plus assez/);
    expect(() => launchFleet({ now: NOW, attacker: attacker(), defender: defender(), fleet: { chasseur: 1 }, lastAttackOnTargetMs: NOW - 60_000 })).toThrow(/récemment/);
  });

  it("fights on arrival: survivors and loot fly back instead of being credited", () => {
    const launched = launchFleet({ now: NOW, attacker: attacker(), defender: defender(), fleet: { chasseur: 60, cargo: 20 }, lastAttackOnTargetMs: null });
    const at = launched.fleet.arriveAtMs;
    const out = performAttack({
      now: at,
      attackerUid: "att",
      attacker: { ...launched.attacker, resourcesUpdatedAtMs: at },
      attackerQueues: defaultQueues(),
      defenderUid: "def",
      defender: { ...defender(), resourcesUpdatedAtMs: at },
      defenderQueues: defaultQueues(),
      fleet: launched.fleet.units,
      lastAttackOnTargetMs: null,
      defenderXpLostLast24h: 0,
      inFlight: true,
    });
    if (!out.ok) throw new Error(out.message);
    expect(out.combat.outcome).toBe("attacker_win");
    expect(out.attacker.units.chasseur.count).toBe(40); // les survivants ne sont pas encore rentrés
    expect(out.survivors.chasseur).toBe(60 - (out.combat.attackerLosses.chasseur ?? 0));
    expect(out.loot.scrap).toBeGreaterThan(0);
    expect(out.attacker.resources.scrap).toBe(launched.attacker.resources.scrap); // butin pas encore crédité

    const fleet: Fleet = { ...launched.fleet, id: "f1", units: out.survivors, loot: out.loot, status: "returning", returnAtMs: at + (at - NOW) };
    const scrapBefore = out.attacker.resources.scrap;
    const back = completeFleetReturn(out.attacker, fleet, fleet.returnAtMs!);
    expect(back.owner.units.chasseur.count).toBe(40 + out.survivors.chasseur);
    expect(back.owner.resources.scrap).toBe(scrapBefore + (out.loot.scrap ?? 0));
  });

  it("recalls before impact, never after", () => {
    const launched = launchFleet({ now: NOW, attacker: attacker(), defender: defender(), fleet: { chasseur: 10 }, lastAttackOnTargetMs: null });
    const fleet: Fleet = { ...launched.fleet, id: "f1" };
    const mid = NOW + (fleet.arriveAtMs - NOW) / 2;
    const recalled = recallFleet(fleet, "att", mid);
    expect(recalled.status).toBe("returning");
    expect(recalled.returnAtMs).toBe(mid + (mid - NOW));
    expect(fleetProgress(recalled, mid)).toBeCloseTo(0.5, 1);
    expect(fleetProgress(recalled, recalled.returnAtMs!)).toBe(0);
    expect(() => recallFleet(fleet, "intrus", mid)).toThrow(/appartient/);
    expect(() => recallFleet(fleet, "att", fleet.arriveAtMs + 1)).toThrow(/Trop tard/);
  });
});

describe("spy, recycle and patrol missions", () => {
  it("sends probes only, without warning the target", () => {
    const owner = player("att", { units: { sonde_espionnage: { level: 2, count: 5 }, chasseur: { level: 1, count: 5 } } });
    const out = performLaunch({ mission: "spy", now: NOW, owner, ownerQueues: defaultQueues(), target: player("def"), fleet: { sonde_espionnage: 3 } });
    expect(out.fleet.mission).toBe("spy");
    expect(out.attacker.units.sonde_espionnage.count).toBe(2);
    expect(out.defenderNotifications).toHaveLength(0);
    expect(out.attacker.lastAttackAtMs ?? 0).toBe(0); // espionner ne lève pas la protection
    expect(() => performLaunch({ mission: "spy", now: NOW, owner, ownerQueues: defaultQueues(), target: player("def"), fleet: { chasseur: 1 } })).toThrow(/sondes/);
  });

  it("recycles only an existing field, with recyclers", () => {
    const owner = player("att", { units: { drone_recuperateur: { level: 1, count: 5 } } });
    const field = { id: "def", locationPseudo: "DEF", scrap: 100, energy: 0, expiresAtMs: NOW + 1000, updatedAtMs: NOW };
    const out = performLaunch({ mission: "recycle", now: NOW, owner, ownerQueues: defaultQueues(), debris: field, fleet: { drone_recuperateur: 2 } });
    expect(out.fleet.targetUid).toBe("def");
    expect(() => performLaunch({ mission: "recycle", now: NOW, owner: player("att", { units: { drone_recuperateur: { level: 1, count: 5 } } }), ownerQueues: defaultQueues(), debris: { ...field, expiresAtMs: NOW }, fleet: { drone_recuperateur: 1 } })).toThrow(/n'existe plus/);
  });

  it("patrols: prepaid upkeep, recall before the midpoint, back at the end", () => {
    const owner = player("att", { units: { chasseur: { level: 1, count: 100 } }, resources: { ...player("x").resources, energy: 10_000_000 } });
    const cost = patrolEnergyCost(owner.units, { chasseur: 100 }, 60);
    expect(cost).toBe(Math.ceil(100 * findUnit("chasseur")!.hangarSpace * 0.015 * 3600));
    const out = performLaunch({ mission: "patrol", now: NOW, owner, ownerQueues: defaultQueues(), fleet: { chasseur: 100 }, patrolMinutes: 60 });
    expect(out.attacker.units.chasseur.count).toBe(0);
    expect(out.attacker.resources.energy).toBeCloseTo(10_000_000 - cost, 0);
    expect(out.fleet.arriveAtMs).toBe(NOW + 30 * 60_000);
    const turned = patrolTurnaround({ ...out.fleet, id: "f" });
    expect(turned.returnAtMs).toBe(NOW + 60 * 60_000);
    const recalled = recallFleet({ ...out.fleet, id: "f" }, "att", NOW + 10 * 60_000);
    expect(recalled.returnAtMs).toBe(NOW + 20 * 60_000);
    expect(() => performLaunch({ mission: "patrol", now: NOW, owner, ownerQueues: defaultQueues(), fleet: { chasseur: 1 }, patrolMinutes: 10 })).toThrow(/entre/);
    const poor = player("att", { units: { chasseur: { level: 1, count: 100 } }, resources: { ...player("x").resources, energy: 10 } });
    expect(() => performLaunch({ mission: "patrol", now: NOW, owner: poor, ownerQueues: defaultQueues(), fleet: { chasseur: 100 }, patrolMinutes: 60 })).toThrow(/énergie/);
  });
});
