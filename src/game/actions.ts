import { chooseEmpireClass } from "@/game/empireClassChoose";
import { upgradeMoon } from "@/game/moonUpgrade";
import { assertEliteBuildable } from "@/game/eliteUnits";
import { assertClassUnitBuildable } from "@/game/classUnits";
import { playerModifiers } from "@/game/modifiers";
import { DOCK_POLICY_LABELS, dockReadyCount, dockScrap, dockTier, freeRushWorkshop, rushWorkshop, setDockSettings, workshopHangarUnits } from "@/game/workshop";
import { autoCommission, commissionDocked, hangarLoad, hasWaitingUnits, startWaitingUnits, waitingOrders } from "@/game/hangar";
import { claimDailyMission } from "@/game/dailyMissions";
import { claimStreak } from "@/game/streak";
import { describeGain, formatInt } from "@/game/format";
import { overflowOfGain, overflowSentence } from "@/game/storageOverflow";
import { claimChronicle } from "@/game/chronicles";
import { assertNotOnVacation, endVacation, onVacation } from "@/game/vacation";
import { playerBuildingDiscount, playerBuildTimeFactor, playerResearchTimeFactor } from "@/game/bonuses";
import { ascend } from "@/game/ascension";
import { buildColonyDefense, renameColony, setColonyRoute, setColonySpec, startColonization, upgradeColonyBuilding } from "@/game/colonies";
import { claimOnboarding, setOnboardingHidden } from "@/game/onboarding";
import { claimGuideStep, setGuideHidden } from "@/game/advancedGuide";
import { claimStartReserve } from "@/game/startRewards";
import { CLAIM_LABELS, describeClaims, pendingClaims, type ClaimAllAction, type ClaimContext } from "@/game/claimAll";
import { claimCodexCategoryLocal, claimCodexTitleLocal, type CodexContext } from "@/game/codex";
import { challengeTierIndex, claimChallengeReward } from "@/game/challenges";
import { setPosture } from "@/game/formations";
import { bumpStat, parisHour, setStat } from "@/game/stats";
import { setActiveTitle } from "@/game/seasons";
import {
  applyBuildingDiscount,
  BUILDING_UNLOCK_COST,
  findBuilding,
  getBuildingUpgradeCost,
  getBuildingUpgradeTime,
  unlockBlocker,
  withMissingBuildings,
} from "@/game/buildings";
import { flushState, grantNewAchievements, type NewNotification } from "@/game/flush";
import { challengeTokens, claimDailyTokens, grantTokens, playerCasino, tokensLabel } from "@/game/casino";
import { EXCHANGE_RULES, exchangeRareLeft, getTradeRate, isCommonToCommon, isCommonToRare, recordCommonExchange, recordRareExchange, RESOURCE_LIST, tradeQuote } from "@/game/resources";
import { RESEARCH_RULES, checkPrereqs, findTech, getTechAmberCost, getTechCost, getTechTime } from "@/game/technologies";
import { findUnit, getUnitBuildTime, ownedBlueprints, scaleUnitCost } from "@/game/units";
import { playerUnitCost } from "@/game/effectTargets";
import { hasPrerequisites, MISSIONS } from "@/game/missions";
import { GameActionError } from "@/game/errors";
import { claimContract, recordContract, rerollContract } from "@/game/contracts";
import { contentObjective, trackAction } from "@/game/trackedActions";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { applyXpDelta } from "@/game/seasons";
import { assignCommanders, COMMANDER_RULES, COMMANDER_XP, grantCommanderXp, recruitCommander, trainCommander } from "@/game/commanders";
import { activateCapsule, craftCapsule } from "@/game/synthesis";
import { equipRelic, fuseRelics, recycleRelic } from "@/game/relics";
import { bountyState } from "@/game/bounties";
import { ACHIEVEMENT_HINT_RULES, achievementHint, checkHintPurchase } from "@/game/achievements";
import { setConversationArchived } from "@/game/messages";
import { applyModulePreset, buildModule, deleteModulePreset, fuseModulePlans, mountModule, recycleModule, saveModulePreset, unmountModule } from "@/game/modules";
import { productionHours, locateLair } from "@/game/pirates";
import { addPassPoints, claimPassTier, passDailyLogin } from "@/game/seasonPass";
import { PRESENCE_WRITE_MS, recordActiveDay } from "@/game/retention";
import { isCancelTarget, performCancel, type CancelTarget } from "@/game/cancel";
import { setProfileStyle } from "@/game/profile";
import { learnTalent, resetTalents } from "@/game/talents";
import { addSeenAnnouncements } from "@/game/announcements";
import { addPlanned, buildSlotBlocker, removePlanned } from "@/game/buildPlan";
import { beginPrestige, prestigeStartCost } from "@/game/prestige";
import type { BattleReport, PlayerState, QueuesState, ResourceId } from "@/types/game";
import { noteAmber } from "@/game/healthTrace";
import { exchangeTaxCut, hangarWaitingMax, setBuildingChoice } from "@/game/buildingTiers";
import { spendAmber, spendResources } from "@/game/spending";

/* =====================================================
   Actions de jeu d'un joueur, arbitrées par le serveur
   (pocketbase/pb_hooks, POST /api/cosmic/action).

   Fonctions pures : le hook lit le joueur et ses files, appelle
   performPlayerAction, puis écrit le résultat dans une transaction. Les
   paramètres viennent du navigateur : tout est revérifié ici.
===================================================== */

