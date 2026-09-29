import { pb, isNotFound, subscribeRecords, throttle } from "@/lib/pocketbase";
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
   Conversion enregistrements PocketBase <-> état du jeu

   Un joueur = un enregistrement `players` dont l'id est celui de son
   compte `users`, et un enregistrement `queues` (files d'attente) avec ce
   même id. Voir pocketbase/pb_schema.json.
===================================================== */

type PbRecord = Record<string, unknown> & { id: string };

/** Champs que le moteur de jeu (flushState + actions) peut modifier. Le
 *  pseudo et l'alliance sont exclus : ils sont écrits à part (connexion,
 *  écran Alliance) et une action de jeu lue juste avant les écraserait
 *  sinon avec une valeur périmée — sans transactions côté client,
 *  PocketBase ne protège pas de ce genre de conflit. */
const GAME_FIELDS = [
  "resources",
  "buildings",
  "units",
  "techLevels",
  "bonuses",
  "xp",
  "seasonId",
  "seasonXp",
  "victories",
  "defeats",
  "playtimeSeconds",
  "resourcesUpdatedAtMs",
  "resourceHistory",
  "unlockedAchievements",
] as const;

function playerFromRecord(record: PbRecord | null | undefined): PlayerState | null {
  if (!record || !record.resources || !record.buildings) return null;
  const player = { ...record, uid: record.id } as unknown as PlayerState;
  return {
    ...player,
    units: player.units ?? {},
    techLevels: player.techLevels ?? {},
    resourceHistory: player.resourceHistory ?? [],
    unlockedAchievements: player.unlockedAchievements ?? [],
  };
}

function gameFieldsOf(player: PlayerState): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of GAME_FIELDS) out[key] = player[key] ?? null;
  return out;
}

function queuesFromRecord(record: PbRecord | null | undefined): QueuesState | null {
  if (!record) return null;
  const defaults = defaultQueues();
  return {
    buildingUpgrades: (record.buildingUpgrades as QueuesState["buildingUpgrades"]) ?? defaults.buildingUpgrades,
    unitQueues: (record.unitQueues as QueuesState["unitQueues"]) ?? defaults.unitQueues,
    activeResearches: (record.activeResearches as QueuesState["activeResearches"]) ?? defaults.activeResearches,
    activeMissions: (record.activeMissions as QueuesState["activeMissions"]) ?? defaults.activeMissions,
  };
}

/* =====================================================
   Création / lecture
===================================================== */

async function createIgnoringDuplicate(collection: string, data: Record<string, unknown>) {
  try {
    await pb.collection(collection).create(data);
  } catch (err) {
    // Création concurrente (inscription + filet de sécurité de useGameSync) :
    // l'enregistrement existe déjà, c'est le résultat voulu.
    if ((err as { status?: number })?.status !== 400) throw err;
    await pb.collection(collection).getOne(data.id as string);
  }
}

export async function ensurePlayerDoc(uid: string, pseudo: string) {
  try {
    await pb.collection("players").getOne(uid, { fields: "id" });
  } catch (err) {
    if (!isNotFound(err)) throw err;
    const state: Partial<PlayerState> = defaultPlayerState(uid, pseudo);
    delete state.uid;
    await createIgnoringDuplicate("players", { ...state, id: uid, createdAtMs: Date.now() });
  }
  try {
    await pb.collection("queues").getOne(uid, { fields: "id" });
  } catch (err) {
    if (!isNotFound(err)) throw err;
    await createIgnoringDuplicate("queues", { ...defaultQueues(), id: uid });
  }
}

export async function setPlayerPseudo(uid: string, pseudo: string) {
  await pb.collection("players").update(uid, { pseudo });
}

export async function fetchPlayerSnapshot(uid: string): Promise<PlayerState | null> {
  try {
    return playerFromRecord(await pb.collection("players").getOne<PbRecord>(uid));
  } catch {
    return null;
  }
}

/* =====================================================
   Abonnements temps réel
===================================================== */

/** Lecture initiale d'un abonnement. Juste après l'inscription, l'écran
 *  de jeu s'ouvre avant que le profil ne soit créé (404) : on réessaie
 *  quelques fois plutôt que d'attendre le prochain évènement temps réel. */
