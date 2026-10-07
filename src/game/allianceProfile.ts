import { GameActionError } from "@/game/errors";
import { allianceRole, type AllianceRole } from "@/game/alliances";
import type { Alliance } from "@/types/game";

/* =====================================================
   v5.10.5 : fiche publique et rangs personnalisés des alliances.
   - Rangs : le fondateur crée ses rangs (nom, couleur, droits fins) et
     les attribue. Ils s'ajoutent aux rôles historiques (officier,
     diplomate), qui gardent leurs droits.
   - Fiche : présentation, mode de recrutement (ouvert, sur candidature,
     fermé) et candidatures à accepter ou refuser.
   Tout est rangé dans le champ « profile » de l'alliance.
===================================================== */


/** Couleurs proposées pour les rangs (enregistrées telles quelles : hex). */
export const RANK_COLORS = ["#ffd86b", "#4be8ff", "#5cf2b0", "#a78bfa", "#ff8a4c", "#ff5c7a", "#94a3b8"];
export type AlliancePerm = "treasury" | "research" | "projects" | "diplomacy" | "boss" | "recruit" | "kick";

export const ALLIANCE_PERMS: { id: AlliancePerm; label: string; hint: string }[] = [
  { id: "treasury", label: "Trésor", hint: "Verser des ressources du trésor aux membres." },
  { id: "research", label: "Recherches", hint: "Lancer les recherches d'alliance." },
  { id: "projects", label: "Projets", hint: "Financer les projets avec le trésor." },
  { id: "diplomacy", label: "Diplomatie", hint: "Pactes, guerres et redditions." },
  { id: "boss", label: "Boss", hint: "Appeler le boss d'alliance de la semaine." },
  { id: "recruit", label: "Recrutement", hint: "Fiche publique, candidatures à accepter ou refuser." },
  { id: "kick", label: "Exclusion", hint: "Exclure un membre (jamais le fondateur)." },
];

export type Recruiting = "open" | "apply" | "closed";

export const RECRUITING_LABELS: Record<Recruiting, string> = {
  open: "Ouvert : on rejoint directement",
  apply: "Sur candidature",
  closed: "Fermé",
};

export interface AllianceRank {
  id: string;
  name: string;
  color: string;
  perms: AlliancePerm[];
}

export interface AllianceApplication {
  uid: string;
  pseudo: string;
  message: string;
  atMs: number;
}

export interface AllianceProfile {
  description: string;
  recruiting: Recruiting;
  ranks: AllianceRank[];
  /** Rang personnalisé de chaque membre (absent : aucun). */
  memberRanks: Record<string, string>;
  applications: AllianceApplication[];
}

export const ALLIANCE_PROFILE_RULES = { maxRanks: 6, maxApplications: 30, descriptionMax: 600, messageMax: 300 };

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const ALLIANCE_PROFILE_RULES_META = {
  maxRanks: { label: "Rangs personnalisés par alliance", min: 1, max: 20 },
  maxApplications: { label: "Candidatures en attente, au plus", min: 1, max: 200 },
  descriptionMax: { label: "Description de l'alliance : longueur", unit: "caractères", min: 50, max: 5000 },
  messageMax: { label: "Message de candidature : longueur", unit: "caractères", min: 20, max: 2000 },
};

const PERM_IDS = new Set(ALLIANCE_PERMS.map((p) => p.id));
const COLOR = /^#[0-9a-fA-F]{6}$/;

/** Droits des rôles historiques (avant les rangs personnalisés). */
const LEGACY_PERMS: Record<AllianceRole, AlliancePerm[]> = {
  founder: ALLIANCE_PERMS.map((p) => p.id),
  officer: ["treasury", "research", "projects", "diplomacy", "boss", "recruit"],
  diplomat: ["diplomacy"],
  member: [],
};

