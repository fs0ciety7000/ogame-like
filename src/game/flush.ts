import { refreshEliteUnlocks } from "@/game/eliteUnits";
import { finishAllTimers } from "@/game/adminTools";
import { advanceWorkshop } from "@/game/workshop";
import { advanceColonies } from "@/game/colonies";
import { BUILDINGS, findBuilding } from "@/game/buildings";
import { advanceEconomy, advanceResources, missionRewards } from "@/game/economy";
import { ensureContracts, recordContract } from "@/game/contracts";
import { settleLegacyDaily } from "@/game/dailyMissions";
import { MISSIONS } from "@/game/missions";
import { missionRewardFactor } from "@/game/events";
import { buildingsUnlockedByTech, findTech, techBonus, techEffects, TECHNOLOGIES } from "@/game/technologies";
import { findUnit, getUnitBuildTime, UNIT_TO_TECH } from "@/game/units";
import { ACHIEVEMENT_TOKENS, achievementReward, checkNewAchievements, type AchievementDef } from "@/game/achievements";
import { grantTokens } from "@/game/casino";
import { checkNewTitles, findTitle, grantTitle, titleStyle } from "@/game/titles";
import { bumpStat, recordMission, setStat } from "@/game/stats";
import { contractDay } from "@/game/contracts";
import { formatInt } from "@/game/format";
import { overflowOfGain, overflowSentence } from "@/game/storageOverflow";
import { applyXpDelta, ensureSeasonRollover } from "@/game/seasons";
import { COMMANDER_XP, grantCommanderXp } from "@/game/commanders";
import { advanceSynthesis, CAPSULES } from "@/game/synthesis";
import { addPassPoints, passTierToAnnounce } from "@/game/seasonPass";
import { advanceWeeklyRecap } from "@/game/weeklyRecap";
import { endVacation, VACATION_RULES } from "@/game/vacation";
import { syncClassUnits } from "@/game/classUnits";
import { advanceBuildPlan } from "@/game/buildPlan";
import { advancePrestige } from "@/game/prestige";
import { noteProductionLoss } from "@/game/healthTrace";
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
/** Titre décerné par un succès : celui du catalogue s'il est choisi, sinon le libellé libre. */
function achievementTitle(a: AchievementDef): string {
  return findTitle(a.titleId)?.label ?? a.title;
}

/** Succès nouvellement remplis : débloqués, récompensés, notifiés. 6.14.110 (AC-20) : appelé au rattrapage et après
 *  chaque action (`performPlayerAction`), pour qu'un succès gagné par l'action s'affiche tout de suite. */