export type GameAction =
  | { type: "vacationEnd" }
  | { type: "workshopRush"; jobId?: string }
  | { type: "dockCommission"; unitId?: string }
  | { type: "dockScrap"; unitId: string; qty: number }
  | { type: "dockSettings"; policy?: string; priority?: string }
  | { type: "workshopFreeRush" }
  | { type: "buildingChoice"; slot: string; value: string }
  | { type: "chronicleClaim"; episode: number }
  | { type: "dailyClaim"; index: number }
  | { type: "cancel"; target: CancelTarget }
  | { type: "sync"; playtimeDeltaSeconds?: number }
  | { type: "unlockBuilding"; buildingId: string }
  | { type: "upgradeBuilding"; buildingId: string }
  | { type: "buildUnits"; unitId: string; qty: number }
  | { type: "sellUnits"; unitId: string; qty: number }
  | { type: "research"; techId: string }
  | { type: "mission"; missionKey: string }
  | { type: "trade"; sellId: ResourceId; buyId: ResourceId; amount: number }
  | { type: "claimContract"; contractId: string }
  | { type: "rerollContract"; contractId: string }
  | { type: "setTitle"; title: string }
  | { type: "claimOnboarding"; stepId: string }
  | { type: "claimGuide"; stepId: string }
  | { type: "codexClaim"; category: string }
  | { type: "codexTitle" }
  | { type: "casinoDaily" }
  | { type: "challengeClaim" }
  | { type: "claimAll" }
  | { type: "hideGuide"; hidden: boolean }
  | { type: "hideOnboarding"; hidden: boolean }
  | { type: "setPosture"; posture: string }
  | { type: "ascend" }
  | { type: "colonize"; name: string }
  | { type: "colonyUpgrade"; colonyId: string; buildingId: string }
  | { type: "colonyDefense"; colonyId: string; unitId: string; qty: number }
  | { type: "colonyRename"; colonyId: string; name: string }
  | { type: "colonySpec"; colonyId: string; spec: string }
  | { type: "empireClass"; classId: string }
  | { type: "moonUpgrade" }
  | { type: "prestigeStart" }
  | { type: "colonyRoute"; colonyId: string; everyHours: number; keepPct: number; direction?: "collect" | "supply" }
  | { type: "locateLair"; factionId: string }
  | { type: "commanderRecruit"; commanderId: string; method?: "amber" | "production" }
  | { type: "commanderAssign"; ids: string[] }
  | { type: "commanderTrain"; commanderId: string }
  | { type: "synthCraft"; capsule: string; level: number }
  | { type: "synthActivate"; capsule: string; level?: number }
  | { type: "relicEquip"; slot: number; relicId: string | null }
  | { type: "relicFuse"; template: string; rarity: string }
  | { type: "relicRecycle"; relicId: string }
  | { type: "achievementHint"; achievementId: string }
  | { type: "moduleBuild"; moduleId: string }
  | { type: "moduleMount"; moduleId: string; cls: string; slot: number }
  | { type: "moduleUnmount"; cls: string; slot: number }
  | { type: "moduleRecycle"; moduleId: string }
  | { type: "moduleFuse"; moduleIds: string[] }
  | { type: "chatArchive"; with: string; archived: boolean }
  | { type: "modulePresetSave"; name: string }
  | { type: "modulePresetApply"; index: number }
  | { type: "modulePresetDelete"; index: number }
  | { type: "talentLearn"; talentId: string }
  | { type: "talentReset" }
  | { type: "streakClaim" }
  | { type: "startReserveClaim" }
  | { type: "setProfileStyle"; style: { banner?: string; emblem?: string; motto?: string; pinned?: string[]; planet?: Partial<import("@/game/planetLook").PlanetLook> } }
  | { type: "passClaim"; tier: number }
  | { type: "seenAnnouncements"; ids: string[] }
  | { type: "planBuilding"; buildingId: string }
  | { type: "unplanBuilding"; index: number };

export interface AwaySummary {
  elapsedMs: number;
  resourceGains: Partial<Record<ResourceId, number>>;
  notifications: NewNotification[];
}

const RESOURCE_IDS = new Set<string>(RESOURCE_LIST.map((r) => r.id));
const MAX_QTY = 100_000;

/** Entier strictement positif (et raisonnable) venu du navigateur. */
function positiveInt(value: unknown, label: string): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n <= 0) throw new GameActionError(`${label} invalide.`);
  return n;
}

/** 6.14.110 (AC-D) : toute dépense passe par `spendResources` (vérifie, débite, compte `spent` et l'objectif « Dépenser »).
 *  v5.9 : un cadeau n'est pas une dépense (`spending = false`), sinon deux joueurs se renvoient les mêmes ressources. */
function pay(player: PlayerState, cost: Partial<Record<string, number>>, now: number, spending = true) {
  spendResources(player, cost, now, { count: spending });
}

/** Unités hors hangar (en vol) augmentées de celles qui gardent leur place à l'Atelier (5.28 : hors Cale sèche).
 *  Le calcul complet des places est dans hangar.ts (`hangarLoad`). */
export function withWorkshop(away: Record<string, number>, player: Parameters<typeof workshopHangarUnits>[0]): Record<string, number> {
  const out = { ...away };
  for (const [id, n] of Object.entries(workshopHangarUnits(player))) out[id] = (out[id] ?? 0) + n;
  return out;
}

export function hangarUsed(units: PlayerState["units"], away: Record<string, number>, category: "attack" | "defense"): number {
  let used = 0;
  for (const [id, u] of Object.entries(units)) {
    const def = findUnit(id);
    if (def?.category === category) used += (u?.count ?? 0) * def.hangarSpace;
  }
  for (const [id, n] of Object.entries(away)) {
    const def = findUnit(id);
    if (def?.category === category) used += (n > 0 ? n : 0) * def.hangarSpace;
  }
  return used;
}

interface ActionState {
  player: PlayerState;
  queues: QueuesState;
  preFlushPlayer: PlayerState;
  flushNotifications: NewNotification[];
  now: number;
  /** Vaisseaux partis en mission (ils reviendront occuper le hangar). */
  unitsAway: Record<string, number>;
  /** 6.14.25 (H29-3) : seigneurs affrontés et boss du Hall of fame (Codex), fournis par le serveur. */
  codex?: CodexContext;
  /** 6.14.113 (AC-G) : réglages du casino et défi terminé, fournis par le serveur (`actionNeedsClaimContext`). */
  claims?: ClaimContext;
}

/** Rend à `target` le contenu de `saved` (même objet : les références tenues par l'appelant restent valables). */
function restoreInPlace<T extends object>(target: T, saved: T): void {
  for (const k of Object.keys(target)) if (!(k in saved)) delete (target as Record<string, unknown>)[k];
  Object.assign(target, saved);
}

