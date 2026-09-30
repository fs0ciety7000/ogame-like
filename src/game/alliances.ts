import { GameActionError } from "@/game/errors";
import { RESOURCE_LIST } from "@/game/resources";
import type { NewNotification } from "@/game/flush";
import type { Alliance, AllianceLog, PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   Alliances (v1.9) : adhésion limitée, trésor commun, recherches qui
   profitent à tous les membres, garnisons et rapports partagés.

   Fonctions pures : le serveur (pb_hooks) lit l'alliance et les joueurs
   concernés, applique l'action puis écrit le résultat dans une transaction.
===================================================== */

export interface AllianceResearchDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  /** Valeur de l'effet par niveau. */
  perLevel: number;
  maxLevel: number;
}

export const ALLIANCE_RULES = {
  maxMembers: 6,
  /** Versement : au plus cette part du stock d'une ressource du trésor. */
  distributionMaxPct: 0.2,
  /** Versements par jour (UTC) pour toute l'alliance. */
  distributionsPerDay: 10,
  /** Coût du niveau n : base × croissance^(n−1). */
  researchCommonCost: 50_000_000,
  researchRareCost: 1_000_000,
  researchGrowth: 2,
  researchHoursPerLevel: 12,
  /** Garnison : part de la puissance d'attaque engagée en défense. */
  garrisonPower: 0.5,
  garrisonMinHours: 1,
  garrisonMaxHours: 24,
  maxGarrisonsPerHost: 3,
  /** Onglet Renseignement : rapports des membres sur cette période. */
  sharedReportsDays: 7,
  sharedReportsMax: 50,
  /** Saison : somme des XP de saison des N meilleurs membres. */
  seasonTopMembers: 5,
  seasonRewardHours: 8,
  seasonTitle: "Allié champion",
  researches: [
    { id: "logistique", name: "Logistique fédérée", emoji: "🛰️", description: "Réduit le temps de vol de toutes les flottes des membres.", perLevel: 0.05, maxLevel: 5 },
    { id: "industrie", name: "Industrie coopérative", emoji: "🏭", description: "Augmente la production de toutes les ressources des membres.", perLevel: 0.03, maxLevel: 5 },
    { id: "brouillage", name: "Réseau de brouillage", emoji: "📡", description: "Ajoute des points de contre-espionnage à chaque membre.", perLevel: 1, maxLevel: 5 },
    { id: "bouclier", name: "Bouclier fédéral", emoji: "🛡️", description: "Renforce le bouclier des bases des membres, au-delà du plafond habituel.", perLevel: 0.01, maxLevel: 5 },
  ] as AllianceResearchDef[],
};

export type AllianceRole = "founder" | "officer" | "member";
export type AllianceLevels = Record<string, number>;

const RESOURCE_IDS = new Set<string>(RESOURCE_LIST.map((r) => r.id));

export function findAllianceResearch(id: string): AllianceResearchDef | undefined {
  return ALLIANCE_RULES.researches.find((r) => r.id === id);
}

export function allianceRole(alliance: Pick<Alliance, "createdBy" | "members" | "roles">, uid: string): AllianceRole | null {
  if (!alliance.members?.includes(uid)) return null;
  if (alliance.createdBy === uid) return "founder";
  return alliance.roles?.[uid] === "officer" ? "officer" : "member";
}

function level(levels: AllianceLevels | undefined | null, id: string): number {
  const def = findAllianceResearch(id);
  return Math.max(0, Math.min(def?.maxLevel ?? 0, Math.floor(Number(levels?.[id]) || 0)));
}

/* ---------- bonus des recherches (appliqués aux membres) ---------- */

/** Multiplicateur du temps de vol (0,75 = −25 %). */
export function allianceFlightFactor(levels: AllianceLevels | undefined | null): number {
  return Math.max(0.1, 1 - level(levels, "logistique") * (findAllianceResearch("logistique")?.perLevel ?? 0));
}

/** Multiplicateur de production (1,15 = +15 %). */
export function allianceProductionFactor(levels: AllianceLevels | undefined | null): number {
  return 1 + level(levels, "industrie") * (findAllianceResearch("industrie")?.perLevel ?? 0);
}

export function allianceCounterSpy(levels: AllianceLevels | undefined | null): number {
  return level(levels, "brouillage") * (findAllianceResearch("brouillage")?.perLevel ?? 0);
}