export function normalizeAllianceProfile(raw: unknown): AllianceProfile {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<AllianceProfile>;
  const ranks = (Array.isArray(r.ranks) ? r.ranks : [])
    .filter((k) => k && typeof k.id === "string" && typeof k.name === "string")
    .slice(0, ALLIANCE_PROFILE_RULES.maxRanks)
    .map((k) => ({ id: k.id, name: k.name.slice(0, 24), color: COLOR.test(k.color) ? k.color : "#94a3b8", perms: (Array.isArray(k.perms) ? k.perms : []).filter((p) => PERM_IDS.has(p)) }));
  const rankIds = new Set(ranks.map((k) => k.id));
  const memberRanks: Record<string, string> = {};
  for (const [uid, id] of Object.entries(r.memberRanks && typeof r.memberRanks === "object" ? r.memberRanks : {})) if (rankIds.has(String(id))) memberRanks[uid] = String(id);
  return {
    description: String(r.description ?? "").slice(0, ALLIANCE_PROFILE_RULES.descriptionMax),
    recruiting: r.recruiting === "apply" || r.recruiting === "closed" ? r.recruiting : "open",
    ranks,
    memberRanks,
    applications: (Array.isArray(r.applications) ? r.applications : [])
      .filter((a) => a && typeof a.uid === "string")
      .map((a) => ({ uid: a.uid, pseudo: String(a.pseudo ?? ""), message: String(a.message ?? "").slice(0, ALLIANCE_PROFILE_RULES.messageMax), atMs: Number(a.atMs) || 0 }))
      .slice(-ALLIANCE_PROFILE_RULES.maxApplications),
  };
}

type AllianceLike = Pick<Alliance, "createdBy" | "members" | "roles"> & { profile?: unknown };

/** Droits d'un membre : ceux de son rôle historique, plus ceux de son rang personnalisé. */
export function alliancePerms(alliance: AllianceLike, uid: string): Set<AlliancePerm> {
  const role = allianceRole(alliance, uid);
  if (!role) return new Set();
  const perms = new Set<AlliancePerm>(LEGACY_PERMS[role]);
  if (role !== "founder") {
    const profile = normalizeAllianceProfile(alliance.profile);
    const rank = profile.ranks.find((k) => k.id === profile.memberRanks[uid]);
    for (const p of rank?.perms ?? []) perms.add(p);
  }
  return perms;
}

export function hasAlliancePerm(alliance: AllianceLike, uid: string, perm: AlliancePerm): boolean {
  return alliancePerms(alliance, uid).has(perm);
}

/** Rang affiché d'un membre (rang personnalisé, sinon rôle). */
export function memberRankLabel(alliance: AllianceLike, uid: string): { name: string; color: string } | null {
  const profile = normalizeAllianceProfile(alliance.profile);
  const rank = profile.ranks.find((k) => k.id === profile.memberRanks[uid]);
  return rank ? { name: rank.name, color: rank.color } : null;
}

function withProfile<T extends AllianceLike>(alliance: T, profile: AllianceProfile): T {
  return { ...alliance, profile };
}

function founderOnly(alliance: AllianceLike, uid: string) {
  if (allianceRole(alliance, uid) !== "founder") throw new GameActionError("Seul le fondateur gère les rangs.");
}

