import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit as fsLimit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { firestoreMillis } from "@/lib/utils";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { flushState, type NewNotification } from "@/game/flush";
import { applyXpDelta } from "@/game/seasons";
import {
  applyBuildingDiscount,
  BUILDING_UNLOCK_COST,
  findBuilding,
  getBuildingUpgradeCost,
  getBuildingUpgradeTime,
  getRepairPercent,
  getUnitCapacity,
} from "@/game/buildings";
import { canAffordAll, getTradeRate } from "@/game/resources";
import { checkPrereqs, findTech, getTechCost, getTechTime, MAX_CONCURRENT_RESEARCH } from "@/game/technologies";
import { findUnit, getUnitBuildTime } from "@/game/units";
import { hasPrerequisites, MISSIONS } from "@/game/missions";
import { resolveCombat } from "@/game/combat";
import type {
  BattleReport,
  BuildingId,
  GameNotification,
  PlayerState,
  QueuesState,
  ResourceGift,
  ResourceId,
  Resources,
  SpyReport,
} from "@/types/game";

const playersCol = () => collection(db, "players");
const playerRef = (uid: string) => doc(db, "players", uid);
const queuesRef = (uid: string) => doc(db, "players", uid, "meta", "queues");
const notificationsCol = (uid: string) => collection(db, "players", uid, "notifications");
const battleReportsCol = () => collection(db, "battle_reports");
const spyReportsCol = () => collection(db, "spy_reports");
const resourceGiftsCol = () => collection(db, "resource_gifts");
const usernameRef = (sanitizedPseudo: string) => doc(db, "usernames", sanitizedPseudo);

export class GameActionError extends Error {}

/* =====================================================
   Création / lecture
===================================================== */

export async function ensurePlayerDoc(uid: string, pseudo: string) {
  const pSnap = await getDoc(playerRef(uid));
  if (!pSnap.exists()) {
    await runTransaction(db, async (tx) => {
      tx.set(playerRef(uid), { ...defaultPlayerState(uid, pseudo), createdAt: serverTimestamp() });
      tx.set(queuesRef(uid), defaultQueues());
    });
  }
}

/** Impose le pseudo exact saisi par le joueur, y compris si le profil a déjà
 *  été créé entre-temps par le filet de sécurité de useGameSync (qui ne
 *  connaît pas le pseudo tapé et retombe sur un nom générique le temps que
 *  ce correctif s'exécute). Sans effet de bord sur le reste du document. */
export async function setPlayerPseudo(uid: string, pseudo: string) {
  // updateDoc plutôt que setDoc({ merge }) : le document vient d'être créé
  // par une transaction, que le cache local ne connaît pas encore. Un merge
  // y serait appliqué localement sur un document "absent" et produirait un
  // instantané { pseudo } seul (units/buildings… undefined → plantage).
  await updateDoc(playerRef(uid), { pseudo });
}

/** Un instantané sans les champs de base (écriture partielle compensée
 *  localement avant la création complète du profil) est traité comme
 *  "pas encore chargé" plutôt que transmis tel quel à l'interface. */
function playerFromSnapshotData(data: Record<string, unknown> | undefined): PlayerState | null {
  if (!data || !data.resources || !data.buildings) return null;
  const player = data as unknown as PlayerState;
  return { ...player, units: player.units ?? {}, techLevels: player.techLevels ?? {} };
}

/* =====================================================
   Résolution pseudo -> email (connexion, mot de passe oublié)

   Firebase Auth ne connaît que des emails, pas des pseudos. Ce document
   public (lecture par id seule, jamais de liste — voir firestore.rules)
   permet de retrouver l'email associé à un pseudo AVANT authentification.
   Écrit par claimUsername() à l'inscription et depuis Réglages quand un
   joueur ajoute un email de récupération.
===================================================== */

