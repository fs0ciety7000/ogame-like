import { describe, expect, it } from "vitest";
import { BUILDINGS } from "@/game/buildings";
import { buildSlots } from "@/game/buildPlan";
import { defaultPlayerState } from "@/game/defaults";
import { EMPIRE_CLASSES, EMPIRE_CLASS_RULES, empireClassEffects, empireClassPrice } from "@/game/empireClass";
import { chooseEmpireClass } from "@/game/empireClassChoose";
import { expeditionsPerDay } from "@/game/expeditions";
import { fleetSlots } from "@/game/fleets";
import { effectImpactReport } from "@/game/impact";
import { playerModifiers } from "@/game/modifiers";
import { bountyState } from "@/game/bounties";
import type { PlayerState } from "@/types/game";

/* 6.0 (proposals/classes-empire.md) : classes d'empire. */

const NOW = Date.UTC(2026, 9, 7, 12);
const DAY = 86_400_000;

function player(amber = 0): PlayerState {
  const p = { ...defaultPlayerState("u1", "Classe"), createdAt: null } as unknown as PlayerState;
  for (const b of BUILDINGS) p.buildings[b.id] = { level: 1, unlocked: true };
  const st = bountyState(p);
  st.amber = amber;
  p.bounties = st;
  return p;
}

describe("classes d'empire", () => {
  it("premier choix gratuit, puis 100 Ambre et 7 jours d'attente", () => {
    const p = player(150);
    expect(empireClassPrice(p)).toBe(0);
    chooseEmpireClass(p, "industriel", NOW);
    expect(p.empireClass).toMatchObject({ id: "industriel", chosenAtMs: NOW, changes: 0 });
    expect(bountyState(p).amber).toBe(150);
    expect(() => chooseEmpireClass(p, "industriel", NOW + 8 * DAY)).toThrow(/déjà Industriel/);
    expect(() => chooseEmpireClass(p, "seigneur", NOW + DAY)).toThrow(/trop récemment/);
    chooseEmpireClass(p, "seigneur", NOW + 7 * DAY);
    expect(p.empireClass).toMatchObject({ id: "seigneur", changes: 1 });
    expect(bountyState(p).amber).toBe(150 - EMPIRE_CLASS_RULES.changeAmber);
    expect(() => chooseEmpireClass(p, "explorateur", NOW + 14 * DAY)).toThrow(/100 Ambre/);
    expect(() => chooseEmpireClass(p, "pirate", NOW + 14 * DAY)).toThrow(/inconnue/);
  });

  it("les effets passent par la couche empire du circuit", () => {
    const p = player();
    expect(empireClassEffects(p)).toEqual([]);
    chooseEmpireClass(p, "industriel", NOW);
    const m = playerModifiers(p, NOW);
    expect(m.productionAll).toBeCloseTo(0.1);
    expect(m.buildTime).toBeCloseTo(0.08);
    expect(m.storage).toBeCloseTo(0.1);
    expect(empireClassEffects(p).every((g) => g.layer === "empire" && g.source.kind === "class")).toBe(true);
  });

  it("avantages propres : chantier, emplacements de flotte, expédition", () => {
    const base = player();
    const b = buildSlots(base);
    const f = fleetSlots(base);
    const e = expeditionsPerDay(base);
    const ind = player();
    chooseEmpireClass(ind, "industriel", NOW);
    expect(buildSlots(ind)).toBe(b + 1);
    expect(fleetSlots(ind)).toBe(f);
    const war = player();
    chooseEmpireClass(war, "seigneur", NOW);
    expect(fleetSlots(war)).toBe(f + 2);
    expect(playerModifiers(war, NOW).loot).toBeCloseTo(0.15);
    const exp = player();
    chooseEmpireClass(exp, "explorateur", NOW);
    expect(expeditionsPerDay(exp)).toBe(e + 1);
    expect(playerModifiers(exp, NOW).spyLevel).toBe(1);
  });

  it("chaque classe apparaît dans le rapport d'impact", () => {
    const labels = new Set(effectImpactReport().flatMap((r) => r.sources.filter((s) => s.kind === "class").map((s) => s.label)));
    for (const c of EMPIRE_CLASSES) expect(labels.has(c.name)).toBe(true);
  });
});
