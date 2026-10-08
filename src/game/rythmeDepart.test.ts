import { afterEach, describe, expect, it } from "vitest";
import { BUILD_TIME_RULES, BUILDINGS, findBuilding, getBuildingUpgradeTime, requiredForAscension, type BuildingDef } from "@/game/buildings";
import { applyGameContent } from "@/game/content";
import { RHYTHM_RULES } from "@/game/rhythm";
import { PROGRESSION_PROFILES, simulateProgression } from "@/game/balance/progressionSim";

/* 6.14.159 (RD-1, docs/proposals/rythme-du-depart.md) : courbe du départ des bâtiments (invariant I49).
   Premier palier géométrique : niveau 2 en secondes, dernier niveau du premier palier inchangé, aucun niveau plus long
   qu'avant (avant la bascule du rythme), jonction lissée avec le second palier (écart ≤ junctionMaxRatio). */

const ext = () => findBuilding("extracteur_ferraille")!;
const linear = (b: BuildingDef, l: number) => (l - 1) * b.upgrade.secondsPerLevel;
const lastFirstTier = (b: BuildingDef) => (b.upgrade.tier2 ? Math.min(b.maxLevel, b.upgrade.tier2.fromLevel - 1) : b.maxLevel);

afterEach(() => {
  applyGameContent({});
});

describe("RD-1 : courbe du départ (I49)", () => {
  it("extracteur : niveau 2 en 20 s, niveau 5 en quelques minutes, niveau 10 inchangé (1 h 30), puis 3 h au 11", () => {
    applyGameContent({});
    const b = ext();
    expect(getBuildingUpgradeTime(b, 2)).toBe(20);
    expect(getBuildingUpgradeTime(b, 5)).toBeLessThanOrEqual(5 * 60);
    expect(getBuildingUpgradeTime(b, 8)).toBeLessThan(3600);
    expect(getBuildingUpgradeTime(b, 10)).toBe(5400);
    expect(getBuildingUpgradeTime(b, 11)).toBe(10_800);
    // Cumul jusqu'au niveau 5 : 7 h 30 → moins de 10 min.
    const sum = (to: number) => Array.from({ length: to - 1 }, (_, i) => getBuildingUpgradeTime(b, i + 2)).reduce((a, x) => a + x, 0);
    expect(sum(5)).toBeLessThan(600);
    expect(sum(10)).toBeLessThan(0.5 * 27_000);
  });

  it("avant la bascule : chaque bâtiment monte en continu, jamais plus long qu'avant au premier palier, écart ≤ ×2,1 jusqu'au second palier", () => {
    applyGameContent({});
    for (const b of BUILDINGS) {
      const last = lastFirstTier(b);
      for (let l = 3; l <= b.maxLevel; l++) expect(getBuildingUpgradeTime(b, l), `${b.id} ${l}`).toBeGreaterThanOrEqual(getBuildingUpgradeTime(b, l - 1));
      for (let l = 2; l <= last; l++) expect(getBuildingUpgradeTime(b, l), `${b.id} ${l}`).toBeLessThanOrEqual(linear(b, l));
      expect(getBuildingUpgradeTime(b, last), b.id).toBe(linear(b, last));
      const upTo = b.upgrade.tier2 ? Math.min(b.maxLevel, b.upgrade.tier2.fromLevel) : last;
      for (let l = 3; l <= upTo; l++) expect(getBuildingUpgradeTime(b, l) / getBuildingUpgradeTime(b, l - 1), `${b.id} ${l}`).toBeLessThanOrEqual(2.1);
    }
  });

  it("après la bascule : jonction lissée, écart ≤ junctionMaxRatio jusqu'au niveau 11 (au lieu de ×24), second palier inchangé", () => {
    applyGameContent({}, RHYTHM_RULES.switchAt);
    const ratio = BUILD_TIME_RULES.junctionMaxRatio;
    expect(ratio).toBe(4);
    for (const b of BUILDINGS.filter(requiredForAscension)) {
      const t2 = b.upgrade.tier2!;
      expect(t2.baseSeconds, b.id).toBe(RHYTHM_RULES.tier2BaseSeconds);
      expect(getBuildingUpgradeTime(b, t2.fromLevel), b.id).toBe(RHYTHM_RULES.tier2BaseSeconds);
      for (let l = 3; l <= t2.fromLevel; l++) expect(getBuildingUpgradeTime(b, l) / getBuildingUpgradeTime(b, l - 1), `${b.id} ${l}`).toBeLessThanOrEqual(ratio + 0.01);
    }
    const b = ext();
    expect(getBuildingUpgradeTime(b, 2)).toBe(20);
    expect(getBuildingUpgradeTime(b, 7)).toBeLessThan(15 * 60);
    expect(getBuildingUpgradeTime(b, 10)).toBe(RHYTHM_RULES.tier2BaseSeconds / 4);
  });

  it("réglable dans l'admin : courbe coupée = ancienne formule ; diviseur et jonction appliqués", () => {
    applyGameContent({ rules: { buildTime: { enabled: false } } as never });
    for (let l = 2; l <= 10; l++) expect(getBuildingUpgradeTime(ext(), l)).toBe(linear(ext(), l));
    applyGameContent({ rules: { buildTime: { startDivisor: 60 } } as never });
    expect(getBuildingUpgradeTime(ext(), 2)).toBe(10);
    expect(BUILD_TIME_RULES.junctionMaxRatio).toBe(4);
    applyGameContent({ rules: { buildTime: { junctionMaxRatio: 0 } } as never }, RHYTHM_RULES.switchAt);
    expect(getBuildingUpgradeTime(ext(), 10)).toBe(5400);
    // Réglages passés à part (aperçu de l'admin) : la règle en vigueur ne change pas.
    applyGameContent({});
    expect(getBuildingUpgradeTime(ext(), 2, { ...BUILD_TIME_RULES, startDivisor: 10 })).toBe(60);
    expect(getBuildingUpgradeTime(ext(), 2)).toBe(20);
  });

  it("première heure d'un nouveau compte : les 4 extracteurs au niveau 4 en 5 minutes (avant : niveau 1)", () => {
    applyGameContent({});
    const r = simulateProgression(PROGRESSION_PROFILES.actif, { days: 1, milestones: [], opening: { minutes: 60, stepSeconds: 10, marks: [5, 60] } });
    expect(r.opening.map((m) => m.minute)).toEqual([5, 60]);
    expect(Math.min(...r.opening[0].extractors)).toBeGreaterThanOrEqual(4);
    applyGameContent({ rules: { buildTime: { enabled: false } } as never });
    const old = simulateProgression(PROGRESSION_PROFILES.actif, { days: 1, milestones: [], opening: { minutes: 60, stepSeconds: 10, marks: [5, 60] } });
    expect(Math.max(...old.opening[0].extractors)).toBe(1);
  });
});