export async function claimUsername(uid: string, sanitizedPseudo: string, email: string) {
  await setDoc(usernameRef(sanitizedPseudo), { uid, email }, { merge: true });
}

export async function resolveEmailForPseudo(sanitizedPseudo: string): Promise<string | null> {
  const snap = await getDoc(usernameRef(sanitizedPseudo));
  return snap.exists() ? ((snap.data().email as string) ?? null) : null;
}

/** onMeta signale si le dernier instantané reçu vient du cache local
 *  (hors-ligne) plutôt que du serveur — utilisé pour l'indicateur de
 *  connexion réel de l'en-tête (voir connectionStore). */
export function subscribePlayer(
  uid: string,
  cb: (player: PlayerState | null) => void,
  onMeta?: (fromCache: boolean) => void,
): Unsubscribe {
  return onSnapshot(playerRef(uid), { includeMetadataChanges: true }, (snap) => {
    cb(snap.exists() ? playerFromSnapshotData(snap.data()) : null);
    onMeta?.(snap.metadata.fromCache);
  });
}

export function subscribeQueues(uid: string, cb: (queues: QueuesState | null) => void): Unsubscribe {
  return onSnapshot(queuesRef(uid), (snap) => cb(snap.exists() ? (snap.data() as QueuesState) : null));
}

export function subscribeNotifications(uid: string, cb: (items: GameNotification[]) => void): Unsubscribe {
  const q = query(notificationsCol(uid), orderBy("createdAtMs", "desc"), fsLimit(30));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GameNotification, "id">) }))));
}

export async function markNotificationRead(uid: string, id: string) {
  await updateDoc(doc(notificationsCol(uid), id), { read: true });
}

export interface LeaderboardEntry {
  uid: string;
  pseudo: string;
  xp: number;
  seasonId: string | null;
  seasonXp: number;
}

function leaderboardEntryFromDoc(d: { id: string; data: () => Record<string, unknown> }): LeaderboardEntry {
  const data = d.data();
  return {
    uid: d.id,
    pseudo: (data.pseudo as string) || "Joueur inconnu",
    xp: (data.xp as number) || 0,
    seasonId: (data.seasonId as string) ?? null,
    seasonXp: (data.seasonXp as number) || 0,
  };
}

/** Classement "total" (tout le temps), trié côté serveur par XP cumulée. */
export function subscribeLeaderboard(cb: (players: LeaderboardEntry[]) => void): Unsubscribe {
  const q = query(playersCol(), orderBy("xp", "desc"), fsLimit(100));
  return onSnapshot(q, (snap) => cb(snap.docs.map(leaderboardEntryFromDoc)));
}

export async function fetchPlayerSnapshot(uid: string): Promise<PlayerState | null> {
  const snap = await getDoc(playerRef(uid));
  return snap.exists() ? playerFromSnapshotData(snap.data()) : null;
}

/* =====================================================
   Contre-espionnage

   Aucune trace n'est écrite en cas de non-détection (voir SpyModal, qui
   tire au sort côté client via rollSpyDetection avant d'appeler ceci) :
   seule une tentative détectée crée un document, lu par la cible via
   subscribePendingSpyReports (même schéma que les rapports de combat).
===================================================== */

export async function createSpyReport(spyUid: string, spyPseudo: string, targetUid: string) {
  await setDoc(doc(spyReportsCol()), {
    spyUid,
    spyPseudo,
    targetUid,
    timestamp: serverTimestamp(),
    targetProcessed: false,
  });
}

export function subscribePendingSpyReports(uid: string, cb: (reports: SpyReport[]) => void): Unsubscribe {
  const q = query(spyReportsCol(), where("targetUid", "==", uid), where("targetProcessed", "==", false));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SpyReport, "id">) }))));
}

