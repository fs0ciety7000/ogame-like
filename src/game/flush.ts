import { findBuilding } from "@/game/buildings";
import { computeElapsedProduction } from "@/game/production";
import { MISSIONS } from "@/game/missions";
import { findTech, TECHNOLOGIES } from "@/game/technologies";
import { findUnit, getUnitBuildTime, UNIT_TO_TECH } from "@/game/units";
import { checkNewAchievements } from "@/game/achievements";
import { applyXpDelta, ensureSeasonRollover } from "@/game/seasons";
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

// Un point par heure de jeu écoulée (pas par appel de flush, qui peut
// survenir toutes les 20s via le heartbeat) : le flush écrit de toute façon
// le document joueur en entier à chaque action, donc consigner l'historique
// ici ne coûte aucune écriture Firestore supplémentaire.
export const RESOURCE_HISTORY_INTERVAL_MS = 60 * 60 * 1000;
export const RESOURCE_HISTORY_MAX_POINTS = 72; // ~3 jours d'historique horaire

function recordResourceHistory(player: PlayerState, now: number): void {
  const history = player.resourceHistory ?? [];
  const last = history[history.length - 1];
  if (last && now - last.t < RESOURCE_HISTORY_INTERVAL_MS) {
    player.resourceHistory = history;
    return;
  }
  const next = [...history, { t: now, r: { ...player.resources } }];
  player.resourceHistory =
    next.length > RESOURCE_HISTORY_MAX_POINTS ? next.slice(next.length - RESOURCE_HISTORY_MAX_POINTS) : next;
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
  recordResourceHistory(player, now);
  ensureSeasonRollover(player, now);

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
      const completedEndTime = front.endTime;
      queue.shift();

      if (queue.length > 0 && queue[0].endTime === null) {
        const nu = findUnit(queue[0].unitId);
        // Chaîné depuis la fin programmée de l'unité précédente (pas "now") :
        // si le joueur était hors-ligne longtemps, plusieurs unités en file
        // peuvent ainsi se terminer d'affilée dans ce même flush, au lieu de
        // réinitialiser le minuteur sur l'instant présent à chaque appel.
        queue[0].endTime = completedEndTime + (nu ? getUnitBuildTime(nu) : 0) * 1000;
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
        applyXpDelta(player, amount, now);
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

  // --- Succès ---
  const newAchievements = checkNewAchievements(player);
  if (newAchievements.length > 0) {
    player.unlockedAchievements = [...(player.unlockedAchievements ?? []), ...newAchievements.map((a) => a.id)];
    for (const a of newAchievements) {
      notifications.push({
        kind: "achievement",
        title: "Succès débloqué !",
        message: `${a.emoji} ${a.name} — ${a.description}`,
        createdAtMs: now,
        read: false,
      });
    }
  }

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