function loadInitial(
  collection: string,
  id: string,
  isActive: () => boolean,
  onRecord: (record: PbRecord) => void,
  onMissing: (serverAnswered: boolean) => void,
  attempt = 0,
) {
  pb.collection(collection)
    .getOne<PbRecord>(id)
    .then((rec) => isActive() && onRecord(rec))
    .catch((err) => {
      if (!isActive()) return;
      onMissing(isNotFound(err));
      if (isNotFound(err) && attempt < 5) {
        setTimeout(() => loadInitial(collection, id, isActive, onRecord, onMissing, attempt + 1), 1000 * (attempt + 1));
      }
    });
}

/** onServerData(true) dès qu'une donnée fraîche arrive du serveur — sert à
 *  l'indicateur de connexion de l'en-tête (voir connectionStore). */
export function subscribePlayer(
  uid: string,
  cb: (player: PlayerState | null) => void,
  onServerData?: (fromServer: boolean) => void,
): () => void {
  let active = true;
  loadInitial(
    "players",
    uid,
    () => active,
    (rec) => {
      cb(playerFromRecord(rec));
      onServerData?.(true);
    },
    // 404 = réponse du serveur (profil pas encore créé) ; sinon serveur injoignable.
    (serverAnswered) => {
      if (serverAnswered) cb(null);
      onServerData?.(serverAnswered);
    },
  );

  const unsubscribe = subscribeRecords<PbRecord>("players", uid, (e) => {
    if (e.action === "delete") cb(null);
    else cb(playerFromRecord(e.record));
    onServerData?.(true);
  });

  return () => {
    active = false;
    unsubscribe();
  };
}

export function subscribeQueues(uid: string, cb: (queues: QueuesState | null) => void): () => void {
  let active = true;
  loadInitial(
    "queues",
    uid,
    () => active,
    (rec) => cb(queuesFromRecord(rec)),
    (serverAnswered) => serverAnswered && cb(null),
  );

  const unsubscribe = subscribeRecords<PbRecord>("queues", uid, (e) => {
    cb(e.action === "delete" ? null : queuesFromRecord(e.record));
  });

  return () => {
    active = false;
    unsubscribe();
  };
}

/** Recharge une liste à l'ouverture puis à chaque évènement temps réel
 *  correspondant au filtre. */
function subscribeList<T>(
  collection: string,
  filter: string,
  load: () => Promise<T>,
  cb: (items: T) => void,
  throttleMs = 0,
): () => void {
  let active = true;
  const refresh = () => {
    load()
      .then((items) => active && cb(items))
      .catch((err) => console.error(`Lecture ${collection} impossible :`, err));
  };
  const trigger = throttleMs > 0 ? throttle(refresh, throttleMs) : refresh;
  refresh();
  const unsubscribe = subscribeRecords(collection, "*", trigger, filter || undefined);
  return () => {
    active = false;
    unsubscribe();
  };
}

export function subscribeNotifications(uid: string, cb: (items: GameNotification[]) => void): () => void {
  const filter = pb.filter("player_id = {:uid}", { uid });
  return subscribeList(
    "notifications",
    filter,
    async () => {
      const res = await pb.collection("notifications").getList<GameNotification>(1, 30, { filter, sort: "-createdAtMs" });
      return res.items;
    },
    cb,
  );
}

export async function markNotificationRead(_uid: string, id: string) {
  await pb.collection("notifications").update(id, { read: true });
}

async function createNotifications(uid: string, notifications: NewNotification[]) {
  for (const n of notifications) {
    await pb.collection("notifications").create({ ...n, player_id: uid });
  }
}

export interface LeaderboardEntry {
  uid: string;
  pseudo: string;
  xp: number;
  seasonId: string | null;
  seasonXp: number;
}

function leaderboardEntryFromRecord(data: PbRecord): LeaderboardEntry {
  return {
    uid: data.id,
    pseudo: (data.pseudo as string) || "Joueur inconnu",
    xp: (data.xp as number) || 0,
    seasonId: (data.seasonId as string) || null,
    seasonXp: (data.seasonXp as number) || 0,
  };
}

const LEADERBOARD_FIELDS = "id,pseudo,xp,seasonId,seasonXp";

/** Classement "total", trié côté serveur par XP. Chaque joueur écrit son
 *  profil toutes les ~20 s (heartbeat) : le rechargement est donc limité à
 *  une fois toutes les 10 s pour ne pas saturer le serveur. */