function applyAction(s: ActionState, action: GameAction): unknown {
  const { player, queues, now } = s;
  // v4.2 : peu d'actions restent possibles pendant les vacances. 6.14.112 (AC-11) : liste blanche unique, réglable
  // (`vacation.allowed`), la même que celle des routes du serveur.
  assertNotOnVacation(player, now, String(action?.type));
  switch (action?.type) {
    case "sync": {
      const elapsedMs = Math.max(0, now - (s.preFlushPlayer.resourcesUpdatedAtMs || now));
      // Temps de jeu déclaré par le navigateur, borné par le temps réellement écoulé.
      const playtime = Math.min(Math.max(0, Number(action.playtimeDeltaSeconds) || 0), elapsedMs / 1000 + 5, 300);
      player.playtimeSeconds = (player.playtimeSeconds || 0) + Math.floor(playtime);
      // v4.1 : connexion du jour pour le passe de saison (suspendue pendant les vacances).
      if (!onVacation(player, now)) passDailyLogin(player, now);
      // v4.5 : jour d'activité, pour le suivi de rétention (administration).
      recordActiveDay(player, now);
      // v4.6 : présence (« en ligne »), réécrite au plus toutes les 2 min.
      if (now - (player.lastActiveMs ?? 0) >= PRESENCE_WRITE_MS) player.lastActiveMs = now;
      const resourceGains: Partial<Record<ResourceId, number>> = {};
      for (const key of Object.keys(player.resources) as ResourceId[]) {
        const delta = (player.resources[key] ?? 0) - (s.preFlushPlayer.resources[key] ?? 0);
        if (delta > 0) resourceGains[key] = delta;
      }
      const summary: AwaySummary = { elapsedMs, resourceGains, notifications: s.flushNotifications };
      return summary;
    }

    case "unlockBuilding": {
      const info = BUILDING_UNLOCK_COST[action.buildingId];
      const state = player.buildings[action.buildingId];
      if (!info || !state) throw new GameActionError("Ce bâtiment se débloque via le Labo.");
      if (state.unlocked) throw new GameActionError("Déjà débloqué.");
      // 5.28 : bâtiment requis (Cale sèche : Atelier niveau 5).
      const def = findBuilding(action.buildingId);
      const blocker = def ? unlockBlocker(def, player.buildings) : null;
      if (blocker) throw new GameActionError(blocker);
      const cost: Record<string, number> = {};
      if ("multi" in info) info.resources.forEach((r) => (cost[r.resource] = r.amount));
      else cost[info.resource] = info.amount;
      pay(player, cost, now);
      state.unlocked = true;
      return undefined;
    }

    case "upgradeBuilding": {
      const def = findBuilding(action.buildingId);
      const state = player.buildings[action.buildingId];
      if (!def || !state) throw new GameActionError("Bâtiment inconnu.");
      if (!state.unlocked && !def.startsUnlocked) throw new GameActionError("Ce bâtiment n'est pas débloqué.");
      if (queues.buildingUpgrades[def.id]) throw new GameActionError("Amélioration déjà en cours.");
      if (state.level >= def.maxLevel) throw new GameActionError("Niveau maximum atteint.");
      const slotBlocker = buildSlotBlocker(player, queues);
      if (slotBlocker) throw new GameActionError(slotBlocker);
      const nextLevel = state.level + 1;
      const paid = applyBuildingDiscount(getBuildingUpgradeCost(def, nextLevel), playerBuildingDiscount(player));
      pay(player, paid, now);
      queues.buildingUpgrades[def.id] = { endTime: now + Math.round(getBuildingUpgradeTime(def, nextLevel) * playerBuildTimeFactor(player, now)) * 1000, startedAtMs: now, paid };
      recordContract(player, "upgrade_building", 1, now);
      // 6.14.121 (AP-L7) : action par contenu (épisode « nouveauté », objectifs paramétrés).
      trackAction(player, contentObjective("building", def.id), now);
      return undefined;
    }

    case "buildUnits": {
      const unit = findUnit(action.unitId);
      if (!unit) throw new GameActionError("Unité invalide.");
      const qty = Math.min(positiveInt(action.qty, "Quantité"), MAX_QTY);
      // 5.22 : unité d'élite : débloquée ET Labo toujours complet.
      if (unit.elite) assertEliteBuildable(player, unit.id);
      // 6.5 : vaisseau de classe : la classe d'empire du joueur et sa techno de référence.
      if (unit.empireClass) assertClassUnitBuildable(player, unit);
      if ((player.units[unit.id]?.level ?? 0) <= 0) throw new GameActionError("Cette unité doit d'abord être débloquée via le Labo.");

      const category = unit.category;
      const queue = queues.unitQueues[category];
      // 6.14.145 (PB-L4) : une commande déjà en attente démarre d'abord si une place s'est libérée (ordre de la file).
      s.flushNotifications.push(...startWaitingUnits(player, queues, s.unitsAway ?? {}, now));
      // 5.20 : les unités à l'Atelier gardent leur place (5.28 : sauf en Cale sèche). 5.27.2 : calcul unique (hangar.ts).
      const load = hangarLoad(player, queues, s.unitsAway ?? {}, category, now);
      // 6.14.145 (PB-L4, I2 réécrit) : au palier 10 du hangar, ce qui n'a pas de place attend dans la file (payé), sans prendre de place.
      const waitMax = hangarWaitingMax(player.buildings, category);
      const fit = queue.some((e) => e.wait) ? 0 : Math.min(qty, Math.floor(load.free / Math.max(1, unit.hangarSpace)));
      const rest = qty - fit;
      const name = category === "attack" ? "d'attaque" : "de défense";
      if (rest > 0 && waitMax <= 0) {
        throw new GameActionError(
          load.overflow > 0
            ? `Hangar ${name} en surcharge (${load.overflow} place${load.overflow > 1 ? "s" : ""} de trop) : améliore le hangar, démantèle ou envoie des vaisseaux en mission.`
            : `Capacité du hangar ${name} insuffisante.`,
        );
      }
      if (rest > 0) {
        const orders = waitingOrders(queue);
        const last = orders[orders.length - 1];
        const merges = !!last && last.unitId === unit.id && last.index + last.count === queue.length;
        if (!merges && orders.length >= waitMax) throw new GameActionError(`File d'attente du hangar ${name} pleine (${orders.length} / ${waitMax} commandes) : attends qu'une place se libère.`);
        const waitingPlaces = (merges ? last.places : 0) + rest * unit.hangarSpace;
        if (waitingPlaces > load.capacity) throw new GameActionError(`Commande trop grande : ${formatInt(waitingPlaces)} places en attente pour un hangar ${name} de ${formatInt(load.capacity)} places.`);
      }

      // 5.23 : réductions de coût ciblées (reliques, technos, officiers).
      const each = playerUnitCost(unit, player, now);
      pay(player, scaleUnitCost(each, qty), now);
      recordContract(player, "build_units", qty, now);
      trackAction(player, contentObjective("unit", unit.id), now, qty);
      const wasEmpty = queue.length === 0;
      for (let i = 0; i < fit; i++) queue.push({ unitId: unit.id, endTime: null });
      for (let i = 0; i < rest; i++) queue.push({ unitId: unit.id, endTime: null, wait: true });
      if (wasEmpty && queue[0] && !queue[0].wait) queue[0].endTime = now + getUnitBuildTime(unit, player.techLevels, player) * 1000;
      if (rest > 0) return { waiting: rest, started: fit };
      return undefined;
    }

    case "sellUnits": {
      const unit = findUnit(action.unitId);
      if (!unit) throw new GameActionError("Unité invalide.");
      // 6.14.110 (AC-21) : même borne que la construction.
      const qty = Math.min(positiveInt(action.qty, "Quantité"), MAX_QTY);
      if ((player.units[unit.id]?.count ?? 0) < qty) throw new GameActionError("Tu n'as pas assez d'unités à vendre.");
      player.units[unit.id].count -= qty;
      // 5.23 : revente à la moitié du prix payé aujourd'hui (réductions comprises).
      const each = playerUnitCost(unit, player, now);
      // 6.14.123 (AA5) : chaque ressource du coût (ferraille, énergie et, pour une unité de fin de partie, ressource rare).
      for (const [res, v] of Object.entries(scaleUnitCost(each, 0.5, Math.floor))) player.resources[res as ResourceId] = (player.resources[res as ResourceId] ?? 0) + (v ?? 0) * qty;
      bumpStat(player, "unitsSold", qty);
      return undefined;
    }

    case "research": {
      const tech = findTech(action.techId);
      if (!tech) throw new GameActionError("Technologie inconnue.");
      const nextLevel = (player.techLevels[tech.id] ?? 0) + 1;
      if (nextLevel > tech.maxLevel) throw new GameActionError("Niveau maximum atteint.");
      if (!checkPrereqs(tech, player.techLevels, ownedBlueprints(player)).valid) throw new GameActionError("Prérequis non remplis.");
      if (queues.activeResearches.some((r) => r.id === tech.id)) throw new GameActionError("Cette technologie est déjà en cours de recherche.");
      if (queues.activeResearches.length >= RESEARCH_RULES.maxConcurrent) {
        throw new GameActionError(`File de recherche pleine (${RESEARCH_RULES.maxConcurrent}/${RESEARCH_RULES.maxConcurrent}).`);
      }
      const paid = getTechCost(tech, nextLevel);
      // v5.9 : certaines technos coûtent aussi de l'ambre (vérifié avant de payer les ressources).
      const amber = getTechAmberCost(tech);
      const bounty = amber > 0 ? bountyState(player) : null;
      if (bounty && bounty.amber < amber) throw new GameActionError(`Pas assez d'ambre (${amber} requis).`);
      pay(player, paid, now);
      if (bounty) {
        spendAmber(player, bounty, amber, `Pas assez d'ambre (${amber} requis).`);
        player.bounties = bounty;
      }
      queues.activeResearches.push({ id: tech.id, endTime: now + Math.round(getTechTime(tech, nextLevel) * playerResearchTimeFactor(player, now)) * 1000, startedAtMs: now, paid, ...(amber > 0 ? { paidAmber: amber } : {}) });
      bumpStat(player, "researchStarted");
      recordContract(player, "research", 1, now);
      trackAction(player, contentObjective("research", tech.id), now);
      const hour = parisHour(now);
      if (hour >= 3 && hour < 5) setStat(player, "nightResearch", 1);
      return undefined;
    }

    case "mission": {
      const mission = MISSIONS[action.missionKey];
      if (!mission) throw new GameActionError("Mission inconnue.");
      if (queues.activeMissions.some((m) => m.key === mission.key)) throw new GameActionError("Mission déjà en cours.");
      if (!hasPrerequisites(mission, player.units)) throw new GameActionError("Prérequis non remplis.");
      queues.activeMissions.push({ key: mission.key, endTime: now + mission.duration * 1000 });
      return undefined;
    }

    case "trade": {
      const { sellId, buyId } = action;
      if (!RESOURCE_IDS.has(sellId) || !RESOURCE_IDS.has(buyId) || sellId === buyId) throw new GameActionError("Échange invalide.");
      const amount = positiveInt(action.amount, "Montant");
      // 6.14.165 (RR-2) : un taux réglé à 0 ferme ce sens d'échange.
      if (!(getTradeRate(sellId, buyId) > 0)) throw new GameActionError("Cet échange est fermé au comptoir.");
      if ((player.resources[sellId] ?? 0) < amount) throw new GameActionError("Pas assez de ressources à échanger.");
      // 5.26.1 : taxe sur ce qui est reçu, versée au pot commun par le serveur.
      // 6.14.143 (PB-L2) : Négoce (palier 15 de l'entrepôt) : taxe du comptoir réduite.
      const quote = tradeQuote(sellId, buyId, amount, exchangeTaxCut(player));
      if (quote.net <= 0) throw new GameActionError("Quantité trop faible pour cet échange.");
      // 6.14.106 (AE-L3, Q98) : plafond hebdomadaire des rares reçues contre des communes (le serveur fait autorité).
      const rareTrade = isCommonToRare(sellId, buyId);
      if (rareTrade) {
        const left = exchangeRareLeft(player, now);
        if (quote.net > left)
          throw new GameActionError(
            left > 0
              ? `Plafond du comptoir : ${formatInt(EXCHANGE_RULES.weeklyRareCap)} ressources rares par semaine. Il t'en reste ${formatInt(left)} cette semaine : échange moins de communes.`
              : `Plafond du comptoir atteint : ${formatInt(EXCHANGE_RULES.weeklyRareCap)} ressources rares par semaine. Reviens lundi.`,
          );
      }
      player.resources[sellId] -= amount;
      player.resources[buyId] = (player.resources[buyId] ?? 0) + quote.net;
      if (rareTrade) recordRareExchange(player, now, quote.net);
      // 6.14.166 (S8, NJ-32) : sens et date du dernier échange commune → commune (pas de conseil inverse aussitôt).
      else if (isCommonToCommon(sellId, buyId)) recordCommonExchange(player, now, sellId, buyId);
      bumpStat(player, "traded", amount);
      grantCommanderXp(player, "steward", COMMANDER_XP.marketTrade);
      return { gained: quote.net, tax: quote.tax, taxRes: buyId };
    }

    case "claimContract": {
      const claimed = claimContract(player, String(action.contractId ?? ""), now);
      bumpStat(player, "contracts");
      addPassPoints(player, "contract", now);
      grantCommanderXp(player, "steward", COMMANDER_XP.contractClaimed);
      return claimed;
    }

    case "rerollContract":
      return rerollContract(player, String(action.contractId ?? ""), now);

    case "setTitle":
      setActiveTitle(player, String(action.title ?? ""));
      return player.activeTitle;

    case "claimOnboarding":
      return claimOnboarding(player, String(action.stepId ?? ""));

    case "claimGuide":
      return claimGuideStep(player, String(action.stepId ?? ""));

    case "codexClaim":
      return claimCodexCategoryLocal(player, action.category, now, s.codex);

    // 6.14.113 (AC-19) : titre du Codex par l'action (même chemin que les catégories : rattrapage, vacances, Journal).
    case "codexTitle":
      return claimCodexTitleLocal(player, now, s.codex);

    // 6.14.113 (AC-15) : jeton du jour du casino (réglages lus par le serveur).
    case "casinoDaily": {
      const settings = s.claims?.casino;
      if (!settings) throw new GameActionError("Casino indisponible : recharge la page.");
      const added = claimDailyTokens(player, settings, now);
      if (added <= 0) throw new GameActionError("Le jeton du jour est déjà récupéré.");
      return { added, tokens: playerCasino(player).tokens };
    }

    // 6.14.113 (AC-15) : récompense du défi hebdomadaire. L'état du défi (qui a réclamé) est rendu au serveur dans
    // `claims.challenge.claimed`, qu'il enregistre dans la même transaction.
    case "challengeClaim": {
      const c = s.claims?.challenge;
      if (!c) throw new GameActionError("Défi indisponible : recharge la page.");
      const res = claimChallengeReward(c.claimed ?? c.previous, player, now);
      const tokens = s.claims?.casino ? grantTokens(player, challengeTokens(s.claims.casino, challengeTierIndex(res.challenge))) : 0;
      c.claimed = res.challenge;
      return { gain: res.gain, tokens };
    }

    case "claimAll": {
      // v5.11 : chaque réclamation passe par son action habituelle ; un échec n'arrête pas les autres.
      // 6.14.113 (AC-14) : chaque sous-action est isolée : un échec rend la fiche (et l'état du défi) d'avant cette
      // sous-action ; seules les règles du jeu (`GameActionError`) sont tues, une erreur de programmation remonte
      // (la route échoue, la transaction est annulée : rien n'est crédité à moitié).
      const counts: Partial<Record<string, number>> = {};
      for (const sub of pendingClaims(player, now, s.codex, s.claims)) {
        const savedPlayer = structuredClone(player);
        const savedQueues = structuredClone(queues);
        const savedChallenge = s.claims?.challenge ? s.claims.challenge.claimed : undefined;
        try {
          applyAction(s, sub);
          counts[sub.type] = (counts[sub.type] ?? 0) + 1;
        } catch (err) {
          restoreInPlace(player, savedPlayer);
          restoreInPlace(queues, savedQueues);
          if (s.claims?.challenge) s.claims.challenge.claimed = savedChallenge;
          if (!(err instanceof GameActionError)) throw err;
          /* déjà réclamé ou plus disponible */
        }
      }
      return counts;
    }

    case "hideGuide":
      setGuideHidden(player, action.hidden === true);
      return undefined;

    case "setPosture":
      return setPosture(player, action.posture, now);

    case "planBuilding":
      return addPlanned(player, queues, action.buildingId, now);

    case "unplanBuilding":
      removePlanned(queues, action.index);
      return { plan: queues.buildPlan };

    case "seenAnnouncements":
      player.announcementsSeen = addSeenAnnouncements(player.announcementsSeen, action.ids);
      return { seen: player.announcementsSeen.length };

    case "hideOnboarding":
      setOnboardingHidden(player, action.hidden === true);
      return player.onboarding;

    case "ascend":
      ascend(player, queues, now);
      return { ascensions: player.ascensions };

    case "colonize":
      return startColonization(player, action.name, now);

    case "colonyUpgrade":
      return upgradeColonyBuilding(player, String(action.colonyId ?? ""), String(action.buildingId ?? ""), now);

    case "colonyDefense":
      return buildColonyDefense(player, String(action.colonyId ?? ""), String(action.unitId ?? ""), action.qty, now);

    case "colonyRename":
      renameColony(player, String(action.colonyId ?? ""), action.name);
      return undefined;

    case "empireClass":
      return chooseEmpireClass(player, action.classId, now);

    // 6.14.0 : améliorer sa lune.
    case "moonUpgrade":
      return upgradeMoon(player, now);

    // 6.14.85 (RL-2) : projet de prestige, un à la fois (I32) ; payé comme une dépense (objectif « Dépenser »).
    case "prestigeStart": {
      const cost = prestigeStartCost(player);
      pay(player, cost, now);
      return beginPrestige(player, cost, now);
    }

    case "colonySpec":
      setColonySpec(player, String(action.colonyId ?? ""), String(action.spec ?? ""), now);
      return undefined;

    case "locateLair":
      return locateLair(player, String(action.factionId ?? ""), now);

    case "colonyRoute":
      return setColonyRoute(player, String(action.colonyId ?? ""), action.everyHours, action.keepPct, now, action.direction);

    case "commanderRecruit": {
      const method = action.method === "production" ? "production" : "amber";
      const def = recruitCommander(
        player,
        action.commanderId,
        (m) => {
          if (m === "production") {
            pay(player, productionHours(player, COMMANDER_RULES.recruitProductionHours), now);
            return;
          }
          const st = bountyState(player);
          spendAmber(player, st, COMMANDER_RULES.recruitAmber, `Il faut ${COMMANDER_RULES.recruitAmber} Ambre de Ruche (primes Kesh'Vaar).`);
          player.bounties = st;
        },
        method,
      );
      return { id: def.id };
    }

    case "commanderAssign":
      assignCommanders(player, action.ids, now);
      return undefined;

    case "commanderTrain":
      return { level: trainCommander(player, action.commanderId) };

    case "synthCraft":
      return craftCapsule(player, action.capsule, action.level, now);

    case "synthActivate":
      return { pct: activateCapsule(player, action.capsule, action.level, now) };

    case "relicEquip":
      equipRelic(player, action.slot, action.relicId);
      return undefined;

    case "relicFuse":
      return fuseRelics(player, action.template, action.rarity, now);

    case "relicRecycle": {
      const out = recycleRelic(player, action.relicId);
      const st = bountyState(player);
      st.amber += out.amber;
      player.bounties = st;
      noteAmber(player, "recycle", out.amber, now);
      return { amber: out.amber };
    }

    // 5.26.2 : indice d'un succès secret, payé en Ambre.
    case "achievementHint": {
      const a = checkHintPurchase(player, action.achievementId);
      const st = bountyState(player);
      spendAmber(player, st, ACHIEVEMENT_HINT_RULES.price, `Il faut ${ACHIEVEMENT_HINT_RULES.price} Ambre de Ruche pour cet indice.`);
      player.bounties = st;
      player.stats = { ...(player.stats ?? {}), hintsBought: [...(player.stats?.hintsBought ?? []), a.id] };
      return { hint: achievementHint(a) };
    }

    // 5.26 : modules de vaisseaux.
    case "moduleBuild": {
      const built = buildModule(player, action.moduleId, (cost) => pay(player, cost, now));
      bumpStat(player, "modulesBuilt");
      return built;
    }

    case "moduleMount":
      mountModule(player, action.moduleId, action.cls, action.slot);
      return undefined;

    case "moduleUnmount":
      unmountModule(player, action.cls, action.slot);
      return undefined;

    case "moduleRecycle": {
      const amber = recycleModule(player, action.moduleId);
      const st = bountyState(player);
      st.amber += amber;
      player.bounties = st;
      noteAmber(player, "recycle", amber, now);
      return { amber };
    }

    // 5.26.2 : archivage d'une conversation privée (elle revient au prochain message reçu).
    case "chatArchive": {
      const other = String(action.with ?? "").slice(0, 40);
      if (!other) throw new GameActionError("Conversation inconnue.");
      player.stats = { ...(player.stats ?? {}), archivedChats: setConversationArchived(player.stats?.archivedChats, other, !!action.archived, now) };
      return undefined;
    }

    // 5.26.2 : fusion de trois plans identiques, préréglages de montage.
    case "moduleFuse":
      return fuseModulePlans(player, action.moduleIds, now);

    case "modulePresetSave":
      return saveModulePreset(player, action.name);

    case "modulePresetApply":
      return applyModulePreset(player, action.index);

    case "modulePresetDelete":
      deleteModulePreset(player, action.index);
      return undefined;

    case "setProfileStyle":
      return setProfileStyle(player, action.style);

    case "talentLearn":
      return learnTalent(player, action.talentId);

    case "talentReset":
      return resetTalents(player, now);

    case "streakClaim":
      return claimStreak(player, now);

    // 6.14.165 (S6, NJ-25) : réserve du départ (récompenses en heures retenues tant que le compte était jeune).
    case "startReserveClaim":
      return { gained: claimStartReserve(player, now) };

    case "passClaim":
      return { gained: claimPassTier(player, action.tier, now) };

    case "chronicleClaim":
      return claimChronicle(player, action.episode, now);

    case "dailyClaim":
      // 5.15.12 : mission du jour (1 jeton, bonus aux trois).
      return claimDailyMission(player, action.index, now);

    case "cancel":
      // v4.7 : annulation au prorata (100 % la première minute ou si rien n'a commencé).
      if (!isCancelTarget(action.target)) throw new GameActionError("Chantier inconnu.");
      return performCancel(player, queues, action.target, now);

    case "workshopRush":
      // 5.21 : terminer un lot de réparation (ou toute la file) contre de l'Ambre.
      return rushWorkshop(player, typeof action.jobId === "string" && action.jobId ? action.jobId : undefined, now, bountyState, (p, w) => (p.bounties = w));

    case "workshopFreeRush":
      // 6.14.144 (PB-L3, palier 20 de l'Atelier) : réparation d'urgence gratuite, une fois par jour.
      return freeRushWorkshop(player, now);

    case "buildingChoice":
      // 6.14.142 (PB-L1) : choix d'un palier de bâtiment (palier atteint, option connue, un changement par 24 h ; le premier est libre).
      if (action.slot === "hangarAttack.lend" || action.slot === "hangarDefense.lend") {
        // 6.14.145 (PB-L4, baies modulaires) : un prêt ou sa reprise qui mettrait un hangar en surcharge est refusé (I4, I5).
        const away = s.unitsAway ?? {};
        const overflow = () => ({ attack: hangarLoad(player, queues, away, "attack", now).overflow, defense: hangarLoad(player, queues, away, "defense", now).overflow });
        const before = overflow();
        const saved = player.buildingChoices;
        const out = setBuildingChoice(player, action.slot, action.value, now);
        const after = overflow();
        const hit = after.attack > before.attack ? "d'attaque" : after.defense > before.defense ? "de défense" : null;
        if (hit) {
          player.buildingChoices = saved;
          throw new GameActionError(`Ce changement mettrait le hangar ${hit} en surcharge : libère d'abord des places.`);
        }
        return out;
      }
      return setBuildingChoice(player, action.slot, action.value, now);

    case "dockCommission": {
      // 5.28 : remettre en service les vaisseaux prêts de la Cale sèche (places libres du hangar).
      if (dockReadyCount(player) <= 0) throw new GameActionError("Aucun vaisseau prêt en Cale sèche.");
      const moved = commissionDocked(player, queues, s.unitsAway ?? {}, now, typeof action.unitId === "string" && action.unitId ? action.unitId : undefined);
      if (!Object.keys(moved).length) throw new GameActionError("Pas de place au hangar : améliore-le, démantèle ou envoie des vaisseaux en mission.");
      return { units: moved };
    }

    case "dockScrap": {
      // 5.28 (palier Triage) : démanteler des vaisseaux de la Cale sèche ou de l'Atelier.
      const unit = findUnit(String(action.unitId ?? ""));
      if (!unit) throw new GameActionError("Unité invalide.");
      return dockScrap(player, unit.id, positiveInt(action.qty, "Quantité"), now);
    }

    case "dockSettings":
      setDockSettings(player, { policy: action.policy, priority: action.priority });
      return { policy: DOCK_POLICY_LABELS[player.workshop?.policy ?? "repair"] };

    case "vacationEnd":
      endVacation(player, queues, now, true);
      return true;

    default:
      throw new GameActionError("Action inconnue.");
  }
}

