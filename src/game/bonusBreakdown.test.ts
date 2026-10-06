import { describe, expect, it } from "vitest";
import { defaultPlayerState } from "@/game/defaults";
import { buildTimeBreakdown, playerBuildTimeFactor, playerResearchTimeFactor, researchTimeBreakdown } from "@/game/bonuses";
import type { PlayerState } from "@/types/game";

/* 5.31 (lot D) : « d'où vient ce chiffre ». Le détail affiché redonne exactement le facteur appliqué. */

const NOW = Date.UTC(2026, 9, 8, 12);
const product = (lines: { factor: number }[]) => lines.reduce((a, l) => a * l.factor, 1);

describe("détail des durées", () => {
  it("le produit des lignes vaut le facteur appliqué (construction et recherche)", () => {
    const p = defaultPlayerState("u1", "Curieux") as PlayerState;
    p.techLevels = { ...p.techLevels, tech1: 5, tech2: 5, tech3: 5, tech10: 5 };
    p.ascensions = 2;
    expect(product(buildTimeBreakdown(p, NOW))).toBeCloseTo(playerBuildTimeFactor(p, NOW), 10);
    expect(product(researchTimeBreakdown(p, NOW))).toBeCloseTo(playerResearchTimeFactor(p, NOW), 10);
  });

  it("sans aucun bonus, aucune ligne (temps de base)", () => {
    const p = defaultPlayerState("u1", "Neuf") as PlayerState;
    const lines = buildTimeBreakdown(p, NOW);
    expect(product(lines)).toBeCloseTo(playerBuildTimeFactor(p, NOW), 10);
    expect(lines.every((l) => l.factor !== 1)).toBe(true);
  });
});
