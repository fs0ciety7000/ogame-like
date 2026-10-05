import { techBonus } from "@/game/technologies";
import { UNITS, unitLevelBonus, type UnitDef } from "@/game/units";

/* =====================================================
   5.16 : fiche technique d'une unité. Valeurs calculées comme au combat
   (base + bonus par niveau, puis technos d'attaque et de blindage) et
   comme en vol (vitesse et soute × niveau), rangs face aux autres unités
   et ratios d'efficacité. Purement informatif.
===================================================== */

export interface UnitSpecValues {
  attack: number;
  defense: number;
  speed: number;
  cargo: number;
}

export type SpecStat = keyof UnitSpecValues;

export const SPEC_STATS: { id: SpecStat; label: string; short: string }[] = [
  { id: "attack", label: "Attaque", short: "ATK" },
  { id: "defense", label: "Résistance", short: "RÉS" },
  { id: "speed", label: "Vitesse", short: "VIT" },
  { id: "cargo", label: "Soute", short: "CAP" },
];

/** Caractéristiques d'une unité à un niveau donné (technos du joueur comprises si fournies). */
export function unitSpecAt(unit: UnitDef, level: number, techLevels: Record<string, number> = {}): UnitSpecValues {
  const lvl = Math.max(1, Math.floor(level));
  const grow = (lvl - 1) * unitLevelBonus(unit);
  return {
    attack: Math.round((unit.stats.attaque + grow) * (1 + techBonus(techLevels, "unit_attack"))),
    defense: Math.round((unit.stats.defense + grow) * (1 + techBonus(techLevels, "unit_defense"))),
    speed: unit.stats.vitesse * lvl,
    cargo: unit.stats.cargo * lvl,
  };
}

/** Rang de l'unité (1 = la meilleure) sur chaque caractéristique de base, parmi toutes les unités. */
export function unitRanks(unit: UnitDef, all: UnitDef[] = UNITS): Record<SpecStat, { rank: number; of: number }> {
  const base = (u: UnitDef): UnitSpecValues => ({ attack: u.stats.attaque, defense: u.stats.defense, speed: u.stats.vitesse, cargo: u.stats.cargo });
  const mine = base(unit);
  const out = {} as Record<SpecStat, { rank: number; of: number }>;
  for (const { id } of SPEC_STATS) out[id] = { rank: 1 + all.filter((u) => base(u)[id] > mine[id]).length, of: all.length };
  return out;
}

/** Ratios d'efficacité (au niveau 1, sans techno) : ce qu'apportent 1 000 ressources et une place de hangar. */
export function unitEfficiency(unit: UnitDef): { attackPerK: number; defensePerK: number; cargoPerSlot: number; powerPerSlot: number } {
  const cost = Math.max(1, (unit.cost.scrap || 0) + (unit.cost.energy || 0));
  const slots = Math.max(1, unit.hangarSpace || 1);
  return {
    attackPerK: Math.round((unit.stats.attaque / cost) * 1000 * 10) / 10,
    defensePerK: Math.round((unit.stats.defense / cost) * 1000 * 10) / 10,
    cargoPerSlot: Math.round((unit.stats.cargo / slots) * 10) / 10,
    powerPerSlot: Math.round(((unit.stats.attaque + unit.stats.defense) / slots) * 10) / 10,
  };
}

/** Désignation stable, façon plan d'ingénieur (ex. « CE-A03 »). */
export function unitDesignation(unit: UnitDef, all: UnitDef[] = UNITS): string {
  const same = all.filter((u) => u.category === unit.category);
  const i = Math.max(0, same.findIndex((u) => u.id === unit.id));
  return `CE-${unit.category === "attack" ? "A" : "D"}${String(i + 1).padStart(2, "0")}`;
}

/** Niveaux à montrer dans le tableau (tous jusqu'à 10, sinon un échantillon jusqu'au maximum). */
export function specLevels(maxLevel: number): number[] {
  const max = Math.max(1, Math.floor(maxLevel));
  if (max <= 10) return Array.from({ length: max }, (_, i) => i + 1);
  const step = Math.ceil(max / 8);
  const out = [1];
  for (let l = step; l < max; l += step) out.push(l);
  out.push(max);
  return [...new Set(out)];
}
