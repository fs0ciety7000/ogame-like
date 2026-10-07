import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent, defaultGameContent } from "@/game/content";
import { getTechCost, getTechTime, RESEARCH_RULES, TECHNOLOGIES } from "@/game/technologies";

/* 6.14.84 (RL-1, proposals/rythme-long-terme.md §5.1) : recherche réglable dans l'admin.
   Les valeurs par défaut sont neutres : le jeu ne change pas (mêmes coûts et durées qu'avec les
   anciennes constantes du code, 2,7 et 1,67). La bascule est le lot RL-3. */

/** Formules d'avant 6.14.84, constantes en dur. */
const oldCost = (t: (typeof TECHNOLOGIES)[number], level: number) => {
  const f = Math.pow(t.costGrowth ?? 2.7, level - 1);
  return Object.fromEntries(Object.entries(t.baseCost).map(([k, n]) => [k, Math.floor(n * f)]));
};
const oldTime = (t: (typeof TECHNOLOGIES)[number], level: number) => Math.floor(t.baseTime * Math.pow(1.67, level - 1));

afterEach(() => applyGameContent({}));

describe("6.14.84 (RL-1) recherche réglable", () => {
  it("valeurs par défaut neutres : chaque niveau de chaque techno coûte et dure exactement comme avant", () => {
    expect(RESEARCH_RULES).toMatchObject({ costGrowth: 2.7, timeGrowth: 1.67, lateFromLevel: 0, lateTimeFactor: 1, maxLevelSeconds: 0 });
    let checked = 0;
    for (const t of TECHNOLOGIES) {
      for (let level = 1; level <= t.maxLevel; level++) {
        expect(getTechCost(t, level), `${t.id} niv. ${level}`).toEqual(oldCost(t, level));
        expect(getTechTime(t, level), `${t.id} niv. ${level}`).toBe(oldTime(t, level));
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(200);
  });

  it("réglages appliqués : croissances, recherche tardive dès un niveau, plafond d'un niveau", () => {
    const t = TECHNOLOGIES.find((x) => x.maxLevel >= 8 && x.costGrowth === undefined)!;
    applyGameContent({ rules: { research: { costGrowth: 3, timeGrowth: 2 } } as never });
    expect(getTechCost(t, 3)).toEqual(Object.fromEntries(Object.entries(t.baseCost).map(([k, n]) => [k, Math.floor(n * 9)])));
    expect(getTechTime(t, 3)).toBe(Math.floor(t.baseTime * 4));
    // Réglage partiel : la file du Labo garde sa valeur.
    expect(RESEARCH_RULES.maxConcurrent).toBe(4);

    applyGameContent({ rules: { research: { lateFromLevel: 6, lateTimeFactor: 30, maxLevelSeconds: 604_800 } } as never });
    expect(getTechTime(t, 5)).toBe(oldTime(t, 5));
    expect(getTechTime(t, 6)).toBe(Math.min(604_800, Math.floor(t.baseTime * Math.pow(1.67, 5) * 30)));
    expect(getTechTime(t, t.maxLevel)).toBeLessThanOrEqual(604_800);
    // Le coût ne bouge pas avec la recherche tardive (seule la durée change, RL-Q3).
    expect(getTechCost(t, 6)).toEqual(oldCost(t, 6));
  });

  it("réglage vidé ou absurde : la valeur par défaut reprend (pas de durée nulle ni infinie)", () => {
    const t = TECHNOLOGIES[0];
    applyGameContent({ rules: { research: { timeGrowth: 0, costGrowth: -1, lateFromLevel: 1, lateTimeFactor: 0 } } as never });
    expect(getTechTime(t, 2)).toBe(oldTime(t, 2));
    expect(getTechCost(t, 2)).toEqual(oldCost(t, 2));
  });

  it("les valeurs par défaut sont dans GameRules, et l'éditeur Labo règle chaque champ", () => {
    expect(defaultGameContent().rules.research).toEqual(RESEARCH_RULES);
    const panels = readFileSync("src/pages/admin/panels.tsx", "utf8");
    expect(panels).toMatch(/<RhythmRulesFields rules=\{rules\} setRules=\{setRules\} \/>/);
    const fields = readFileSync("src/pages/admin/RhythmRulesFields.tsx", "utf8");
    for (const key of Object.keys(RESEARCH_RULES)) expect(fields, key).toMatch(new RegExp(`setResearch\\(\\{ ${key}:`));
  });
});