/** Rattrape le temps écoulé (production, files terminées) puis applique l'action. */
/* 6.14.110 (AU27, lot AC-D, constat AC-6 ; Q76 = Q-AC1, option B) : chaque réclamation laisse une ligne au Journal, déjà lue
   (ni toast ni pastille en plus), et « Tout réclamer » une seule ligne récapitulative. Le gain est mesuré sur la fiche
   (ressources, Ambre, jetons, XP) : la ligne dit ce que le joueur a vraiment reçu. */
const CLAIM_NOTE_TITLES: Record<ClaimAllAction["type"], string> = {
  streakClaim: "Récompense de série récupérée",
  dailyClaim: "Mission du jour récupérée",
  chronicleClaim: "Épisode des Chroniques récupéré",
  claimContract: "Objectif du jour récupéré",
  passClaim: "Palier du passe récupéré",
  claimOnboarding: "Objectif de prise en main récupéré",
  claimGuide: "Objectif du Carnet récupéré",
  codexClaim: "Récompense du Codex récupérée",
  casinoDaily: "Jeton du jour du casino récupéré",
  challengeClaim: "Récompense du défi récupérée",
  codexTitle: "Titre du Codex reçu",
  startReserveClaim: "Réserve du départ versée",
};

interface WalletSnapshot {
  resources: Partial<Record<ResourceId, number>>;
  amber: number;
  tokens: number;
  xp: number;
}

