import { advanceColonies } from "@/game/colonies";
import { BUILDINGS, findBuilding } from "@/game/buildings";
import { advanceResources, missionRewards } from "@/game/economy";
import { ensureContracts, recordContract } from "@/game/contracts";
import { MISSIONS } from "@/game/missions";
import { missionRewardFactor } from "@/game/events";
import { buildingsUnlockedByTech, findTech, techBonus, techEffects, TECHNOLOGIES } from "@/game/technologies";
import { findUnit, getUnitBuildTime, UNIT_TO_TECH } from "@/game/units";
import { achievementReward, checkNewAchievements } from "@/game/achievements";
import { bumpStat, recordMission, setStat } from "@/game/stats";
import { contractDay } from "@/game/contracts";
import { formatInt } from "@/game/format";
import { applyXpDelta, ensureSeasonRollover } from "@/game/seasons";
import { COMMANDER_XP, grantCommanderXp } from "@/game/commanders";
import { advanceSynthesis, CAPSULES } from "@/game/synthesis";
import type { GameNotification, PlayerState, QueuesState, ResourceId } from "@/types/game";

/** Unité liée à une technologie (effet unlock_next_level), calculée à la
 *  demande : le contenu du jeu peut être modifié depuis l'administration. */
function unitForTech(techId: string): string | undefined {
  return Object.entries(UNIT_TO_TECH).find(([, tech]) => tech === techId)?.[0];
}

export type NewNotification = Omit<GameNotification, "id">;

export interface FlushResult {
  player: PlayerState;
  queues: QueuesState;
  notifications: NewNotification[];
}

