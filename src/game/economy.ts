import { BUILDINGS, effectiveBuildingLevel, getStorageCapacity } from "@/game/buildings";
import type { MissionDef } from "@/game/missions";
import { getProductionRatesPerSecond } from "@/game/production";
import { RESOURCE_LIST } from "@/game/resources";
import { findUnit } from "@/game/units";
import type { Buildings, ResourceId, Resources, TechLevels, Units } from "@/types/game";

/* =====================================================
   Économie continue : production, plafond de l'entrepôt, entretien de
   flotte et panne d'énergie. Une seule fonction (advanceResources) sert
   au serveur (flush) et au client (compteurs en direct) : les deux
   calculent exactement la même chose.
===================================================== */

export const ECONOMY_RULES = {
  /** Énergie consommée par seconde et par place de hangar occupée. */
  upkeepPerPlaceAttack: 0.015,
  upkeepPerPlaceDefense: 0.0075,
  /** Production des autres ressources pendant une panne d'énergie. */
  outageProductionFactor: 0.5,
  /** Part de la capacité de l'entrepôt à l'abri du pillage. */
  protectedStoragePct: 0.1,
  /** Missions : ressources communes = au moins ce multiple de (durée × production). */
  missionProductionMultiplier: 1.5,
  /** Missions : ressources rares × (1 + niveaux de bâtiments cumulés / ce diviseur). */
  missionRareLevelDivisor: 35,
};

export const COMMON_RESOURCES = RESOURCE_LIST.filter((r) => r.rarity === "common").map((r) => r.id) as ResourceId[];

export interface EconomyInput {
  buildings: Buildings;
  techLevels: TechLevels;
  units?: Units;
  resources: Partial<Resources>;
}

/** Énergie consommée par seconde par les unités construites. */
export function getFleetUpkeep(units: Units | undefined): number {
  let upkeep = 0;
  for (const [id, state] of Object.entries(units ?? {})) {
    const def = findUnit(id);
    if (!def || !state?.count) continue;
    const perPlace = def.category === "attack" ? ECONOMY_RULES.upkeepPerPlaceAttack : ECONOMY_RULES.upkeepPerPlaceDefense;
    upkeep += state.count * def.hangarSpace * perPlace;
  }
  return upkeep;
}

export interface EconomySnapshot {
  /** Production brute par seconde (bâtiments + technologies). */
  gross: Partial<Resources>;
  /** Consommation d'énergie de la flotte, par seconde. */
  upkeep: number;
  /** Variation nette par seconde en ce moment (entrepôt plein = 0, panne prise en compte). */
  net: Partial<Resources>;
  capacity: number;
  /** Énergie épuisée : les autres productions tournent au ralenti. */
  outage: boolean;
  /** Ressources communes dont l'entrepôt est plein. */
  full: ResourceId[];
}

export function economySnapshot(input: EconomyInput): EconomySnapshot {
  const gross = getProductionRatesPerSecond(input.buildings, input.techLevels);
  const upkeep = getFleetUpkeep(input.units);
  const capacity = getStorageCapacity(input.buildings);
  const energyNet = (gross.energy ?? 0) - upkeep;
  const outage = energyNet < 0 && (input.resources.energy ?? 0) <= 0;
  const factor = outage ? ECONOMY_RULES.outageProductionFactor : 1;
  const net: Partial<Resources> = {};
  const full: ResourceId[] = [];
  for (const r of RESOURCE_LIST) {
    const stock = input.resources[r.id] ?? 0;
    const isCommon = r.rarity === "common";
    const atCap = isCommon && stock >= capacity;
    if (r.id === "energy") {
      net.energy = outage ? 0 : atCap && energyNet > 0 ? 0 : energyNet;
    } else {
      net[r.id] = atCap ? 0 : (gross[r.id] ?? 0) * factor;
    }
    if (atCap) full.push(r.id);
  }
  return { gross, upkeep, net, capacity, outage, full };
}

function addCapped(stock: number, gain: number, cap: number): number {
  if (gain <= 0) return Math.max(0, stock + gain);
  if (stock >= cap) return stock; // déjà au-delà : conservé, mais plus de production
  return Math.min(cap, stock + gain);
}

/** Ressources après `elapsedSeconds` de production continue. */
export function advanceResources(input: EconomyInput, elapsedSeconds: number): Resources {
  const out = { ...input.resources } as Resources;
  if (elapsedSeconds <= 0) return out;

  const gross = getProductionRatesPerSecond(input.buildings, input.techLevels);
  const upkeep = getFleetUpkeep(input.units);
  const capacity = getStorageCapacity(input.buildings);
  const capOf = (res: ResourceId) => (COMMON_RESOURCES.includes(res) ? capacity : Infinity);

  // Énergie : production moins entretien. Si elle baisse, on calcule
  // l'instant où le stock tombe à zéro : au-delà, c'est la panne.
  const energyNet = (gross.energy ?? 0) - upkeep;
  const energyStock = out.energy ?? 0;
  let normalSeconds = elapsedSeconds;
  if (energyNet < 0) normalSeconds = Math.min(elapsedSeconds, Math.max(0, energyStock) / -energyNet);
  const outageSeconds = elapsedSeconds - normalSeconds;

  out.energy = addCapped(energyStock, energyNet * normalSeconds, capOf("energy"));
  if (outageSeconds > 0) out.energy = 0;

  for (const r of RESOURCE_LIST) {
    if (r.id === "energy") continue;
    const rate = gross[r.id] ?? 0;
    if (!rate) continue;
    const gain = rate * normalSeconds + rate * ECONOMY_RULES.outageProductionFactor * outageSeconds;
    out[r.id] = addCapped(out[r.id] ?? 0, gain, capOf(r.id));
  }
  return out;
}

/** Quantité d'une ressource à l'abri du pillage (bunker de l'entrepôt). */
export function protectedAmount(buildings: Buildings, res: ResourceId): number {
  if (!COMMON_RESOURCES.includes(res)) return 0;
  const capacity = getStorageCapacity(buildings);
  return Number.isFinite(capacity) ? Math.floor(capacity * ECONOMY_RULES.protectedStoragePct) : 0;
}

/** Récompenses réelles d'une mission pour ce joueur : les ressources
 *  communes valent au moins 1,5 × la durée en production, les rares
 *  grandissent avec le développement de l'empire. */
export function missionRewards(mission: MissionDef, player: { buildings: Buildings; techLevels: TechLevels }): Record<string, number> {
  const rates = getProductionRatesPerSecond(player.buildings, player.techLevels);
  const levels = BUILDINGS.reduce((sum, b) => sum + effectiveBuildingLevel(player.buildings, b.id), 0);
  const rareScale = 1 + levels / Math.max(1, ECONOMY_RULES.missionRareLevelDivisor);
  const out: Record<string, number> = {};
  for (const [res, fixed] of Object.entries(mission.reward)) {
    if (res === "xp") out.xp = fixed;
    else if (COMMON_RESOURCES.includes(res as ResourceId)) {
      const indexed = Math.floor(ECONOMY_RULES.missionProductionMultiplier * mission.duration * (rates[res as ResourceId] ?? 0));
      out[res] = Math.max(fixed, indexed);
    } else out[res] = Math.floor(fixed * rareScale);
  }
  return out;
}