export function subscribeLeaderboard(cb: (players: LeaderboardEntry[]) => void): () => void {
  return subscribeList(
    "players",
    "",
    async () => {
      const res = await pb.collection("players").getList<PbRecord>(1, 100, { sort: "-xp", fields: LEADERBOARD_FIELDS });
      return res.items.map(leaderboardEntryFromRecord);
    },
    cb,
    10_000,
  );
}

export async function listAllPlayers(): Promise<LeaderboardEntry[]> {
  const res = await pb.collection("players").getFullList<PbRecord>({ sort: "-xp", fields: LEADERBOARD_FIELDS });
  return res.map(leaderboardEntryFromRecord);
}

/* =====================================================
   Contre-espionnage
===================================================== */

export async function createSpyReport(spyUid: string, spyPseudo: string, targetUid: string) {
  await pb.collection("spy_reports").create({
    spyUid,
    spyPseudo,
    targetUid,
    timestamp: Date.now(),
    targetProcessed: false,
  });
}

export function subscribePendingSpyReports(uid: string, cb: (reports: SpyReport[]) => void): () => void {
  const filter = pb.filter("targetUid = {:uid} && targetProcessed = false", { uid });
  return subscribeList(
    "spy_reports",
    pb.filter("targetUid = {:uid}", { uid }),
    () => pb.collection("spy_reports").getFullList<SpyReport>({ filter }),
    cb,
  );
}

export function acknowledgeSpyReport(uid: string, reportId: string) {
  return once(`spy:${reportId}`, () => acknowledgeSpyReportOnce(uid, reportId));
}

async function acknowledgeSpyReportOnce(uid: string, reportId: string) {
  let report: SpyReport;
  try {
    // La règle d'accès n'autorise ce passage qu'une seule fois
    // (targetProcessed doit encore valoir false) : un second onglet qui
    // traiterait le même rapport reçoit une 404 et s'arrête là.
    report = await pb.collection("spy_reports").update<SpyReport>(reportId, { targetProcessed: true });
  } catch (err) {
    if (isNotFound(err)) return;
    throw err;
  }
  await createNotifications(uid, [
    {
      kind: "spy-detected",
      title: "Espionnage détecté !",
      message: `${report.spyPseudo} a tenté de t'espionner.`,
      createdAtMs: Date.now(),
      read: false,
    },
  ]);
}

/* =====================================================
   Actions de jeu

   PocketBase n'offre pas de transactions côté client : chaque action lit
   le joueur, applique la production accumulée (flushState), la modifie
   puis réécrit. Toutes les actions de cet onglet passent par une file
   unique pour qu'un heartbeat et un clic ne s'écrasent pas mutuellement.
===================================================== */

let actionQueue: Promise<unknown> = Promise.resolve();

/** Un seul traitement à la fois par rapport/don dans cet onglet : deux
 *  requêtes parties au même instant passeraient toutes deux la règle
 *  d'accès (PocketBase ne verrouille pas l'enregistrement entre la
 *  vérification et l'écriture). La règle, elle, bloque les passages
 *  suivants (autre onglet, rechargement). */
const inFlight = new Map<string, Promise<unknown>>();

function once<T>(key: string, task: () => Promise<T>): Promise<T> {
  const pending = inFlight.get(key) as Promise<T> | undefined;
  if (pending) return pending.then(() => null as T);
  const run = task().finally(() => inFlight.delete(key));
  inFlight.set(key, run);
  return run;
}

function serialized<T>(task: () => Promise<T>): Promise<T> {
  const run = actionQueue.then(task, task);
  actionQueue = run.catch(() => undefined);
  return run;
}

interface MutateOutput<T> {
  player: PlayerState;
  queues: QueuesState;
  notifications?: NewNotification[];
  result: T;
}

async function loadFlushed(uid: string) {
  let playerRecord: PbRecord;
  let queueRecord: PbRecord;
  try {
    [playerRecord, queueRecord] = await Promise.all([
      pb.collection("players").getOne<PbRecord>(uid),
      pb.collection("queues").getOne<PbRecord>(uid),
    ]);
  } catch (err) {
    if (isNotFound(err)) throw new GameActionError("Profil joueur introuvable.");
    throw err;
  }
  const preFlushPlayer = playerFromRecord(playerRecord);
  const queues = queuesFromRecord(queueRecord);
  if (!preFlushPlayer || !queues) throw new GameActionError("Profil joueur introuvable.");
  return { preFlushPlayer, flushed: flushState(preFlushPlayer, queues, Date.now()) };
}