export async function acknowledgeSpyReport(uid: string, reportId: string) {
  const reportRef = doc(spyReportsCol(), reportId);
  const snap = await getDoc(reportRef);
  if (!snap.exists()) return;
  const report = { id: snap.id, ...(snap.data() as Omit<SpyReport, "id">) };
  if (report.targetProcessed) return;

  await updateDoc(reportRef, { targetProcessed: true });
  await setDoc(doc(notificationsCol(uid)), {
    kind: "spy-detected",
    title: "Espionnage détecté !",
    message: `${report.spyPseudo} a tenté de t'espionner.`,
    createdAtMs: Date.now(),
    read: false,
  });
}

/* =====================================================
   Action transactionnelle générique
   (flush production + files en attente, puis mutation)
===================================================== */

interface MutateOutput<T> {
  player: PlayerState;
  queues: QueuesState;
  notifications?: NewNotification[];
  result: T;
}

async function runFlushedAction<T>(
  uid: string,
  mutate: (state: {
    player: PlayerState;
    queues: QueuesState;
    preFlushPlayer: PlayerState;
    flushNotifications: NewNotification[];
  }) => MutateOutput<T>,
): Promise<T> {
  let result!: T;

  await runTransaction(db, async (tx) => {
    const [pSnap, qSnap] = await Promise.all([tx.get(playerRef(uid)), tx.get(queuesRef(uid))]);
    if (!pSnap.exists() || !qSnap.exists()) throw new GameActionError("Profil joueur introuvable.");

    const now = Date.now();
    const preFlushPlayer = pSnap.data() as PlayerState;
    const flushed = flushState(preFlushPlayer, qSnap.data() as QueuesState, now);
    const mutated = mutate({ player: flushed.player, queues: flushed.queues, preFlushPlayer, flushNotifications: flushed.notifications });

    tx.set(playerRef(uid), mutated.player);
    tx.set(queuesRef(uid), mutated.queues);

    for (const n of [...flushed.notifications, ...(mutated.notifications ?? [])]) {
      tx.set(doc(notificationsCol(uid)), n);
    }

    result = mutated.result;
  });

  return result;
}

export interface AwaySummary {
  elapsedMs: number;
  resourceGains: Partial<Record<ResourceId, number>>;
  notifications: NewNotification[];
}

/** Flush pur (production + complétions), sans action supplémentaire. Utilisé
 *  au chargement et par le "heartbeat" périodique pour rester à jour sans
 *  dépendre uniquement des actions du joueur. Retourne un résumé (gains de
 *  ressources, temps écoulé, complétions) pour le modal "pendant ton absence",
 *  que useGameSync n'affiche que pour le tout premier appel après montage. */
export async function syncPlayer(uid: string, playtimeDeltaSeconds = 0): Promise<AwaySummary> {
  return runFlushedAction(uid, ({ player, queues, preFlushPlayer, flushNotifications }) => {
    player.playtimeSeconds = (player.playtimeSeconds || 0) + Math.max(0, playtimeDeltaSeconds);

    const elapsedMs = Date.now() - (preFlushPlayer.resourcesUpdatedAtMs || Date.now());
    const resourceGains: Partial<Record<ResourceId, number>> = {};
    for (const key of Object.keys(player.resources) as ResourceId[]) {
      const delta = (player.resources[key] ?? 0) - (preFlushPlayer.resources[key] ?? 0);
      if (delta > 0) resourceGains[key] = delta;
    }

    return {
      player,
      queues,
      result: { elapsedMs, resourceGains, notifications: flushNotifications },
    };
  });
}

/* =====================================================
   Bâtiments
===================================================== */