export function grantNewAchievements(player: PlayerState, now: number, notifications: NewNotification[]): void {
  const newAchievements = checkNewAchievements(player);
  if (newAchievements.length > 0) {
    player.unlockedAchievements = [...(player.unlockedAchievements ?? []), ...newAchievements.map((a) => a.id)];
    let totalXp = 0;
    let totalTokens = 0;
    const tokensOf = new Map<string, number>();
    const rewards = new Map<string, Partial<Record<ResourceId, number>>>();
    const allRewards: Partial<Record<ResourceId, number>> = {};
    for (const a of newAchievements) {
      const reward = achievementReward(a, player);
      rewards.set(a.id, reward);
      for (const [res, amount] of Object.entries(reward) as [ResourceId, number][]) {
        player.resources[res] = (player.resources[res] ?? 0) + amount;
        allRewards[res] = (allRewards[res] ?? 0) + amount;
      }
      if (a.rewardXp > 0) applyXpDelta(player, a.rewardXp, now, "achievement");
      totalXp += a.rewardXp;
      // 5.15 : jetons du casino selon le palier du succès.
      const tokens = grantTokens(player, ACHIEVEMENT_TOKENS[a.tier] ?? 0);
      if (tokens > 0) tokensOf.set(a.id, tokens);
      totalTokens += tokens;
      // v5.10 : titre du catalogue (titleId) en priorité, sinon libellé libre.
      grantTitle(player, findTitle(a.titleId)?.label ?? a.title, `achievement:${a.id}`);
    }
    // Plusieurs succès d'un coup (rattrapage) : une seule notification.
    if (newAchievements.length > 3) {
      notifications.push({
        kind: "achievement",
        title: `${newAchievements.length} succès débloqués !`,
        message: `${newAchievements.slice(0, 5).map((a) => `${a.emoji} ${a.name}`).join(", ")}${newAchievements.length > 5 ? "…" : ""} (+${formatInt(totalXp)} XP${totalTokens > 0 ? `, +${totalTokens} jeton${totalTokens > 1 ? "s" : ""} du casino` : ""}). Détails sur la page Succès.`,
        createdAtMs: now,
        read: false,
        link: "/game/succes",
        data: { xp: totalXp || undefined, resources: allRewards },
      });
    } else {
      for (const a of newAchievements) {
        notifications.push({
          kind: "achievement",
          title: "Succès débloqué !",
          message: `${a.emoji} ${a.name} — ${a.description}${a.rewardXp > 0 ? ` (+${a.rewardXp} XP${a.rewardHours > 0 ? `, ${a.rewardHours} h de production` : ""})` : ""}${achievementTitle(a) ? ` · titre « ${achievementTitle(a)} »` : ""}${tokensOf.get(a.id) ? ` · +${tokensOf.get(a.id)} jeton${(tokensOf.get(a.id) ?? 0) > 1 ? "s" : ""} du casino` : ""}`,
          createdAtMs: now,
          read: false,
          link: "/game/succes",
          data: { xp: a.rewardXp || undefined, resources: rewards.get(a.id) },
        });
      }
    }
  }
}

