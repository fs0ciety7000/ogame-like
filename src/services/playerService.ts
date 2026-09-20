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
  ResourceId,
} from "@/types/game";

const playersCol = () => collection(db, "players");
const playerRef = (uid: string) => doc(db, "players", uid);
const queuesRef = (uid: string) => doc(db, "players", uid, "meta", "queues");
const notificationsCol = (uid: string) => collection(db, "players", uid, "notifications");
const battleReportsCol = () => collection(db, "battle_reports");
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
  await setDoc(playerRef(uid), { pseudo }, { merge: true });
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

export function subscribePlayer(uid: string, cb: (player: PlayerState | null) => void): Unsubscribe {
  return onSnapshot(playerRef(uid), (snap) => cb(snap.exists() ? (snap.data() as PlayerState) : null));
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
}

export function subscribeLeaderboard(cb: (players: LeaderboardEntry[]) => void): Unsubscribe {
  const q = query(playersCol(), orderBy("xp", "desc"), fsLimit(100));
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ uid: d.id, pseudo: (d.data().pseudo as string) || "Joueur inconnu", xp: (d.data().xp as number) || 0 }))),
  );
}

export async function fetchPlayerSnapshot(uid: string): Promise<PlayerState | null> {
  const snap = await getDoc(playerRef(uid));
  return snap.exists() ? (snap.data() as PlayerState) : null;
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
  mutate: (state: { player: PlayerState; queues: QueuesState }) => MutateOutput<T>,
): Promise<T> {
  let result!: T;

  await runTransaction(db, async (tx) => {
    const [pSnap, qSnap] = await Promise.all([tx.get(playerRef(uid)), tx.get(queuesRef(uid))]);
    if (!pSnap.exists() || !qSnap.exists()) throw new GameActionError("Profil joueur introuvable.");

    const now = Date.now();
    const flushed = flushState(pSnap.data() as PlayerState, qSnap.data() as QueuesState, now);
    const mutated = mutate({ player: flushed.player, queues: flushed.queues });

    tx.set(playerRef(uid), mutated.player);
    tx.set(queuesRef(uid), mutated.queues);

    for (const n of [...flushed.notifications, ...(mutated.notifications ?? [])]) {
      tx.set(doc(notificationsCol(uid)), n);
    }

    result = mutated.result;
  });

  return result;
}

/** Flush pur (production + complétions), sans action supplémentaire. Utilisé
 *  au chargement et par le "heartbeat" périodique pour rester à jour sans
 *  dépendre uniquement des actions du joueur. */
export async function syncPlayer(uid: string, playtimeDeltaSeconds = 0) {
  return runFlushedAction(uid, ({ player, queues }) => {
    player.playtimeSeconds = (player.playtimeSeconds || 0) + Math.max(0, playtimeDeltaSeconds);
    return { player, queues, result: undefined };
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
      flushed.player.xp += 40;
    } else if (combat.outcome === "defender_win") {
      flushed.player.defeats += 1;
      flushed.player.xp = Math.max(0, flushed.player.xp - 20);
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
      flushed.player.xp += 40;
    } else if (report.outcome === "attacker_win") {
      flushed.player.defeats += 1;
      flushed.player.xp = Math.max(0, flushed.player.xp - 20);
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
  return snap.docs
    .map((d) => ({ uid: d.id, pseudo: (d.data().pseudo as string) || "Joueur inconnu", xp: (d.data().xp as number) || 0 }))
    .sort((a, b) => b.xp - a.xp);
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
