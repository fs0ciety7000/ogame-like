import { describe, expect, it } from "vitest";
import { BUILDINGS } from "@/game/buildings";
import { COLONY_RULES, advanceColonies, buildColonyDefense, colonyBuildingIds, colonyDefenseHangar, colonyDefenseSeconds, colonyHourlyRates, colonyUpgradeCost, collectFromColony, deliverToColony, homeLevels, nextColonySlot, parseCargo, startColonization, upgradeColonyBuilding } from "@/game/colonies";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { flushState } from "@/game/flush";
import { findUnit, UNITS } from "@/game/units";
import type { PlayerState } from "@/types/game";

const NOW = Date.UTC(2026, 9, 7, 12);
const H = 3600_000;

function empire(levels = 15): PlayerState {
  const p = { ...defaultPlayerState("u1", "Colon"), createdAt: null } as unknown as PlayerState;
  for (const b of BUILDINGS) p.buildings[b.id] = { level: levels, unlocked: true };
  for (const k of Object.keys(p.resources)) (p.resources as Record<string, number>)[k] = 2e9;
  p.resourcesUpdatedAtMs = NOW;
  return p;
}

describe("colonies", () => {
  it("requires cumulative levels, pays the colony ship and founds the colony on arrival", () => {
    const small = empire(5);
    expect(() => startColonization(small, "Néo", NOW)).toThrow(/120 niveaux/);
    const p = empire();
    const job = startColonization(p, "Néo-Avalon", NOW);
    expect(job).toMatchObject({ slot: 1, endTime: NOW + 2 * H });
    expect(p.resources.scrap).toBe(2e9 - 50_000_000);
    expect(p.resources.aiFragment).toBe(2e9 - 1_000_000);
    expect(() => startColonization(p, "Bis", NOW)).toThrow(/déjà en route/);
    expect(advanceColonies(p, NOW + H)).toHaveLength(0);
    const notes = advanceColonies(p, NOW + 3 * H);
    expect(notes[0].title).toMatch(/Nouvelle colonie/);
    expect(p.colonies).toHaveLength(1);
    const c = p.colonies![0];
    expect(c.id).toBe("u1-c1");
    expect(Object.keys(c.buildings).sort()).toEqual(colonyBuildingIds().sort());
    // Elle produit depuis sa fondation (1 h avant ce rattrapage).
    expect(c.resources.scrap).toBeGreaterThan(COLONY_RULES.startStock);
    expect(nextColonySlot(p)).toEqual({ slot: 2, levels: 140 });
  });

  it("has separate stocks: buildings and defenses are paid by the colony", () => {
    const p = empire();
    startColonization(p, "Néo", NOW);
    advanceColonies(p, NOW + 2 * H);
    const c = p.colonies![0];
    const homeScrap = p.resources.scrap;
    const extractor = colonyBuildingIds()[0];
    const cost = colonyUpgradeCost(p, extractor, 2);
    const before = c.resources.scrap;
    const job = upgradeColonyBuilding(p, c.id, extractor, NOW + 2 * H);
    expect(c.resources.scrap).toBe(before - (cost.scrap ?? 0));
    expect(p.resources.scrap).toBe(homeScrap);
    expect(() => upgradeColonyBuilding(p, c.id, extractor, NOW + 2 * H)).toThrow(/déjà en cours/);
    advanceColonies(p, job.endTime + 1);
    expect(c.buildings[extractor].level).toBe(2);
    // Coût × 1,5, niveau 15 au plus.
    c.buildings[extractor].level = 15;
    expect(() => upgradeColonyBuilding(p, c.id, extractor, job.endTime + 2)).toThrow(/maximum/);
    // Défenses : débloquées sur la planète mère, payées par la colonie.
    const def = UNITS.find((u) => u.category === "defense")!;
    expect(() => buildColonyDefense(p, c.id, def.id, 1, job.endTime + 2)).toThrow(/Débloque/);
    p.units[def.id] = { level: 2, count: 0 };
    const d = buildColonyDefense(p, c.id, def.id, 2, job.endTime + 2);
    // Durée et place affichées = celles appliquées par le serveur.
    expect(d.endTime - (job.endTime + 2)).toBe(colonyDefenseSeconds(p, def.id, 2) * 1000);
    advanceColonies(p, d.endTime);
    expect(c.defenses[def.id]).toEqual({ level: 2, count: 2 });
    const hangar = colonyDefenseHangar(c);
    expect(hangar.used).toBe(2 * def.hangarSpace);
    expect(() => buildColonyDefense(p, c.id, def.id, Math.floor((hangar.capacity - hangar.used) / def.hangarSpace) + 1, d.endTime)).toThrow(/Capacité/);
    expect(findUnit(def.id)).toBeTruthy();
  });

  it("is rolled forward by the player flush and produces with empire bonuses", () => {
    const p = empire();
    startColonization(p, "Néo", NOW);
    const out = flushState(p, defaultQueues(), NOW + 3 * H);
    expect(out.player.colonies).toHaveLength(1);
    const rates = colonyHourlyRates(out.player.colonies![0], out.player);
    const boosted = colonyHourlyRates(out.player.colonies![0], { ...out.player, ascensions: 1 });
    expect((boosted.scrap ?? 0) / (rates.scrap ?? 1)).toBeCloseTo(1.1, 1);
  });

  it("loads cargo within capacity, delivers and collects", () => {
    expect(() => parseCargo({ scrap: 600, energy: 600 }, 1000)).toThrow(/soute/);
    expect(parseCargo({ scrap: 600, energy: -3, bogus: 9 }, 1000)).toEqual({ scrap: 600 });
    const p = empire();
    startColonization(p, "Néo", NOW);
    advanceColonies(p, NOW + 2 * H);
    const c = p.colonies![0];
    deliverToColony(c, { reinforcedSteel: 500 });
    expect(c.resources.reinforcedSteel).toBe(500);
    c.resources.scrap = 3000;
    c.resources.energy = 1000;
    for (const k of ["nano", "data", "reinforcedSteel"] as const) c.resources[k] = 0;
    const taken = collectFromColony(c, {}, 2000);
    expect(taken).toEqual({ scrap: 1500, energy: 500 });
    expect(c.resources.scrap).toBe(1500);
    expect(collectFromColony(c, { energy: 100 }, 2000)).toEqual({ energy: 100 });
  });
});

describe("v4.9.3 : niveaux requis pour fonder", () => {
  it("les bâtiments de fin de partie comptent", () => {
    const p = empire(0);
    p.buildings.fonderie_quantique = { level: 5, unlocked: true };
    p.buildings.generateur_bouclier = { level: 3, unlocked: true };
    expect(homeLevels(p)).toBe(8);
  });
});
