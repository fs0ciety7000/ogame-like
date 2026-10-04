import { claimStreak } from "@/game/streak";
import { describeGain } from "@/game/format";
import { claimChronicle } from "@/game/chronicles";
import { endVacation, onVacation } from "@/game/vacation";
import { playerBuildTimeFactor, playerResearchTimeFactor } from "@/game/bonuses";
import { ascend } from "@/game/ascension";
import { buildColonyDefense, renameColony, setColonySpec, startColonization, upgradeColonyBuilding } from "@/game/colonies";
import { claimOnboarding, setOnboardingHidden } from "@/game/onboarding";
import { setPosture } from "@/game/formations";
import { bumpStat, parisHour, setStat } from "@/game/stats";
import { setActiveTitle } from "@/game/seasons";
import {
  applyBuildingDiscount,
  BUILDING_UNLOCK_COST,
  findBuilding,
  getBuildingUpgradeCost,
  getBuildingUpgradeTime,
  getUnitCapacity,
  withMissingBuildings,
} from "@/game/buildings";
import { flushState, type NewNotification } from "@/game/flush";
import { canAffordAll, getTradeRate, RESOURCE_LIST } from "@/game/resources";
import { MAX_CONCURRENT_RESEARCH, checkPrereqs, findTech, getTechAmberCost, getTechCost, getTechTime } from "@/game/technologies";
import { findUnit, getUnitBuildTime, ownedBlueprints } from "@/game/units";
import { hasPrerequisites, MISSIONS } from "@/game/missions";
import { GameActionError } from "@/game/errors";
import { claimContract, recordContract, rerollContract } from "@/game/contracts";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { applyXpDelta } from "@/game/seasons";
import { assignCommanders, COMMANDER_RULES, COMMANDER_XP, grantCommanderXp, recruitCommander, trainCommander } from "@/game/commanders";
import { activateCapsule, craftCapsule } from "@/game/synthesis";
import { equipRelic, fuseRelics, recycleRelic } from "@/game/relics";
import { bountyState } from "@/game/bounties";
import { productionHours } from "@/game/pirates";
import { addPassPoints, claimPassTier, passDailyLogin } from "@/game/seasonPass";
import { PRESENCE_WRITE_MS, recordActiveDay } from "@/game/retention";
import { isCancelTarget, performCancel, type CancelTarget } from "@/game/cancel";
import { setProfileStyle } from "@/game/profile";
import { learnTalent, resetTalents } from "@/game/talents";
import { addSeenAnnouncements } from "@/game/announcements";
import { addPlanned, removePlanned } from "@/game/buildPlan";
import type { BattleReport, PlayerState, QueuesState, Resources, ResourceId } from "@/types/game";

/* =====================================================
   Actions de jeu d'un joueur, arbitrées par le serveur
   (pocketbase/pb_hooks, POST /api/cosmic/action).

   Fonctions pures : le hook lit le joueur et ses files, appelle
   performPlayerAction, puis écrit le résultat dans une transaction. Les
   paramètres viennent du navigateur : tout est revérifié ici.
===================================================== */

export type GameAction =
  | { type: "vacationEnd" }
  | { type: "chronicleClaim"; episode: number }
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
  | { type: "hideOnboarding"; hidden: boolean }
  | { type: "setPosture"; posture: string }
  | { type: "ascend" }
  | { type: "colonize"; name: string }
  | { type: "colonyUpgrade"; colonyId: string; buildingId: string }
  | { type: "colonyDefense"; colonyId: string; unitId: string; qty: number }
  | { type: "colonyRename"; colonyId: string; name: string }
  | { type: "colonySpec"; colonyId: string; spec: string }
  | { type: "commanderRecruit"; commanderId: string; method?: "amber" | "production" }
  | { type: "commanderAssign"; ids: string[] }
  | { type: "commanderTrain"; commanderId: string }
  | { type: "synthCraft"; capsule: string; level: number }
  | { type: "synthActivate"; capsule: string; level?: number }
  | { type: "relicEquip"; slot: number; relicId: string | null }
  | { type: "relicFuse"; template: string; rarity: string }
  | { type: "relicRecycle"; relicId: string }
  | { type: "talentLearn"; talentId: string }
  | { type: "talentReset" }
  | { type: "streakClaim" }
  | { type: "setProfileStyle"; style: { banner?: string; emblem?: string; motto?: string; pinned?: string[] } }
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

function pay(player: PlayerState, cost: Partial<Record<string, number>>, now: number, spending = true) {
  if (!canAffordAll(player.resources, cost as Partial<Resources>)) throw new GameActionError("Ressources insuffisantes.");
  let total = 0;
  for (const [res, val] of Object.entries(cost)) {
    player.resources[res as ResourceId] -= val ?? 0;
    total += val ?? 0;
  }
  // v5.9 : un cadeau n'est pas une dépense (sinon deux joueurs se renvoient
  // les mêmes ressources pour remplir le contrat « dépenser »).
  if (!spending) return;
  recordContract(player, "spend", total, now);
  bumpStat(player, "spent", total);
}

