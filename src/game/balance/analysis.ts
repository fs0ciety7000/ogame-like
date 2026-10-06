import { BUILDINGS, findBuilding, getBuildingUpgradeCost, getBuildingUpgradeTime, productionPerSecond } from "@/game/buildings";
import { computeFullPower, unitStat } from "@/game/combat";
import { ECONOMY_RULES, missionRewards } from "@/game/economy";
import { MISSIONS } from "@/game/missions";
import { getProductionBonus } from "@/game/production";
import { RESOURCE_LIST } from "@/game/resources";
import { TECHNOLOGIES } from "@/game/technologies";
import { findUnit, OFFENSIVE_UNITS, UNITS, type UnitDef } from "@/game/units";
import type { Buildings, TechLevels, Units } from "@/types/game";

/* =====================================================
   Outils d'équilibrage (v5.4). Calculs purs sur les données du jeu :
   rentabilité des unités (par place de hangar, par ressource dépensée),
   amortissement des bâtiments, valeur des gains en heures de production.
   Utilisés par les tests d'invariants (balance.test.ts) et le rapport
   (BALANCE_REPORT=1 npx vitest run src/game/balance).
===================================================== */

/** Une ressource rare vaut ce nombre de ressources communes (taux du comptoir). */
export const RARE_VALUE = 50;

/** Valeur d'un coût en ressources communes équivalentes. */
export function costValue(cost: Partial<Record<string, number>>): number {
  let total = 0;
  for (const [res, n] of Object.entries(cost)) {
    const rare = RESOURCE_LIST.find((r) => r.id === res)?.rarity === "rare";
    total += (n ?? 0) * (rare ? RARE_VALUE : 1);
  }
  return total;
}

/** Niveaux de technologie d'un profil (fraction 0 → 1 du maximum de chaque techno). */
export function techProfile(fraction: number): TechLevels {
  return Object.fromEntries(TECHNOLOGIES.map((t) => [t.id, Math.round(t.maxLevel * fraction)]));
}

export interface UnitMetrics {
  id: string;
  name: string;
  category: "attack" | "defense";
  level: number;
  places: number;
  cost: number;
  attack: number;
  defense: number;
  /** Attaque par place de hangar (ce qui compte quand le hangar est plein). */
  attackPerPlace: number;
  /** Attaque + défense par place : valeur défensive à domicile. */
  powerPerPlace: number;
  /** Attaque par millier de ressources dépensées (ce qui compte au début). */
  attackPer1k: number;
  powerPer1k: number;
  /** Énergie d'entretien par heure. */
  upkeepPerHour: number;
  speed: number;
  cargo: number;
}

export function unitMetrics(unit: UnitDef, level: number, techLevels: TechLevels): UnitMetrics {
  const units: Units = { [unit.id]: { level, count: 1 } };
  const attack = unitStat(units, techLevels, unit.id, "attack");
  const defense = unitStat(units, techLevels, unit.id, "defense");
  const cost = costValue(unit.cost);
  const upkeep = (unit.category === "attack" ? ECONOMY_RULES.upkeepPerPlaceAttack : ECONOMY_RULES.upkeepPerPlaceDefense) * unit.hangarSpace * 3600;
  return {
    id: unit.id,
    name: unit.name,
    category: unit.category as "attack" | "defense",
    level,
    places: unit.hangarSpace,
    cost,
    attack,
    defense,
    attackPerPlace: attack / unit.hangarSpace,
    powerPerPlace: (attack + defense) / unit.hangarSpace,
    attackPer1k: (attack / cost) * 1000,
    powerPer1k: ((attack + defense) / cost) * 1000,
    upkeepPerHour: upkeep,
    speed: unit.stats.vitesse,
    cargo: unit.stats.cargo,
  };
}

/** Unités de combat comparables (hors sonde, drone utilitaire et unité de faction). */
export const SUPPORT_UNITS = ["sonde_espionnage", "drone_recuperateur", "traqueur_kesh", "vaisseau_atelier", "recolteur"];

export function combatUnits(): UnitDef[] {
  return UNITS.filter((u) => !SUPPORT_UNITS.includes(u.id));
}

export function unitTable(level: number | "max", techLevels: TechLevels): UnitMetrics[] {
  return combatUnits().map((u) => unitMetrics(u, level === "max" ? u.maxLevel : Math.min(level, u.maxLevel), techLevels));
}

export interface ExtractorStep {
  level: number;
  cost: number;
  seconds: number;
  /** Gain de production (par heure, bonus de technologies compris). */
  gainPerHour: number;
  /** Heures de production supplémentaire pour rembourser le niveau. */
  paybackHours: number;
}

/** Amortissement des niveaux d'un extracteur. */
export function extractorCurve(buildingId: string, techLevels: TechLevels): ExtractorStep[] {
  const def = findBuilding(buildingId);
  if (!def?.production) return [];
  const bonus = 1 + getProductionBonus(techLevels);
  const out: ExtractorStep[] = [];
  for (let level = 2; level <= def.maxLevel; level++) {
    const gain = (productionPerSecond(buildingId, level) - productionPerSecond(buildingId, level - 1)) * bonus * 3600;
    const cost = costValue(getBuildingUpgradeCost(def, level));
    out.push({ level, cost, seconds: getBuildingUpgradeTime(def, level), gainPerHour: gain, paybackHours: gain > 0 ? cost / gain : Infinity });
  }
  return out;
}

/** Profil d'empire type : extracteurs et hangars à un niveau donné. */
export function empireProfile(level: number, techFraction: number): { buildings: Buildings; techLevels: TechLevels } {
  const buildings: Buildings = {};
  for (const b of BUILDINGS) buildings[b.id] = { level: Math.min(level, b.maxLevel), unlocked: true };
  return { buildings, techLevels: techProfile(techFraction) };
}

/** Production commune totale par heure d'un profil. */
export function commonPerHour(profile: { buildings: Buildings; techLevels: TechLevels }): number {
  const bonus = 1 + getProductionBonus(profile.techLevels);
  let total = 0;
  for (const b of BUILDINGS) {
    const res = b.production?.resource;
    if (!res || RESOURCE_LIST.find((r) => r.id === res)?.rarity !== "common") continue;
    total += productionPerSecond(b.id, profile.buildings[b.id]?.level ?? 0) * bonus * 3600;
  }
  return total;
}

export interface MissionValue {
  key: string;
  name: string;
  minutes: number;
  value: number;
  /** Valeur de la mission rapportée à sa durée, en heures de production commune. */
  productionHoursPerHour: number;
}

export function missionTable(profile: { buildings: Buildings; techLevels: TechLevels }): MissionValue[] {
  const perHour = commonPerHour(profile);
  return Object.values(MISSIONS).map((m) => {
    const reward = missionRewards(m, profile);
    const value = costValue(Object.fromEntries(Object.entries(reward).filter(([k]) => k !== "xp")));
    return { key: m.key, name: m.name, minutes: m.duration / 60, value, productionHoursPerHour: perHour > 0 ? value / perHour / (m.duration / 3600) : 0 };
  });
}

/** Puissance maximale d'un hangar plein d'une seule unité (attaque pour la flotte, attaque + défense pour les défenses). */
export function fullHangarPower(unitId: string, places: number, techLevels: TechLevels): number {
  const u = findUnit(unitId);
  if (!u) return 0;
  const count = Math.floor(places / u.hangarSpace);
  const units: Units = { [unitId]: { level: u.maxLevel, count } };
  return computeFullPower(units, techLevels, [unitId], OFFENSIVE_UNITS.includes(unitId) ? ["attack"] : ["attack", "defense"]);
}