/** Bouclier supplémentaire (0,05 = +5 points), qui repousse aussi le plafond. */
export function allianceShieldBonus(levels: AllianceLevels | undefined | null): number {
  return level(levels, "bouclier") * (findAllianceResearch("bouclier")?.perLevel ?? 0);
}

/* ---------- création et membres ---------- */

export function newAlliance(founder: { uid: string; pseudo: string }, nameIn: string, tagIn: string, now: number): Omit<Alliance, "id"> {
  const name = String(nameIn ?? "").trim();
  const tag = String(tagIn ?? "").trim().toUpperCase();
  if (name.length < 3 || name.length > 40) throw new GameActionError("Le nom doit contenir entre 3 et 40 caractères.");
  if (!/^[A-Z0-9]{2,5}$/.test(tag)) throw new GameActionError("Le tag doit contenir 2 à 5 lettres ou chiffres.");
  return {
    name,
    tag,
    createdBy: founder.uid,
    createdAtMs: now,
    members: [founder.uid],
    memberPseudos: { [founder.uid]: founder.pseudo },
    roles: {},
    treasury: {},
    research: {},
    activeResearch: null,
    distributions: { day: "", count: 0 },
  };
}

export function addMember(alliance: Alliance, player: { uid: string; pseudo: string }): Alliance {
  if (alliance.members.includes(player.uid)) throw new GameActionError("Tu es déjà membre de cette alliance.");
  if (alliance.members.length >= ALLIANCE_RULES.maxMembers) throw new GameActionError(`Cette alliance est complète (${ALLIANCE_RULES.maxMembers} membres).`);
  return { ...alliance, members: [...alliance.members, player.uid], memberPseudos: { ...alliance.memberPseudos, [player.uid]: player.pseudo } };
}

/** Départ d'un membre. Le fondateur qui part passe la main à un officier (ou
 *  au plus ancien membre) ; le dernier membre dissout l'alliance (null). */
export function removeMember(alliance: Alliance, uid: string): Alliance | null {
  if (!alliance.members.includes(uid)) throw new GameActionError("Ce joueur n'est pas membre de l'alliance.");
  const members = alliance.members.filter((m) => m !== uid);
  if (members.length === 0) return null;
  const memberPseudos = { ...alliance.memberPseudos };
  delete memberPseudos[uid];
  const roles = { ...(alliance.roles ?? {}) };
  delete roles[uid];
  let createdBy = alliance.createdBy;
  if (createdBy === uid) {
    createdBy = members.find((m) => roles[m] === "officer") ?? members[0];
    delete roles[createdBy];
  }
  return { ...alliance, members, memberPseudos, roles, createdBy };
}

export function kickMember(alliance: Alliance, actorUid: string, targetUid: string): Alliance {
  if (allianceRole(alliance, actorUid) !== "founder") throw new GameActionError("Seul le fondateur peut exclure un membre.");
  if (actorUid === targetUid) throw new GameActionError("Tu ne peux pas t'exclure toi-même.");
  return removeMember(alliance, targetUid)!;
}

export function setOfficer(alliance: Alliance, actorUid: string, targetUid: string, officer: boolean): Alliance {
  if (allianceRole(alliance, actorUid) !== "founder") throw new GameActionError("Seul le fondateur gère les officiers.");
  if (!alliance.members.includes(targetUid) || targetUid === alliance.createdBy) throw new GameActionError("Ce joueur ne peut pas changer de rôle.");
  const roles = { ...(alliance.roles ?? {}) };
  if (officer) roles[targetUid] = "officer";
  else delete roles[targetUid];
  return { ...alliance, roles };
}

/* ---------- trésor ---------- */

/** Montants valides (entiers > 0, ressources connues). */
export function parseAmounts(raw: unknown): Partial<Record<ResourceId, number>> {
  const out: Partial<Record<ResourceId, number>> = {};
  for (const [res, value] of Object.entries((raw as Record<string, unknown>) ?? {})) {
    const n = Math.floor(Number(value));
    if (!RESOURCE_IDS.has(res) || !Number.isFinite(n) || n <= 0) continue;
    out[res as ResourceId] = n;
  }
  if (Object.keys(out).length === 0) throw new GameActionError("Indique au moins un montant.");
  return out;
}

