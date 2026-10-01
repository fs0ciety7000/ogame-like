import { pb, isNotFound, subscribeRecords, throttle } from "@/lib/pocketbase";
import { defaultQueues } from "@/game/defaults";
import type { NewNotification } from "@/game/flush";
import { withMissingBuildings } from "@/game/buildings";
import { GameActionError } from "@/game/errors";
import type { AwaySummary, GameAction } from "@/game/actions";
import type { Fleet, FleetMission } from "@/game/fleets";
import type { DebrisField } from "@/game/debris";
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
  SeasonResult,
} from "@/types/game";

export { GameActionError };
export type { AwaySummary };

/* =====================================================
   Conversion enregistrements PocketBase <-> état du jeu

   Un joueur = un enregistrement `players` dont l'id est celui de son
   compte `users`, et un enregistrement `queues` (files d'attente) avec ce
   même id. Voir pocketbase/pb_schema.json.
===================================================== */

type PbRecord = Record<string, unknown> & { id: string };

function playerFromRecord(record: PbRecord | null | undefined): PlayerState | null {
  if (!record || !record.resources || !record.buildings) return null;
  const player = { ...record, uid: record.id } as unknown as PlayerState;
  return {
    ...player,
    // Bâtiments ajoutés depuis l'administration après la création du joueur.
    buildings: withMissingBuildings(player.buildings, player.resources),
    units: player.units ?? {},
    techLevels: player.techLevels ?? {},
    resourceHistory: player.resourceHistory ?? [],
    unlockedAchievements: player.unlockedAchievements ?? [],
  };
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
   Appels au serveur de jeu

   Toutes les actions sont arbitrées par le serveur
   (pocketbase/pb_hooks/cosmic.pb.js) : il relit le joueur, applique la
   production accumulée, vérifie l'action et écrit le résultat dans une
   transaction. Le navigateur n'écrit plus lui-même ses ressources,
   bâtiments, unités ni son XP.
===================================================== */

/** Appel d'une route du jeu. Une règle non respectée (400) devient une
 *  GameActionError avec le message du serveur, à afficher au joueur. */
export async function callGame<T>(path: string, body: Record<string, unknown> = {}): Promise<T> {
  try {
    return await pb.send<T>(`/api/cosmic/${path}`, { method: "POST", body });
  } catch (err) {
    const status = (err as { status?: number })?.status;
    const message = (err as { response?: { message?: string } })?.response?.message;
    if (status === 404 && !message?.includes("joueur")) {
      throw new GameActionError("Serveur de jeu indisponible : les hooks ne sont pas installés (voir README).");
    }
    if (status === 400 || status === 404) throw new GameActionError(message || "Action impossible.");
    throw err;
  }
}

/** Un seul traitement à la fois par rapport/don dans cet onglet (évite
 *  d'envoyer deux fois la même requête depuis des abonnements concurrents). */
const inFlight = new Map<string, Promise<unknown>>();

function once<T>(key: string, task: () => Promise<T>): Promise<T> {
  const pending = inFlight.get(key) as Promise<T> | undefined;
  if (pending) return pending.then(() => null as T);
  const run = task().finally(() => inFlight.delete(key));
  inFlight.set(key, run);
  return run;
}

/* =====================================================
   Création / lecture
===================================================== */

/** Crée le profil du joueur connecté (côté serveur) s'il n'existe pas. */
export async function ensurePlayerDoc(_uid: string, _pseudo: string) {
  await callGame("init");
}

export async function setPlayerPseudo(uid: string, pseudo: string) {
  await pb.collection("players").update(uid, { pseudo });
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
      const res = await pb.collection("notifications").getList<GameNotification>(1, 60, { filter, sort: "-createdAtMs" });
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
  createdAtMs?: number;
  lastDefeatAtMs?: number;
  lastAttackAtMs?: number;
  allianceId?: string;
  activeTitle?: string;
}

function leaderboardEntryFromRecord(data: PbRecord): LeaderboardEntry {
  return {
    uid: data.id,
    pseudo: (data.pseudo as string) || "Joueur inconnu",
    xp: (data.xp as number) || 0,
    seasonId: (data.seasonId as string) || null,
    seasonXp: (data.seasonXp as number) || 0,
    createdAtMs: (data.createdAtMs as number) || undefined,
    lastDefeatAtMs: (data.lastDefeatAtMs as number) || undefined,
    lastAttackAtMs: (data.lastAttackAtMs as number) || undefined,
    allianceId: (data.allianceId as string) || undefined,
    activeTitle: (data.activeTitle as string) || undefined,
  };
}

const LEADERBOARD_FIELDS = "id,pseudo,xp,seasonId,seasonXp,createdAtMs,lastDefeatAtMs,lastAttackAtMs,allianceId,activeTitle";

/** Classement "total", trié côté serveur par XP, lu dans les fiches
 *  publiques (collection profiles, tenue à jour par le serveur) : la fiche
 *  complète d'un autre joueur n'est pas lisible. Rechargement limité à une
 *  fois toutes les 10 s. */
export function subscribeLeaderboard(cb: (players: LeaderboardEntry[]) => void): () => void {
  return subscribeList(
    "profiles",
    "",
    async () => {
      const res = await pb.collection("profiles").getList<PbRecord>(1, 100, { sort: "-xp", fields: LEADERBOARD_FIELDS });
      return res.items.map(leaderboardEntryFromRecord);
    },
    cb,
    10_000,
  );
}

export async function listAllPlayers(): Promise<LeaderboardEntry[]> {
  const res = await pb.collection("profiles").getFullList<PbRecord>({ sort: "-xp", fields: LEADERBOARD_FIELDS });
  return res.map(leaderboardEntryFromRecord);
}

/* =====================================================
   Espionnage et débris (v1.7)
===================================================== */

/** Dernier rapport d'espionnage que j'ai obtenu sur ce joueur. */
export async function fetchLatestSpyReport(spyUid: string, targetUid: string): Promise<SpyReport | null> {
  const res = await pb.collection("spy_reports").getList<SpyReport>(1, 1, {
    filter: pb.filter("spyUid = {:spyUid} && targetUid = {:targetUid}", { spyUid, targetUid }),
    sort: "-timestamp",
  });
  return res.items[0] ?? null;
}

export async function fetchSpyReport(id: string): Promise<SpyReport | null> {
  try {
    return await pb.collection("spy_reports").getOne<SpyReport>(id);
  } catch {
    return null;
  }
}

/** Mes rapports d'espionnage et les tentatives détectées contre moi. */
export function subscribeSpyLog(uid: string, cb: (reports: SpyReport[]) => void): () => void {
  return subscribeList(
    "spy_reports",
    "",
    () =>
      pb
        .collection("spy_reports")
        .getList<SpyReport>(1, 30, { filter: pb.filter("spyUid = {:uid} || (targetUid = {:uid} && detected = true)", { uid }), sort: "-timestamp" })
        .then((res) => res.items),
    cb,
  );
}

/** Champs de débris encore présents dans la galaxie. */
export function subscribeDebrisFields(cb: (fields: DebrisField[]) => void): () => void {
  return subscribeList(
    "debris_fields",
    "",
    () => pb.collection("debris_fields").getFullList<DebrisField>({ filter: pb.filter("expiresAtMs > {:now}", { now: Date.now() }) }),
    cb,
  );
}

/* =====================================================
   Actions de jeu
===================================================== */

async function act<T = void>(action: GameAction): Promise<T> {
  const res = await callGame<{ result: T }>("action", action as unknown as Record<string, unknown>);
  return res.result;
}

/** Rattrapage de la production (heartbeat, retour sur l'onglet). */
export function syncPlayer(_uid: string, playtimeDeltaSeconds = 0): Promise<AwaySummary> {
  return act<AwaySummary>({ type: "sync", playtimeDeltaSeconds });
}

export function unlockBuilding(_uid: string, buildingId: BuildingId) {
  return act({ type: "unlockBuilding", buildingId });
}

export function startBuildingUpgrade(_uid: string, buildingId: BuildingId) {
  return act({ type: "upgradeBuilding", buildingId });
}

export function enqueueUnitBuild(_uid: string, unitId: string, qty: number) {
  return act({ type: "buildUnits", unitId, qty });
}

export function sellUnit(_uid: string, unitId: string, qty: number) {
  return act({ type: "sellUnits", unitId, qty });
}

export function startResearch(_uid: string, techId: string) {
  return act({ type: "research", techId });
}

export function startMission(_uid: string, missionKey: string) {
  return act({ type: "mission", missionKey });
}

export function claimOnboarding(stepId: string) {
  return act<Partial<Record<import("@/types/game").ResourceId, number>>>({ type: "claimOnboarding", stepId });
}

export function setBasePosture(posture: string) {
  return act<string>({ type: "setPosture", posture });
}

export function hideOnboarding(hidden: boolean) {
  return act({ type: "hideOnboarding", hidden });
}

export function claimContract(contractId: string) {
  return act<import("@/game/contracts").ClaimResult>({ type: "claimContract", contractId });
}

/** Réponse à l'ultimatum en cours (toutes factions) : payer le tribut ou refuser (raid). */
export function answerPirateUltimatum(answer: "pay" | "refuse") {
  return callGame<{ answer: string; raid: { power: number; arriveAtMs: number } | null }>("pirates", { answer });
}

export function setActiveTitle(title: string) {
  return act({ type: "setTitle", title });
}

/** Palmarès : résultats des saisons terminées (les plus récentes d'abord). */
export async function fetchSeasonResults(): Promise<SeasonResult[]> {
  return pb.collection("season_results").getFullList<SeasonResult>({ sort: "-seasonId,rank", filter: 'rank <= 10 && (kind != "alliance" || rank = 1)' });
}

export function rerollContract(contractId: string) {
  return act({ type: "rerollContract", contractId });
}

export function tradeResources(_uid: string, sellId: ResourceId, buyId: ResourceId, amount: number) {
  return act<number>({ type: "trade", sellId, buyId, amount });
}

/* =====================================================
   Échanges entre joueurs
===================================================== */

/** Transfert immédiat : le destinataire est crédité par le serveur. */
export async function sendResourceGift(params: {
  fromUid: string;
  fromPseudo: string;
  toUid: string;
  toPseudo: string;
  resources: Partial<Resources>;
}) {
  const { fromUid, toUid, resources } = params;
  if (fromUid === toUid) throw new GameActionError("Tu ne peux pas t'envoyer des ressources à toi-même !");
  const positive = Object.fromEntries(Object.entries(resources).filter(([, v]) => (v ?? 0) > 0));
  if (Object.keys(positive).length === 0) throw new GameActionError("Sélectionne au moins une ressource à envoyer.");
  await callGame("gift", { toUid, resources: positive });
}

/** Dons envoyés avec l'ancien système (débités à l'envoi, pas encore crédités). */
export function subscribePendingGifts(uid: string, cb: (gifts: ResourceGift[]) => void): () => void {
  const filter = pb.filter("toUid = {:uid} && claimed = false", { uid });
  return subscribeList(
    "resource_gifts",
    pb.filter("toUid = {:uid}", { uid }),
    () => pb.collection("resource_gifts").getFullList<ResourceGift>({ filter }),
    cb,
  );
}

export function claimResourceGift(_uid: string, giftId: string) {
  return once(`gift:${giftId}`, () => callGame("gift/claim", { giftId }));
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

/** Décollage d'une flotte d'attaque : le combat a lieu à son arrivée,
 *  résolu par le serveur (voir src/game/fleets.ts). */
export async function sendFleet(
  targetUid: string,
  fleet: Record<string, number>,
  mission: FleetMission = "attack",
  options: { minutes?: number; hours?: number; formation?: string } = {},
): Promise<Fleet> {
  return callGame<Fleet>("fleet/send", { targetUid, fleet, mission, ...options });
}

export function recallFleet(fleetId: string): Promise<Fleet> {
  return callGame<Fleet>("fleet/recall", { fleetId });
}

/** Mes flottes et celles qui foncent sur moi (la règle d'accès ne montre
 *  au défenseur que les flottes encore en approche). */
export function subscribeFleets(uid: string, cb: (fleets: Fleet[]) => void): () => void {
  const filter = pb.filter(
    '(ownerUid = {:uid} && status != "done") || (targetUid = {:uid} && status = "outbound" && (mission = "attack" || mission = "pirate")) || (targetUid = {:uid} && mission = "garrison" && status != "done")',
    { uid },
  );
  return subscribeList(
    "fleets",
    "",
    () => pb.collection("fleets").getFullList<Fleet>({ filter, sort: "arriveAtMs" }),
    cb,
  );
}

export async function fetchBattleReport(id: string): Promise<BattleReport | null> {
  try {
    return await pb.collection("battle_reports").getOne<BattleReport>(id);
  } catch {
    return null;
  }
}

/** Mes attaques récentes (pour afficher le délai avant de pouvoir
 *  réattaquer une même cible) : combats et départs de flottes. */
export async function fetchMyRecentAttacks(uid: string, sinceMs: number): Promise<Record<string, number>> {
  const [reports, fleets] = await Promise.all([
    pb.collection("battle_reports").getFullList<BattleReport>({
      filter: pb.filter("attackerUid = {:uid} && timestamp > {:since}", { uid, since: sinceMs }),
      fields: "defenderUid,timestamp",
    }),
    pb
      .collection("fleets")
      .getFullList<Fleet>({
        filter: pb.filter('ownerUid = {:uid} && departAtMs > {:since} && mission = "attack"', { uid, since: sinceMs }),
        fields: "targetUid,departAtMs",
      })
      .catch(() => [] as Fleet[]),
  ]);
  const last: Record<string, number> = {};
  for (const r of reports) last[r.defenderUid] = Math.max(last[r.defenderUid] ?? 0, r.timestamp);
  for (const f of fleets) last[f.targetUid] = Math.max(last[f.targetUid] ?? 0, f.departAtMs);
  return last;
}

/** Rapports de combat que le défenseur n'a pas encore vus. */
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

/** Marque le rapport comme vu (une seule fois) et le renvoie pour
 *  l'afficher. Les pertes ont déjà été appliquées par le serveur. */
export function processBattleReportForDefender(_uid: string, reportId: string): Promise<BattleReport | null> {
  return once(`battle:${reportId}`, async () => {
    const res = await callGame<{ report: BattleReport | null }>("report/seen", { reportId });
    return res.report;
  });
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

/** Part des joueurs ayant obtenu chaque succès (v2.3). */
export async function fetchAchievementRates(): Promise<{ players: number; counts: Record<string, number> }> {
  try {
    return await pb.send("/api/cosmic/achievements", { method: "GET" });
  } catch {
    return { players: 0, counts: {} };
  }
}