function walletOf(player: PlayerState): WalletSnapshot {
  return { resources: { ...player.resources }, amber: bountyState(player).amber, tokens: playerCasino(player).tokens, xp: Number(player.xp) || 0 };
}

/** Ce que le joueur a gagné entre deux relevés : « 5 000 ferraille, 3 Ambre, 2 jetons du casino, 40 XP ». */
function describeWalletGain(before: WalletSnapshot, after: WalletSnapshot): { text: string; resources: Partial<Record<ResourceId, number>>; amber: number; tokens: number; xp: number } {
  const resources: Partial<Record<ResourceId, number>> = {};
  for (const [k, v] of Object.entries(after.resources) as [ResourceId, number][]) {
    const d = Math.floor((v ?? 0) - (before.resources[k] ?? 0));
    if (d > 0) resources[k] = d;
  }
  const amber = Math.max(0, after.amber - before.amber);
  const tokens = Math.max(0, after.tokens - before.tokens);
  const xp = Math.max(0, after.xp - before.xp);
  const parts = [Object.keys(resources).length ? describeGain(resources) : "", amber ? `${formatInt(amber)} Ambre` : "", tokens ? tokensLabel(tokens) : "", xp ? `${formatInt(xp)} XP` : ""].filter(Boolean);
  return { text: parts.join(", "), resources, amber, tokens, xp };
}

