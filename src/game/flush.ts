import { findBuilding } from "@/game/buildings";
import { computeElapsedProduction } from "@/game/production";
import { MISSIONS } from "@/game/missions";
import { findTech, TECHNOLOGIES } from "@/game/technologies";
import { findUnit, getUnitBuildTime, UNIT_TO_TECH } from "@/game/units";
import type { GameNotification, PlayerState, QueuesState, ResourceId } from "@/types/game";

const TECH_TO_UNIT: Record<string, string> = Object.fromEntries(
  Object.entries(UNIT_TO_TECH).map(([unit, tech]) => [tech, unit]),
);

export type NewNotification = Omit<GameNotification, "id">;

export interface FlushResult {
  player: PlayerState;
  queues: QueuesState;
  notifications: NewNotification[];
}

/** Rejoue localement (côté client) le temps écoulé depuis la dernière synchro :
 *  production continue, files de construction / recherche / missions terminées. */
export function flushState(playerIn: PlayerState, queuesIn: QueuesState, now: number): FlushResult {
  const player: PlayerState = structuredClone(playerIn);
  const queues: QueuesState = structuredClone(queuesIn);
  const notifications: NewNotification[] = [];

  // --- Production continue ---
  const elapsedSeconds = Math.max(0, (now - (player.resourcesUpdatedAtMs || now)) / 1000);
  const gains = computeElapsedProduction(player.buildings, player.techLevels, elapsedSeconds);
  for (const [res, amount] of Object.entries(gains)) {
    player.resources[res as ResourceId] = (player.resources[res as ResourceId] ?? 0) + (amount ?? 0);
  }
  player.resourcesUpdatedAtMs = now;

  // --- Bâtiments en construction ---
  for (const buildingId of Object.keys(queues.buildingUpgrades) as (keyof typeof queues.buildingUpgrades)[]) {
    const entry = queues.buildingUpgrades[buildingId];
    if (!entry || entry.endTime > now) continue;

    const def = findBuilding(buildingId);
    if (def) {
      player.buildings[buildingId].level += 1;
      notifications.push({
        kind: "building",
        title: "Construction terminée",
        message: `${def.name} a atteint le niveau ${player.buildings[buildingId].level}.`,
        createdAtMs: now,
        read: false,
      });
    }
    delete queues.buildingUpgrades[buildingId];
  }

  // --- Files de production d'unités ---
  (["attack", "defense"] as const).forEach((category) => {
    const queue = queues.unitQueues[category];
    let guard = 0;
    while (queue.length > 0 && guard++ < 2000) {
      const front = queue[0];
      if (front.endTime === null) {
        const u = findUnit(front.unitId);
        front.endTime = now + (u ? getUnitBuildTime(u) : 0) * 1000;
        break;
      }
      if (front.endTime > now) break;

      const u = findUnit(front.unitId);
      if (u) {
        if (!player.units[u.id]) player.units[u.id] = { level: 1, count: 0 };
        player.units[u.id].count += 1;
      }
      queue.shift();

      if (queue.length > 0 && queue[0].endTime === null) {
        const nu = findUnit(queue[0].unitId);
        queue[0].endTime = now + (nu ? getUnitBuildTime(nu) : 0) * 1000;
      }
    }
  });

  // --- Recherches actives ---
  const stillActiveResearch = [];
  for (const entry of queues.activeResearches) {
    const tech = findTech(entry.id);
    if (!tech) continue;
    if (entry.endTime > now) {
      stillActiveResearch.push(entry);
      continue;
    }

    const nextLevel = (player.techLevels[tech.id] ?? 0) + 1;
    if (nextLevel <= tech.maxLevel) {
      player.techLevels[tech.id] = nextLevel;
      applyTechEffect(player, tech.id, nextLevel);
      notifications.push({
        kind: "research",
        title: "Recherche terminée",
        message: `${tech.nom} a atteint le niveau ${nextLevel}.`,
        createdAtMs: now,
        read: false,
      });
    }
  }
  queues.activeResearches = stillActiveResearch;

  // --- Missions actives ---
  const stillActiveMissions = [];
  for (const entry of queues.activeMissions) {
    const mission = MISSIONS[entry.key];
    if (!mission) continue;
    if (entry.endTime > now) {
      stillActiveMissions.push(entry);
      continue;
    }

    for (const [res, amount] of Object.entries(mission.reward)) {
      if (res === "xp") {
        player.xp = (player.xp ?? 0) + amount;
      } else {
        player.resources[res as ResourceId] = (player.resources[res as ResourceId] ?? 0) + amount;
      }
    }
    notifications.push({
      kind: "mission",
      title: "Mission terminée",
      message: `${mission.name} : récompense obtenue${mission.reward.xp ? ` (+${mission.reward.xp} XP)` : ""}.`,
      createdAtMs: now,
      read: false,
    });
  }
  queues.activeMissions = stillActiveMissions;

  return { player, queues, notifications };
}

function applyTechEffect(player: PlayerState, techId: string, level: number) {
  const tech = TECHNOLOGIES.find((t) => t.id === techId);
  if (!tech) return;

  switch (tech.effect) {
    case "energy_efficiency":
      player.bonuses.energyEfficiency = level * 0.1;
      break;
    case "unit_defense":
      player.bonuses.unitDefenseBonus = level * 0.1;
      break;
    case "unit_attack":
      player.bonuses.unitAttackBonus = level * 0.1;
      break;
    case "building_discount":
      player.bonuses.buildingUpgradeDiscount = level * 0.05;
      break;
    case "unlock_recipe":
      player.bonuses.unlockedRecipes = level;
      break;
    case "unlock_hangars":
      player.buildings.hangar_attaque.unlocked = true;
      player.buildings.hangar_defense.unlocked = true;
      break;
    case "unlock_next_level": {
      const unitId = TECH_TO_UNIT[techId];
      if (!unitId) break;
      if (!player.units[unitId]) player.units[unitId] = { level: 0, count: 0 };
      player.units[unitId].level = level;
      break;
    }
    default:
      break;
  }
}
