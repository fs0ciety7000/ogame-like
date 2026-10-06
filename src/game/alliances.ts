import { playerModifiers } from "@/game/modifiers";
import { applyToAlliance, assertCanJoin, assignRank, deleteRank, dropApplication, hasAlliancePerm, normalizeAllianceProfile, saveRank, setAllianceProfile, type AllianceRank } from "@/game/allianceProfile";
import { bumpStat, setStat } from "@/game/stats";
import { GameActionError } from "@/game/errors";
import { RESOURCE_LIST } from "@/game/resources";
import type { NewNotification } from "@/game/flush";
import type { Alliance, AllianceLog, PlayerState, ResourceId } from "@/types/game";
import { techReductionFactor } from "@/game/technologies";

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

export interface AllianceProjectDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  perLevel: number;
  maxLevel: number;
}

export const ALLIANCE_RULES = {
  /** 5.33 (proposals/alliances-grandes.md) : membres de base ; +membersPerQuarter par niveau de « Quartiers fédérés ». */
  maxMembers: 8,
  membersPerQuarter: 4,
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
    // 5.33 : agrandit l'alliance (8 → 12 → 16 → 20 membres).
    { id: "quartiers", name: "Quartiers fédérés", emoji: "🏘️", description: "Agrandit l'alliance : des places de membres en plus.", perLevel: 4, maxLevel: 3 },
  ] as AllianceResearchDef[],
  /** v3.3 : projets (méga-structures). Coût du palier n : base × croissance^(n−1). */
  projectCommonCost: 500_000_000,
  projectRareCost: 5_000_000,
  projectGrowth: 2,
  /** Construction du palier n : n × ce nombre d'heures, une fois financé. */
  projectHoursPerLevel: 24,
  projects: [
    { id: "forge", name: "Anneau-forge", emoji: "🔨", description: "Réduit la durée des constructions et des recherches des membres.", perLevel: 0.02, maxLevel: 5 },
    { id: "siege", name: "Batterie de siège", emoji: "🎯", description: "Augmente l'attaque des membres contre le Léviathan et les repaires pirates.", perLevel: 0.04, maxLevel: 5 },
    { id: "bastion", name: "Bastion fédéral", emoji: "🏰", description: "Met à l'abri du pillage une part supplémentaire des stocks des membres.", perLevel: 0.02, maxLevel: 5 },
  ] as AllianceProjectDef[],
};

export type AllianceRole = "founder" | "officer" | "diplomat" | "member";

/** v4.9 : diplomates par alliance, au plus. */
export const MAX_DIPLOMATS = 2;

/** Peut signer et rompre les pactes, déclarer une guerre ou y répondre. */
export function canDiplomacy(role: AllianceRole | null): boolean {
  return role === "founder" || role === "officer" || role === "diplomat";
}

/** v5.10.5 : diplomatie selon le rôle ou le rang personnalisé. */
export function canDiplomacyIn(alliance: Pick<Alliance, "createdBy" | "members" | "roles"> & { profile?: unknown }, uid: string): boolean {
  return hasAlliancePerm(alliance, uid, "diplomacy");
}
export type AllianceLevels = Record<string, number>;

const RESOURCE_IDS = new Set<string>(RESOURCE_LIST.map((r) => r.id));

export function findAllianceResearch(id: string): AllianceResearchDef | undefined {
  return ALLIANCE_RULES.researches.find((r) => r.id === id);
}

export function allianceRole(alliance: Pick<Alliance, "createdBy" | "members" | "roles">, uid: string): AllianceRole | null {
  if (!alliance.members?.includes(uid)) return null;
  if (alliance.createdBy === uid) return "founder";
  const r = alliance.roles?.[uid];
  return r === "officer" ? "officer" : r === "diplomat" ? "diplomat" : "member";
}

function level(levels: AllianceLevels | undefined | null, id: string): number {
  const def = findAllianceResearch(id);
  return Math.max(0, Math.min(def?.maxLevel ?? 0, Math.floor(Number(levels?.[id]) || 0)));
}

/* ---------- bonus des recherches (appliqués aux membres) ---------- */