/** Dépôt : le joueur (production rattrapée) verse au trésor. */
export function deposit(alliance: Alliance, player: PlayerState, amounts: Partial<Record<ResourceId, number>>): Alliance {
  if (!alliance.members.includes(player.uid)) throw new GameActionError("Tu n'es pas membre de cette alliance.");
  const treasury = { ...(alliance.treasury ?? {}) };
  for (const [res, amount] of Object.entries(amounts) as [ResourceId, number][]) {
    if ((player.resources[res] ?? 0) < amount) throw new GameActionError("Ressources insuffisantes pour ce dépôt.");
  }
  for (const [res, amount] of Object.entries(amounts) as [ResourceId, number][]) {
    player.resources[res] = (player.resources[res] ?? 0) - amount;
    treasury[res] = (treasury[res] ?? 0) + amount;
  }
  return { ...alliance, treasury };
}

function utcDay(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

/** Versement du trésor à un membre, par le fondateur ou un officier. */
export function distribute(
  alliance: Alliance,
  actorUid: string,
  targetUid: string,
  amounts: Partial<Record<ResourceId, number>>,
  now: number,
): Alliance {
  const role = allianceRole(alliance, actorUid);
  if (role !== "founder" && role !== "officer") throw new GameActionError("Seuls le fondateur et les officiers peuvent verser le trésor.");
  if (!alliance.members.includes(targetUid)) throw new GameActionError("Ce joueur n'est pas membre de l'alliance.");
  const day = utcDay(now);
  const count = alliance.distributions?.day === day ? alliance.distributions.count : 0;
  if (count >= ALLIANCE_RULES.distributionsPerDay) throw new GameActionError(`Limite de ${ALLIANCE_RULES.distributionsPerDay} versements par jour atteinte.`);
  const treasury = { ...(alliance.treasury ?? {}) };
  for (const [res, amount] of Object.entries(amounts) as [ResourceId, number][]) {
    const max = Math.floor((treasury[res] ?? 0) * ALLIANCE_RULES.distributionMaxPct);
    if (amount > max) {
      throw new GameActionError(`Un versement est limité à ${Math.round(ALLIANCE_RULES.distributionMaxPct * 100)} % du stock du trésor (${max} pour cette ressource).`);
    }
  }
  for (const [res, amount] of Object.entries(amounts) as [ResourceId, number][]) treasury[res] = (treasury[res] ?? 0) - amount;
  return { ...alliance, treasury, distributions: { day, count: count + 1 } };
}

/* ---------- recherches ---------- */

export function allianceResearchCost(nextLevel: number): Partial<Record<ResourceId, number>> {
  const factor = Math.pow(ALLIANCE_RULES.researchGrowth, Math.max(0, nextLevel - 1));
  const cost: Partial<Record<ResourceId, number>> = {};
  for (const r of RESOURCE_LIST) cost[r.id] = Math.round((r.rarity === "rare" ? ALLIANCE_RULES.researchRareCost : ALLIANCE_RULES.researchCommonCost) * factor);
  return cost;
}

export function allianceResearchSeconds(nextLevel: number): number {
  return Math.round(ALLIANCE_RULES.researchHoursPerLevel * nextLevel * 3600);
}

export function startAllianceResearch(alliance: Alliance, actorUid: string, researchId: string, now: number): Alliance {
  const role = allianceRole(alliance, actorUid);
  if (role !== "founder" && role !== "officer") throw new GameActionError("Seuls le fondateur et les officiers lancent les recherches.");
  const def = findAllianceResearch(researchId);
  if (!def) throw new GameActionError("Recherche inconnue.");
  if (alliance.activeResearch) throw new GameActionError("Une recherche d'alliance est déjà en cours.");
  const next = level(alliance.research, def.id) + 1;
  if (next > def.maxLevel) throw new GameActionError("Niveau maximum atteint.");
  const cost = allianceResearchCost(next);
  const treasury = { ...(alliance.treasury ?? {}) };
  for (const [res, amount] of Object.entries(cost) as [ResourceId, number][]) {
    if ((treasury[res] ?? 0) < amount) throw new GameActionError("Le trésor ne suffit pas pour cette recherche.");
  }
  for (const [res, amount] of Object.entries(cost) as [ResourceId, number][]) treasury[res] = (treasury[res] ?? 0) - amount;
  return { ...alliance, treasury, activeResearch: { id: def.id, level: next, endTime: now + allianceResearchSeconds(next) * 1000 } };
}

/** Termine la recherche en cours si son heure est passée. */
export function completeAllianceResearch(alliance: Alliance, now: number): { alliance: Alliance; completed: { id: string; level: number } | null } {
  const active = alliance.activeResearch;
  if (!active || active.endTime > now) return { alliance, completed: null };
  return {
    alliance: { ...alliance, research: { ...(alliance.research ?? {}), [active.id]: active.level }, activeResearch: null },
    completed: { id: active.id, level: active.level },
  };
}

/* ---------- saison d'alliance ---------- */

export interface AllianceStanding {
  allianceId: string;
  rank: number;
  score: number;
}

/** Classement des alliances : somme des N meilleures XP de saison des membres. */
export function allianceStandings(members: { allianceId?: string | null; seasonXp: number }[]): AllianceStanding[] {
  const byAlliance = new Map<string, number[]>();
  for (const m of members) {
    if (!m.allianceId || !(m.seasonXp > 0)) continue;
    byAlliance.set(m.allianceId, [...(byAlliance.get(m.allianceId) ?? []), m.seasonXp]);
  }
  return [...byAlliance.entries()]
    .map(([allianceId, xps]) => ({
      allianceId,
      score: xps
        .sort((a, b) => b - a)
        .slice(0, ALLIANCE_RULES.seasonTopMembers)
        .reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => b.score - a.score || (a.allianceId < b.allianceId ? -1 : 1))
    .map((s, i) => ({ ...s, rank: i + 1 }));
}

/* ---------- point d'entrée serveur ---------- */

export type AllianceAction =
  | { type: "create"; name: string; tag: string }
  | { type: "join"; allianceId: string }
  | { type: "leave" }
  | { type: "kick"; targetUid: string }
  | { type: "promote"; targetUid: string }
  | { type: "demote"; targetUid: string }
  | { type: "deposit"; resources: Record<string, unknown> }
  | { type: "distribute"; targetUid: string; resources: Record<string, unknown> }
  | { type: "research"; researchId: string };

export interface AllianceLogEntry {
  kind: AllianceLog["kind"];
  actorUid: string;
  actorPseudo: string;
  targetUid?: string;
  targetPseudo?: string;
  resources?: Partial<Record<ResourceId, number>> | null;
  text?: string;
  createdAtMs: number;
}

export interface AllianceActionInput {
  action: AllianceAction;
  now: number;
  /** Joueur qui agit (production rattrapée avant). */
  actor: PlayerState;
  /** Alliance concernée (null pour une création). */
  alliance: Alliance | null;
  /** Membre qui reçoit un versement (production rattrapée avant). */
  target?: PlayerState | null;
}

export interface AllianceActionOutput {
  /** Alliance à enregistrer ; null = supprimée (dernier départ). */
  alliance: Omit<Alliance, "id"> & { id?: string } | null;
  actor: PlayerState;
  target: PlayerState | null;
  /** Champs d'alliance à écrire sur des joueurs (adhésion, départ, bonus). */
  memberships: Record<string, { allianceId: string; allianceResearch: Record<string, number> }>;
  logs: AllianceLogEntry[];
  notifications: Record<string, NewNotification[]>;
}

function note(title: string, message: string, now: number): NewNotification {
  return { kind: "alliance", title, message, createdAtMs: now, read: false };
}

export function performAllianceAction(input: AllianceActionInput): AllianceActionOutput {
  const { action, now, actor } = input;
  const alliance = input.alliance;
  const out: AllianceActionOutput = { alliance, actor, target: input.target ?? null, memberships: {}, logs: [], notifications: {} };
  const log = (entry: Omit<AllianceLogEntry, "actorUid" | "actorPseudo" | "createdAtMs">) =>
    out.logs.push({ actorUid: actor.uid, actorPseudo: actor.pseudo, createdAtMs: now, ...entry });
  const research = (a: Pick<Alliance, "research"> | null) => ({ ...(a?.research ?? {}) });

  switch (action?.type) {
    case "create": {
      if (actor.allianceId) throw new GameActionError("Quitte d'abord ton alliance actuelle.");
      out.alliance = newAlliance({ uid: actor.uid, pseudo: actor.pseudo }, action.name, action.tag, now);
      return out; // le serveur complète memberships une fois l'identifiant connu
    }
    case "join": {
      if (!alliance) throw new GameActionError("Cette alliance n'existe plus.");
      if (actor.allianceId && actor.allianceId !== alliance.id) throw new GameActionError("Quitte d'abord ton alliance actuelle.");
      out.alliance = addMember(alliance, { uid: actor.uid, pseudo: actor.pseudo });
      out.memberships[actor.uid] = { allianceId: alliance.id, allianceResearch: research(alliance) };
      log({ kind: "join" });
      return out;
    }
    case "leave": {
      if (!alliance || !alliance.members.includes(actor.uid)) {
        out.memberships[actor.uid] = { allianceId: "", allianceResearch: {} };
        out.alliance = alliance;
        return out;
      }
      out.alliance = removeMember(alliance, actor.uid);
      out.memberships[actor.uid] = { allianceId: "", allianceResearch: {} };
      log({ kind: "leave" });
      return out;
    }
    case "kick": {
      if (!alliance) throw new GameActionError("Alliance introuvable.");
      const targetPseudo = alliance.memberPseudos[action.targetUid] ?? "?";
      out.alliance = kickMember(alliance, actor.uid, String(action.targetUid ?? ""));
      out.memberships[action.targetUid] = { allianceId: "", allianceResearch: {} };
      out.notifications[action.targetUid] = [note("Exclu de l'alliance", `${actor.pseudo} t'a exclu de [${alliance.tag}] ${alliance.name}.`, now)];
      log({ kind: "kick", targetUid: action.targetUid, targetPseudo });
      return out;
    }
    case "promote":
    case "demote": {
      if (!alliance) throw new GameActionError("Alliance introuvable.");
      out.alliance = setOfficer(alliance, actor.uid, String(action.targetUid ?? ""), action.type === "promote");
      return out;
    }
    case "deposit": {
      if (!alliance) throw new GameActionError("Alliance introuvable.");
      const amounts = parseAmounts(action.resources);
      out.alliance = deposit(alliance, actor, amounts);
      log({ kind: "deposit", resources: amounts });
      return out;
    }
    case "distribute": {
      if (!alliance) throw new GameActionError("Alliance introuvable.");
      const target = input.target;
      if (!target || target.uid !== action.targetUid) throw new GameActionError("Ce joueur est introuvable.");
      const amounts = parseAmounts(action.resources);
      out.alliance = distribute(alliance, actor.uid, target.uid, amounts, now);
      for (const [res, amount] of Object.entries(amounts) as [ResourceId, number][]) target.resources[res] = (target.resources[res] ?? 0) + amount;
      out.notifications[target.uid] = [note("Versement du trésor", `${actor.pseudo} t'a versé des ressources du trésor de l'alliance.`, now)];
      log({ kind: "distribute", targetUid: target.uid, targetPseudo: target.pseudo, resources: amounts });
      return out;
    }
    case "research": {
      if (!alliance) throw new GameActionError("Alliance introuvable.");
      const started = startAllianceResearch(alliance, actor.uid, String(action.researchId ?? ""), now);
      out.alliance = started;
      const def = findAllianceResearch(started.activeResearch!.id)!;
      log({ kind: "research", text: `${def.name} niveau ${started.activeResearch!.level}`, resources: allianceResearchCost(started.activeResearch!.level) });
      return out;
    }
    default:
      throw new GameActionError("Action d'alliance inconnue.");
  }
}

/** Fin d'une recherche : bonus recopiés chez tous les membres, qui sont prévenus. */
export function finishAllianceResearch(alliance: Alliance, now: number): Omit<AllianceActionOutput, "actor" | "target"> | null {
  const done = completeAllianceResearch(alliance, now);
  if (!done.completed) return null;
  const def = findAllianceResearch(done.completed.id);
  const label = `${def?.name ?? done.completed.id} niveau ${done.completed.level}`;
  const memberships: AllianceActionOutput["memberships"] = {};
  const notifications: AllianceActionOutput["notifications"] = {};
  for (const uid of done.alliance.members) {
    memberships[uid] = { allianceId: alliance.id, allianceResearch: { ...(done.alliance.research ?? {}) } };
    notifications[uid] = [note("Recherche d'alliance terminée", `${def?.emoji ?? ""} ${label} : le bonus s'applique à tous les membres.`.trim(), now)];
  }
  return {
    alliance: done.alliance,
    memberships,
    notifications,
    logs: [{ kind: "research-done", actorUid: "", actorPseudo: "", text: label, createdAtMs: now }],
  };
}
