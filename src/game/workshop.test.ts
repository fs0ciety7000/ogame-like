import { describe, expect, it } from "vitest";
import { COMBAT_RULES, resolveCombat, unitBaseHp } from "@/game/combat";
import { defaultPlayerState } from "@/game/defaults";
import { advanceWorkshop, applyBossWear, applyHull, bossAssaultLosses, hullPercent, rushWorkshop, sendToWorkshop, workshopEta, workshopRate, workshopRushCost, workshopState, workshopUnits } from "@/game/workshop";
import { withWorkshop, hangarUsed } from "@/game/actions";
import type { PlayerState, Units } from "@/types/game";

const NOW = Date.UTC(2026, 9, 6, 12);

function player(atelier = 5): PlayerState {
  const p = defaultPlayerState("u1", "Testeur") as PlayerState;
  p.units = { chasseur: { level: 1, count: 100 }, canon_plasma: { level: 1, count: 50 } } as Units;
  p.buildings = { ...p.buildings, atelier_reparation: { level: atelier, unlocked: atelier > 0 } };
  return p;
}

describe("5.20 points de vie conservés", () => {
  const duel = (hull?: Record<string, number>) =>
    resolveCombat({
      attackerUnits: { chasseur: { level: 1, count: 200 } },
      attackerTechLevels: {},
      attackerRepairPct: 0,
      fleet: { chasseur: 200 },
      defenderUnits: { canon_plasma: { level: 1, count: 300 } },
      defenderTechLevels: {},
      defenderRepairPct: 0,
      defenderResources: {},
      attackerHull: hull,
    });

  it("une part des PV perdus reste en dégâts sur les survivants", () => {
    const r = duel();
    expect(r.attackerHull?.chasseur ?? 0).toBeGreaterThan(0);
    expect(r.defenderHull?.canon_plasma ?? 0).toBeGreaterThan(0);
    // Les dégâts ne dépassent jamais hullMaxDamage des survivants.
    const survivors = 200 - (r.attackerLosses.chasseur ?? 0);
    expect(r.attackerHull!.chasseur).toBeLessThanOrEqual(survivors * 300 * COMBAT_RULES.hullMaxDamage + 1);
  });

  it("les unités détruites emportent leur part des dégâts : pas de destruction en cascade des survivantes", () => {
    // 1 000 chasseurs usés à 30 %, face à une défense qui en détruit une bonne partie.
    const r = resolveCombat({
      attackerUnits: { chasseur: { level: 1, count: 1000 } },
      attackerTechLevels: {},
      attackerRepairPct: 0,
      fleet: { chasseur: 1000 },
      defenderUnits: { lance_gravitationnelle: { level: 1, count: 40 } },
      defenderTechLevels: {},
      defenderRepairPct: 0,
      defenderResources: {},
      attackerHull: { chasseur: 1000 * 300 * 0.3 },
    });
    const survivors = 1000 - (r.attackerLosses.chasseur ?? 0);
    expect(survivors).toBeGreaterThan(0);
    // L'usure moyenne des survivantes reste du même ordre (pas 90 %).
    expect((r.attackerHull?.chasseur ?? 0) / (survivors * 300)).toBeLessThan(0.6);
  });

  it("une flotte abîmée se bat moins bien", () => {
    const fresh = duel();
    const damaged = duel({ chasseur: 200 * 300 * 0.5 });
    expect(damaged.rounds![0].attackerDamage).toBeLessThan(fresh.rounds![0].attackerDamage);
    expect(damaged.attackerPower).toBeLessThan(fresh.attackerPower);
  });
});

describe("5.20 Atelier de réparation", () => {
  it("les unités sauvées quittent le hangar et y reviennent une fois réparées", () => {
    const p = player(5);
    sendToWorkshop(p, { chasseur: 10 }, NOW, "defense", true);
    expect(p.units.chasseur.count).toBe(90);
    expect(workshopUnits(p)).toEqual({ chasseur: 10 });
    // Elles gardent leur place de hangar.
    expect(hangarUsed(p.units, withWorkshop({}, p), "attack")).toBe(hangarUsed({ chasseur: { level: 1, count: 100 } } as Units, {}, "attack"));
    const hp = 10 * unitBaseHp(p.units, {}, "chasseur");
    const seconds = hp / workshopRate(p);
    expect(advanceWorkshop(p, NOW + (seconds / 2) * 1000)).toEqual([]);
    expect(p.units.chasseur.count).toBe(90);
    const notes = advanceWorkshop(p, NOW + (seconds + 1) * 1000);
    expect(p.units.chasseur.count).toBe(100);
    expect(notes[0].message).toMatch(/10 × Chasseur/);
    expect(workshopState(p).jobs).toHaveLength(0);
  });

  it("répare ensuite les coques, plus vite avec un Atelier de plus haut niveau", () => {
    const low = player(1);
    const high = player(10);
    expect(workshopRate(high)).toBeGreaterThan(workshopRate(low));
    expect(workshopRate(player(0))).toBeGreaterThan(0);
    for (const p of [low, high]) {
      p.workshop = { updatedAtMs: NOW, jobs: [], hull: {} };
      applyHull(p, { chasseur: 6000 });
      expect(hullPercent(p, "chasseur")).toBeCloseTo(1 - 6000 / (100 * 300));
      advanceWorkshop(p, NOW + 60_000);
    }
    expect(hullPercent(high, "chasseur")).toBeGreaterThan(hullPercent(low, "chasseur"));
  });

  it("annonce les heures de fin et termine tout d'un coup en compte test", () => {
    const p = player(3);
    sendToWorkshop(p, { chasseur: 5, canon_plasma: 2 }, NOW, "raid", true);
    applyHull(p, { chasseur: 900 });
    const eta = workshopEta(p, NOW);
    expect(eta.jobs).toHaveLength(2);
    expect(eta.jobs[1].endsAtMs).toBeGreaterThan(eta.jobs[0].endsAtMs);
    expect(eta.hullDoneAtMs).toBeGreaterThan(eta.jobs[1].endsAtMs);
    advanceWorkshop(p, NOW + 1, true);
    expect(workshopState(p).jobs).toHaveLength(0);
    expect(workshopState(p).hull).toEqual({});
    expect(p.units.chasseur.count).toBe(100);
  });

  it("les PNJ ne passent pas par l'Atelier", () => {
    const npc = { ...player(5), npc: "zharkesh" } as PlayerState;
    sendToWorkshop(npc, { chasseur: 10 }, NOW, "attack", true);
    expect(npc.units.chasseur.count).toBe(100);
    expect(npc.workshop).toBeUndefined();
  });
});