export async function unlockBuilding(uid: string, buildingId: BuildingId) {
  return runFlushedAction(uid, ({ player, queues }) => {
    const info = BUILDING_UNLOCK_COST[buildingId];
    if (!info) throw new GameActionError("Ce bâtiment se débloque via le Labo.");
    if (player.buildings[buildingId].unlocked) throw new GameActionError("Déjà débloqué.");

    if ("multi" in info) {
      const costMap: Partial<Record<ResourceId, number>> = {};
      info.resources.forEach((r) => (costMap[r.resource as ResourceId] = r.amount));
      if (!canAffordAll(player.resources, costMap)) throw new GameActionError("Ressources insuffisantes.");
      info.resources.forEach((r) => (player.resources[r.resource as ResourceId] -= r.amount));
    } else {
      if ((player.resources[info.resource as ResourceId] ?? 0) < info.amount) {
        throw new GameActionError("Ressources insuffisantes.");
      }
      player.resources[info.resource as ResourceId] -= info.amount;
    }

    player.buildings[buildingId].unlocked = true;
    return { player, queues, result: undefined };
  });
}

export async function startBuildingUpgrade(uid: string, buildingId: BuildingId) {
  return runFlushedAction(uid, ({ player, queues }) => {
    const def = findBuilding(buildingId);
    if (!def) throw new GameActionError("Bâtiment inconnu.");

    const state = player.buildings[buildingId];
    if (!state.unlocked) throw new GameActionError("Ce bâtiment n'est pas débloqué.");
    if (queues.buildingUpgrades[buildingId]) throw new GameActionError("Amélioration déjà en cours.");
    if (state.level >= def.maxLevel) throw new GameActionError("Niveau maximum atteint.");

    const nextLevel = state.level + 1;
    const rawCost = getBuildingUpgradeCost(def, nextLevel);
    const cost = applyBuildingDiscount(rawCost, player.bonuses.buildingUpgradeDiscount);

    if (!canAffordAll(player.resources, cost)) throw new GameActionError("Ressources insuffisantes.");
    for (const [res, val] of Object.entries(cost)) {
      player.resources[res as ResourceId] -= val ?? 0;
    }

    const time = getBuildingUpgradeTime(def, nextLevel);
    queues.buildingUpgrades[buildingId] = { endTime: Date.now() + time * 1000 };

    return { player, queues, result: undefined };
  });
}

/* =====================================================
   Unités
===================================================== */

export async function enqueueUnitBuild(uid: string, unitId: string, qty: number) {
  return runFlushedAction(uid, ({ player, queues }) => {
    const unit = findUnit(unitId);
    if (!unit || qty <= 0) throw new GameActionError("Unité invalide.");

    const level = player.units[unitId]?.level ?? 0;
    if (level <= 0) throw new GameActionError("Cette unité doit d'abord être débloquée via le Labo.");

    const category = unit.category;
    const capacity = getUnitCapacity(player.buildings, category);
    const built = Object.entries(player.units).reduce((sum, [id, u]) => {
      const def = findUnit(id);
      return def?.category === category ? sum + u.count : sum;
    }, 0);
    const reserved = queues.unitQueues[category].length;

    if (built + reserved + qty > capacity) {
      throw new GameActionError(`Capacité du hangar ${category === "attack" ? "d'attaque" : "de défense"} insuffisante.`);
    }

    const totalCost = { scrap: unit.cost.scrap * qty, energy: unit.cost.energy * qty };
    if (!canAffordAll(player.resources, totalCost)) throw new GameActionError("Ressources insuffisantes.");
    player.resources.scrap -= totalCost.scrap;
    player.resources.energy -= totalCost.energy;

    const queue = queues.unitQueues[category];
    const wasEmpty = queue.length === 0;
    for (let i = 0; i < qty; i++) queue.push({ unitId, endTime: null });
    if (wasEmpty) queue[0].endTime = Date.now() + getUnitBuildTime(unit) * 1000;

    return { player, queues, result: undefined };
  });
}

