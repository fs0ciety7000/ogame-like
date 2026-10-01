import { bumpStat, parisHour, setStat } from "@/game/stats";
import { setActiveTitle } from "@/game/seasons";
import { buildTimeFactor, researchTimeFactor } from "@/game/events";
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
import { MAX_CONCURRENT_RESEARCH, checkPrereqs, findTech, getTechCost, getTechTime, techReductionFactor } from "@/game/technologies";
import { findUnit, getUnitBuildTime } from "@/game/units";
import { hasPrerequisites, MISSIONS } from "@/game/missions";
import { GameActionError } from "@/game/errors";
import { claimContract, recordContract, rerollContract } from "@/game/contracts";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { applyXpDelta } from "@/game/seasons";
import type { BattleReport, PlayerState, QueuesState, Resources, ResourceId } from "@/types/game";

/* =====================================================
   Actions de jeu d'un joueur, arbitrées par le serveur
   (pocketbase/pb_hooks, POST /api/cosmic/action).

   Fonctions pures : le hook lit le joueur et ses files, appelle
   performPlayerAction, puis écrit le résultat dans une transaction. Les
   paramètres viennent du navigateur : tout est revérifié ici.
===================================================== */

export type GameAction =
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
  | { type: "setTitle"; title: string };

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

function pay(player: PlayerState, cost: Partial<Record<string, number>>, now: number) {
  if (!canAffordAll(player.resources, cost as Partial<Resources>)) throw new GameActionError("Ressources insuffisantes.");
  let total = 0;
  for (const [res, val] of Object.entries(cost)) {
    player.resources[res as ResourceId] -= val ?? 0;
    total += val ?? 0;
  }
  recordContract(player, "spend", total, now);
  bumpStat(player, "spent", total);
}

interface ActionState {
  player: PlayerState;
  queues: QueuesState;
  preFlushPlayer: PlayerState;
  flushNotifications: NewNotification[];
  now: number;
}

function applyAction(s: ActionState, action: GameAction): unknown {
  const { player, queues, now } = s;
  switch (action?.type) {
    case "sync": {
      const elapsedMs = Math.max(0, now - (s.preFlushPlayer.resourcesUpdatedAtMs || now));
      // Temps de jeu déclaré par le navigateur, borné par le temps réellement écoulé.
      const playtime = Math.min(Math.max(0, Number(action.playtimeDeltaSeconds) || 0), elapsedMs / 1000 + 5, 300);
      player.playtimeSeconds = (player.playtimeSeconds || 0) + Math.floor(playtime);
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
      pay(player, applyBuildingDiscount(getBuildingUpgradeCost(def, nextLevel), player.bonuses?.buildingUpgradeDiscount ?? 0), now);
      queues.buildingUpgrades[def.id] = { endTime: now + Math.round(getBuildingUpgradeTime(def, nextLevel) * buildTimeFactor(now) * techReductionFactor(player.techLevels, "building_time")) * 1000 };
      recordContract(player, "upgrade_building", 1, now);
      return undefined;
    }

    case "buildUnits": {
      const unit = findUnit(action.unitId);
      if (!unit) throw new GameActionError("Unité invalide.");
      const qty = Math.min(positiveInt(action.qty, "Quantité"), MAX_QTY);
      if ((player.units[unit.id]?.level ?? 0) <= 0) throw new GameActionError("Cette unité doit d'abord être débloquée via le Labo.");

      const category = unit.category;
      const built = Object.entries(player.units).reduce((sum, [id, u]) => {
        const def = findUnit(id);
        return def?.category === category ? sum + u.count * def.hangarSpace : sum;
      }, 0);
      const reserved = queues.unitQueues[category].reduce((sum, item) => sum + (findUnit(item.unitId)?.hangarSpace ?? 1), 0);
      if (built + reserved + qty * unit.hangarSpace > getUnitCapacity(player.buildings, category)) {
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
      if (!checkPrereqs(tech, player.techLevels).valid) throw new GameActionError("Prérequis non remplis.");
      if (queues.activeResearches.some((r) => r.id === tech.id)) throw new GameActionError("Cette technologie est déjà en cours de recherche.");
      if (queues.activeResearches.length >= MAX_CONCURRENT_RESEARCH) {
        throw new GameActionError(`File de recherche pleine (${MAX_CONCURRENT_RESEARCH}/${MAX_CONCURRENT_RESEARCH}).`);
      }
      pay(player, getTechCost(tech, nextLevel), now);
      queues.activeResearches.push({ id: tech.id, endTime: now + Math.round(getTechTime(tech, nextLevel) * researchTimeFactor(now) * techReductionFactor(player.techLevels, "research_time")) * 1000 });
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
      return gained;
    }

    case "claimContract": {
      const claimed = claimContract(player, String(action.contractId ?? ""), now);
      bumpStat(player, "contracts");
      return claimed;
    }

    case "rerollContract":
      return rerollContract(player, String(action.contractId ?? ""), now);

    case "setTitle":
      setActiveTitle(player, String(action.title ?? ""));
      return player.activeTitle;

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
): { player: PlayerState; queues: QueuesState; notifications: NewNotification[]; result: unknown } {
  const preFlushPlayer = { ...playerIn, buildings: withMissingBuildings(playerIn.buildings, playerIn.resources) };
  const flushed = flushState(preFlushPlayer, queuesIn, now);
  const result = applyAction(
    { player: flushed.player, queues: flushed.queues, preFlushPlayer, flushNotifications: flushed.notifications, now },
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
  const resources: Partial<Record<ResourceId, number>> = {};
  for (const [res, raw] of Object.entries(rawResources ?? {})) {
    const n = Math.floor(Number(raw));
    if (!RESOURCE_IDS.has(res) || !Number.isFinite(n) || n < 0) throw new GameActionError("Ressources invalides.");
    if (n > 0) resources[res as ResourceId] = n;
  }
  if (Object.keys(resources).length === 0) throw new GameActionError("Sélectionne au moins une ressource à envoyer.");

  const s = flushState({ ...sender, buildings: withMissingBuildings(sender.buildings, sender.resources) }, senderQueues, now);
  const r = flushState({ ...recipient, buildings: withMissingBuildings(recipient.buildings, recipient.resources) }, recipientQueues, now);
  pay(s.player, resources, now);
  recordContract(s.player, "gift", 1, now);
  for (const [res, amt] of Object.entries(resources)) {
    r.player.resources[res as ResourceId] = (r.player.resources[res as ResourceId] ?? 0) + (amt ?? 0);
  }
  r.notifications.push({
    kind: "gift",
    title: "Ressources reçues !",
    message: `${sender.pseudo} t'a envoyé des ressources.`,
    createdAtMs: now,
    read: false,
  });

  return {
    sender: s.player,
    senderQueues: s.queues,
    senderNotifications: s.notifications,
    recipient: r.player,
    recipientQueues: r.queues,
    recipientNotifications: r.notifications,
    resources,
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
  notifications.push({ kind: "gift", title: "Ressources reçues !", message: `${gift.fromPseudo} t'a envoyé des ressources.`, createdAtMs: now, read: false });
  return { player, queues, notifications };
}