export function saveRank<T extends AllianceLike>(alliance: T, actorUid: string, raw: Partial<AllianceRank>): T {
  founderOnly(alliance, actorUid);
  const profile = normalizeAllianceProfile(alliance.profile);
  const name = String(raw.name ?? "").trim().slice(0, 24);
  if (!name) throw new GameActionError("Donne un nom au rang.");
  const color = COLOR.test(String(raw.color)) ? String(raw.color) : "#94a3b8";
  const perms = (Array.isArray(raw.perms) ? raw.perms : []).filter((p): p is AlliancePerm => PERM_IDS.has(p as AlliancePerm));
  const id = raw.id && profile.ranks.some((k) => k.id === raw.id) ? raw.id : `r${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
  if (!profile.ranks.some((k) => k.id === id) && profile.ranks.length >= ALLIANCE_PROFILE_RULES.maxRanks) throw new GameActionError(`${ALLIANCE_PROFILE_RULES.maxRanks} rangs au plus.`);
  const rank = { id, name, color, perms };
  const ranks = profile.ranks.some((k) => k.id === id) ? profile.ranks.map((k) => (k.id === id ? rank : k)) : [...profile.ranks, rank];
  return withProfile(alliance, { ...profile, ranks });
}

export function deleteRank<T extends AllianceLike>(alliance: T, actorUid: string, rankId: string): T {
  founderOnly(alliance, actorUid);
  const profile = normalizeAllianceProfile(alliance.profile);
  const memberRanks = Object.fromEntries(Object.entries(profile.memberRanks).filter(([, id]) => id !== rankId));
  return withProfile(alliance, { ...profile, ranks: profile.ranks.filter((k) => k.id !== rankId), memberRanks });
}

export function assignRank<T extends AllianceLike>(alliance: T, actorUid: string, targetUid: string, rankId: string | null): T {
  founderOnly(alliance, actorUid);
  if (!alliance.members.includes(targetUid) || targetUid === alliance.createdBy) throw new GameActionError("Ce joueur ne peut pas recevoir de rang.");
  const profile = normalizeAllianceProfile(alliance.profile);
  if (rankId && !profile.ranks.some((k) => k.id === rankId)) throw new GameActionError("Rang inconnu.");
  const memberRanks = { ...profile.memberRanks };
  if (rankId) memberRanks[targetUid] = rankId;
  else delete memberRanks[targetUid];
  return withProfile(alliance, { ...profile, memberRanks });
}

export function setAllianceProfile<T extends AllianceLike>(alliance: T, actorUid: string, patch: { description?: unknown; recruiting?: unknown }): T {
  if (!hasAlliancePerm(alliance, actorUid, "recruit")) throw new GameActionError("Il te faut le droit « Recrutement » pour modifier la fiche.");
  const profile = normalizeAllianceProfile(alliance.profile);
  return withProfile(alliance, {
    ...profile,
    ...(patch.description !== undefined ? { description: String(patch.description).trim().slice(0, ALLIANCE_PROFILE_RULES.descriptionMax) } : {}),
    ...(patch.recruiting === "open" || patch.recruiting === "apply" || patch.recruiting === "closed" ? { recruiting: patch.recruiting } : {}),
  });
}

export function applyToAlliance<T extends AllianceLike>(alliance: T, player: { uid: string; pseudo: string; allianceId?: string | null }, message: unknown, now: number): T {
  const profile = normalizeAllianceProfile(alliance.profile);
  if (player.allianceId) throw new GameActionError("Quitte d'abord ton alliance actuelle.");
  if (alliance.members.includes(player.uid)) throw new GameActionError("Tu fais déjà partie de cette alliance.");
  if (profile.recruiting === "closed") throw new GameActionError("Cette alliance ne recrute pas pour l'instant.");
  if (profile.recruiting === "open") throw new GameActionError("Cette alliance est ouverte : rejoins-la directement.");
  if (profile.applications.some((a) => a.uid === player.uid)) throw new GameActionError("Ta candidature est déjà en attente.");
  if (profile.applications.length >= ALLIANCE_PROFILE_RULES.maxApplications) throw new GameActionError("Trop de candidatures en attente : réessaie plus tard.");
  const app = { uid: player.uid, pseudo: player.pseudo, message: String(message ?? "").trim().slice(0, ALLIANCE_PROFILE_RULES.messageMax), atMs: now };
  return withProfile(alliance, { ...profile, applications: [...profile.applications, app] });
}

/** Retire une candidature (acceptée, refusée ou retirée par le joueur). */
export function dropApplication<T extends AllianceLike>(alliance: T, uid: string): T {
  const profile = normalizeAllianceProfile(alliance.profile);
  return withProfile(alliance, { ...profile, applications: profile.applications.filter((a) => a.uid !== uid) });
}

/** Rejoindre directement : seulement si le recrutement est ouvert. */
export function assertCanJoin(alliance: AllianceLike): void {
  const r = normalizeAllianceProfile(alliance.profile).recruiting;
  if (r === "apply") throw new GameActionError("Cette alliance recrute sur candidature : postule depuis sa fiche.");
  if (r === "closed") throw new GameActionError("Cette alliance ne recrute pas pour l'instant.");
}