export async function sellUnit(uid: string, unitId: string, qty: number) {
  return runFlushedAction(uid, ({ player, queues }) => {
    const unit = findUnit(unitId);
    if (!unit || qty <= 0) throw new GameActionError("Unité invalide.");

    const owned = player.units[unitId]?.count ?? 0;
    if (owned < qty) throw new GameActionError("Tu n'as pas assez d'unités à vendre.");

    player.units[unitId].count -= qty;
    player.resources.scrap += Math.floor(unit.cost.scrap * 0.5) * qty;
    player.resources.energy += Math.floor(unit.cost.energy * 0.5) * qty;

    return { player, queues, result: undefined };
  });
}

/* =====================================================
   Recherche
===================================================== */

export async function startResearch(uid: string, techId: string) {
  return runFlushedAction(uid, ({ player, queues }) => {
    const tech = findTech(techId);
    if (!tech) throw new GameActionError("Technologie inconnue.");

    const currentLevel = player.techLevels[techId] ?? 0;
    const nextLevel = currentLevel + 1;
    if (nextLevel > tech.maxLevel) throw new GameActionError("Niveau maximum atteint.");

    const check = checkPrereqs(tech, player.techLevels);
    if (!check.valid) throw new GameActionError("Prérequis non remplis.");

    if (queues.activeResearches.some((r) => r.id === techId)) {
      throw new GameActionError("Cette technologie est déjà en cours de recherche.");
    }
    if (queues.activeResearches.length >= MAX_CONCURRENT_RESEARCH) {
      throw new GameActionError(`File de recherche pleine (${MAX_CONCURRENT_RESEARCH}/${MAX_CONCURRENT_RESEARCH}).`);
    }

    const cost = getTechCost(tech, nextLevel);
    if (!canAffordAll(player.resources, cost)) throw new GameActionError("Ressources insuffisantes.");
    for (const [res, val] of Object.entries(cost)) {
      player.resources[res as ResourceId] -= val;
    }

    const time = getTechTime(tech, nextLevel);
    queues.activeResearches.push({ id: techId, endTime: Date.now() + time * 1000 });

    return { player, queues, result: undefined };
  });
}

/* =====================================================
   Missions
===================================================== */

export async function startMission(uid: string, missionKey: string) {
  return runFlushedAction(uid, ({ player, queues }) => {
    const mission = MISSIONS[missionKey];
    if (!mission) throw new GameActionError("Mission inconnue.");
    if (queues.activeMissions.some((m) => m.key === missionKey)) {
      throw new GameActionError("Mission déjà en cours.");
    }
    if (!hasPrerequisites(mission, player.units)) throw new GameActionError("Prérequis non remplis.");

    queues.activeMissions.push({ key: missionKey, endTime: Date.now() + mission.duration * 1000 });
    return { player, queues, result: undefined };
  });
}

/* =====================================================
   Commerce
===================================================== */

export async function tradeResources(uid: string, sellId: ResourceId, buyId: ResourceId, amount: number) {
  return runFlushedAction(uid, ({ player, queues }) => {
    if (amount <= 0 || sellId === buyId) throw new GameActionError("Échange invalide.");
    if ((player.resources[sellId] ?? 0) < amount) throw new GameActionError("Pas assez de ressources à échanger.");

    const rate = getTradeRate(sellId, buyId);
    const gained = Math.floor(amount * rate);

    player.resources[sellId] -= amount;
    player.resources[buyId] = (player.resources[buyId] ?? 0) + gained;

    return { player, queues, result: gained };
  });
}

/* =====================================================
   Échange entre joueurs

   Le débit de l'expéditeur et la création du don sont dans la même
   transaction (comme initiateAttack) : impossible de perdre des
   ressources si l'écriture échoue à mi-chemin. Le crédit du
   destinataire se fait séparément, dans SA propre transaction, quand
   il traite le don (voir claimResourceGift) — jamais l'expéditeur qui
   n'a pas le droit d'écrire sur le document d'un autre joueur.
===================================================== */