function claimNote(type: ClaimAllAction["type"] | "claimAll", before: WalletSnapshot, player: PlayerState, now: number, counts?: Partial<Record<string, number>>): NewNotification {
  const gain = describeWalletGain(before, walletOf(player));
  const what = type === "claimAll" ? describeClaims(counts ?? {}) : CLAIM_LABELS[type][0];
  const title = type === "claimAll" ? "Tout réclamé" : CLAIM_NOTE_TITLES[type];
  // 6.14.155 (R8, AE-14) : la part versée au-delà de l'entrepôt est dite (versement inchangé, I6).
  const overflow = overflowOfGain(player, gain.resources);
  const overLine = overflowSentence(overflow);
  const base = gain.text ? `${what.charAt(0).toUpperCase()}${what.slice(1)} : +${gain.text}.` : `${what.charAt(0).toUpperCase()}${what.slice(1)} : récompense reçue.`;
  const message = overLine ? `${base} ${overLine}` : base;
  return {
    kind: "event",
    title,
    message,
    createdAtMs: now,
    read: true,
    data: { resources: gain.resources, ...(gain.xp ? { xp: gain.xp } : {}), ...(gain.amber ? { amber: gain.amber } : {}), ...(gain.tokens ? { tokens: gain.tokens } : {}), ...(overLine ? { overflow } : {}) },
  };
}

