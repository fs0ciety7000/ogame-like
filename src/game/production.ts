import { BUILDINGS, LOCKABLE_BUILDINGS, PRODUCTION_RESOURCE_BY_BUILDING, productionPerSecond } from "@/game/buildings";
import type { Buildings, Resources, TechLevels } from "@/types/game";

/** Bonus de production (tech3), recalculé depuis le niveau actuel — jamais figé. */
export function getProductionBonus(techLevels: TechLevels): number {
  return (techLevels.tech3 ?? 0) * 0.1;
}

export function getProductionRatesPerSecond(buildings: Buildings, techLevels: TechLevels): Partial<Resources> {
  const bonus = getProductionBonus(techLevels);
  const rates: Partial<Resources> = {};

  for (const building of BUILDINGS) {
    const resource = PRODUCTION_RESOURCE_BY_BUILDING[building.id];
    if (!resource) continue;

    const state = buildings[building.id];
    const level = state?.level ?? 0;
    const unlocked = LOCKABLE_BUILDINGS.includes(building.id) ? state?.unlocked === true : true;
    if (level <= 0 || !unlocked) continue;

    const base = productionPerSecond(building.id, level);
    rates[resource as keyof Resources] = Math.floor(base * (1 + bonus));
  }

  return rates;
}

/** Ressources accumulées pendant `elapsedSeconds`, à ajouter au stock courant. */
export function computeElapsedProduction(
  buildings: Buildings,
  techLevels: TechLevels,
  elapsedSeconds: number,
): Partial<Resources> {
  if (elapsedSeconds <= 0) return {};
  const rates = getProductionRatesPerSecond(buildings, techLevels);
  const gains: Partial<Resources> = {};
  for (const [res, rate] of Object.entries(rates)) {
    if (rate) gains[res as keyof Resources] = rate * elapsedSeconds;
  }
  return gains;
}
