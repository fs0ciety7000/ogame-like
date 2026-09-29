import { pb } from "@/lib/pocketbase";
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

export class GameActionError extends Error {}

/* =====================================================
   Utilitaires de conversion PocketBase <-> App
===================================================== */

function playerFromRecord(record: any): PlayerState | null {
  if (!record || !record.resources || !record.buildings) return null;
  return {
    ...record,
    units: record.units ?? {},
    techLevels: record.techLevels ?? {},
  } as PlayerState;
}

/* =====================================================
   Création / lecture
===================================================== */

export async function ensurePlayerDoc(uid: string, pseudo: string) {
  try {
    await pb.collection("players").getOne(uid);
  } catch (err) {
    // Si le joueur n'existe pas, on le crée avec l'ID forcé
    // (Dans PocketBase, on peut forcer un ID de 15 caractères, ce qui correspond à l'ID utilisateur)
    const newPlayer = { ...defaultPlayerState(uid, pseudo), id: uid };
    await pb.collection("players").create(newPlayer);
    
    const newQueues = { ...defaultQueues(), player_id: uid };
    await pb.collection("queues").create(newQueues);
  }
}

export async function setPlayerPseudo(uid: string, pseudo: string) {
  await pb.collection("players").update(uid, { pseudo });
}

export async function claimUsername(uid: string, sanitizedPseudo: string, email: string) {
  // Avec PocketBase, l'unicité de l'username est gérée nativement dans la collection 'users'.
  // Cette fonction est conservée pour la compatibilité avec votre authService refactorisé.
  return Promise.resolve();
}

export async function fetchPlayerSnapshot(uid: string): Promise<PlayerState | null> {
  try {
    const record = await pb.collection("players").getOne(uid);
    return playerFromRecord(record);
  } catch (e) {
    return null;
  }
}

/* =====================================================
   Abonnements (Temps Réel via SSE PocketBase)
===================================================== */

export function subscribePlayer(
  uid: string,
  cb: (player: PlayerState | null) => void,
  onMeta?: (fromCache: boolean) => void,
): () => void {
  // Fetch initial
  pb.collection("players").getOne(uid)
    .then((rec) => { cb(playerFromRecord(rec)); onMeta?.(false); })
    .catch(() => { cb(null); onMeta?.(false); });

  // Abonnement aux changements
  pb.collection("players").subscribe(uid, (e) => {
    if (e.action === "update" || e.action === "create") cb(playerFromRecord(e.record));
    if (e.action === "delete") cb(null);
  });

  return () => { pb.collection("players").unsubscribe(uid); };
}

export function subscribeQueues(uid: string, cb: (queues: QueuesState | null) => void): () => void {
  const fetchInitial = async () => {
    try {
      const res = await pb.collection("queues").getFirstListItem(`player_id="${uid}"`);
      cb(res as unknown as QueuesState);
    } catch { cb(null); }
  };
  
  fetchInitial();
  
  pb.collection("queues").subscribe("*", (e) => {
    if (e.record.player_id === uid) {
      if (e.action === "update" || e.action === "create") cb(e.record as unknown as QueuesState);
      if (e.action === "delete") cb(null);
    }
  });

  return () => { pb.collection("queues").unsubscribe("*"); };
}

export function subscribeNotifications(uid: string, cb: (items: GameNotification[]) => void): () => void {
  const fetchList = async () => {
    const res = await pb.collection("notifications").getList(1, 30, {
      filter: `player_id="${uid}"`,
      sort: "-createdAtMs",
    });
    cb(res.items as unknown as GameNotification[]);
  };

  fetchList();
  
  pb.collection("notifications").subscribe("*", (e) => {
    if (e.record.player_id === uid) fetchList();
  });

  return () => { pb.collection("notifications").unsubscribe("*"); };
}

export async function markNotificationRead(uid: string, id: string) {
  await pb.collection("notifications").update(id, { read: true });
}

export interface LeaderboardEntry {
  uid: string;
  pseudo: string;
  xp: number;
  seasonId: string | null;
  seasonXp: number;
}

function leaderboardEntryFromRecord(data: any): LeaderboardEntry {
  return {
    uid: data.id,
    pseudo: data.pseudo || "Joueur inconnu",
    xp: data.xp || 0,
    seasonId: data.seasonId ?? null,
    seasonXp: data.seasonXp || 0,
  };
}