/** Multiplicateur du temps de vol (0,75 = −25 %). */
export function allianceFlightFactor(levels: AllianceLevels | undefined | null, techLevels?: Record<string, number>, player?: Parameters<typeof playerModifiers>[0]): number {
  // v2.6 : la techno « vitesse des flottes » se cumule à la logistique d'alliance.
  // v5.14 : et la Logisticienne en poste (couche empire du circuit d'effets).
  const empire = player ? playerModifiers(player).fleetSpeed : 0;
  return Math.max(0.1, (1 - level(levels, "logistique") * (findAllianceResearch("logistique")?.perLevel ?? 0)) * techReductionFactor(techLevels, "fleet_speed") * (1 - empire));
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

/* ---------- bonus des projets (v3.3, appliqués aux membres) ---------- */

/** Clé du niveau d'un projet dans les niveaux recopiés chez les membres. */
export const projectKey = (id: string) => `projet_${id}`;

export function findAllianceProject(id: string): AllianceProjectDef | undefined {
  return ALLIANCE_RULES.projects.find((p) => p.id === id);
}

/** Niveau d'un projet d'après les niveaux d'un membre (allianceResearch). */
export function memberProjectLevel(levels: AllianceLevels | undefined | null, id: string): number {
  const def = findAllianceProject(id);
  return Math.max(0, Math.min(def?.maxLevel ?? 0, Math.floor(Number(levels?.[projectKey(id)]) || 0)));
}

function projectEffect(levels: AllianceLevels | undefined | null, id: string): number {
  return memberProjectLevel(levels, id) * (findAllianceProject(id)?.perLevel ?? 0);
}

/** Multiplicateur des durées de construction et de recherche (0,9 = −10 %). */
export function allianceForgeFactor(levels: AllianceLevels | undefined | null): number {
  return Math.max(0.5, 1 - projectEffect(levels, "forge"));
}

/** Multiplicateur d'attaque contre le Léviathan et les repaires (1,2 = +20 %). */
export function allianceSiegeFactor(levels: AllianceLevels | undefined | null): number {
  return 1 + projectEffect(levels, "siege");
}

/** Part supplémentaire des stocks à l'abri du pillage (0,1 = +10 points). */
export function allianceBastionBonus(levels: AllianceLevels | undefined | null): number {
  return projectEffect(levels, "bastion");
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

/** 5.33 : places de l'alliance = base + Quartiers fédérés. */
export function allianceMaxMembers(alliance: Pick<Alliance, "research"> | null | undefined): number {
  const def = findAllianceResearch("quartiers");
  const lvl = Math.min(def?.maxLevel ?? 0, Math.max(0, Math.floor(alliance?.research?.quartiers ?? 0)));
  return Math.max(1, Math.floor(ALLIANCE_RULES.maxMembers)) + lvl * Math.max(0, ALLIANCE_RULES.membersPerQuarter);
}

export function addMember(alliance: Alliance, player: { uid: string; pseudo: string }): Alliance {
  if (alliance.members.includes(player.uid)) throw new GameActionError("Tu es déjà membre de cette alliance.");
  const cap = allianceMaxMembers(alliance);
  if (alliance.members.length >= cap) throw new GameActionError(`Cette alliance est complète (${cap} membres). La recherche « Quartiers fédérés » ouvre 4 places de plus.`);
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
  if (!hasAlliancePerm(alliance, actorUid, "kick")) throw new GameActionError("Il te faut le droit « Exclusion » pour exclure un membre.");
  if (actorUid === targetUid) throw new GameActionError("Tu ne peux pas t'exclure toi-même.");
  if (targetUid === alliance.createdBy) throw new GameActionError("Le fondateur ne peut pas être exclu.");
  return removeMember(alliance, targetUid)!;
}

export function setOfficer(alliance: Alliance, actorUid: string, targetUid: string, officer: boolean): Alliance {
  return setRole(alliance, actorUid, targetUid, officer ? "officer" : "member");
}

/** v4.9 : rôle d'un membre (officier, diplomate ou simple membre), par le fondateur. */
export function setRole(alliance: Alliance, actorUid: string, targetUid: string, role: unknown): Alliance {
  if (allianceRole(alliance, actorUid) !== "founder") throw new GameActionError("Seul le fondateur gère les rôles.");
  if (!alliance.members.includes(targetUid) || targetUid === alliance.createdBy) throw new GameActionError("Ce joueur ne peut pas changer de rôle.");
  if (role !== "officer" && role !== "diplomat" && role !== "member") throw new GameActionError("Rôle inconnu.");
  const roles = { ...(alliance.roles ?? {}) };
  if (role === "diplomat" && roles[targetUid] !== "diplomat" && Object.values(roles).filter((r) => r === "diplomat").length >= MAX_DIPLOMATS) {
    throw new GameActionError(`${MAX_DIPLOMATS} diplomates au plus par alliance.`);
  }
  if (role === "member") delete roles[targetUid];
  else roles[targetUid] = role;
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
  if (!hasAlliancePerm(alliance, actorUid, "treasury")) throw new GameActionError("Il te faut le droit « Trésor » pour verser des ressources.");
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
  if (!hasAlliancePerm(alliance, actorUid, "research")) throw new GameActionError("Il te faut le droit « Recherches » pour lancer une recherche.");
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

/* ---------- projets d'alliance (v3.3) ---------- */

export interface AllianceProjectState {
  level: number;
  /** Ressources déjà versées pour le palier suivant. */
  funded: Partial<Record<ResourceId, number>>;
  /** Fin de construction du palier suivant (0 = pas en construction). */
  buildEndMs: number;
}

export function allianceProjectCost(nextLevel: number): Partial<Record<ResourceId, number>> {
  const factor = Math.pow(ALLIANCE_RULES.projectGrowth, Math.max(0, nextLevel - 1));
  const cost: Partial<Record<ResourceId, number>> = {};
  for (const r of RESOURCE_LIST) cost[r.id] = Math.round((r.rarity === "rare" ? ALLIANCE_RULES.projectRareCost : ALLIANCE_RULES.projectCommonCost) * factor);
  return cost;
}

export function allianceProjectSeconds(nextLevel: number): number {
  return Math.round(ALLIANCE_RULES.projectHoursPerLevel * nextLevel * 3600);
}

export function projectState(alliance: Pick<Alliance, "projects">, id: string): AllianceProjectState {
  const raw = alliance.projects?.[id];
  return { level: Math.max(0, Math.floor(Number(raw?.level) || 0)), funded: { ...(raw?.funded ?? {}) }, buildEndMs: Number(raw?.buildEndMs) || 0 };
}

/** Niveaux recopiés chez chaque membre : recherches et projets. */
export function memberLevels(alliance: Pick<Alliance, "research" | "projects"> | null): AllianceLevels {
  const out: AllianceLevels = { ...(alliance?.research ?? {}) };
  for (const def of ALLIANCE_RULES.projects) {
    const level = alliance ? projectState(alliance, def.id).level : 0;
    if (level > 0) out[projectKey(def.id)] = level;
  }
  return out;
}

/** Valeur d'un versement (une rare vaut 100 communes), pour le classement des contributeurs. */
export function contributionValue(amounts: Partial<Record<ResourceId, number>>): number {
  return Object.entries(amounts).reduce((a, [res, n]) => a + (n ?? 0) * (RESOURCE_LIST.find((r) => r.id === res)?.rarity === "rare" ? 100 : 1), 0);
}

/** v5.8 : avancement du financement d'un palier (0 à 1), en valeur : une
 *  rare compte pour 100 communes, comme dans le classement des bâtisseurs.
 *  Le total brut faisait peser les rares à 1 % du palier à peine. */
export function allianceProjectProgress(cost: Partial<Record<ResourceId, number>>, funded: Partial<Record<ResourceId, number>>): number {
  const capped: Partial<Record<ResourceId, number>> = {};
  for (const [res, n] of Object.entries(cost) as [ResourceId, number][]) capped[res] = Math.min(n, funded[res] ?? 0);
  const total = contributionValue(cost);
  return total > 0 ? Math.min(1, contributionValue(capped) / total) : 0;
}

/** Financement d'un projet, depuis le trésor (fondateur, officiers) ou le
 *  stock du joueur (tout membre). Chaque montant est plafonné à ce qui manque ;
 *  le palier financé lance la construction. */
export function fundAllianceProject(
  alliance: Alliance,
  actor: PlayerState,
  projectId: string,
  source: "treasury" | "self",
  amounts: Partial<Record<ResourceId, number>>,
  now: number,
): { alliance: Alliance; used: Partial<Record<ResourceId, number>>; started: number | null } {
  const def = findAllianceProject(projectId);
  if (!def) throw new GameActionError("Projet inconnu.");
  const role = allianceRole(alliance, actor.uid);
  if (!role) throw new GameActionError("Tu n'es pas membre de cette alliance.");
  if (source === "treasury" && !hasAlliancePerm(alliance, actor.uid, "projects")) throw new GameActionError("Il te faut le droit « Projets » pour puiser dans le trésor.");
  const state = projectState(alliance, def.id);
  if (state.buildEndMs > 0) throw new GameActionError("Ce palier est déjà en construction.");
  const next = state.level + 1;
  if (next > def.maxLevel) throw new GameActionError("Ce projet est achevé.");
  const cost = allianceProjectCost(next);
  const pool = source === "treasury" ? { ...(alliance.treasury ?? {}) } : actor.resources;
  const used: Partial<Record<ResourceId, number>> = {};
  for (const [res, amount] of Object.entries(amounts) as [ResourceId, number][]) {
    const missing = Math.max(0, (cost[res] ?? 0) - (state.funded[res] ?? 0));
    const n = Math.min(amount, missing);
    if (n <= 0) continue;
    if ((pool[res] ?? 0) < n) throw new GameActionError(source === "treasury" ? "Le trésor ne suffit pas pour ce versement." : "Ressources insuffisantes pour ce versement.");
    used[res] = n;
  }
  if (Object.keys(used).length === 0) throw new GameActionError("Ces ressources sont déjà réunies pour ce palier.");
  for (const [res, n] of Object.entries(used) as [ResourceId, number][]) {
    pool[res] = (pool[res] ?? 0) - n;
    state.funded[res] = (state.funded[res] ?? 0) + n;
  }
  const complete = (Object.entries(cost) as [ResourceId, number][]).every(([res, n]) => (state.funded[res] ?? 0) >= n);
  const started = complete ? now + allianceProjectSeconds(next) * 1000 : null;
  const nextState: AllianceProjectState = complete ? { level: state.level, funded: {}, buildEndMs: started! } : state;
  const contributors = { ...(alliance.projectContributors ?? {}) };
  if (source === "self") contributors[actor.uid] = (contributors[actor.uid] ?? 0) + contributionValue(used);
  return {
    alliance: {
      ...alliance,
      treasury: source === "treasury" ? (pool as Alliance["treasury"]) : alliance.treasury,
      projects: { ...(alliance.projects ?? {}), [def.id]: nextState },
      projectContributors: contributors,
    },
    used,
    started,
  };
}

/** Paliers dont la construction est terminée. */
export function completeAllianceProjects(alliance: Alliance, now: number): { alliance: Alliance; completed: { id: string; level: number }[] } {
  const completed: { id: string; level: number }[] = [];
  const projects = { ...(alliance.projects ?? {}) };
  for (const def of ALLIANCE_RULES.projects) {
    const state = projectState(alliance, def.id);
    if (state.buildEndMs > 0 && state.buildEndMs <= now) {
      projects[def.id] = { level: state.level + 1, funded: {}, buildEndMs: 0 };
      completed.push({ id: def.id, level: state.level + 1 });
    }
  }
  return { alliance: completed.length ? { ...alliance, projects } : alliance, completed };
}

/** Prochaine échéance (recherche ou construction d'un projet), 0 sinon. */
export function allianceNextDueMs(alliance: Pick<Alliance, "activeResearch" | "projects">): number {
  const dues = [alliance.activeResearch?.endTime ?? 0, ...ALLIANCE_RULES.projects.map((p) => projectState(alliance, p.id).buildEndMs)].filter((t) => t > 0);
  return dues.length ? Math.min(...dues) : 0;
}

/* ---------- saison d'alliance ---------- */

export interface AllianceStanding {
  allianceId: string;
  rank: number;
  score: number;
}

/** Classement des alliances : somme des N meilleures XP de saison des membres. */
export function allianceStandings(members: { allianceId?: string | null; seasonXp: number }[], bonuses: Record<string, number> = {}): AllianceStanding[] {
  const byAlliance = new Map<string, number[]>();
  for (const m of members) {
    if (!m.allianceId || !(m.seasonXp > 0)) continue;
    byAlliance.set(m.allianceId, [...(byAlliance.get(m.allianceId) ?? []), m.seasonXp]);
  }
  return [...byAlliance.entries()]
    .map(([allianceId, xps]) => ({
      allianceId,
      // v3.2 : bonus des guerres gagnées pendant la saison.
      score: Math.round(
        xps
          .sort((a, b) => b - a)
          .slice(0, ALLIANCE_RULES.seasonTopMembers)
          .reduce((a, b) => a + b, 0) * (1 + (bonuses[allianceId] ?? 0)),
      ),
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
  | { type: "setRole"; targetUid: string; role: string }
  | { type: "deposit"; resources: Record<string, unknown> }
  | { type: "distribute"; targetUid: string; resources: Record<string, unknown> }
  | { type: "research"; researchId: string }
  | { type: "project"; projectId: string; source: "treasury" | "self"; resources: Record<string, unknown> }
  // v5.10.5 : fiche, rangs personnalisés, candidatures.
  | { type: "profile"; description?: string; recruiting?: string }
  | { type: "rankSave"; rank: Record<string, unknown> }
  | { type: "rankDelete"; rankId: string }
  | { type: "rankAssign"; targetUid: string; rankId: string | null }
  | { type: "apply"; allianceId: string; message?: string }
  | { type: "withdraw"; allianceId: string }
  | { type: "applicationAccept"; targetUid: string }
  | { type: "applicationDecline"; targetUid: string };

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
  const research = (a: Pick<Alliance, "research" | "projects"> | null) => memberLevels(a);

  switch (action?.type) {
    case "create": {
      if (actor.allianceId) throw new GameActionError("Quitte d'abord ton alliance actuelle.");
      out.alliance = newAlliance({ uid: actor.uid, pseudo: actor.pseudo }, action.name, action.tag, now);
      setStat(actor, "allianceFounded", 1);
      return out; // le serveur complète memberships une fois l'identifiant connu
    }
    case "join": {
      if (!alliance) throw new GameActionError("Cette alliance n'existe plus.");
      if (actor.allianceId && actor.allianceId !== alliance.id) throw new GameActionError("Quitte d'abord ton alliance actuelle.");
      assertCanJoin(alliance);
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
    case "setRole": {
      if (!alliance) throw new GameActionError("Alliance introuvable.");
      out.alliance = setRole(alliance, actor.uid, String(action.targetUid ?? ""), action.role);
      return out;
    }
    case "deposit": {
      if (!alliance) throw new GameActionError("Alliance introuvable.");
      const amounts = parseAmounts(action.resources);
      out.alliance = deposit(alliance, actor, amounts);
      bumpStat(actor, "donated", Object.values(amounts).reduce((a: number, b) => a + (b ?? 0), 0));
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
    case "project": {
      if (!alliance) throw new GameActionError("Alliance introuvable.");
      const source = action.source === "treasury" ? "treasury" : "self";
      const res = fundAllianceProject(alliance, actor, String(action.projectId ?? ""), source, parseAmounts(action.resources), now);
      out.alliance = res.alliance;
      const def = findAllianceProject(String(action.projectId))!;
      const next = projectState(alliance, def.id).level + 1;
      if (source === "self") bumpStat(actor, "donated", Object.values(res.used).reduce((a: number, b) => a + (b ?? 0), 0));
      log({ kind: "project", text: `${def.name} niveau ${next}${source === "treasury" ? " (trésor)" : ""}${res.started ? " : financé, construction lancée" : ""}`, resources: res.used });
      if (res.started) {
        for (const uid of alliance.members) {
          out.notifications[uid] = [note("Projet d'alliance financé", `${def.emoji} ${def.name} niveau ${next} : construction lancée.`, now)];
        }
      }
      return out;
    }
    case "profile": {
      if (!alliance) throw new GameActionError("Alliance introuvable.");
      out.alliance = setAllianceProfile(alliance, actor.uid, { description: action.description, recruiting: action.recruiting });
      return out;
    }
    case "rankSave": {
      if (!alliance) throw new GameActionError("Alliance introuvable.");
      out.alliance = saveRank(alliance, actor.uid, action.rank as Partial<AllianceRank>);
      return out;
    }
    case "rankDelete": {
      if (!alliance) throw new GameActionError("Alliance introuvable.");
      out.alliance = deleteRank(alliance, actor.uid, String(action.rankId ?? ""));
      return out;
    }
    case "rankAssign": {
      if (!alliance) throw new GameActionError("Alliance introuvable.");
      out.alliance = assignRank(alliance, actor.uid, String(action.targetUid ?? ""), action.rankId ? String(action.rankId) : null);
      return out;
    }
    case "apply": {
      if (!alliance) throw new GameActionError("Cette alliance n'existe plus.");
      out.alliance = applyToAlliance(alliance, actor, action.message, now);
      // Prévenir ceux qui peuvent recruter.
      for (const uid of alliance.members) {
        if (hasAlliancePerm(alliance, uid, "recruit")) out.notifications[uid] = [{ ...note("Nouvelle candidature", `${actor.pseudo} souhaite rejoindre [${alliance.tag}] : réponds depuis l'onglet Fiche de l'alliance.`, now), link: "/game/alliance?onglet=fiche" }];
      }
      return out;
    }
    case "withdraw": {
      if (!alliance) throw new GameActionError("Cette alliance n'existe plus.");
      out.alliance = dropApplication(alliance, actor.uid);
      return out;
    }
    case "applicationAccept":
    case "applicationDecline": {
      if (!alliance) throw new GameActionError("Alliance introuvable.");
      if (!hasAlliancePerm(alliance, actor.uid, "recruit")) throw new GameActionError("Il te faut le droit « Recrutement » pour répondre aux candidatures.");
      const targetUid = String(action.targetUid ?? "");
      const app = normalizeAllianceProfile(alliance.profile).applications.find((a) => a.uid === targetUid);
      if (!app) throw new GameActionError("Candidature introuvable.");
      const cleaned = dropApplication(alliance, targetUid);
      if (action.type === "applicationDecline") {
        out.alliance = cleaned;
        out.notifications[targetUid] = [note("Candidature refusée", `[${alliance.tag}] ${alliance.name} n'a pas retenu ta candidature cette fois.`, now)];
        return out;
      }
      const target = input.target;
      if (!target || target.uid !== targetUid) throw new GameActionError("Ce joueur est introuvable.");
      if (target.allianceId) {
        out.alliance = cleaned;
        out.notifications[actor.uid] = [note("Candidature caduque", `${app.pseudo} a déjà rejoint une autre alliance.`, now)];
        return out;
      }
      out.alliance = addMember(cleaned, { uid: target.uid, pseudo: target.pseudo });
      out.memberships[target.uid] = { allianceId: alliance.id, allianceResearch: research(alliance) };
      out.notifications[target.uid] = [{ ...note("Candidature acceptée !", `Bienvenue dans [${alliance.tag}] ${alliance.name}.`, now), link: "/game/alliance" }];
      out.logs.push({ kind: "join", actorUid: target.uid, actorPseudo: target.pseudo, text: `(candidature acceptée par ${actor.pseudo})`, createdAtMs: now });
      return out;
    }
    default:
      throw new GameActionError("Action d'alliance inconnue.");
  }
}

/** Fin d'une recherche ou de la construction d'un projet : bonus recopiés
 *  chez tous les membres, qui sont prévenus. */
export function finishAllianceResearch(alliance: Alliance, now: number): Omit<AllianceActionOutput, "actor" | "target"> | null {
  const done = completeAllianceResearch(alliance, now);
  const built = completeAllianceProjects(done.alliance, now);
  if (!done.completed && built.completed.length === 0) return null;
  const labels: string[] = [];
  const logs: AllianceLogEntry[] = [];
  if (done.completed) {
    const def = findAllianceResearch(done.completed.id);
    const label = `${def?.name ?? done.completed.id} niveau ${done.completed.level}`;
    labels.push(`${def?.emoji ?? ""} ${label}`.trim());
    logs.push({ kind: "research-done", actorUid: "", actorPseudo: "", text: label, createdAtMs: now });
  }
  for (const c of built.completed) {
    const def = findAllianceProject(c.id);
    const label = `${def?.name ?? c.id} niveau ${c.level}`;
    labels.push(`${def?.emoji ?? ""} ${label}`.trim());
    logs.push({ kind: "project-done", actorUid: "", actorPseudo: "", text: label, createdAtMs: now });
  }
  const memberships: AllianceActionOutput["memberships"] = {};
  const notifications: AllianceActionOutput["notifications"] = {};
  const title = done.completed && built.completed.length === 0 ? "Recherche d'alliance terminée" : built.completed.length && !done.completed ? "Projet d'alliance achevé" : "Alliance : travaux terminés";
  for (const uid of built.alliance.members) {
    memberships[uid] = { allianceId: alliance.id, allianceResearch: memberLevels(built.alliance) };
    notifications[uid] = [note(title, `${labels.join(" · ")} : le bonus s'applique à tous les membres.`, now)];
  }
  return { alliance: built.alliance, memberships, notifications, logs };
}