async function savePlayerState(uid: string, player: PlayerState, queues: QueuesState) {
  await pb.collection("players").update(uid, gameFieldsOf(player));
  await pb.collection("queues").update(uid, { ...queues });
}

function runFlushedAction<T>(
  uid: string,
  mutate: (state: {
    player: PlayerState;
    queues: QueuesState;
    preFlushPlayer: PlayerState;
    flushNotifications: NewNotification[];
  }) => MutateOutput<T>,
): Promise<T> {
  return serialized(async () => {
    const { preFlushPlayer, flushed } = await loadFlushed(uid);
    const mutated = mutate({
      player: flushed.player,
      queues: flushed.queues,
      preFlushPlayer,
      flushNotifications: flushed.notifications,
    });
    await savePlayerState(uid, mutated.player, mutated.queues);
    await createNotifications(uid, [...flushed.notifications, ...(mutated.notifications ?? [])]);
    return mutated.result;
  });
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

  await runFlushedAction(fromUid, ({ player, queues }) => {
    for (const [res, amt] of entries) {
      if ((player.resources[res] ?? 0) < (amt ?? 0)) throw new GameActionError("Ressources insuffisantes.");
      player.resources[res] -= amt ?? 0;
    }
    return { player, queues, result: undefined };
  });

  await pb.collection("resource_gifts").create({
    fromUid,
    fromPseudo,
    toUid,
    toPseudo,
    resources: Object.fromEntries(entries),
    timestamp: Date.now(),
    claimed: false,
  });
}

export function subscribePendingGifts(uid: string, cb: (gifts: ResourceGift[]) => void): () => void {
  const filter = pb.filter("toUid = {:uid} && claimed = false", { uid });
  return subscribeList(
    "resource_gifts",
    pb.filter("toUid = {:uid}", { uid }),
    () => pb.collection("resource_gifts").getFullList<ResourceGift>({ filter }),
    cb,
  );
}

export function claimResourceGift(uid: string, giftId: string) {
  return once(`gift:${giftId}`, () => claimResourceGiftOnce(uid, giftId));
}

