import { describe, expect, it } from "vitest";
import { BUILDINGS } from "@/game/buildings";
import { COLONY_ROUTE_RULES, COLONY_RULES, advanceColonies, buildColonyDefense, colonyDefenseHangar, colonyDefensePendingSpace, colonyStorage, runColonyRoute, setColonyRoute, startColonization } from "@/game/colonies";
import { performCancel } from "@/game/cancel";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { COMMON_RESOURCES, storageCapacityOf } from "@/game/economy";
import { UNITS } from "@/game/units";
import type { PlayerState } from "@/types/game";

/* 6.4 (lot Q, proposals/colonies-suite.md) : ravitaillement des colonies et file de défense coloniale. */

const NOW = Date.UTC(2026, 9, 7, 12);
const H = 3600_000;

function withColony(): PlayerState {
  const p = { ...defaultPlayerState("u1", "Colon"), createdAt: null } as unknown as PlayerState;
  for (const b of BUILDINGS) p.buildings[b.id] = { level: 15, unlocked: true };
  for (const k of Object.keys(p.resources)) (p.resources as Record<string, number>)[k] = 2e9;
  p.resourcesUpdatedAtMs = NOW;
  startColonization(p, "Néo", NOW);
  advanceColonies(p, NOW + 3 * H);
  return p;
}

describe("route de ravitaillement (planète mère → colonie)", () => {
  it("remplit la colonie jusqu'au niveau visé, garde la réserve de la planète mère, perd 10 % en route", () => {
    const p = withColony();
    const c = p.colonies![0];
    const cap = colonyStorage(c, p);
    for (const r of COMMON_RESOURCES) c.resources[r] = 0;
    const home = storageCapacityOf(p);
    for (const r of COMMON_RESOURCES) p.resources[r] = home;
    const route = setColonyRoute(p, c.id, 6, 0.5, NOW, "supply")!;
    expect(route.direction).toBe("supply");
    const delivered = runColonyRoute(c, p, NOW + 6 * H)!;
    expect(c.resources.scrap).toBe(delivered.scrap);
    expect(c.resources.scrap).toBeLessThanOrEqual(Math.floor(cap * 0.5));
    expect(c.resources.scrap).toBeGreaterThan(Math.floor(cap * 0.5) * 0.98);
    expect(home - p.resources.scrap).toBeGreaterThanOrEqual(delivered.scrap!);
    expect(Math.floor((home - p.resources.scrap) * (1 - COLONY_ROUTE_RULES.feePct))).toBe(delivered.scrap);
  });

  it("ne descend jamais sous la réserve de la planète mère", () => {
    const p = withColony();
    const c = p.colonies![0];
    for (const r of COMMON_RESOURCES) c.resources[r] = 0;
    const reserve = Math.floor(storageCapacityOf(p) * COLONY_ROUTE_RULES.supplyHomeReservePct);
    p.resources.scrap = reserve + 100;
    setColonyRoute(p, c.id, 6, 0.8, NOW, "supply");
    runColonyRoute(c, p, NOW + 6 * H);
    expect(p.resources.scrap).toBeGreaterThanOrEqual(reserve);
  });

  it("changer de sens relance la cadence", () => {
    const p = withColony();
    const id = p.colonies![0].id;
    setColonyRoute(p, id, 6, 0.2, NOW);
    expect(setColonyRoute(p, id, 6, 0.5, NOW + H, "supply")!.nextAtMs).toBe(NOW + 7 * H);
  });
});

describe("file de défense coloniale", () => {
  function ready() {
    const p = withColony();
    const c = p.colonies![0];
    const def = UNITS.find((u) => u.category === "defense" && u.hangarSpace === 1)!;
    p.units[def.id] = { level: 1, count: 0 } as never;
    for (const r of COMMON_RESOURCES) c.resources[r] = 1e12;
    return { p, c, def };
  }

  it("met les lots en file, payés d'avance, puis les enchaîne", () => {
    const { p, c, def } = ready();
    const first = buildColonyDefense(p, c.id, def.id, 2, NOW + 3 * H);
    const scrap = c.resources.scrap;
    buildColonyDefense(p, c.id, def.id, 3, NOW + 3 * H);
    expect(c.resources.scrap).toBeLessThan(scrap);
    expect(c.defenseQueue).toHaveLength(1);
    expect(colonyDefensePendingSpace(c)).toBe(5 * def.hangarSpace);
    // Les deux lots finissent l'un après l'autre.
    advanceColonies(p, first.endTime + 10 * 24 * H);
    expect(c.defenses[def.id].count).toBe(5);
    expect(c.defenseJob).toBeNull();
    expect(c.defenseQueue).toBeUndefined();
  });

  it("refuse au-delà de la file et de la place du hangar (lots en attente comptés)", () => {
    const { p, c, def } = ready();
    const t = NOW + 3 * H;
    buildColonyDefense(p, c.id, def.id, 1, t);
    for (let i = 0; i < COLONY_RULES.defenseQueueMax; i++) buildColonyDefense(p, c.id, def.id, 1, t);
    expect(() => buildColonyDefense(p, c.id, def.id, 1, t)).toThrow(/File pleine/);
    const { p: p2, c: c2, def: d2 } = ready();
    const h = colonyDefenseHangar(c2, p2, t);
    const room = Math.floor((h.capacity - h.used) / d2.hangarSpace);
    buildColonyDefense(p2, c2.id, d2.id, room - 1, t);
    expect(() => buildColonyDefense(p2, c2.id, d2.id, 2, t)).toThrow(/Capacité/);
  });

  it("annuler un lot en attente rembourse tout ; annuler le lot en cours démarre le suivant", () => {
    const { p, c, def } = ready();
    const t = NOW + 3 * H;
    buildColonyDefense(p, c.id, def.id, 2, t);
    const before = c.resources.scrap;
    buildColonyDefense(p, c.id, def.id, 3, t);
    buildColonyDefense(p, c.id, def.id, 4, t);
    const q = defaultQueues();
    performCancel(p, q, { kind: "colonyDefense", colonyId: c.id, index: 2 }, t + 1000);
    expect(c.defenseQueue).toHaveLength(1);
    expect(c.defenseQueue![0].qty).toBe(3);
    performCancel(p, q, { kind: "colonyDefense", colonyId: c.id }, t + 2000);
    expect(c.defenseJob?.qty).toBe(3);
    expect(c.defenseJob?.startedAtMs).toBe(t + 2000);
    expect(c.defenseQueue).toBeUndefined();
    expect(c.resources.scrap).toBeLessThan(before);
  });
});
