import { shelterExtraHours } from "@/game/buildingTiers";
import { describe, expect, it } from "vitest";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { BUILDINGS } from "@/game/buildings";
import { capacityProtected, ECONOMY_RULES, exposureView, hourlyProduction, protectedAmount } from "@/game/economy";
import { activeBuildCount, advanceBuildPlan, buildSlotBlocker, buildSlots } from "@/game/buildPlan";
import { performPlayerAction } from "@/game/actions";
import type { PlayerState, QueuesState } from "@/types/game";

/* 5.32 : entrepôt et pillage (proposals/entrepot-pillage.md, option A + C),
   chantiers en parallèle (proposals/constructeurs.md, option C). */

const BEFORE = ECONOMY_RULES.protectedHoursFromMs - 3600_000;
const AFTER = ECONOMY_RULES.protectedHoursFromMs + 3600_000;

function endgame(): PlayerState {
  const p = defaultPlayerState("u1", "Thésauriseur") as PlayerState;
  for (const b of BUILDINGS) p.buildings[b.id] = { level: Math.min(20, b.maxLevel), unlocked: true };
  p.techLevels = { ...p.techLevels };
  p.resources = { ...p.resources, scrap: 30e9, energy: 30e9, nano: 30e9, data: 30e9 };
  return p;
}

describe("5.32 entrepôt : au plus 8 h de production à l'abri", () => {
  it("avant l'activation, la règle de capacité ne change pas", () => {
    const p = endgame();
    expect(protectedAmount(p.buildings, "scrap", p.techLevels, undefined, p, BEFORE)).toBe(capacityProtected(p.buildings, "scrap", p.techLevels, undefined, p));
  });

  it("après l'activation : min(capacité, max(plancher, 8 h de production)), jamais au-dessus de la règle de capacité", () => {
    const p = endgame();
    const cap = capacityProtected(p.buildings, "scrap", p.techLevels, undefined, p);
    // 6.14.143 (PB-L2) : entrepôt 20 = palier « Entrepôt orbital » (+4 h pour les 4 ressources), toujours sous la règle de capacité.
    const eight = Math.floor(hourlyProduction(p.buildings, "scrap", p.techLevels) * (ECONOMY_RULES.protectedHours + shelterExtraHours(p, "scrap")));
    const now = protectedAmount(p.buildings, "scrap", p.techLevels, undefined, p, AFTER);
    expect(now).toBe(Math.min(cap, Math.max(ECONOMY_RULES.protectedFloor, eight)));
    expect(now).toBeLessThanOrEqual(cap);
  });

  it("un compte neuf garde au moins le plancher (ou toute sa capacité si elle est plus petite)", () => {
    const p = defaultPlayerState("u2", "Neuf") as PlayerState;
    const cap = capacityProtected(p.buildings, "scrap", p.techLevels, undefined, p);
    expect(protectedAmount(p.buildings, "scrap", p.techLevels, undefined, p, AFTER)).toBe(Math.min(cap, ECONOMY_RULES.protectedFloor));
  });

  it("« ce que tu risques » annonce la part à l'abri après l'activation", () => {
    const p = endgame();
    const v = exposureView(p, BEFORE);
    expect(v.active).toBe(false);
    const line = v.lines.find((l) => l.res === "scrap")!;
    expect(line.protectedSoon).toBe(protectedAmount(p.buildings, "scrap", p.techLevels, undefined, p, AFTER));
    expect(line.exposedNow).toBe(Math.max(0, line.stock - line.protectedNow));
  });

  it("0 heure = règle de capacité seule (réglage admin)", () => {
    const p = endgame();
    const saved = ECONOMY_RULES.protectedHours;
    ECONOMY_RULES.protectedHours = 0;
    try {
      expect(protectedAmount(p.buildings, "scrap", p.techLevels, undefined, p, AFTER)).toBe(capacityProtected(p.buildings, "scrap", p.techLevels, undefined, p));
    } finally {
      ECONOMY_RULES.protectedHours = saved;
    }
  });
});

describe("5.32 chantiers : 6 de base, +1 à la Fonderie quantique 5 et 10", () => {
  it("paliers", () => {
    const p = defaultPlayerState("u1", "Bâtisseur") as PlayerState;
    expect(buildSlots(p)).toBe(6);
    p.buildings.fonderie_quantique = { level: 5, unlocked: true };
    expect(buildSlots(p)).toBe(7);
    p.buildings.fonderie_quantique = { level: 10, unlocked: true };
    expect(buildSlots(p)).toBe(8);
  });

  it("un 7e lancement est refusé avec la sortie dans le message ; les chantiers en trop déjà lancés continuent", () => {
    const p = endgame();
    p.buildings = { ...p.buildings };
    for (const b of BUILDINGS) p.buildings[b.id] = { level: 1, unlocked: true };
    p.buildings.fonderie_quantique = { level: 1, unlocked: true };
    const q = defaultQueues() as QueuesState;
    const ids = BUILDINGS.map((b) => b.id);
    // 9 chantiers hérités d'avant la limite : ils restent.
    for (const id of ids.slice(0, 9)) (q.buildingUpgrades as Record<string, unknown>)[id] = { endTime: Date.now() + 3600_000, startedAtMs: Date.now(), paid: {} };
    expect(activeBuildCount(q)).toBe(9);
    expect(buildSlotBlocker(p, q)).toMatch(/Fonderie quantique niveau 5/);
    expect(() => performPlayerAction(p, q, { type: "upgradeBuilding", buildingId: ids[10] }, Date.now())).toThrow(/chantiers sont occupés/);
  });

  it("la file planifiée attend un chantier libre sans expirer", () => {
    const p = endgame();
    for (const b of BUILDINGS) p.buildings[b.id] = { level: 1, unlocked: true };
    const q = defaultQueues() as QueuesState;
    const ids = BUILDINGS.map((b) => b.id);
    for (const id of ids.slice(0, 6)) (q.buildingUpgrades as Record<string, unknown>)[id] = { endTime: Date.now() + 3600_000, startedAtMs: Date.now(), paid: {} };
    q.buildPlan = [{ buildingId: ids[8], level: 2, addedAtMs: 0 }];
    advanceBuildPlan(p, q, Date.now() + 48 * 3600_000);
    expect(q.buildPlan).toHaveLength(1);
    expect(q.buildPlan?.[0].waitingSinceMs).toBeUndefined();
  });
});