async function claimResourceGiftOnce(uid: string, giftId: string) {
  let gift: ResourceGift;
  try {
    // Marqué comme réclamé AVANT de créditer : la règle d'accès refuse un
    // second passage (claimed doit encore valoir false), donc un don ne
    // peut jamais être crédité deux fois, même depuis deux onglets.
    gift = await pb.collection("resource_gifts").update<ResourceGift>(giftId, { claimed: true });
  } catch (err) {
    if (isNotFound(err)) return;
    throw err;
  }
  if (gift.toUid !== uid) return;

  await runFlushedAction(uid, ({ player, queues }) => {
    for (const [res, amt] of Object.entries(gift.resources ?? {})) {
      const key = res as ResourceId;
      player.resources[key] = (player.resources[key] ?? 0) + ((amt as number) ?? 0);
    }
    return {
      player,
      queues,
      notifications: [
        {
          kind: "gift",
          title: "Ressources reçues !",
          message: `${gift.fromPseudo} t'a envoyé des ressources.`,
          createdAtMs: Date.now(),
          read: false,
        },
      ],
      result: undefined,
    };
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

export function initiateAttack(params: AttackParams) {
  const { attackerUid, attackerPseudo, targetUid, targetPseudo, fleet } = params;
  if (attackerUid === targetUid) return Promise.reject(new GameActionError("Tu ne peux pas t'attaquer toi-même !"));

  return serialized(async () => {
    const [{ flushed }, defenderRecord] = await Promise.all([
      loadFlushed(attackerUid),
      pb
        .collection("players")
        .getOne<PbRecord>(targetUid)
        .catch(() => null),
    ]);
    const defender = playerFromRecord(defenderRecord);
    if (!defender) throw new GameActionError("Ce joueur est introuvable.");
    const now = Date.now();
    const attacker = flushed.player;

    for (const [unitId, qty] of Object.entries(fleet)) {
      if ((attacker.units[unitId]?.count ?? 0) < qty) {
        throw new GameActionError("Tu ne possèdes plus assez d'unités pour cette flotte.");
      }
    }

    const combat = resolveCombat({
      attackerUnits: attacker.units,
      attackerTechLevels: attacker.techLevels,
      attackerRepairPct: getRepairPercent(attacker.buildings),
      fleet,
      defenderUnits: defender.units,
      defenderTechLevels: defender.techLevels,
      defenderRepairPct: getRepairPercent(defender.buildings),
      defenderResources: defender.resources,
    });

    for (const [unitId, lost] of Object.entries(combat.attackerLosses)) {
      if (attacker.units[unitId]) {
        attacker.units[unitId].count = Math.max(0, attacker.units[unitId].count - lost);
      }
    }
    if (combat.loot) {
      for (const [res, amt] of Object.entries(combat.loot)) {
        attacker.resources[res as ResourceId] = (attacker.resources[res as ResourceId] ?? 0) + (amt ?? 0);
      }
    }
    if (combat.outcome === "attacker_win") {
      attacker.victories += 1;
      applyXpDelta(attacker, 40, now);
    } else if (combat.outcome === "defender_win") {
      attacker.defeats += 1;
      applyXpDelta(attacker, -20, now);
    }

    await savePlayerState(attackerUid, attacker, flushed.queues);
    await createNotifications(attackerUid, flushed.notifications);

    const report: Omit<BattleReport, "id"> = {
      attackerUid,
      attackerPseudo,
      defenderUid: targetUid,
      defenderPseudo: targetPseudo,
      timestamp: now,
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
  });
}

export function subscribePendingBattleReports(uid: string, cb: (reports: BattleReport[]) => void): () => void {
  const filter = pb.filter("defenderUid = {:uid} && defenderProcessed = false", { uid });
  return subscribeList(
    "battle_reports",
    pb.filter("defenderUid = {:uid}", { uid }),
    () => pb.collection("battle_reports").getFullList<BattleReport>({ filter }),
    cb,
  );
}

export function subscribeBattleLog(uid: string, cb: (reports: BattleReport[]) => void): () => void {
  const filter = pb.filter("attackerUid = {:uid} || defenderUid = {:uid}", { uid });
  return subscribeList(
    "battle_reports",
    filter,
    async () => {
      const res = await pb.collection("battle_reports").getList<BattleReport>(1, 50, { filter, sort: "-timestamp" });
      return res.items;
    },
    cb,
  );
}

export function processBattleReportForDefender(uid: string, reportId: string): Promise<BattleReport | null> {
  return once(`battle:${reportId}`, () => processBattleReportOnce(uid, reportId));
}

async function processBattleReportOnce(uid: string, reportId: string): Promise<BattleReport | null> {
  let report: BattleReport;
  try {
    // Passage unique garanti par la règle d'accès (defenderProcessed doit
    // encore valoir false) : les pertes ne sont jamais appliquées deux fois.
    report = await pb.collection("battle_reports").update<BattleReport>(reportId, { defenderProcessed: true });
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
  if (report.defenderUid !== uid) return null;

  const outcomeLabel: Record<string, string> = {
    attacker_win: "Tu as perdu ce combat...",
    defender_win: "Attaque repoussée !",
    draw: "Match nul.",
  };

  await runFlushedAction(uid, ({ player, queues }) => {
    for (const [unitId, lost] of Object.entries(report.defenderLosses ?? {})) {
      if (player.units[unitId]) {
        player.units[unitId].count = Math.max(0, player.units[unitId].count - lost);
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

    for (const [res, amt] of Object.entries(report.loot ?? {})) {
      const key = res as ResourceId;
      player.resources[key] = Math.max(0, (player.resources[key] ?? 0) - (amt ?? 0));
    }

    return {
      player,
      queues,
      notifications: [
        {
          kind: "combat-defender",
          title: outcomeLabel[report.outcome] ?? "Rapport de combat",
          message: `Attaque de ${report.attackerPseudo}.`,
          createdAtMs: Date.now(),
          read: false,
        },
      ],
      result: undefined,
    };
  });

  return report;
}

/* =====================================================
   Suppression de compte
===================================================== */

export async function deletePlayerAccountData(uid: string, _pseudo: string) {
  const notifications = await pb
    .collection("notifications")
    .getFullList({ filter: pb.filter("player_id = {:uid}", { uid }), fields: "id" })
    .catch(() => []);
  for (const n of notifications) await pb.collection("notifications").delete(n.id).catch(() => {});
  await pb.collection("queues").delete(uid).catch(() => {});
  await pb.collection("players").delete(uid).catch(() => {});
}