const CLAIM_TYPES = new Set<string>(Object.keys(CLAIM_NOTE_TITLES));

export function performPlayerAction(
  playerIn: PlayerState,
  queuesIn: QueuesState,
  action: GameAction,
  now: number,
  /** Vaisseaux en vol (flottes du joueur), comptés dans le hangar. */
  unitsAway: Record<string, number> = {},
  /** 5.28 : `unitsAway` a bien été lu (sinon, pas de remise en service automatique : la place serait surestimée). */
  awayKnown = false,
  /** 6.14.25 : données du Codex lues par le serveur (`actionNeedsCodex`). */
  codex?: CodexContext,
  /** 6.14.113 : réglages du casino et défi terminé (`actionNeedsClaimContext`) ; `claims.challenge.claimed` en sortie. */
  claims?: ClaimContext,
): { player: PlayerState; queues: QueuesState; notifications: NewNotification[]; result: unknown } {
  const preFlushPlayer = { ...playerIn, buildings: withMissingBuildings(playerIn.buildings, playerIn.resources) };
  const flushed = flushState(preFlushPlayer, queuesIn, now);
  const type = String(action?.type ?? "");
  const before = CLAIM_TYPES.has(type) || type === "claimAll" ? walletOf(flushed.player) : null;
  const result = applyAction(
    { player: flushed.player, queues: flushed.queues, preFlushPlayer, flushNotifications: flushed.notifications, now, unitsAway, codex, claims },
    action,
  );
  // 6.14.110 (AC-6) : trace de la réclamation au Journal (une ligne, déjà lue) ; « Tout réclamer » sans rien de prêt n'en laisse pas.
  if (before) {
    const counts = type === "claimAll" ? ((result ?? {}) as Partial<Record<string, number>>) : undefined;
    if (!counts || Object.values(counts).some((n) => (n ?? 0) > 0)) flushed.notifications.push(claimNote(type as ClaimAllAction["type"] | "claimAll", before, flushed.player, now, counts));
  }
  // 6.14.110 (AC-20) : un succès gagné par l'action (1re recherche, 1er module…) est débloqué tout de suite, pas au rattrapage suivant.
  if (type !== "sync") grantNewAchievements(flushed.player, now, flushed.notifications);
  // 5.28 : Cale sèche au palier 10 : les vaisseaux prêts rentrent d'eux-mêmes dès qu'une place se libère.
  // Le serveur fournit alors les flottes en vol (`dockAutoCommission` dit quand il doit les lire).
  if (awayKnown) flushed.notifications.push(...autoCommission(flushed.player, flushed.queues, unitsAway, now));
  // 6.14.145 (PB-L4) : file d'attente des hangars, les commandes en attente démarrent dès qu'une place se libère (flottes en vol lues).
  if (awayKnown && !onVacation(flushed.player, now)) flushed.notifications.push(...startWaitingUnits(flushed.player, flushed.queues, unitsAway, now));
  return { player: flushed.player, queues: flushed.queues, notifications: flushed.notifications, result };
}

/** 5.28 : le serveur doit-il lire les flottes en vol pour cette action ? (construction, remise en service,
 *  ou Cale sèche au palier 10 avec des vaisseaux à l'Atelier, qui peuvent devenir prêts au rattrapage.) */
export function actionNeedsAway(player: Pick<PlayerState, "buildings" | "workshop">, action: { type?: unknown; slot?: unknown } | null | undefined, queues?: Pick<QueuesState, "unitQueues"> | null): boolean {
  const type = action?.type;
  if (type === "buildUnits" || type === "dockCommission") return true;
  // 6.14.145 (PB-L4) : prêt des baies modulaires (surcharge refusée) et commandes en attente d'une place.
  if (type === "buildingChoice" && typeof action?.slot === "string" && action.slot.endsWith(".lend")) return true;
  if (hasWaitingUnits(queues)) return true;
  const w = player.workshop;
  return dockTier(player, "auto") && ((w?.jobs?.length ?? 0) > 0 || Object.keys(w?.ready ?? {}).length > 0);
}

/** 6.14.25 (H29-3) : le serveur doit-il lire les seigneurs affrontés et le Hall of fame (Codex) pour cette action ? */
export function actionNeedsCodex(action: { type?: unknown } | null | undefined): boolean {
  return action?.type === "claimAll" || action?.type === "codexClaim" || action?.type === "codexTitle";
}

/** 6.14.113 (AC-15) : le serveur doit-il lire les réglages du casino et le défi hebdomadaire pour cette action ? */
export function actionNeedsClaimContext(action: { type?: unknown } | null | undefined): boolean {
  return action?.type === "claimAll" || action?.type === "casinoDaily" || action?.type === "challengeClaim";
}

/* ---------- dons de ressources entre joueurs ---------- */

export interface GiftOutput {
  sender: PlayerState;
  senderQueues: QueuesState;
  senderNotifications: NewNotification[];
  recipient: PlayerState;
  recipientQueues: QueuesState;
  recipientNotifications: NewNotification[];
  resources: Partial<Record<ResourceId, number>>;
  /** v5.10 : ce que reçoit le destinataire (après la taxe hors alliance). */
  delivered: Partial<Record<ResourceId, number>>;
}

/** v5.10 : règles des cadeaux — âge de compte minimum (anti multi-comptes)
 *  et taxe de transport hors alliance (cadeau libre entre membres). */
export const GIFT_RULES = { minAccountDays: 3, outsideAllianceTax: 0.2 };

/** Part qui arrive à destination (1 entre membres d'une même alliance). */
export function giftDeliveryRate(sender: Pick<PlayerState, "allianceId"> & Partial<Pick<PlayerState, "commanders" | "relics" | "ascensions" | "talents" | "territory">>, recipient: Pick<PlayerState, "allianceId">): number {
  // v5.14 : la Diplomate en poste de l'expéditeur réduit la taxe de transport.
  return sender.allianceId && sender.allianceId === recipient.allianceId ? 1 : 1 - GIFT_RULES.outsideAllianceTax * (1 - playerModifiers(sender).tradeTax);
}

/** Raison qui empêche ce compte d'envoyer ou de recevoir un cadeau (null si rien). */
export function giftAgeBlock(p: Pick<PlayerState, "createdAtMs">, now: number): string | null {
  const created = p.createdAtMs ?? 0;
  if (!created) return null;
  const left = created + GIFT_RULES.minAccountDays * 86_400_000 - now;
  if (left <= 0) return null;
  const hours = Math.ceil(left / 3_600_000);
  return hours > 24 ? `encore ${Math.ceil(hours / 24)} jour(s)` : `encore ${hours} h`;
}