describe("5.21 seigneurs de guerre et boss", () => {
  it("un seigneur de guerre garde ses dégâts et les répare à l'heure, sans Atelier", () => {
    const npc = player(0);
    npc.npc = "vorn";
    const max = 100 * unitBaseHp(npc.units, npc.techLevels, "chasseur");
    applyHull(npc, { chasseur: max * 0.5 });
    npc.workshop = { ...workshopState(npc), updatedAtMs: NOW };
    expect(hullPercent(npc, "chasseur")).toBeCloseTo(0.5, 2);
    advanceWorkshop(npc, NOW + 3 * 3600_000);
    expect(hullPercent(npc, "chasseur")).toBeCloseTo(0.5 + 3 * COMBAT_RULES.warlordHullRepairPerHour, 2);
    advanceWorkshop(npc, NOW + 24 * 3600_000);
    expect(hullPercent(npc, "chasseur")).toBe(1);
    // Ses unités sauvées ne passent jamais par une file d'Atelier.
    sendToWorkshop(npc, { chasseur: 10 }, NOW, "attack", true);
    expect(workshopUnits(npc)).toEqual({});
  });

  it("un assaut de boss envoie les unités sauvées à l'Atelier et abîme les survivantes", () => {
    const p = player(5);
    const { survivors, lost, recovered, hull } = bossAssaultLosses(p, { chasseur: 100 }, 0.1, 0.5, true);
    expect(lost.chasseur).toBe(5);
    expect(recovered.chasseur).toBe(5);
    expect(survivors.chasseur).toBe(90);
    expect(hull.chasseur).toBeGreaterThan(0);
    p.units.chasseur.count = 0; // flotte partie
    applyBossWear(p, { recovered, hull, survivors }, NOW);
    expect(workshopUnits(p)).toEqual({ chasseur: 5 });
    expect(workshopState(p).hull.chasseur).toBe(hull.chasseur);
    // Boss parti : ni pertes ni usure.
    expect(bossAssaultLosses(p, { chasseur: 100 }, 0.1, 0.5, false)).toMatchObject({ lost: {}, recovered: {}, hull: {}, survivors: { chasseur: 100 } });
  });
});

describe("5.21 cadence et réparation accélérée", () => {
  it("Nanoréparation, Mécanicien et Vaisseaux-ateliers accélèrent l'Atelier", () => {
    const p = player(5);
    const base = workshopRate(p);
    p.techLevels = { ...p.techLevels, tech27: 5 };
    expect(workshopRate(p)).toBeCloseTo(base * 1.5, 5);
    p.units.vaisseau_atelier = { level: 1, count: 2 };
    expect(workshopRate(p)).toBeCloseTo((base + 30) * 1.5, 5);
  });

  it("l'Ambre termine un lot tout de suite, au prix du temps restant", () => {
    const p = player(1);
    p.bounties = { ...(p.bounties ?? {}), amber: 50 } as never;
    sendToWorkshop(p, { chasseur: 40 }, NOW, "attack", true);
    const job = workshopState(p).jobs[0];
    const { amber, seconds } = workshopRushCost(p, job.id);
    expect(amber).toBe(Math.max(1, Math.ceil(seconds / COMBAT_RULES.workshopRushSecondsPerAmber)));
    const before = p.units.chasseur.count;
    const out = rushWorkshop(p, job.id, NOW, (x) => ({ amber: (x.bounties as { amber: number }).amber }), (x, w) => ((x.bounties as { amber: number }).amber = w.amber));
    expect(out.units.chasseur).toBe(40);
    expect(p.units.chasseur.count).toBe(before + 40);
    expect(workshopState(p).jobs).toHaveLength(0);
    expect((p.bounties as { amber: number }).amber).toBe(50 - amber);
    expect(() => rushWorkshop(p, job.id, NOW, () => ({ amber: 99 }), () => undefined)).toThrow(/plus à l'Atelier/);
  });
});