// Un point par heure de jeu écoulée (pas par appel de flush, qui peut
// survenir toutes les 20s via le heartbeat) : le flush écrit de toute façon
// le document joueur en entier à chaque action, donc consigner l'historique
// ici ne coûte aucune écriture serveur supplémentaire.
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
  // Production, plafond de l'entrepôt, entretien de flotte et panne d'énergie.
  player.resources = advanceResources(player, elapsedSeconds, now - elapsedSeconds * 1000);
  ensureContracts(player, now);
  player.resourcesUpdatedAtMs = now;
  recordResourceHistory(player, now);
  ensureSeasonRollover(player, now);
  // v3.5 : colonies (production, constructions, défenses) et colonisation.
  notifications.push(...advanceColonies(player, now));

  // --- Bâtiments en construction ---
  for (const buildingId of Object.keys(queues.buildingUpgrades) as (keyof typeof queues.buildingUpgrades)[]) {
    const entry = queues.buildingUpgrades[buildingId];
    if (!entry || entry.endTime > now) continue;

    const def = findBuilding(buildingId);
    if (def) {
      player.buildings[buildingId].level += 1;
      grantCommanderXp(player, "engineer", COMMANDER_XP.buildingDone);
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
        front.endTime = now + (u ? getUnitBuildTime(u, player.techLevels) : 0) * 1000;
        break;
      }
      if (front.endTime > now) break;

      const u = findUnit(front.unitId);
      if (u) {
        if (!player.units[u.id]) player.units[u.id] = { level: 1, count: 0 };
        player.units[u.id].count += 1;
        bumpStat(player, "unitsBuilt");
      }
      const completedEndTime = front.endTime;
      queue.shift();

      if (queue.length > 0 && queue[0].endTime === null) {
        const nu = findUnit(queue[0].unitId);
        // Chaîné depuis la fin programmée de l'unité précédente (pas "now") :
        // si le joueur était hors-ligne longtemps, plusieurs unités en file
        // peuvent ainsi se terminer d'affilée dans ce même flush, au lieu de
        // réinitialiser le minuteur sur l'instant présent à chaque appel.
        queue[0].endTime = completedEndTime + (nu ? getUnitBuildTime(nu, player.techLevels) : 0) * 1000;
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
      setStat(player, "lastResearchAtMs", entry.endTime);
      grantCommanderXp(player, "engineer", COMMANDER_XP.researchDone);
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

    // Bonus d'événement : selon l'heure de fin de la mission.
    const factor = missionRewardFactor(entry.endTime);
    const reward = Object.fromEntries(Object.entries(missionRewards(mission, player)).map(([k, v]) => [k, Math.round(v * factor)]));
    for (const [res, amount] of Object.entries(reward)) {
      if (res === "xp") {
        applyXpDelta(player, amount, now);
      } else {
        player.resources[res as ResourceId] = (player.resources[res as ResourceId] ?? 0) + amount;
      }
    }
    recordContract(player, "missions", 1, now);
    grantCommanderXp(player, "steward", COMMANDER_XP.missionDone);
    recordMission(player, contractDay(entry.endTime));
    notifications.push({
      kind: "mission",
      title: "Mission terminée",
      message: `${mission.name} : récompense obtenue${reward.xp ? ` (+${reward.xp} XP)` : ""}.`,
      createdAtMs: now,
      read: false,
    });
  }
  queues.activeMissions = stillActiveMissions;

  // --- v4.0 : capsule du Labo de synthèse terminée ---
  const capsule = advanceSynthesis(player, now);
  if (capsule) {
    notifications.push({
      kind: "building",
      title: "Capsule prête",
      message: `${CAPSULES[capsule.type].name} (niveau ${capsule.level}) rejoint la réserve du Labo de synthèse.`,
      createdAtMs: now,
      read: false,
    });
  }

  // --- Succès ---
  const newAchievements = checkNewAchievements(player);
  if (newAchievements.length > 0) {
    player.unlockedAchievements = [...(player.unlockedAchievements ?? []), ...newAchievements.map((a) => a.id)];
    let totalXp = 0;
    for (const a of newAchievements) {
      const reward = achievementReward(a, player);
      for (const [res, amount] of Object.entries(reward) as [ResourceId, number][]) player.resources[res] = (player.resources[res] ?? 0) + amount;
      if (a.rewardXp > 0) applyXpDelta(player, a.rewardXp, now);
      totalXp += a.rewardXp;
      if (a.title && !(player.titles ?? []).some((t) => t.label === a.title)) {
        player.titles = [...(player.titles ?? []), { label: a.title, seasonId: `achievement:${a.id}`, rank: 1 }];
      }
    }
    // Plusieurs succès d'un coup (rattrapage) : une seule notification.
    if (newAchievements.length > 3) {
      notifications.push({
        kind: "achievement",
        title: `${newAchievements.length} succès débloqués !`,
        message: `${newAchievements.slice(0, 5).map((a) => `${a.emoji} ${a.name}`).join(", ")}${newAchievements.length > 5 ? "…" : ""} (+${formatInt(totalXp)} XP). Détails sur la page Succès.`,
        createdAtMs: now,
        read: false,
      });
    } else {
      for (const a of newAchievements) {
        notifications.push({
          kind: "achievement",
          title: "Succès débloqué !",
          message: `${a.emoji} ${a.name} — ${a.description}${a.rewardXp > 0 ? ` (+${a.rewardXp} XP${a.rewardHours > 0 ? `, ${a.rewardHours} h de production` : ""})` : ""}${a.title ? ` · titre « ${a.title} »` : ""}`,
          createdAtMs: now,
          read: false,
        });
      }
    }
  }

  return { player, queues, notifications };
}

function applyTechEffect(player: PlayerState, techId: string, level: number) {
  const tech = TECHNOLOGIES.find((t) => t.id === techId);
  if (!tech) return;

  const levels = { ...player.techLevels, [techId]: level };
  for (const effect of techEffects(tech)) {
    switch (effect.type) {
      case "energy_efficiency":
        player.bonuses.energyEfficiency = techBonus(levels, "energy_efficiency");
        break;
      case "unit_defense":
        player.bonuses.unitDefenseBonus = techBonus(levels, "unit_defense");
        break;
      case "unit_attack":
        player.bonuses.unitAttackBonus = techBonus(levels, "unit_attack");
        break;
      case "building_discount":
        player.bonuses.buildingUpgradeDiscount = techBonus(levels, "building_discount");
        break;
      case "unlock_recipe":
        player.bonuses.unlockedRecipes = level;
        break;
      case "unlock_hangars":
      case "unlock_buildings":
        for (const id of buildingsUnlockedByTech(techId, BUILDINGS)) {
          if (!BUILDINGS.some((b) => b.id === id)) continue;
          player.buildings[id] = { level: player.buildings[id]?.level ?? 1, unlocked: true };
        }
        break;
      case "unlock_next_level": {
        const unitId = effect.target || unitForTech(techId);
        if (!unitId) break;
        if (!player.units[unitId]) player.units[unitId] = { level: 0, count: 0 };
        player.units[unitId].level = level;
        break;
      }
      default:
        // Les autres effets sont calculés à la volée depuis les niveaux.
        break;
    }
  }
}