export async function sendResourceGift(params: {
  fromUid: string;
  fromPseudo: string;
  toUid: string;
  toPseudo: string;
  resources: Partial<Resources>;
}) {
  const { fromUid, fromPseudo, toUid, toPseudo, resources } = params;
  if (fromUid === toUid) throw new GameActionError("Tu ne peux pas t'envoyer des ressources à toi-même !");

  const entries = (Object.entries(resources) as [ResourceId, number | undefined][]).filter(([, v]) => (v ?? 0) > 0);
  if (entries.length === 0) throw new GameActionError("Sélectionne au moins une ressource à envoyer.");

  await runTransaction(db, async (tx) => {
    const [pSnap, qSnap] = await Promise.all([tx.get(playerRef(fromUid)), tx.get(queuesRef(fromUid))]);
    if (!pSnap.exists() || !qSnap.exists()) throw new GameActionError("Profil joueur introuvable.");

    const now = Date.now();
    const flushed = flushState(pSnap.data() as PlayerState, qSnap.data() as QueuesState, now);

    for (const [res, amt] of entries) {
      if ((flushed.player.resources[res] ?? 0) < (amt ?? 0)) throw new GameActionError("Ressources insuffisantes.");
      flushed.player.resources[res] -= amt ?? 0;
    }

    tx.set(playerRef(fromUid), flushed.player);
    tx.set(queuesRef(fromUid), flushed.queues);
    for (const n of flushed.notifications) tx.set(doc(notificationsCol(fromUid)), n);

    tx.set(doc(resourceGiftsCol()), {
      fromUid,
      fromPseudo,
      toUid,
      toPseudo,
      resources: Object.fromEntries(entries),
      timestamp: serverTimestamp(),
      claimed: false,
    });
  });
}

export function subscribePendingGifts(uid: string, cb: (gifts: ResourceGift[]) => void): Unsubscribe {
  const q = query(resourceGiftsCol(), where("toUid", "==", uid), where("claimed", "==", false));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ResourceGift, "id">) }))));
}

export async function claimResourceGift(uid: string, giftId: string) {
  await runTransaction(db, async (tx) => {
    const giftRef = doc(resourceGiftsCol(), giftId);
    const [giftSnap, pSnap, qSnap] = await Promise.all([tx.get(giftRef), tx.get(playerRef(uid)), tx.get(queuesRef(uid))]);
    if (!giftSnap.exists()) return;
    const gift = { id: giftSnap.id, ...(giftSnap.data() as Omit<ResourceGift, "id">) };
    if (gift.claimed || !pSnap.exists() || !qSnap.exists()) return;

    const now = Date.now();
    const flushed = flushState(pSnap.data() as PlayerState, qSnap.data() as QueuesState, now);

    for (const [res, amt] of Object.entries(gift.resources)) {
      const key = res as ResourceId;
      flushed.player.resources[key] = (flushed.player.resources[key] ?? 0) + (amt ?? 0);
    }

    tx.set(playerRef(uid), flushed.player);
    tx.set(queuesRef(uid), flushed.queues);
    tx.update(giftRef, { claimed: true });
    tx.set(doc(notificationsCol(uid)), {
      kind: "gift",
      title: "Ressources reçues !",
      message: `${gift.fromPseudo} t'a envoyé des ressources.`,
      createdAtMs: now,
      read: false,
    });
    for (const n of flushed.notifications) tx.set(doc(notificationsCol(uid)), n);
  });
}

/* =====================================================
   Combat
===================================================== */

export interface AttackParams {
  attackerUid: string;
  attackerPseudo: string;
  targetUid: string;
  targetPseudo: string;
  fleet: Record<string, number>;
}

