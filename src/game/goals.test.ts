import { describe, expect, it } from "vitest";
import { planGoal, sanitizeGoal, type Goal } from "@/game/goals";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { findTech, TECHNOLOGIES } from "@/game/technologies";
import type { PlayerState } from "@/types/game";

const NOW = 1_800_000_000_000;
const player = (patch: Partial<PlayerState> = {}): PlayerState => ({ ...defaultPlayerState("a", "A"), createdAtMs: NOW - 1000, resourcesUpdatedAtMs: NOW, ...patch }) as PlayerState;
const goal = (g: Partial<Goal>): Goal => ({ id: "g", kind: "building", target: "extracteur_ferraille", value: 3, createdAtMs: 0, ...g });

describe("objectifs personnels", () => {
  it("planifie les niveaux manquants d'un bâtiment, coût et date", () => {
    const p = player();
    const level = p.buildings.extracteur_ferraille?.level ?? 0;
    const plan = planGoal(p, defaultQueues(), goal({ value: level + 3 }), NOW);
    expect(plan.steps.map((s) => s.level)).toEqual([level + 1, level + 2, level + 3]);
    expect(plan.totalCost.scrap ?? 0).toBeGreaterThan(0);
    expect(plan.etaSeconds).toBeGreaterThanOrEqual(plan.buildSeconds);
    expect(plan.done).toBe(false);
  });

  it("déroule les prérequis d'une technologie avant elle", () => {
    const withPrereq = TECHNOLOGIES.find((t) => Object.keys(t.prereq).length > 0)!;
    const plan = planGoal(player(), defaultQueues(), goal({ kind: "tech", target: withPrereq.id, value: 1 }), NOW);
    const last = plan.steps[plan.steps.length - 1];
    expect(last.id).toBe(withPrereq.id);
    for (const req of Object.keys(withPrereq.prereq)) expect(plan.steps.some((s) => s.id === req)).toBe(true);
    expect(findTech(withPrereq.id)).toBeTruthy();
  });

  it("objectif atteint : rien à faire", () => {
    const p = player();
    const level = p.buildings.extracteur_ferraille?.level ?? 0;
    const plan = planGoal(p, defaultQueues(), goal({ value: Math.max(1, level) }), NOW);
    if (level >= 1) {
      expect(plan.done).toBe(true);
      expect(plan.progress).toBe(1);
    }
  });

  it("refuse les objectifs malformés", () => {
    expect(sanitizeGoal({ id: "x", kind: "building", target: "a", value: 0 })).toBeNull();
    expect(sanitizeGoal({ id: "x", kind: "magie", target: "a", value: 3 })).toBeNull();
    expect(sanitizeGoal({ id: "x", kind: "fleet", target: "chasseur", value: 1e9 })?.value).toBe(100_000);
  });
});
