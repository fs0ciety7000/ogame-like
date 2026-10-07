import { afterEach, describe, expect, it } from "vitest";
import { BUILDINGS } from "@/game/buildings";
import { advanceColonies, startColonization } from "@/game/colonies";
import { applyGameContent, currentGameContent } from "@/game/content";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { attackTravelSeconds, baseReturnUnits, COLONY_BASE_RULES, distanceBetween, fleetSpeed, performLaunch, type Fleet } from "@/game/fleets";
import type { PlayerState } from "@/types/game";

/* 6.10.0 (proposals/flotte-basee.md) : base avancée sur une colonie ; invariant I20. */

const NOW = Date.UTC(2026, 9, 7, 12);
const H = 3600_000;

function colon(uid = "u1"): PlayerState {
  const p = { ...defaultPlayerState(uid, "Colon"), createdAt: null } as unknown as PlayerState;
  for (const b of BUILDINGS) p.buildings[b.id] = { level: 15, unlocked: true };
  for (const k of Object.keys(p.resources)) (p.resources as Record<string, number>)[k] = 2e9;
  p.resourcesUpdatedAtMs = NOW;
  startColonization(p, "Néo", NOW - 5 * H);
  advanceColonies(p, NOW);
  p.units.chasseur = { level: 1, count: 20 };
  p.xp = 5_000_000;
  p.createdAtMs = NOW - 60 * 24 * H;
  return p;
}

function target(): PlayerState {
  const t = defaultPlayerState("cible", "Cible") as PlayerState;
  t.xp = 5_000_000;
  t.createdAtMs = NOW - 60 * 24 * H;
  t.lastAttackAtMs = NOW - 24 * H;
  return t;
}

const baseOf = (p: PlayerState, units: Record<string, number>): Fleet => {
  const out = performLaunch({ mission: "colonybase", now: NOW, owner: p, ownerQueues: defaultQueues(), fleet: units, baseColonyId: p.colonies![0].id, basesAtColony: 0 });
  return { ...(out.fleet as Fleet), id: "base1", status: "stationed", stationedUntilMs: out.fleet.arriveAtMs + (out.fleet.durationMs ?? 0) };
};

afterEach(() => applyGameContent({}));

describe("6.10.0 base avancée", () => {
  it("la flotte part de la planète mère vers la colonie et y stationne au plus maxDays jours ; une base par colonie", () => {
    const p = colon();
    const colonyId = p.colonies![0].id;
    const out = performLaunch({ mission: "colonybase", now: NOW, owner: p, ownerQueues: defaultQueues(), fleet: { chasseur: 10 }, baseColonyId: colonyId, basesAtColony: 0 });
    expect(out.attacker.units.chasseur.count).toBe(10);
    expect(out.fleet).toMatchObject({ mission: "colonybase", targetUid: colonyId, units: { chasseur: 10 }, base: { colonyId } });
    expect(out.fleet.durationMs).toBe(COLONY_BASE_RULES.maxDays * 24 * H);
    expect(out.fleet.arriveAtMs).toBeGreaterThan(NOW);
    expect(() => performLaunch({ mission: "colonybase", now: NOW, owner: colon(), ownerQueues: defaultQueues(), fleet: { chasseur: 1 }, baseColonyId: colonyId, basesAtColony: 1 })).toThrow(/déjà une base/);
    expect(() => performLaunch({ mission: "colonybase", now: NOW, owner: colon(), ownerQueues: defaultQueues(), fleet: { chasseur: 1 }, baseColonyId: "u1-c9", basesAtColony: 0 })).toThrow(/introuvable/);
  });

  it("I20 : l'attaque prend ses vaisseaux dans la base (jamais plus), part de la colonie, ne touche pas la planète mère", () => {
    const p = colon();
    const base = baseOf(p, { chasseur: 10 });
    const home = p.units.chasseur.count;
    const t = target();
    const out = performLaunch({ mission: "attack", now: NOW, owner: p, ownerQueues: defaultQueues(), target: t, fleet: { chasseur: 6 }, fromBase: base });
    expect(out.attacker.units.chasseur.count).toBe(home);
    expect(out.baseUnitsLeft).toEqual({ chasseur: 4 });
    expect(out.fleet.base).toEqual({ colonyId: base.base!.colonyId, fromBaseId: "base1" });
    // Trajet depuis les coordonnées de la colonie, pas de la planète mère.
    expect(out.fleet.arriveAtMs - NOW).toBe(attackTravelSeconds(distanceBetween(base.base!.colonyId, t.uid), fleetSpeed(p.units, { chasseur: 6 })) * 1000);
    expect(distanceBetween(base.base!.colonyId, t.uid)).not.toBe(distanceBetween(p.uid, t.uid));
    expect(() => performLaunch({ mission: "attack", now: NOW, owner: colon(), ownerQueues: defaultQueues(), target: target(), fleet: { chasseur: 11 }, fromBase: base })).toThrow(/plus assez/);
    // Base levée ou expirée : refusée.
    expect(() => performLaunch({ mission: "attack", now: NOW, owner: colon(), ownerQueues: defaultQueues(), target: target(), fleet: { chasseur: 1 }, fromBase: { ...base, status: "returning" } })).toThrow(/plus en place/);
  });

  it("retour : les survivants rejoignent la base encore en place, sinon la planète mère", () => {
    const p = colon();
    const base = baseOf(p, { chasseur: 4 });
    const back = { units: { chasseur: 5 }, base: { colonyId: base.base!.colonyId, fromBaseId: "base1" }, ownerUid: p.uid };
    expect(baseReturnUnits(back, base, NOW + H)).toEqual({ chasseur: 9 });
    expect(baseReturnUnits(back, { ...base, status: "returning" }, NOW + H)).toBeNull();
    expect(baseReturnUnits(back, null, NOW + H)).toBeNull();
    expect(baseReturnUnits({ ...back, base: null }, base, NOW + H)).toBeNull();
  });

  it("réglages : base fermée dans l'admin, durée réglable", () => {
    applyGameContent({ rules: { ...currentGameContent().rules, colonyBase: { ...COLONY_BASE_RULES, enabled: false } } });
    const p = colon();
    expect(() => performLaunch({ mission: "colonybase", now: NOW, owner: p, ownerQueues: defaultQueues(), fleet: { chasseur: 1 }, baseColonyId: p.colonies![0].id, basesAtColony: 0 })).toThrow(/fermées/);
    applyGameContent({ rules: { ...currentGameContent().rules, colonyBase: { ...COLONY_BASE_RULES, enabled: true, maxDays: 3 } } });
    const out = performLaunch({ mission: "colonybase", now: NOW, owner: colon(), ownerQueues: defaultQueues(), fleet: { chasseur: 1 }, baseColonyId: p.colonies![0].id, basesAtColony: 0 });
    expect(out.fleet.durationMs).toBe(3 * 24 * H);
  });
});