export async function initiateAttack(params: AttackParams) {
  const { attackerUid, attackerPseudo, targetUid, targetPseudo, fleet } = params;
  if (attackerUid === targetUid) throw new GameActionError("Tu ne peux pas t'attaquer toi-même !");

  return runTransaction(db, async (tx) => {
    const [aSnap, aQSnap, dSnap] = await Promise.all([
      tx.get(playerRef(attackerUid)),
      tx.get(queuesRef(attackerUid)),
      tx.get(playerRef(targetUid)),
    ]);
    if (!aSnap.exists() || !aQSnap.exists()) throw new GameActionError("Profil attaquant introuvable.");
    if (!dSnap.exists()) throw new GameActionError("Ce joueur est introuvable.");

    const now = Date.now();
    const flushed = flushState(aSnap.data() as PlayerState, aQSnap.data() as QueuesState, now);
    const defender = dSnap.data() as PlayerState;

    for (const [unitId, qty] of Object.entries(fleet)) {
      if ((flushed.player.units[unitId]?.count ?? 0) < qty) {
        throw new GameActionError("Tu ne possèdes plus assez d'unités pour cette flotte.");
      }
    }

    const attackerRepairPct = getRepairPercent(flushed.player.buildings);
    const defenderRepairPct = getRepairPercent(defender.buildings);

    const combat = resolveCombat({
      attackerUnits: flushed.player.units,
      attackerTechLevels: flushed.player.techLevels,
      attackerRepairPct,
      fleet,
      defenderUnits: defender.units,
      defenderTechLevels: defender.techLevels,
      defenderRepairPct,
      defenderResources: defender.resources,
    });

    for (const [unitId, lost] of Object.entries(combat.attackerLosses)) {
      if (flushed.player.units[unitId]) {
        flushed.player.units[unitId].count = Math.max(0, flushed.player.units[unitId].count - lost);
      }
    }
    if (combat.loot) {
      for (const [res, amt] of Object.entries(combat.loot)) {
        flushed.player.resources[res as ResourceId] += amt ?? 0;
      }
    }
    if (combat.outcome === "attacker_win") {
      flushed.player.victories += 1;
      applyXpDelta(flushed.player, 40, now);
    } else if (combat.outcome === "defender_win") {
      flushed.player.defeats += 1;
      applyXpDelta(flushed.player, -20, now);
    }

    tx.set(playerRef(attackerUid), flushed.player);
    tx.set(queuesRef(attackerUid), flushed.queues);
    for (const n of flushed.notifications) tx.set(doc(notificationsCol(attackerUid)), n);

    const reportRef = doc(battleReportsCol());
    const report: Omit<BattleReport, "id"> = {
      attackerUid,
      attackerPseudo,
      defenderUid: targetUid,
      defenderPseudo: targetPseudo,
      timestamp: serverTimestamp(),
      outcome: combat.outcome,
      attackerPower: combat.attackerPower,
      defenderPower: combat.defenderPower,
      attackerLossPercent: combat.attackerLossPercent,
      defenderLossPercent: combat.defenderLossPercent,
      attackerLosses: combat.attackerLosses,
      attackerRecovered: combat.attackerRecovered,
      defenderLosses: combat.defenderLosses,
      defenderRecovered: combat.defenderRecovered,
      loot: combat.loot,
      defenderProcessed: false,
    };
    tx.set(reportRef, report);

    return { ...combat, defenderPseudo: targetPseudo };
  });
}

export function subscribePendingBattleReports(uid: string, cb: (reports: BattleReport[]) => void): Unsubscribe {
  const q = query(battleReportsCol(), where("defenderUid", "==", uid), where("defenderProcessed", "==", false));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BattleReport, "id">) }))));
}

/** Journal de combat complet (attaques lancées + reçues), temps réel.
 *  Deux abonnements simples (une égalité chacun, sans orderBy) plutôt
 *  qu'une requête OR + tri serveur : évite d'avoir à déployer de nouveaux
 *  index composites, le tri se fait ici côté client. */