export function subscribeLeaderboard(cb: (players: LeaderboardEntry[]) => void): () => void {
  const fetchList = async () => {
    const res = await pb.collection("players").getList(1, 100, { sort: "-xp" });
    cb(res.items.map(leaderboardEntryFromRecord));
  };

  fetchList();
  pb.collection("players").subscribe("*", fetchList);
  return () => { pb.collection("players").unsubscribe("*"); };
}

/* =====================================================
   Contre-espionnage
===================================================== */

export async function createSpyReport(spyUid: string, spyPseudo: string, targetUid: string) {
  await pb.collection("spy_reports").create({
    spyUid,
    spyPseudo,
    targetUid,
    timestamp: new Date().toISOString(),
    targetProcessed: false,
  });
}

export function subscribePendingSpyReports(uid: string, cb: (reports: SpyReport[]) => void): () => void {
  const fetchList = async () => {
    const res = await pb.collection("spy_reports").getFullList({
      filter: `targetUid="${uid}" && targetProcessed=false`,
    });
    cb(res as unknown as SpyReport[]);
  };

  fetchList();
  pb.collection("spy_reports").subscribe("*", (e) => {
    if (e.record.targetUid === uid) fetchList();
  });

  return () => { pb.collection("spy_reports").unsubscribe("*"); };
}

export async function acknowledgeSpyReport(uid: string, reportId: string) {
  try {
    const report = await pb.collection("spy_reports").getOne(reportId);
    if (report.targetProcessed) return;

    await pb.collection("spy_reports").update(reportId, { targetProcessed: true });
    await pb.collection("notifications").create({
      player_id: uid,
      kind: "spy-detected",
      title: "Espionnage détecté !",
      message: `${report.spyPseudo} a tenté de t'espionner.`,
      createdAtMs: Date.now(),
      read: false,
    });
  } catch (e) {
    console.error(e);
  }
}