/** Places de hangar occupées : vaisseaux à quai + vaisseaux en mission. */
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
}

/** v4.2 : seules ces actions restent possibles pendant les vacances. */
const VACATION_ACTIONS = new Set(["sync", "seenAnnouncements", "setTitle", "hideOnboarding", "setProfileStyle", "colonyRename", "vacationEnd"]);

function applyAction(s: ActionState, action: GameAction): unknown {
  const { player, queues, now } = s;
  if (onVacation(player, now) && !VACATION_ACTIONS.has(String(action?.type))) {
    throw new GameActionError("Tu es en vacances : reviens d'abord (Paramètres) pour jouer.");
  }
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
      const nextLevel = state.level + 1;
      const paid = applyBuildingDiscount(getBuildingUpgradeCost(def, nextLevel), player.bonuses?.buildingUpgradeDiscount ?? 0);
      pay(player, paid, now);
      queues.buildingUpgrades[def.id] = { endTime: now + Math.round(getBuildingUpgradeTime(def, nextLevel) * playerBuildTimeFactor(player, now)) * 1000, startedAtMs: now, paid };
      recordContract(player, "upgrade_building", 1, now);
      return undefined;
    }

    case "buildUnits": {
      const unit = findUnit(action.unitId);
      if (!unit) throw new GameActionError("Unité invalide.");
      const qty = Math.min(positiveInt(action.qty, "Quantité"), MAX_QTY);
      if ((player.units[unit.id]?.level ?? 0) <= 0) throw new GameActionError("Cette unité doit d'abord être débloquée via le Labo.");

      const category = unit.category;
      const built = hangarUsed(player.units, s.unitsAway, category);
      const reserved = queues.unitQueues[category].reduce((sum, item) => sum + (findUnit(item.unitId)?.hangarSpace ?? 1), 0);
      if (built + reserved + qty * unit.hangarSpace > getUnitCapacity(player.buildings, category, player.techLevels)) {
        throw new GameActionError(`Capacité du hangar ${category === "attack" ? "d'attaque" : "de défense"} insuffisante.`);
      }

      pay(player, { scrap: unit.cost.scrap * qty, energy: unit.cost.energy * qty }, now);
      recordContract(player, "build_units", qty, now);
      const queue = queues.unitQueues[category];
      const wasEmpty = queue.length === 0;
      for (let i = 0; i < qty; i++) queue.push({ unitId: unit.id, endTime: null });
      if (wasEmpty) queue[0].endTime = now + getUnitBuildTime(unit, player.techLevels) * 1000;
      return undefined;
    }

    case "sellUnits": {
      const unit = findUnit(action.unitId);
      if (!unit) throw new GameActionError("Unité invalide.");
      const qty = positiveInt(action.qty, "Quantité");
      if ((player.units[unit.id]?.count ?? 0) < qty) throw new GameActionError("Tu n'as pas assez d'unités à vendre.");
      player.units[unit.id].count -= qty;
      player.resources.scrap += Math.floor(unit.cost.scrap * 0.5) * qty;
      player.resources.energy += Math.floor(unit.cost.energy * 0.5) * qty;
      return undefined;
    }

    case "research": {
      const tech = findTech(action.techId);
      if (!tech) throw new GameActionError("Technologie inconnue.");
      const nextLevel = (player.techLevels[tech.id] ?? 0) + 1;
      if (nextLevel > tech.maxLevel) throw new GameActionError("Niveau maximum atteint.");
      if (!checkPrereqs(tech, player.techLevels, ownedBlueprints(player)).valid) throw new GameActionError("Prérequis non remplis.");
      if (queues.activeResearches.some((r) => r.id === tech.id)) throw new GameActionError("Cette technologie est déjà en cours de recherche.");
      if (queues.activeResearches.length >= MAX_CONCURRENT_RESEARCH) {
        throw new GameActionError(`File de recherche pleine (${MAX_CONCURRENT_RESEARCH}/${MAX_CONCURRENT_RESEARCH}).`);
      }
      const paid = getTechCost(tech, nextLevel);
      // v5.9 : certaines technos coûtent aussi de l'ambre (vérifié avant de payer les ressources).
      const amber = getTechAmberCost(tech);
      const bounty = amber > 0 ? bountyState(player) : null;
      if (bounty && bounty.amber < amber) throw new GameActionError(`Pas assez d'ambre (${amber} requis).`);
      pay(player, paid, now);
      if (bounty) {
        bounty.amber -= amber;
        player.bounties = bounty;
      }
      queues.activeResearches.push({ id: tech.id, endTime: now + Math.round(getTechTime(tech, nextLevel) * playerResearchTimeFactor(player, now)) * 1000, startedAtMs: now, paid, ...(amber > 0 ? { paidAmber: amber } : {}) });
      bumpStat(player, "researchStarted");
      recordContract(player, "research", 1, now);
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
      if ((player.resources[sellId] ?? 0) < amount) throw new GameActionError("Pas assez de ressources à échanger.");
      const gained = Math.floor(amount * getTradeRate(sellId, buyId));
      player.resources[sellId] -= amount;
      player.resources[buyId] = (player.resources[buyId] ?? 0) + gained;
      bumpStat(player, "traded", amount);
      grantCommanderXp(player, "steward", COMMANDER_XP.marketTrade);
      return gained;
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

    case "colonySpec":
      setColonySpec(player, String(action.colonyId ?? ""), String(action.spec ?? ""), now);
      return undefined;

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
          if (st.amber < COMMANDER_RULES.recruitAmber) throw new GameActionError(`Il faut ${COMMANDER_RULES.recruitAmber} Ambre de Ruche (primes Kesh'Vaar).`);
          st.amber -= COMMANDER_RULES.recruitAmber;
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
      return { amber: out.amber };
    }

    case "setProfileStyle":
      return setProfileStyle(player, action.style);

    case "talentLearn":
      return learnTalent(player, action.talentId);

    case "talentReset":
      return resetTalents(player, now);

    case "streakClaim":
      return claimStreak(player, now);

    case "passClaim":
      return { gained: claimPassTier(player, action.tier, now) };

    case "chronicleClaim":
      return claimChronicle(player, action.episode, now);

    case "cancel":
      // v4.7 : annulation au prorata (100 % la première minute ou si rien n'a commencé).
      if (!isCancelTarget(action.target)) throw new GameActionError("Chantier inconnu.");
      return performCancel(player, queues, action.target, now);

    case "vacationEnd":
      endVacation(player, queues, now, true);
      return true;

    default:
      throw new GameActionError("Action inconnue.");
  }
}