export function subscribeBattleLog(uid: string, cb: (reports: BattleReport[]) => void): Unsubscribe {
  let sent: BattleReport[] = [];
  let received: BattleReport[] = [];

  const emit = () => {
    const merged = [...sent, ...received].sort((a, b) => firestoreMillis(b.timestamp) - firestoreMillis(a.timestamp));
    cb(merged);
  };

  const unsubSent = onSnapshot(query(battleReportsCol(), where("attackerUid", "==", uid)), (snap) => {
    sent = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BattleReport, "id">) }));
    emit();
  });
  const unsubReceived = onSnapshot(query(battleReportsCol(), where("defenderUid", "==", uid)), (snap) => {
    received = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BattleReport, "id">) }));
    emit();
  });

  return () => {
    unsubSent();
    unsubReceived();
  };
}

export async function processBattleReportForDefender(uid: string, reportId: string): Promise<BattleReport | null> {
  return runTransaction(db, async (tx) => {
    const reportDocRef = doc(battleReportsCol(), reportId);
    const [reportSnap, pSnap, qSnap] = await Promise.all([
      tx.get(reportDocRef),
      tx.get(playerRef(uid)),
      tx.get(queuesRef(uid)),
    ]);
    if (!reportSnap.exists()) return null;
    const report = { id: reportSnap.id, ...(reportSnap.data() as Omit<BattleReport, "id">) };
    if (report.defenderProcessed || !pSnap.exists() || !qSnap.exists()) return null;

    const now = Date.now();
    const flushed = flushState(pSnap.data() as PlayerState, qSnap.data() as QueuesState, now);

    for (const [unitId, lost] of Object.entries(report.defenderLosses || {})) {
      if (flushed.player.units[unitId]) {
        flushed.player.units[unitId].count = Math.max(0, flushed.player.units[unitId].count - lost);
      }
    }
    if (report.outcome === "defender_win") {
      flushed.player.victories += 1;
      applyXpDelta(flushed.player, 40, now);
    } else if (report.outcome === "attacker_win") {
      flushed.player.defeats += 1;
      applyXpDelta(flushed.player, -20, now);
    }
    if (report.loot) {
      for (const [res, amt] of Object.entries(report.loot)) {
        const key = res as ResourceId;
        flushed.player.resources[key] = Math.max(0, (flushed.player.resources[key] ?? 0) - (amt ?? 0));
      }
    }

    tx.set(playerRef(uid), flushed.player);
    tx.set(queuesRef(uid), flushed.queues);
    tx.update(reportDocRef, { defenderProcessed: true });

    const outcomeLabel: Record<string, string> = {
      attacker_win: "Tu as perdu ce combat...",
      defender_win: "Attaque repoussée !",
      draw: "Match nul.",
    };
    tx.set(doc(notificationsCol(uid)), {
      kind: "combat-defender",
      title: outcomeLabel[report.outcome] ?? "Rapport de combat",
      message: `Attaque de ${report.attackerPseudo}.`,
      createdAtMs: now,
      read: false,
    });
    for (const n of flushed.notifications) tx.set(doc(notificationsCol(uid)), n);

    return report;
  });
}

/* =====================================================
   Divers
===================================================== */

export async function listAllPlayers(): Promise<LeaderboardEntry[]> {
  const snap = await getDocs(playersCol());
  return snap.docs.map(leaderboardEntryFromDoc).sort((a, b) => b.xp - a.xp);
}

/** Supprime les données Firestore du joueur (profil, files, notifications,
 *  réservation de pseudo). Le compte Firebase Auth lui-même est supprimé
 *  séparément par authService.deleteAccount juste après. */
export async function deletePlayerAccountData(uid: string, pseudo: string) {
  const notifSnap = await getDocs(notificationsCol(uid));

  const batch = writeBatch(db);
  notifSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(queuesRef(uid));
  batch.delete(playerRef(uid));
  await batch.commit();

  const sanitized = pseudo.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  const usernameSnap = await getDoc(usernameRef(sanitized));
  if (usernameSnap.exists() && usernameSnap.data().uid === uid) {
    await deleteDoc(usernameRef(sanitized));
  }
}
