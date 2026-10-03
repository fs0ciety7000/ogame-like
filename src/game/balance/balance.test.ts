import { describe, expect, it } from "vitest";
import { combatUnits, commonPerHour, empireProfile, extractorCurve, fullHangarPower, missionTable, techProfile, unitTable, type UnitMetrics } from "@/game/balance/analysis";
import { RARITIES } from "@/game/relics";
import { FACTIONS, lairPower, raidPower } from "@/game/pirates";
import { getShieldPercent, homeDefensePower, computeFullPower } from "@/game/combat";
import { MISSIONS } from "@/game/missions";
import { missionRewards } from "@/game/economy";
import { OFFENSIVE_UNITS } from "@/game/units";
import { defaultPlayerState } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

/* =====================================================
   Invariants d'équilibrage (v5.4). Ils échouent si un réglage (code ou
   contenu par défaut) recrée un piège ou une unité dominée.
===================================================== */

const END = techProfile(1);
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const value = (u: UnitMetrics) => (u.category === "attack" ? u.attackPerPlace : u.powerPerPlace);

describe("unités", () => {
  const table = unitTable("max", END);

  it("aucune unité de combat n'est un piège : au moins 55 % de la médiane de sa catégorie par place", () => {
    for (const cat of ["attack", "defense"] as const) {
      const units = table.filter((u) => u.category === cat && u.id !== "cargo");
      const med = median(units.map(value));
      for (const u of units) expect.soft(value(u), `${u.id} : ${Math.round(value(u))} par place (médiane ${Math.round(med)})`).toBeGreaterThanOrEqual(0.55 * med);
    }
  });

  it("aucune unité n'en écrase une autre de la même catégorie (plus chère ET plus faible par place, sans vitesse ni soute en plus)", () => {
    for (const a of table) {
      for (const b of table) {
        if (a === b || a.category !== b.category) continue;
        const dominated = b.cost >= a.cost && value(b) < value(a) && b.speed <= a.speed && b.cargo <= a.cargo;
        expect.soft(dominated, `${b.id} est dominée par ${a.id}`).toBe(false);
      }
    }
  });

  it("les défenses de base suivent une échelle : plus chère ⇒ plus forte par place", () => {
    const ladder = ["roquette", "canon_impulsion", "canon_plasma", "batterie_aa"].map((id) => table.find((u) => u.id === id)!);
    for (let i = 1; i < ladder.length; i++) {
      expect(ladder[i].cost).toBeGreaterThan(ladder[i - 1].cost);
      expect(ladder[i].powerPerPlace).toBeGreaterThan(ladder[i - 1].powerPerPlace);
    }
  });

  it("les unités de fin de partie dominent par place sans écraser (≤ 1,8 × la meilleure unité de base)", () => {
    const basic = table.filter((u) => u.places <= 2);
    for (const id of ["etoile_noire", "croiseur_nova", "lance_gravitationnelle"]) {
      const u = table.find((x) => x.id === id)!;
      const best = Math.max(...basic.filter((b) => b.category === u.category).map(value));
      expect.soft(value(u), id).toBeGreaterThanOrEqual(0.9 * best);
      expect.soft(value(u), id).toBeLessThanOrEqual(1.8 * best);
    }
  });

  it("toutes les unités de combat sont couvertes par l'analyse", () => {
    expect(combatUnits().length).toBeGreaterThanOrEqual(12);
  });
});

describe("économie", () => {
  it("chaque niveau d'extracteur s'amortit en moins de 6 jours de production supplémentaire", () => {
    for (const s of extractorCurve("extracteur_ferraille", END)) expect.soft(s.paybackHours, `niveau ${s.level}`).toBeLessThan(150);
  });

  it("les missions de ressources communes rapportent au moins 0,3 h de production par heure, à tout stade", () => {
    for (const [lvl, frac] of [[5, 0.3], [10, 0.6], [18, 1]] as const) {
      for (const m of missionTable(empireProfile(lvl, frac))) {
        const def = MISSIONS[m.key];
        const commonOnly = Object.keys(def.reward).every((r) => ["scrap", "energy", "nano", "data", "xp"].includes(r));
        if (commonOnly) expect.soft(m.productionHoursPerHour, `${m.key} (niveau ${lvl})`).toBeGreaterThanOrEqual(0.3);
      }
    }
  });

  it("en fin de partie, une heure de mission rare vaut au moins 20 % d'une heure de Synthétiseur neuronal niveau 10", () => {
    const end = empireProfile(18, 1);
    const reward = missionRewards(MISSIONS.fouille_archives_IA, end);
    expect(reward.aiFragment).toBeGreaterThanOrEqual(0.2 * 10 * 3600);
  });

  it("la production commune croît fortement du début à la fin", () => {
    expect(commonPerHour(empireProfile(18, 1)) / commonPerHour(empireProfile(5, 0.3))).toBeGreaterThan(50);
  });
});

describe("reliques", () => {
  it("chaque rareté est plus forte que la précédente (mythique en tête)", () => {
    for (let i = 1; i < RARITIES.length; i++) expect(RARITIES[i].pct).toBeGreaterThan(RARITIES[i - 1].pct);
  });
});

describe("factions", () => {
  function empire(): PlayerState {
    const p = defaultPlayerState("u", "U") as PlayerState;
    const prof = empireProfile(15, 1);
    p.buildings = prof.buildings;
    p.techLevels = prof.techLevels;
    p.units = { batterie_aa: { level: 10, count: 15_000 }, sentinelle: { level: 10, count: 15_000 } };
    return p;
  }

  it("raids : repoussables à faible notoriété, menaçants au maximum (bouclier seul, sans bonus)", () => {
    const p = empire();
    const shield = getShieldPercent(p.buildings);
    const defense = homeDefensePower(p.units, p.techLevels);
    for (const f of FACTIONS.filter((x) => x.raid.target === "base")) {
      expect.soft(raidPower(f, p, 0) * (1 - shield), `${f.id} à notoriété 0`).toBeLessThan(defense);
      expect.soft(raidPower(f, p, f.raid.maxNotoriety) * (1 - shield), `${f.id} au maximum`).toBeGreaterThan(defense);
    }
  });

  it("repaires : à portée de la flotte avec un bonus d'attaque de 10 à 20 %", () => {
    const p = empire();
    const attack = computeFullPower(p.units, p.techLevels, OFFENSIVE_UNITS, ["attack"]);
    for (const f of FACTIONS) {
      const lair = lairPower(f, p);
      expect.soft(lair, f.id).toBeGreaterThan(attack);
      expect.soft(lair, f.id).toBeLessThan(attack * 1.2);
    }
  });
});

describe("hangars", () => {
  it("un hangar d'attaque plein (niveau 20) frappe entre 10 et 20 M en fin de partie, quelle que soit la bonne unité", () => {
    for (const id of ["sentinelle", "chasseur", "etoile_noire", "croiseur_nova"]) {
      const p = fullHangarPower(id, 40_000, END);
      expect.soft(p, id).toBeGreaterThan(10e6);
      expect.soft(p, id).toBeLessThan(20e6);
    }
  });
});
