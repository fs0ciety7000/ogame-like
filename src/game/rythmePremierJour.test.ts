import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { BUILD_COST_RULES, BUILDINGS, findBuilding, getBuildingUpgradeCost, productionPerSecond } from "@/game/buildings";
import { applyGameContent } from "@/game/content";
import { DEFAULT_MISSIONS, hasPrerequisites, MISSIONS } from "@/game/missions";
import { RHYTHM_RULES } from "@/game/rhythm";
import { PROGRESSION_PROFILES, simulateProgression, type ProgressionPaceDay } from "@/game/balance/progressionSim";

/* 6.14.167 (S9, docs/proposals/rythme-du-premier-jour.md) : rythme du premier jour (invariant I51).
   1. Pente adoucie des coûts du premier palier des extracteurs (groupe `buildCost`) : ×2,5 par niveau au plus dès le niveau 5,
      jamais plus cher qu'avant, second palier inchangé ; l'attente d'un niveau (ferraille des 4 extracteurs ÷ production de
      ferraille du niveau d'avant) reste sous 2 h jusqu'au niveau 10.
   2. Échelle des missions du premier jour : Patrouille du périmètre (10 min), Collecte d'énergie (15 min) et Forage profond
      (30 min) accessibles avec les unités de la prise en main.
   3. Simulateur : un actif connecté en continu le premier jour a toujours une action utile (chantier, recherche ou mission de
      5 min et plus) au moins toutes les 10 minutes ; la première heure, jamais plus de 10 min sans chantier ni recherche ; un
      joueur qui revient 3 fois par jour trouve à chaque retour (J1, J2, J7) au moins 2 actions utiles et une mission terminée. */

const ext = () => findBuilding("extracteur_ferraille")!;
const steep = { ...BUILD_COST_RULES, enabled: false };

afterEach(() => {
  applyGameContent({});
});

describe("S9 : pente adoucie des coûts du premier palier (I51)", () => {
  it("extracteurs : ×2,5 au plus par niveau dès le niveau 5, jamais plus cher qu'avant, niveaux 2 à 4 et second palier inchangés", () => {
    applyGameContent({});
    for (const b of BUILDINGS.filter((x) => x.production && x.upgrade.tier2)) {
      for (let l = 2; l <= 20; l++) {
        const now = getBuildingUpgradeCost(b, l) as Record<string, number>;
        const before = getBuildingUpgradeCost(b, l, steep) as Record<string, number>;
        for (const k of Object.keys(before)) expect(now[k], `${b.id} ${l} ${k}`).toBeLessThanOrEqual(before[k]);
        if (l < 5 || l >= 11) expect(now, `${b.id} ${l}`).toEqual(before);
        if (l >= 5 && l <= 10) {
          const prev = getBuildingUpgradeCost(b, l - 1) as Record<string, number>;
          for (const k of Object.keys(now)) expect(now[k] / prev[k], `${b.id} ${l} ${k}`).toBeLessThanOrEqual(BUILD_COST_RULES.maxGrowth + 0.01);
        }
      }
    }
    expect(getBuildingUpgradeCost(ext(), 8)).toEqual({ scrap: 71_953, energy: 35_000 });
    expect(getBuildingUpgradeCost(ext(), 11)).toEqual({ scrap: 5_000_000, energy: 3_000_000, reinforcedSteel: 20_000 });
  });

  it("seulement les bâtiments de production par défaut ; décochée : les coûts d'avant ; jonction : jamais sous le dernier niveau ÷ ratio^écart", () => {
    const hangar = findBuilding("hangar_attaque")!;
    expect(getBuildingUpgradeCost(hangar, 8)).toEqual(getBuildingUpgradeCost(hangar, 8, steep));
    expect(getBuildingUpgradeCost(hangar, 8, { ...BUILD_COST_RULES, productionOnly: false }).scrap!).toBeLessThan(getBuildingUpgradeCost(hangar, 8, steep).scrap!);
    expect(getBuildingUpgradeCost(ext(), 9, steep)).toEqual({ scrap: 751_332, energy: 506_758 });
    const j = { ...BUILD_COST_RULES, junctionMaxRatio: 4 };
    expect(getBuildingUpgradeCost(ext(), 10, j)).toEqual(getBuildingUpgradeCost(ext(), 10, steep));
    expect(getBuildingUpgradeCost(ext(), 9, j).scrap).toBe(Math.floor(2_499_999 / 4));
  });

  it("attente d'un niveau d'extracteur sous 2 h jusqu'au niveau 10 (avant : 10,7 h), et décroissance du rapport coût ÷ production", () => {
    const wait = (l: number, rules = BUILD_COST_RULES) => (4 * getBuildingUpgradeCost(ext(), l, rules).scrap!) / productionPerSecond("extracteur_ferraille", l - 1) / 3600;
    for (let l = 5; l <= 10; l++) expect(wait(l), `niveau ${l}`).toBeLessThan(2);
    expect(wait(10, steep)).toBeGreaterThan(10);
    expect(wait(7)).toBeLessThan(wait(7, steep) / 2);
  });

  it("la pente se règle (registre `buildCost`) et se fusionne champ par champ", () => {
    applyGameContent({ rules: { buildCost: { maxGrowth: 3 } } } as never);
    expect(BUILD_COST_RULES.maxGrowth).toBe(3);
    expect(BUILD_COST_RULES.fromLevel).toBe(5);
    expect(getBuildingUpgradeCost(ext(), 6).scrap).toBe(Math.floor(1842 * 9));
    applyGameContent({});
    expect(BUILD_COST_RULES.maxGrowth).toBe(2.5);
  });
});

