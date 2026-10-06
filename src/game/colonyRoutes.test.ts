import { describe, expect, it } from "vitest";
import { BUILDINGS } from "@/game/buildings";
import { COLONY_ROUTE_RULES, advanceColonies, colonyBiome, colonyRouteLoad, colonyStorage, runColonyRoute, setColonyRoute, startColonization } from "@/game/colonies";
import { defaultPlayerState } from "@/game/defaults";
import { COMMON_RESOURCES, storageCapacityOf } from "@/game/economy";
import type { PlayerState } from "@/types/game";

/* 5.33 (proposals/routes-logistiques.md) : routes logistiques des colonies. */

const NOW = Date.UTC(2026, 9, 7, 12);
const H = 3600_000;

function withColony(): PlayerState {
  const p = { ...defaultPlayerState("u1", "Colon"), createdAt: null } as unknown as PlayerState;
  for (const b of BUILDINGS) p.buildings[b.id] = { level: 15, unlocked: true };
  for (const k of Object.keys(p.resources)) (p.resources as Record<string, number>)[k] = 2e9;
  p.resourcesUpdatedAtMs = NOW;
  startColonization(p, "Néo", NOW);
  advanceColonies(p, NOW + 3 * H);
  for (const k of Object.keys(p.resources)) (p.resources as Record<string, number>)[k] = 0;
  return p;
}

describe("routes logistiques", () => {
  it("se règle : cadences proposées seulement, réserve bornée, 0 = arrêt", () => {
    const p = withColony();
    const id = p.colonies![0].id;
    expect(() => setColonyRoute(p, id, 5, 0.2, NOW)).toThrow(/6, 12, 24/);
    const r = setColonyRoute(p, id, 6, 3, NOW)!;
    expect(r).toMatchObject({ everyHours: 6, keepPct: COLONY_ROUTE_RULES.maxKeepPct, nextAtMs: NOW + 6 * H });
    // Changer la réserve seule garde l'heure du convoi.
    expect(setColonyRoute(p, id, 6, 0.5, NOW + H)!.nextAtMs).toBe(NOW + 6 * H);
    expect(setColonyRoute(p, id, 0, 0.5, NOW)).toBeNull();
    expect(p.colonies![0].route).toBeNull();
    expect(() => setColonyRoute(p, "x", 6, 0, NOW)).toThrow(/introuvable/);
  });

  it("garde la réserve, perd 10 % en route, ne dépasse pas l'entrepôt de la planète mère", () => {
    const p = withColony();
    const c = p.colonies![0];
    const cap = colonyStorage(c, p);
    for (const r of COMMON_RESOURCES) c.resources[r] = cap;
    setColonyRoute(p, c.id, 6, 0.2, NOW);
    const before = c.resources.scrap;
    const delivered = runColonyRoute(c, p, NOW + 6 * H)!;
    const taken = before - c.resources.scrap;
    expect(c.resources.scrap).toBe(Math.floor(cap * 0.2) + (before - Math.floor(cap * 0.2) - taken));
    expect(c.resources.scrap).toBeGreaterThanOrEqual(Math.floor(cap * 0.2));
    expect(delivered.scrap).toBe(Math.floor(taken * 0.9));
    expect(p.resources.scrap).toBe(delivered.scrap);
    expect(p.resources.scrap).toBeLessThanOrEqual(storageCapacityOf(p));
    // Entrepôt de la planète mère plein : rien ne part en ressources communes.
    p.resources.scrap = storageCapacityOf(p);
    c.route!.nextAtMs = NOW;
    const stock = c.resources.scrap;
    runColonyRoute(c, p, NOW + 7 * H);
    expect(c.resources.scrap).toBe(stock);
  });

  it("la ressource rare du gisement suit aussi, sans plafond", () => {
    const p = withColony();
    const c = p.colonies![0];
    const rare = colonyBiome(c);
    c.resources[rare] = 1000;
    setColonyRoute(p, c.id, 12, 0.5, NOW);
    expect(colonyRouteLoad(c, p).taken[rare]).toBe(500);
    runColonyRoute(c, p, NOW + 12 * H);
    expect(c.resources[rare]).toBe(500);
    expect(p.resources[rare]).toBe(450);
  });

  it("un seul convoi au rattrapage, le suivant reste aligné sur la cadence", () => {
    const p = withColony();
    const c = p.colonies![0];
    setColonyRoute(p, c.id, 6, 0.2, NOW);
    expect(runColonyRoute(c, p, NOW + 5 * H)).toBeNull();
    runColonyRoute(c, p, NOW + 20 * H);
    expect(c.route!.lastAtMs).toBe(NOW + 20 * H);
    expect(c.route!.nextAtMs).toBe(NOW + 24 * H);
    expect(runColonyRoute(c, p, NOW + 21 * H)).toBeNull();
  });

  it("passe par advanceColonies (rattrapage du serveur)", () => {
    const p = withColony();
    const c = p.colonies![0];
    setColonyRoute(p, c.id, 6, 0, NOW + 3 * H);
    advanceColonies(p, NOW + 10 * H);
    expect(c.route!.lastAtMs).toBe(NOW + 10 * H);
    expect(p.resources.scrap).toBeGreaterThan(0);
  });
});