/* =====================================================
   Action transactionnelle (Émulation pour API REST)
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
  // En l'absence de transactions client dans PB, on séquence les requêtes.
  // Idéalement, sur un gros jeu, cette logique irait dans un hook Go ou JS côté serveur PB.
  const [playerRecord, queueRecord] = await Promise.all([
    pb.collection("players").getOne(uid),
    pb.collection("queues").getFirstListItem(`player_id="${uid}"`)
  ]);

  if (!playerRecord || !queueRecord) throw new GameActionError("Profil joueur introuvable.");

  const now = Date.now();
  const preFlushPlayer = playerFromRecord(playerRecord) as PlayerState;
  const flushed = flushState(preFlushPlayer, queueRecord as unknown as QueuesState, now);
  const mutated = mutate({ 
    player: flushed.player, 
    queues: flushed.queues, 
    preFlushPlayer, 
    flushNotifications: flushed.notifications 
  });

  await Promise.all([
    pb.collection("players").update(uid, mutated.player),
    pb.collection("queues").update(queueRecord.id, mutated.queues)
  ]);

  const allNotifs = [...flushed.notifications, ...(mutated.notifications ?? [])];
  for (const n of allNotifs) {
    await pb.collection("notifications").create({ player_id: uid, ...n });
  }

  return mutated.result;
}

export interface AwaySummary {
  elapsedMs: number;
  resourceGains: Partial<Record<ResourceId, number>>;
  notifications: NewNotification[];
}

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
   Bâtiments, Unités, Recherche, Missions, Commerce
   (Logique identique, seule l'enveloppe transactionnelle a changé)
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
      if (def?.category !== category) return sum;
      return sum + u.count * def.hangarSpace;
    }, 0);

    const reserved = queues.unitQueues[category].reduce((sum, item) => {
      const def = findUnit(item.unitId);
      return sum + (def?.hangarSpace ?? 1);
    }, 0);

    const requested = qty * unit.hangarSpace;

    if (built + reserved + requested > capacity) {
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
   Échanges entre joueurs
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

  // Retire les ressources de l'envoyeur
  await runFlushedAction(fromUid, ({ player, queues }) => {
    for (const [res, amt] of entries) {
      if ((player.resources[res] ?? 0) < (amt ?? 0)) throw new GameActionError("Ressources insuffisantes.");
      player.resources[res] -= amt ?? 0;
    }
    return { player, queues, result: undefined };
  });

  // Crée le don
  await pb.collection("resource_gifts").create({
    fromUid,
    fromPseudo,
    toUid,
    toPseudo,
    resources: Object.fromEntries(entries),
    timestamp: new Date().toISOString(),
    claimed: false,
  });
}

export function subscribePendingGifts(uid: string, cb: (gifts: ResourceGift[]) => void): () => void {
  const fetchList = async () => {
    const res = await pb.collection("resource_gifts").getFullList({
      filter: `toUid="${uid}" && claimed=false`
    });
    cb(res as unknown as ResourceGift[]);
  };

  fetchList();
  pb.collection("resource_gifts").subscribe("*", (e) => {
    if (e.record.toUid === uid) fetchList();
  });

  return () => { pb.collection("resource_gifts").unsubscribe("*"); };
}

export async function claimResourceGift(uid: string, giftId: string) {
  const gift = await pb.collection("resource_gifts").getOne(giftId);
  if (gift.claimed || gift.toUid !== uid) return;

  await runFlushedAction(uid, ({ player, queues }) => {
    for (const [res, amt] of Object.entries(gift.resources)) {
      const key = res as ResourceId;
      player.resources[key] = (player.resources[key] ?? 0) + (amt as number ?? 0);
    }
    return { player, queues, result: undefined };
  });

  await pb.collection("resource_gifts").update(giftId, { claimed: true });
  await pb.collection("notifications").create({
    player_id: uid,
    kind: "gift",
    title: "Ressources reçues !",
    message: `${gift.fromPseudo} t'a envoyé des ressources.`,
    createdAtMs: Date.now(),
    read: false,
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

  const [aRecord, aQRecord, dRecord] = await Promise.all([
    pb.collection("players").getOne(attackerUid),
    pb.collection("queues").getFirstListItem(`player_id="${attackerUid}"`),
    pb.collection("players").getOne(targetUid),
  ]);

  if (!aRecord || !aQRecord) throw new GameActionError("Profil attaquant introuvable.");
  if (!dRecord) throw new GameActionError("Ce joueur est introuvable.");

  const now = Date.now();
  const preFlushAttacker = playerFromRecord(aRecord) as PlayerState;
  const flushedAttacker = flushState(preFlushAttacker, aQRecord as unknown as QueuesState, now);
  const defender = playerFromRecord(dRecord) as PlayerState;

  for (const [unitId, qty] of Object.entries(fleet)) {
    if ((flushedAttacker.player.units[unitId]?.count ?? 0) < qty) {
      throw new GameActionError("Tu ne possèdes plus assez d'unités pour cette flotte.");
    }
  }

  const attackerRepairPct = getRepairPercent(flushedAttacker.player.buildings);
  const defenderRepairPct = getRepairPercent(defender.buildings);

  const combat = resolveCombat({
    attackerUnits: flushedAttacker.player.units,
    attackerTechLevels: flushedAttacker.player.techLevels,
    attackerRepairPct,
    fleet,
    defenderUnits: defender.units,
    defenderTechLevels: defender.techLevels,
    defenderRepairPct,
    defenderResources: defender.resources,
  });

  for (const [unitId, lost] of Object.entries(combat.attackerLosses)) {
    if (flushedAttacker.player.units[unitId]) {
      flushedAttacker.player.units[unitId].count = Math.max(0, flushedAttacker.player.units[unitId].count - lost);
    }
  }

  if (combat.loot) {
    for (const [res, amt] of Object.entries(combat.loot)) {
      flushedAttacker.player.resources[res as ResourceId] += amt ?? 0;
    }
  }

  if (combat.outcome === "attacker_win") {
    flushedAttacker.player.victories += 1;
    applyXpDelta(flushedAttacker.player, 40, now);
  } else if (combat.outcome === "defender_win") {
    flushedAttacker.player.defeats += 1;
    applyXpDelta(flushedAttacker.player, -20, now);
  }

  await Promise.all([
    pb.collection("players").update(attackerUid, flushedAttacker.player),
    pb.collection("queues").update(aQRecord.id, flushedAttacker.queues)
  ]);

  for (const n of flushedAttacker.notifications) {
    await pb.collection("notifications").create({ player_id: attackerUid, ...n });
  }

  const report: Omit<BattleReport, "id"> = {
    attackerUid,
    attackerPseudo,
    defenderUid: targetUid,
    defenderPseudo: targetPseudo,
    timestamp: new Date().toISOString(), // Conversion en Date standard pour PocketBase
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

  await pb.collection("battle_reports").create(report);

  return { ...combat, defenderPseudo: targetPseudo };
}

export function subscribePendingBattleReports(uid: string, cb: (reports: BattleReport[]) => void): () => void {
  const fetchList = async () => {
    const res = await pb.collection("battle_reports").getFullList({
      filter: `defenderUid="${uid}" && defenderProcessed=false`
    });
    cb(res as unknown as BattleReport[]);
  };

  fetchList();
  pb.collection("battle_reports").subscribe("*", (e) => {
    if (e.record.defenderUid === uid) fetchList();
  });

  return () => { pb.collection("battle_reports").unsubscribe("*"); };
}

export function subscribeBattleLog(uid: string, cb: (reports: BattleReport[]) => void): () => void {
  const fetchLogs = async () => {
    // Dans PocketBase, on peut utiliser un OR direct dans le filtre
    const res = await pb.collection("battle_reports").getList(1, 50, {
      filter: `attackerUid="${uid}" || defenderUid="${uid}"`,
      sort: "-timestamp"
    });
    cb(res.items as unknown as BattleReport[]);
  };

  fetchLogs();
  pb.collection("battle_reports").subscribe("*", (e) => {
    if (e.record.attackerUid === uid || e.record.defenderUid === uid) fetchLogs();
  });

  return () => { pb.collection("battle_reports").unsubscribe("*"); };
}

export async function processBattleReportForDefender(uid: string, reportId: string): Promise<BattleReport | null> {
  const report = await pb.collection("battle_reports").getOne(reportId);
  if (report.defenderProcessed || report.defenderUid !== uid) return null;

  await runFlushedAction(uid, ({ player, queues }) => {
    for (const [unitId, lost] of Object.entries(report.defenderLosses || {})) {
      if (player.units[unitId]) {
        player.units[unitId].count = Math.max(0, player.units[unitId].count - (lost as number));
      }
    }

    const now = Date.now();
    if (report.outcome === "defender_win") {
      player.victories += 1;
      applyXpDelta(player, 40, now);
    } else if (report.outcome === "attacker_win") {
      player.defeats += 1;
      applyXpDelta(player, -20, now);
    }

    if (report.loot) {
      for (const [res, amt] of Object.entries(report.loot)) {
        const key = res as ResourceId;
        player.resources[key] = Math.max(0, (player.resources[key] ?? 0) - (amt as number ?? 0));
      }
    }

    return { player, queues, result: undefined };
  });

  await pb.collection("battle_reports").update(reportId, { defenderProcessed: true });

  const outcomeLabel: Record<string, string> = {
    attacker_win: "Tu as perdu ce combat...",
    defender_win: "Attaque repoussée !",
    draw: "Match nul.",
  };

  await pb.collection("notifications").create({
    player_id: uid,
    kind: "combat-defender",
    title: outcomeLabel[report.outcome] ?? "Rapport de combat",
    message: `Attaque de ${report.attackerPseudo}.`,
    createdAtMs: Date.now(),
    read: false,
  });

  return report as unknown as BattleReport;
}

/* =====================================================
   Divers
===================================================== */

export async function listAllPlayers(): Promise<LeaderboardEntry[]> {
  const res = await pb.collection("players").getFullList({ sort: "-xp" });
  return res.map(leaderboardEntryFromRecord);
}

export async function deletePlayerAccountData(uid: string, pseudo: string) {
  // Supprime toutes les données relatives au joueur via une suppression en cascade (si configurée côté PocketBase)
  // ou en requêtant puis supprimant chaque entité (PocketBase requiert des suppressions individuelles par ID).
  
  try {
    const notifs = await pb.collection("notifications").getFullList({ filter: `player_id="${uid}"` });
    for (const n of notifs) await pb.collection("notifications").delete(n.id);
  } catch(e) {}

  try {
    const queues = await pb.collection("queues").getFirstListItem(`player_id="${uid}"`);
    await pb.collection("queues").delete(queues.id);
  } catch(e) {}

  try {
    await pb.collection("players").delete(uid);
  } catch(e) {}
}