describe("S9 : échelle des missions du premier jour (I51)", () => {
  it("10 roquettes et 8 drones ouvrent des missions de 10, 15 et 30 min (avant : 30 roquettes, chasseurs, frégates, cargos)", () => {
    applyGameContent({});
    const units = { roquette: { count: 10 }, drone_recuperateur: { count: 8 } };
    const ok = Object.values(MISSIONS).filter((m) => hasPrerequisites(m, units));
    expect(ok.map((m) => m.key).sort()).toEqual(["collecte_energie", "forage_profond", "patrouille_courte", "patrouille_perimetrique"]);
    expect(ok.map((m) => m.duration).sort((a, b) => a - b)).toEqual([60, 600, 900, 1800]);
  });

  it("la migration de contenu remplace les anciens prérequis par ceux du code (cosmic_db.js)", () => {
    const db = readFileSync("pocketbase/pb_hooks/cosmic_db.js", "utf8");
    const start = db.indexOf('id: "missions-premier-jour-6.14.167"');
    expect(start).toBeGreaterThan(0);
    const block = db.slice(start, db.indexOf("run(", start) + 900);
    for (const key of ["patrouille_perimetrique", "forage_profond", "collecte_energie"]) {
      const m = new RegExp(`key: "${key}", from: (\\{[^}]*\\}), to: (\\{[^}]*\\})`).exec(block);
      expect(m, key).not.toBeNull();
      const to = JSON.parse(m![2].replace(/(\w+):/g, '"$1":'));
      expect(to, key).toEqual(DEFAULT_MISSIONS[key].prereq);
    }
  });
});

/** Journée de jeu de l'actif connecté en continu (J1 0–16 h) et retours du profil moyen (3 sessions par jour), J1, J2 et J7.
 *  Récompenses du départ versées aux minutes du parcours joué (comme `progression-sim.mjs --recompenses`). */
function pace(afterSwitch: boolean): { continuous: ProgressionPaceDay[]; moyen: ProgressionPaceDay[] } {
  applyGameContent({}, afterSwitch ? RHYTHM_RULES.switchAt : undefined);
  const opts = { days: 8, milestones: [], opening: { minutes: 60, stepSeconds: 10, marks: [] }, startRewards: { raidMinute: 18, guideMinute: 60, passMinute: 24 } };
  const continuous = simulateProgression(PROGRESSION_PROFILES.actif, { ...opts, activeWindows: [[0, 16]] }).pace;
  const moyen = simulateProgression(PROGRESSION_PROFILES.moyen, opts).pace;
  applyGameContent({});
  return { continuous, moyen };
}

describe.each([
  ["avant la bascule du rythme", false],
  ["après la bascule du rythme", true],
])("S9 : rythme du premier jour, %s (I51)", (_label, afterSwitch) => {
  const p = pace(afterSwitch);

  it("actif connecté en continu : une action utile au moins toutes les 10 min le premier jour ; la première heure, aucun trou de plus de 10 min", () => {
    const j1 = p.continuous.find((d) => d.day === 1)!;
    expect(j1.continuousMinutes).toBe(960);
    expect(j1.longestIdleWithMissionsMinutes).toBeLessThanOrEqual(10);
    expect(j1.idleGaps.filter(([at]) => at < 60)).toEqual([]);
  });

  it("joueur qui revient 3 fois par jour : au moins 2 actions utiles et une mission terminée à chaque retour, J1, J2 et J7", () => {
    for (const day of [1, 2, 7]) {
      const d = p.moyen.find((x) => x.day === day)!;
      expect(d.actionsPerReturn.length, `J${day}`).toBe(3);
      for (const n of d.actionsPerReturn) expect(n, `J${day}`).toBeGreaterThanOrEqual(2);
      for (const n of d.missionsPerReturn) expect(n, `J${day}`).toBeGreaterThanOrEqual(1);
    }
  });
});