/** Débite l'expéditeur et crédite le destinataire (les deux rattrapés à
 *  maintenant). Appelé par le serveur dans une seule transaction. */
export function performGift(
  sender: PlayerState,
  senderQueues: QueuesState,
  recipient: PlayerState,
  recipientQueues: QueuesState,
  rawResources: Record<string, unknown>,
  now: number,
): GiftOutput {
  if (sender.uid === recipient.uid) throw new GameActionError("Tu ne peux pas t'envoyer des ressources à toi-même !");
  if (recipient.npc) throw new GameActionError("On ne fait pas de cadeau à un seigneur de guerre.");
  assertNotOnVacation(sender, now, "gift");
  const senderWait = giftAgeBlock(sender, now);
  if (senderWait) throw new GameActionError(`Les cadeaux s'ouvrent après ${GIFT_RULES.minAccountDays} jours de jeu (${senderWait}).`);
  const recipientWait = giftAgeBlock(recipient, now);
  if (recipientWait) throw new GameActionError(`${recipient.pseudo} est arrivé il y a moins de ${GIFT_RULES.minAccountDays} jours : il ne peut pas encore recevoir de cadeau (${recipientWait}).`);
  const resources: Partial<Record<ResourceId, number>> = {};
  for (const [res, raw] of Object.entries(rawResources ?? {})) {
    const n = Math.floor(Number(raw));
    if (!RESOURCE_IDS.has(res) || !Number.isFinite(n) || n < 0) throw new GameActionError("Ressources invalides.");
    if (n > 0) resources[res as ResourceId] = n;
  }
  if (Object.keys(resources).length === 0) throw new GameActionError("Sélectionne au moins une ressource à envoyer.");

  const s = flushState({ ...sender, buildings: withMissingBuildings(sender.buildings, sender.resources) }, senderQueues, now);
  const r = flushState({ ...recipient, buildings: withMissingBuildings(recipient.buildings, recipient.resources) }, recipientQueues, now);
  pay(s.player, resources, now, false);
  recordContract(s.player, "gift", 1, now);
  bumpStat(s.player, "giftsSent");
  grantCommanderXp(s.player, "diplomat", COMMANDER_XP.giftSent);
  // v5.10 : hors alliance, une part se perd en route (taxe de transport).
  const rate = giftDeliveryRate(sender, recipient);
  const delivered: Partial<Record<ResourceId, number>> = {};
  for (const [res, amt] of Object.entries(resources) as [ResourceId, number][]) {
    const got = Math.floor(amt * rate);
    if (got <= 0) continue;
    delivered[res] = got;
    r.player.resources[res] = (r.player.resources[res] ?? 0) + got;
  }
  const taxNote = rate < 1 ? ` (${Math.round((1 - rate) * 100)} % perdus en route hors alliance)` : "";
  // v5.9 : le détail du cadeau (quantités, expéditeur) pour le destinataire, et une trace pour l'expéditeur.
  r.notifications.push({
    kind: "gift",
    title: `Cadeau de ${sender.pseudo}`,
    message: `${sender.pseudo} t'a envoyé ${describeGain(delivered)}${taxNote}.`,
    createdAtMs: now,
    read: false,
    link: `/game/joueurs?fiche=${sender.uid}`,
    data: { resources: delivered, fromUid: sender.uid, fromPseudo: sender.pseudo },
  });
  s.notifications.push({
    kind: "gift",
    title: `Cadeau livré à ${recipient.pseudo}`,
    message: `Tu as envoyé ${describeGain(resources)} à ${recipient.pseudo}${rate < 1 ? ` : ${describeGain(delivered)} arrivent${taxNote}` : ""}.`,
    createdAtMs: now,
    read: true,
    link: `/game/joueurs?fiche=${recipient.uid}`,
    data: { resources, toUid: recipient.uid, toPseudo: recipient.pseudo },
  });

  return {
    sender: s.player,
    senderQueues: s.queues,
    senderNotifications: s.notifications,
    recipient: r.player,
    recipientQueues: r.queues,
    recipientNotifications: r.notifications,
    resources,
    delivered,
  };
}

/* ---------- création du profil ---------- */

/** Profil de départ d'un nouveau joueur, créé par le serveur. Le pseudo
 *  vient du compte (nom ou identifiant), pas du navigateur. */
export function newPlayerProfile(uid: string, rawPseudo: unknown, now: number): { player: PlayerState; queues: QueuesState } {
  const pseudo = String(rawPseudo ?? "").trim().replace(/\s+/g, " ").slice(0, 30) || "Joueur";
  const player = { ...defaultPlayerState(uid, pseudo), createdAtMs: now, resourcesUpdatedAtMs: now } as PlayerState;
  return { player, queues: defaultQueues() };
}

/* ---------- anciens rapports (avant l'économie côté serveur) ----------
   6.14.135 (AC-18) : les dons de l'ancien système (`applyLegacyGift`, route `gift/claim`) sont retirés : aucun
   non réclamé sur la copie de la production. Les anciens rapports restent : 4 encore non vus (2026-10-08). */

/** Rapport de combat vu par le défenseur. Les rapports récents ont déjà été
 *  appliqués au moment du combat ; les anciens (defenderApplied absent)
 *  l'étaient par le navigateur du défenseur : le serveur le fait ici. */
export function applyLegacyBattleReport(
  playerIn: PlayerState,
  queuesIn: QueuesState,
  report: Pick<BattleReport, "outcome" | "defenderLosses" | "loot" | "defenderXpDelta" | "attackerPseudo">,
  now: number,
): { player: PlayerState; queues: QueuesState; notifications: NewNotification[] } {
  const { player, queues, notifications } = flushState({ ...playerIn, buildings: withMissingBuildings(playerIn.buildings, playerIn.resources) }, queuesIn, now);
  for (const [unitId, lost] of Object.entries(report.defenderLosses ?? {})) {
    if (player.units[unitId]) player.units[unitId].count = Math.max(0, player.units[unitId].count - (Number(lost) || 0));
  }
  for (const [res, amt] of Object.entries(report.loot ?? {})) {
    const key = res as ResourceId;
    if (RESOURCE_IDS.has(key)) player.resources[key] = Math.max(0, (player.resources[key] ?? 0) - (Number(amt) || 0));
  }
  if (report.outcome === "defender_win") player.victories = (player.victories ?? 0) + 1;
  else if (report.outcome === "attacker_win") player.defeats = (player.defeats ?? 0) + 1;
  applyXpDelta(player, Number(report.defenderXpDelta) || 0, now, "defense");
  const title: Record<string, string> = { attacker_win: "Tu as perdu ce combat...", defender_win: "Attaque repoussée !", draw: "Match nul." };
  notifications.push({
    kind: "combat-defender",
    title: title[report.outcome] ?? "Rapport de combat",
    message: `Attaque de ${report.attackerPseudo}.`,
    createdAtMs: now,
    read: false,
  });
  return { player, queues, notifications };
}