export function flushState(playerIn: PlayerState, queuesIn: QueuesState, now: number): FlushResult {
  const player: PlayerState = structuredClone(playerIn);
  const queues: QueuesState = structuredClone(queuesIn);
  const notifications: NewNotification[] = [];

  // --- v4.2 : vacances (production au quart, files gelées, décalées au retour) ---
  const vac = player.vacation;
  if (vac && !vac.endedAtMs && vac.startedAtMs <= now) {
    const from = Math.max(player.resourcesUpdatedAtMs || now, vac.startedAtMs);
    const to = Math.min(now, vac.untilMs);
    if (to > from) {
      const before = player.resources;
      const after = advanceResources(player, (to - from) / 1000, from);
      player.resources = Object.fromEntries(
        Object.entries(after).map(([res, n]) => {
          const old = before[res as ResourceId] ?? 0;
          return [res, n > old ? old + (n - old) * VACATION_RULES.productionFactor : n];
        }),
      ) as PlayerState["resources"];
      player.resourcesUpdatedAtMs = to;
    }
    if (now >= vac.untilMs) {
      endVacation(player, queues, vac.untilMs);
      notifications.push({ kind: "event", title: "Retour de vacances", message: "Tes vacances sont terminées : production et chantiers reprennent normalement.", createdAtMs: now, read: false });
    } else {
      recordResourceHistory(player, now);
      return { player, queues, notifications };
    }
  }

  // --- Production continue ---
  const elapsedSeconds = Math.max(0, (now - (player.resourcesUpdatedAtMs || now)) / 1000);
  // Production, plafond de l'entrepôt, entretien de flotte et panne d'énergie.
  const beforeProduction = player.resources;
  // 6.14.143 (PB-L2) : avec le tampon de l'entrepôt (palier 10), rempli et versé aussi pendant l'absence.
  const advanced = advanceEconomy(player, elapsedSeconds, now - elapsedSeconds * 1000);
  player.resources = advanced.resources;
  if (Object.keys(advanced.buffer).length) player.storageBuffer = advanced.buffer;
  else if (player.storageBuffer && Object.keys(player.storageBuffer).length) player.storageBuffer = null;
  // 6.14.107 (AE-L4) : production perdue à entrepôt plein (santé de l'équilibre, deux semaines au plus) ; le tampon n'est pas une perte.
  noteProductionLoss(player, beforeProduction, player.resources, elapsedSeconds, now - elapsedSeconds * 1000, now, advanced.buffered);
  ensureContracts(player, now);
  // 6.2 (lot N) : missions du jour fusionnées ; celles faites mais pas réclamées sont payées une fois.
  const legacyTokens = settleLegacyDaily(player, now);
  if (legacyTokens > 0) notifications.push({ kind: "event", title: "Missions du jour réglées", message: `Les missions du jour rejoignent les objectifs du jour. Tes missions faites t'ont rapporté ${legacyTokens} jeton${legacyTokens > 1 ? "s" : ""}.`, createdAtMs: now, read: false, link: "/game/ordres" });
  player.resourcesUpdatedAtMs = now;
  recordResourceHistory(player, now);
  ensureSeasonRollover(player, now);
  // v3.5 : colonies (production, constructions, défenses) et colonisation.
  notifications.push(...advanceColonies(player, now));

  // v5.5 : compte test, tout ce qui est en cours se termine maintenant.
  if (player.testMode) finishAllTimers(queues, now);
  // 5.20 : Atelier de réparation (unités en file, puis coques abîmées).
  notifications.push(...advanceWorkshop(player, now, !!player.testMode));
  // 6.14.85 (RL-2) : projet de prestige arrivé à terme (compteur, points, notification au Journal).
  notifications.push(...advancePrestige(player, now));

  // --- Bâtiments en construction ---
  const finishedAt: Record<string, number> = {};
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
    finishedAt[buildingId] = entry.endTime;
    delete queues.buildingUpgrades[buildingId];
  }
  // v4.9 : file planifiée (la suite démarre dès la fin du chantier précédent).
  notifications.push(...advanceBuildPlan(player, queues, now, finishedAt));

  // --- Files de production d'unités ---
  let unitsDone = 0;
  (["attack", "defense"] as const).forEach((category) => {
    const queue = queues.unitQueues[category];
    let guard = 0;
    while (queue.length > 0 && guard++ < 2000) {
      const front = queue[0];
      // 6.14.145 (PB-L4, I2) : une commande en attente d'une place ne démarre que par `startWaitingUnits` (place vérifiée).
      if (front.wait) break;
      if (front.endTime === null) {
        const u = findUnit(front.unitId);
        front.endTime = now + (u ? getUnitBuildTime(u, player.techLevels, player) : 0) * 1000;
        break;
      }
      if (front.endTime > now) break;

      const u = findUnit(front.unitId);
      if (u) {
        if (!player.units[u.id]) player.units[u.id] = { level: 1, count: 0 };
        player.units[u.id].count += 1;
        bumpStat(player, "unitsBuilt");
        unitsDone += 1;
      }
      const completedEndTime = front.endTime;
      queue.shift();

      if (queue.length > 0 && queue[0].endTime === null && !queue[0].wait) {
        const nu = findUnit(queue[0].unitId);
        // Chaîné depuis la fin programmée de l'unité précédente (pas "now") :
        // si le joueur était hors-ligne longtemps, plusieurs unités en file
        // peuvent ainsi se terminer d'affilée dans ce même flush, au lieu de
        // réinitialiser le minuteur sur l'instant présent à chaque appel.
        queue[0].endTime = completedEndTime + (nu ? getUnitBuildTime(nu, player.techLevels, player) : 0) * 1000;
      }
    }
  });

  // v5.14 : le Mécanicien progresse par tranche de 10 unités sorties des chantiers.
  if (unitsDone > 0) grantCommanderXp(player, "mechanic", COMMANDER_XP.unitsBuilt * Math.ceil(unitsDone / 10));

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
    let missionXp = 0;
    const paid: Partial<Record<ResourceId, number>> = {};
    for (const [res, amount] of Object.entries(reward)) {
      if (res === "xp") {
        // 5.17.1 : un compte test termine ses missions aussitôt : elles ne rapportent pas d'XP.
        // 5.18 : XP après paliers journaliers.
        if (!player.testMode) missionXp = applyXpDelta(player, amount, now, "mission");
      } else {
        player.resources[res as ResourceId] = (player.resources[res as ResourceId] ?? 0) + amount;
        paid[res as ResourceId] = amount;
      }
    }
    // 6.14.155 (R8, AE-14) : la part versée au-delà de l'entrepôt est dite (versement inchangé, I6).
    const overflow = overflowOfGain(player, paid);
    const overLine = overflowSentence(overflow);
    recordContract(player, "missions", 1, now);
    grantCommanderXp(player, "steward", COMMANDER_XP.missionDone);
    addPassPoints(player, "mission", now);
    recordMission(player, contractDay(entry.endTime));
    notifications.push({
      kind: "mission",
      title: "Mission terminée",
      message: `${mission.name} : récompense obtenue${missionXp > 0 ? ` (+${missionXp} XP${missionXp < reward.xp ? ", palier du jour" : ""})` : ""}.${overLine ? ` ${overLine}` : ""}`,
      createdAtMs: now,
      read: false,
      ...(overLine ? { data: { overflow } } : {}),
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
  grantNewAchievements(player, now, notifications);

  // --- v5.10 : résumé de la semaine écoulée (premier passage du lundi) ---
  const weekRecap = advanceWeeklyRecap(player, now);
  if (weekRecap) {
    const parts = [
      weekRecap.victories ? `${weekRecap.victories} victoire${weekRecap.victories > 1 ? "s" : ""}` : "",
      weekRecap.loot ? `${formatInt(weekRecap.loot)} pillés` : "",
      weekRecap.missions ? `${weekRecap.missions} mission${weekRecap.missions > 1 ? "s" : ""}` : "",
      weekRecap.achievements ? `${weekRecap.achievements} succès` : "",
    ].filter(Boolean);
    notifications.push({
      kind: "system",
      title: "Ton résumé de la semaine",
      message: `${parts.length ? parts.join(", ") : "Une semaine calme"}${weekRecap.xp > 0 ? ` et +${formatInt(weekRecap.xp)} XP` : ""}. Partage ta carte depuis l'accueil.`,
      createdAtMs: now,
      read: false,
      link: "/game?semaine=1",
      data: { xp: weekRecap.xp > 0 ? weekRecap.xp : undefined },
    });
  }

  // --- v5.10 : palier du passe prêt à récupérer ---
  const passTierReady = passTierToAnnounce(player, now);
  if (passTierReady.tier > 0 && passTierReady.claimable > 0) {
    notifications.push({
      kind: "season",
      title: `Passe de saison : palier ${passTierReady.tier} atteint`,
      message: passTierReady.claimable > 1 ? `${passTierReady.claimable} paliers t'attendent : récupère leurs récompenses.` : "Une récompense t'attend : récupère-la sur la page du passe.",
      createdAtMs: now,
      read: false,
      link: "/game/passe",
    });
  }

  // --- v5.10 : titres du catalogue débloqués par une mesure ---
  // 6.5 : vaisseaux de classe (niveau = techno de référence, dans la bonne classe).
  for (const id of syncClassUnits(player)) {
    notifications.push({ kind: "event", title: "Vaisseau de classe débloqué", message: `${findUnit(id)?.name ?? id} rejoint ton chantier.`, createdAtMs: now, read: false, link: "/game/unites" });
  }
  // 5.22 : unités d'élite (Labo complet et vendetta gagnée contre la personnalité visée).
  for (const id of refreshEliteUnlocks(player)) {
    notifications.push({ kind: "event", title: "Unité d'élite débloquée", message: `${findUnit(id)?.name ?? id} rejoint ton chantier. Elle ne combat que les seigneurs de guerre.`, createdAtMs: now, read: false, link: "/game/unites" });
  }
  for (const t of checkNewTitles(player)) {
    if (!grantTitle(player, t.label, `title:${t.id}`)) continue;
    const style = titleStyle(t.label);
    notifications.push({
      kind: "achievement",
      title: "Nouveau titre !",
      message: `${style.icon} « ${t.label} »${style.rarity ? ` (${style.rarity.toLowerCase()})` : ""} — ${t.description} Affiche-le depuis ton profil.`,
      createdAtMs: now,
      read: false,
      link: "/game/profil",
    });
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