/** Rattrape le temps écoulé (production, files terminées) puis applique l'action. */
export function performPlayerAction(
  playerIn: PlayerState,
  queuesIn: QueuesState,
  action: GameAction,
  now: number,
  /** Vaisseaux en vol (flottes du joueur), comptés dans le hangar. */
  unitsAway: Record<string, number> = {},
): { player: PlayerState; queues: QueuesState; notifications: NewNotification[]; result: unknown } {
  const preFlushPlayer = { ...playerIn, buildings: withMissingBuildings(playerIn.buildings, playerIn.resources) };
  const flushed = flushState(preFlushPlayer, queuesIn, now);
  const result = applyAction(
    { player: flushed.player, queues: flushed.queues, preFlushPlayer, flushNotifications: flushed.notifications, now, unitsAway },
    action,
  );
  return { player: flushed.player, queues: flushed.queues, notifications: flushed.notifications, result };
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
export function giftDeliveryRate(sender: Pick<PlayerState, "allianceId">, recipient: Pick<PlayerState, "allianceId">): number {
  return sender.allianceId && sender.allianceId === recipient.allianceId ? 1 : 1 - GIFT_RULES.outsideAllianceTax;
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
  if (onVacation(sender, now)) throw new GameActionError("Tu es en vacances : reviens d'abord pour envoyer des ressources.");
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

/* ---------- anciens rapports et dons (avant l'économie côté serveur) ---------- */

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
  applyXpDelta(player, Number(report.defenderXpDelta) || 0, now);
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

/** Don envoyé avec l'ancien système (débité à l'envoi, crédité à la réception). */
export function applyLegacyGift(
  playerIn: PlayerState,
  queuesIn: QueuesState,
  gift: { fromPseudo: string; resources: Record<string, unknown> | null },
  now: number,
): { player: PlayerState; queues: QueuesState; notifications: NewNotification[] } {
  const { player, queues, notifications } = flushState({ ...playerIn, buildings: withMissingBuildings(playerIn.buildings, playerIn.resources) }, queuesIn, now);
  for (const [res, amt] of Object.entries(gift.resources ?? {})) {
    const n = Math.floor(Number(amt));
    if (RESOURCE_IDS.has(res) && Number.isFinite(n) && n > 0) player.resources[res as ResourceId] = (player.resources[res as ResourceId] ?? 0) + n;
  }
  const received = Object.fromEntries(Object.entries(gift.resources ?? {}).map(([k, v]) => [k, Math.floor(Number(v)) || 0]).filter(([k, v]) => RESOURCE_IDS.has(k as string) && (v as number) > 0)) as Partial<Record<ResourceId, number>>;
  notifications.push({ kind: "gift", title: `Cadeau de ${gift.fromPseudo}`, message: `${gift.fromPseudo} t'a envoyé ${describeGain(received)}.`, createdAtMs: now, read: false, data: { resources: received, fromPseudo: gift.fromPseudo } });
  return { player, queues, notifications };
}
