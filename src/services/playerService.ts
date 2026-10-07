import { pb, isNotFound, subscribeRecords, throttle } from "@/lib/pocketbase";
import { coalesce } from "@/lib/sharedSubscriptions";
import { defaultQueues } from "@/game/defaults";
import { withMissingBuildings } from "@/game/buildings";
import { GameActionError } from "@/game/errors";
import { rememberLastMission } from "@/store/lastMissionStore";
import type { AwaySummary, GameAction } from "@/game/actions";
import type { Fleet, FleetMission } from "@/game/fleets";
import type { DebrisField } from "@/game/debris";
import type { PhalanxFeatures, ScanReport } from "@/game/phalanx";
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
    buildPlan: (record.buildPlan as QueuesState["buildPlan"]) ?? [],
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
    // 6.14.49 : un 404 du jeu porte un message (« Flotte introuvable. ») ; seul un 404 sans message du jeu veut dire « hooks absents ».
    if (status === 404 && !message?.includes("joueur") && !message?.includes("introuvable")) {
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

/** Vrai si l'enregistrement reçu est identique au précédent (hors champs techniques). */
function sameRecordGuard() {
  let last = "";
  return (rec: PbRecord) => {
    const { updated: _u, created: _c, collectionId: _ci, collectionName: _cn, ...rest } = rec as PbRecord & Record<string, unknown>;
    const sig = JSON.stringify(rest);
    if (sig === last) return true;
    last = sig;
    return false;
  };
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

  // 5.26 : une écriture qui ne change rien au joueur (horodatage seul) ne redessine pas les écrans.
  const same = sameRecordGuard();
  const unsubscribe = subscribeRecords<PbRecord>("players", uid, (e) => {
    if (e.action === "delete") cb(null);
    else if (!same(e.record)) cb(playerFromRecord(e.record));
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

  const same = sameRecordGuard();
  const unsubscribe = subscribeRecords<PbRecord>("queues", uid, (e) => {
    if (e.action === "delete") cb(null);
    else if (!same(e.record)) cb(queuesFromRecord(e.record));
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
  // 5.26 : une rafale d'évènements (plusieurs écritures d'une même action) ne relit la liste qu'une fois.
  const trigger = throttleMs > 0 ? throttle(refresh, throttleMs) : coalesce(refresh, 120);
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

/** Une page de l'historique complet (page Journal d'empire). */
export async function fetchNotificationHistory(uid: string, page: number, perPage = 50) {
  const filter = pb.filter("player_id = {:uid}", { uid });
  const res = await pb.collection("notifications").getList<GameNotification>(page, perPage, { filter, sort: "-createdAtMs" });
  return { items: res.items, totalPages: res.totalPages, totalItems: res.totalItems };
}

export async function markNotificationRead(_uid: string, id: string) {
  await pb.collection("notifications").update(id, { read: true });
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
  /** v3.4 */
  ascensions?: number;
  ascendedAtMs?: number;
  /** v3.5 : colonies publiques. */
  planets?: { id: string; name: string }[];
  /** v4.2 : seigneur de guerre (identifiant du roster) et fin des vacances. */
  npc?: string;
  vacationUntilMs?: number;
  /** v4.6 : dernière activité réelle (synchro du navigateur), pour « en ligne ». */
  lastActiveMs?: number;
  /** v5.1 : avatar envoyé (nom de fichier sur la fiche publique). */
  avatar?: string;
  /** 6.0 : classe d'empire (identifiant). */
  empireClass?: string;
  /** 6.13.3 : nom de la lune (vide sans lune). */
  moonName?: string;
  /** 6.14.48 : niveau de la lune (0 sans lune), public (Q41). */
  moonLevel?: number;
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
    ascensions: (data.ascensions as number) || 0,
    ascendedAtMs: (data.ascendedAtMs as number) || undefined,
    planets: Array.isArray(data.planets) ? (data.planets as { id?: unknown; name?: unknown }[]).filter((c) => typeof c?.id === "string" && c.id).map((c) => ({ id: String(c.id), name: String(c.name ?? "Colonie") })) : [],
    npc: (data.npc as string) || undefined,
    vacationUntilMs: (data.vacationUntilMs as number) || undefined,
    lastActiveMs: (data.lastActiveMs as number) || undefined,
    avatar: (data.avatar as string) || undefined,
    empireClass: (data.empireClass as string) || undefined,
    moonName: (data.moonName as string) || undefined,
    moonLevel: (data.moonLevel as number) || 0,
  };
}

const LEADERBOARD_FIELDS = "id,pseudo,xp,seasonId,seasonXp,createdAtMs,lastDefeatAtMs,lastAttackAtMs,allianceId,activeTitle,ascensions,ascendedAtMs,planets,npc,vacationUntilMs,lastActiveMs,avatar,empireClass,moonName,moonLevel";

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

/** v4.7.1 : annonces fermées, gardées sur le compte. */
export function markAnnouncementsSeen(ids: string[]): Promise<{ seen: number }> {
  return act<{ seen: number }>({ type: "seenAnnouncements", ids });
}

async function act<T = void>(action: GameAction): Promise<T> {
  const res = await callGame<{ result: T }>("action", action as unknown as Record<string, unknown>);
  return res.result;
}

/** 5.26 : action de jeu brute (Planificateur : étapes d'un modèle déjà vérifiées par l'aperçu). */
export function performGameAction(action: GameAction) {
  return act(action);
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

/** v4.9 : file planifiée des bâtiments. */
export function planBuilding(buildingId: string) {
  return act({ type: "planBuilding", buildingId });
}

export function unplanBuilding(index: number) {
  return act({ type: "unplanBuilding", index });
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

export function claimAllRewards() {
  return act<Partial<Record<import("@/game/claimAll").ClaimAllAction["type"], number>>>({ type: "claimAll" });
}

export function claimGuide(stepId: string) {
  return act<{ resources: Partial<Record<import("@/types/game").ResourceId, number>>; amber: number }>({ type: "claimGuide", stepId });
}

export function hideGuide(hidden: boolean) {
  return act({ type: "hideGuide", hidden });
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
/** 5.16 : traité avec une faction (pacte de péage, escorte, embargo). */
export function signFactionTreaty(factionId: string, kind: "pact" | "escort" | "embargo") {
  return callGame<{ treaty: { kind: string; untilMs: number } }>("pirates", { action: "treaty", factionId, kind });
}

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

export interface PlayerFeats {
  titles: string[];
  achievements: number;
  victories: number;
  defeats: number;
  missions: number;
  expeditions: number;
  leviathanKills: number;
  warsWon: number;
  /** v3.9 : primes Kesh'Vaar. */
  bounties?: number;
  /** 5.26.3 : Ambre versée au pot commun (badge « Mécène »). */
  patron?: number;
  kesh?: { rank: number; frame: boolean; emblem: boolean; shieldUntilMs: number };
  /** v4.0 : bannière, emblème, devise, officiers et reliques. */
  showcase?: import("@/game/profile").PublicShowcase | null;
}

export interface PlayerSheet {
  entry: LeaderboardEntry;
  feats: PlayerFeats | null;
  seasons: SeasonResult[];
}

/** Fiche publique détaillée d'un joueur (v3.7) : faits d'armes et saisons. */
export async function fetchPlayerSheet(uid: string): Promise<PlayerSheet> {
  const [record, seasons] = await Promise.all([
    pb.collection("profiles").getOne<PbRecord>(uid, { fields: `${LEADERBOARD_FIELDS},feats` }),
    pb.collection("season_results").getList<SeasonResult>(1, 12, { filter: pb.filter('uid = {:uid} && kind != "alliance"', { uid }), sort: "-seasonId" }),
  ]);
  const feats = record.feats && typeof record.feats === "object" ? (record.feats as PlayerFeats) : null;
  return { entry: leaderboardEntryFromRecord(record), feats, seasons: seasons.items };
}

export function rerollContract(contractId: string) {
  return act({ type: "rerollContract", contractId });
}

export function tradeResources(_uid: string, sellId: ResourceId, buyId: ResourceId, amount: number) {
  return act<{ gained: number; tax: number; taxRes: ResourceId }>({ type: "trade", sellId, buyId, amount });
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
  options: { minutes?: number; hours?: number; formation?: string; targetPriority?: "defenses" | "ships"; capsules?: { assault?: number | true; decoy?: number | true }; delayMinutes?: number; fromBaseId?: string } = {},
): Promise<Fleet> {
  return launchFleet<Fleet>({ targetUid, fleet, mission, ...options });
}

/** Tout départ de flotte : appelle fleet/send et mémorise la requête pour « Relancer » (5.33, étendu en 6.3
 *  aux primes, boss, transports et livraisons). Le départ différé n'est pas rejoué. */
export async function launchFleet<T = Fleet>(body: Record<string, unknown>, targetLabel?: string, meta?: { bountyTier?: number }): Promise<T> {
  const sent = await callGame<T>("fleet/send", body);
  const { delayMinutes: _delay, ...again } = body;
  void _delay;
  const pseudo = (sent as { targetPseudo?: unknown } | null)?.targetPseudo;
  rememberLastMission({ body: again, mission: String(body.mission ?? "attack") as FleetMission, targetLabel: targetLabel ?? (typeof pseudo === "string" ? pseudo : ""), at: Date.now(), ...(meta ? { meta } : {}) });
  return sent;
}

export function recallFleet(fleetId: string): Promise<Fleet> {
  return callGame<Fleet>("fleet/recall", { fleetId });
}

/* ---------- 6.14.49 (É30-1c) : phalange et porte de saut lunaires ---------- */

/** Flotte d'attaque vue par la phalange (vue publique, percée pour la cible selon son niveau de lune). */
export interface PhalanxFleetLine {
  id: string;
  ownerUid: string;
  ownerPseudo: string;
  targetUid: string;
  targetPseudo: string;
  targetOwnerUid: string;
  departAtMs: number;
  arriveAtMs: number;
  formation: string;
  units: Record<string, number>;
  /** Puissance à afficher ; null : à recalculer sur `units`. */
  power: number | null;
  /** Flottes qui te visent seulement. */
  assault?: number | null;
  pierced?: { decoy: boolean; boosts: boolean };
  piercedText?: string | null;
  /** Attaques sur un allié seulement. */
  allyUid?: string;
  allyPseudo?: string;
}

export interface PhalanxStatus {
  enabled: boolean;
  level: number;
  range: number;
  features: PhalanxFeatures;
  scan: { readyAtMs: number; cooldownMs: number; cost: number };
  gate: { enabled: boolean; unlocked: boolean; minLevel: number; readyAtMs: number; cooldownMs: number | null; missions: string[] };
  incoming: PhalanxFleetLine[];
  allies: PhalanxFleetLine[];
  now: number;
}

/** État de la phalange : flottes qui te visent (percées), alliés menacés dans ta portée, recharges (lecture seule). */
export function fetchPhalanx(): Promise<PhalanxStatus> {
  return callGame<PhalanxStatus>("moon/phalanx");
}

/** Balayage d'un agresseur : énergie payée, recharge posée, rapport rendu (et gardé dans le Journal). */
export function scanAggressor(targetUid: string): Promise<{ report: ScanReport; cost: number; scanReadyAtMs: number; message: string }> {
  return callGame("moon/scan", { targetUid });
}

/** Porte de saut : la patrouille, la garnison ou la base avancée rentre tout de suite à quai. */
export function jumpFleet(fleetId: string): Promise<{ fleetId: string; status: string; gateReadyAtMs: number; message: string }> {
  return callGame("fleet/jump", { fleetId });
}

/** Mes flottes et celles qui foncent sur moi (la règle d'accès ne montre
 *  au défenseur que les flottes encore en approche). */
export function subscribeFleets(uid: string, cb: (fleets: Fleet[]) => void): () => void {
  const filter = pb.filter(
    '(ownerUid = {:uid} && status != "done") || (targetUid = {:uid} && status = "outbound" && (mission = "attack" || mission = "pirate")) || (targetOwnerUid = {:uid} && status = "outbound" && mission = "attack") || (targetUid = {:uid} && mission = "garrison" && status != "done")',
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

/** v3.4 : ascension (bâtiments au niveau 1 contre un bonus permanent). */
export function ascendEmpire() {
  return act<{ ascensions: number }>({ type: "ascend" });
}

/* v3.5 : colonies */

export function startColonization(name: string) {
  return act({ type: "colonize", name });
}

export function upgradeColonyBuilding(colonyId: string, buildingId: string) {
  return act({ type: "colonyUpgrade", colonyId, buildingId });
}

export function buildColonyDefense(colonyId: string, unitId: string, qty: number) {
  return act({ type: "colonyDefense", colonyId, unitId, qty });
}

export function renameColony(colonyId: string, name: string) {
  return act({ type: "colonyRename", colonyId, name });
}

export function setColonySpec(colonyId: string, spec: string) {
  return act({ type: "colonySpec", colonyId, spec });
}

export function chooseEmpireClass(classId: string) {
  return act({ type: "empireClass", classId });
}

/** 6.6 (revue AU1) : localiser le repaire d'une faction contre de la production. */
export function locateFactionLair(factionId: string) {
  return act({ type: "locateLair", factionId });
}

export function setColonyRoute(colonyId: string, everyHours: number, keepPct: number, direction: "collect" | "supply" = "collect") {
  return act({ type: "colonyRoute", colonyId, everyHours, keepPct, direction });
}

export function sendTransport(colonyId: string, direction: "deliver" | "collect", fleet: Record<string, number>, cargo: Partial<Record<import("@/types/game").ResourceId, number>>): Promise<Fleet> {
  return launchFleet<Fleet>({ colonyId, direction, fleet, cargo, mission: "transport" }, direction === "deliver" ? "vers la colonie" : "depuis la colonie");
}

/* ---------- v4.0 : État-major (officiers, reliques, Labo de synthèse) ---------- */

export function recruitCommander(commanderId: string, method: "amber" | "production") {
  return act<{ id: string }>({ type: "commanderRecruit", commanderId, method });
}

export function assignCommanders(ids: string[]) {
  return act({ type: "commanderAssign", ids });
}

export function trainCommander(commanderId: string) {
  return act<{ level: number }>({ type: "commanderTrain", commanderId });
}

export function craftCapsule(capsule: string, level: number) {
  return act<{ type: string; level: number; endsAtMs: number }>({ type: "synthCraft", capsule, level });
}

export function activateCapsule(capsule: string, level?: number) {
  return act<{ pct: number }>({ type: "synthActivate", capsule, level });
}

export function equipRelic(slot: number, relicId: string | null) {
  return act({ type: "relicEquip", slot, relicId });
}

export function fuseRelics(template: string, rarity: string) {
  return act<import("@/game/relics").RelicItem>({ type: "relicFuse", template, rarity });
}

export function recycleRelic(relicId: string) {
  return act<{ amber: number }>({ type: "relicRecycle", relicId });
}

/** 5.26.2 : indice d'un succès secret (Ambre). */
export function buyAchievementHint(achievementId: string) {
  return act<{ hint: string }>({ type: "achievementHint", achievementId });
}

/** 5.26 : modules de vaisseaux. */
export function buildShipModule(moduleId: string) {
  return act<import("@/game/modules").ModuleItem>({ type: "moduleBuild", moduleId });
}

export function mountShipModule(moduleId: string, cls: string, slot: number) {
  return act({ type: "moduleMount", moduleId, cls, slot });
}

export function unmountShipModule(cls: string, slot: number) {
  return act({ type: "moduleUnmount", cls, slot });
}

export function recycleShipModule(moduleId: string) {
  return act<{ amber: number }>({ type: "moduleRecycle", moduleId });
}

/** 5.26.2 : archiver une conversation privée (elle revient au prochain message reçu). */
export function archiveConversation(other: string, archived: boolean) {
  return act({ type: "chatArchive", with: other, archived });
}

/** 5.26.2 : fusion de trois plans identiques, préréglages de montage. */
export function fuseShipModules(moduleIds: string[]) {
  return act<import("@/game/modules").ModuleItem>({ type: "moduleFuse", moduleIds });
}

export function saveModulePresetAction(name: string) {
  return act({ type: "modulePresetSave", name });
}

export function applyModulePresetAction(index: number) {
  return act<{ missing: number }>({ type: "modulePresetApply", index });
}

export function deleteModulePresetAction(index: number) {
  return act({ type: "modulePresetDelete", index });
}

/** v5.1 : talents d'Ascension. */
export function learnTalent(talentId: string) {
  return act({ type: "talentLearn", talentId });
}

/** 5.21 : termine un lot de réparation (ou toute la file) contre de l'Ambre. */
export function rushWorkshop(jobId?: string) {
  return act<{ amber: number; units: Record<string, number>; ready: Record<string, number> }>({ type: "workshopRush", ...(jobId ? { jobId } : {}) });
}

/** 5.28 : remet en service les vaisseaux prêts de la Cale sèche (un type, ou tous), dans les places libres du hangar. */
export function dockCommission(unitId?: string) {
  return act<{ units: Record<string, number> }>({ type: "dockCommission", ...(unitId ? { unitId } : {}) });
}

/** 5.28 (palier Triage) : démantèle des vaisseaux de la Cale sèche ou de l'Atelier. */
export function dockScrap(unitId: string, qty: number) {
  return act<{ count: number; refund: { scrap: number; energy: number } }>({ type: "dockScrap", unitId, qty });
}

/** 5.28 : réglages du Triage et de l'ordre de réparation. */
export function dockSettings(settings: { policy?: string; priority?: string }) {
  return act({ type: "dockSettings", ...settings });
}

export function resetTalents() {
  return act({ type: "talentReset" });
}

/** v5.3 : récompense de la série de connexion du jour. */
export function claimStreak() {
  return act<{ count: number; resources: Partial<Record<ResourceId, number>>; amber: number; tokens: number; chest: import("@/game/streak").StreakChest | null }>({ type: "streakClaim" });
}

export function saveProfileStyle(style: { banner?: string; emblem?: string; motto?: string; pinned?: string[]; planet?: Partial<import("@/game/planetLook").PlanetLook> }) {
  return act<import("@/game/profile").ProfileStyle>({ type: "setProfileStyle", style });
}

/* ---------- v4.1 : passe de saison ---------- */

/** v4.2 : retour de vacances (anticipé, après 48 h). */
export function endVacation() {
  return act<boolean>({ type: "vacationEnd" });
}

/** v4.3 : épisode des Chroniques terminé (+40 points de passe). */
export function claimChronicleEpisode(episode: number) {
  return act<{ points: number; gained?: string[]; chapter?: boolean }>({ type: "chronicleClaim", episode });
}

/** 5.15.12 : réclame une mission du jour. */
export function claimDailyMissionAction(index: number) {
  return act<{ tokens: number; bonus: boolean }>({ type: "dailyClaim", index });
}

export function claimPassTier(tier: number) {
  return act<{ gained: string[] }>({ type: "passClaim", tier });
}

/** v4.7 : annule un chantier (remboursement calculé par le serveur). */
export function cancelJob(target: import("@/game/cancel").CancelTarget) {
  return act<import("@/game/cancel").CancelQuote>({ type: "cancel", target });
}

/** v5.1 : changement de pseudo unique (10 Ambre). Le compte de connexion suit. */
export async function renamePlayer(pseudo: string): Promise<{ pseudo: string }> {
  const out = await callGame<{ pseudo: string }>("rename", { pseudo });
  await pb.collection("users").authRefresh().catch(() => undefined);
  return out;
}

/** 5.15.12 : mon classement d'une saison close (rapport de fin de saison). */
export async function fetchMySeasonResult(uid: string, seasonId: string): Promise<SeasonResult | null> {
  try {
    return await pb.collection("season_results").getFirstListItem<SeasonResult>(pb.filter('uid = {:uid} && seasonId = {:s} && kind != "alliance"', { uid, s: seasonId }));
  } catch {
    return null;
  }
}

/** 5.16 : planète personnalisée d'un joueur (vitrine publique), gardée en cache pour la session. */
const publicPlanets = new Map<string, Promise<import("@/game/planetLook").PlanetLook | null>>();
export function fetchPublicPlanet(uid: string): Promise<import("@/game/planetLook").PlanetLook | null> {
  let p = publicPlanets.get(uid);
  if (!p) {
    p = pb
      .collection("profiles")
      .getOne<PbRecord>(uid, { fields: "feats" })
      .then((r) => ((r.feats as PlayerFeats | null)?.showcase as { planet?: import("@/game/planetLook").PlanetLook } | undefined)?.planet ?? null)
      .catch(() => null);
    publicPlanets.set(uid, p);
  }
  return p;
}

/** 6.14.0 : améliorer sa lune (achat immédiat). */
export function upgradeMoon() {
  return act({ type: "moonUpgrade" });
}
