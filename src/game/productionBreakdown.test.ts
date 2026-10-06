import { describe, expect, it } from "vitest";
import { BUILDINGS } from "@/game/buildings";
import { defaultPlayerState } from "@/game/defaults";
import { productionBreakdown } from "@/game/economy";
import { chooseEmpireClass } from "@/game/empireClassChoose";
import type { PlayerState } from "@/types/game";

/* 6.1 (lot L) : la décomposition redonne la production affichée. */

const NOW = Date.UTC(2026, 9, 20, 12);

describe("d'où vient la production", () => {
  it("base × multiplicateurs = production brute (à l'arrondi près), classe comprise", () => {
    const p = { ...defaultPlayerState("u", "U"), createdAt: null } as unknown as PlayerState;
    for (const b of BUILDINGS) p.buildings[b.id] = { level: 12, unlocked: true };
    p.techLevels = { ...(p.techLevels ?? {}), production: 5 } as PlayerState["techLevels"];
    chooseEmpireClass(p, "industriel", NOW);
    const b = productionBreakdown(p, "scrap", NOW);
    expect(b.baseHourly).toBeGreaterThan(0);
    expect(b.lines.some((l) => /classe/.test(l.label))).toBe(true);
    const product = b.lines.reduce((a, l) => a * l.factor, b.baseHourly);
    expect(Math.abs(product - b.totalHourly) / b.totalHourly).toBeLessThan(0.01);
  });
});
