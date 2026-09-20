import { defaultBuildings } from "@/game/buildings";
import type { PlayerState, QueuesState, Resources } from "@/types/game";

export function defaultResources(): Resources {
  return {
    scrap: 100,
    energy: 50,
    nano: 0,
    data: 0,
    reinforcedSteel: 0,
    cyberModule: 0,
    syntheticNanites: 0,
    aiFragment: 0,
  };
}

export function defaultPlayerState(uid: string, pseudo: string): Omit<PlayerState, "createdAt"> {
  return {
    uid,
    pseudo,
    resources: defaultResources(),
    buildings: defaultBuildings(),
    units: {},
    techLevels: {},
    bonuses: {
      energyEfficiency: 0,
      unitDefenseBonus: 0,
      unitAttackBonus: 0,
      buildingUpgradeDiscount: 0,
      unlockedRecipes: 0,
    },
    xp: 0,
    victories: 0,
    defeats: 0,
    playtimeSeconds: 0,
    resourcesUpdatedAtMs: Date.now(),
  };
}

export function defaultQueues(): QueuesState {
  return {
    buildingUpgrades: {},
    unitQueues: { attack: [], defense: [] },
    activeResearches: [],
    activeMissions: [],
  };
}
