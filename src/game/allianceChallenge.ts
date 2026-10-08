import { METRICS, type AchievementMetric } from "@/game/achievements";
import { allianceWeekId } from "@/game/allianceBoss";
import { productionHours } from "@/game/pirates";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   v5.10.5 : défi d'alliance de la semaine. Chaque lundi (heure de Paris),
   un défi tourne (pillage, missions, arsenal…) : le score d'une alliance
   est la progression cumulée de ses membres sur la mesure du défi. Le
   classement entre alliances est relevé tous les quarts d'heure ; à la
   fin de la semaine, le podium reçoit des heures de production cumulée
   de ses membres dans son trésor (game_config « alliance_challenge »).
===================================================== */

export const ALLIANCE_CHALLENGE_KEY = "alliance_challenge";

/** 6.14.154 (AU27, R6, reste d'AA-23) : défi d'alliance, fiche de la section de contenu `allianceChallenges`
 *  (Admin → Listes du jeu). L'ordre de la liste (défis retirés exclus) est la rotation hebdomadaire. */
export interface AllianceChallengeDef {
  id: string;
  name: string;
  emoji: string;
  /** Mesure cumulée des membres (succès) : sa progression pendant la semaine fait le score. */
  metric: AchievementMetric;
  hint: string;
  /** Retiré de la rotation : gardé pour la semaine en cours et le podium passé qui le citent. */
  retired?: boolean;
}

export const DEFAULT_ALLIANCE_CHALLENGES: AllianceChallengeDef[] = [
  { id: "pillards", name: "Les pillards", emoji: "💰", metric: "loot", hint: "Ressources pillées par les membres." },
  { id: "explorateurs", name: "Les explorateurs", emoji: "🧭", metric: "missions", hint: "Missions terminées par les membres." },
  { id: "arsenal", name: "L'arsenal", emoji: "🛠️", metric: "unitsBuilt", hint: "Unités construites par les membres." },
  { id: "ferrailleurs", name: "Les ferrailleurs", emoji: "♻️", metric: "recycled", hint: "Débris recyclés par les membres." },
  { id: "conquerants", name: "Les conquérants", emoji: "⚔️", metric: "victories", hint: "Victoires des membres." },
  { id: "negociants", name: "Les négociants", emoji: "📜", metric: "contracts", hint: "Contrats remplis par les membres." },
  // 6.14.69 (É30-1d, Q40) : défense mutuelle. Garnisons envoyées (tout le monde) et balayages de phalange (joueurs à lune).
  { id: "vigies", name: "Les vigies", emoji: "🛰️", metric: "vigil", hint: "Garnisons envoyées et balayages de phalange des membres." },
];

/** Défis en vigueur (section `allianceChallenges`, posée par `applyGameContent` via `setAllianceChallenges`). */
export const ALLIANCE_CHALLENGES: AllianceChallengeDef[] = structuredClone(DEFAULT_ALLIANCE_CHALLENGES);

export function setAllianceChallenges(list: AllianceChallengeDef[]): void {
  ALLIANCE_CHALLENGES.splice(0, ALLIANCE_CHALLENGES.length, ...list);
}

/**
 * Liste enregistrée + défis livrés absents (ajoutés à la fin, **retirés** : la rotation ne bouge pas, le nom d'une semaine
 * passée reste lisible). Sans liste enregistrée : les défis livrés (I43, comme talents et modules).
 */
export function withDefaultAllianceChallenges(list: unknown): AllianceChallengeDef[] {
  if (!Array.isArray(list)) return DEFAULT_ALLIANCE_CHALLENGES;
  const ids = new Set(list.map((c) => (c as { id?: unknown })?.id));
  const missing = DEFAULT_ALLIANCE_CHALLENGES.filter((c) => !ids.has(c.id)).map((c) => ({ ...c, retired: true }));
  return missing.length > 0 ? [...(list as AllianceChallengeDef[]), ...missing] : (list as AllianceChallengeDef[]);
}

/** Rotation hebdomadaire : défis non retirés, dans l'ordre de la liste (au moins un : le premier, sinon). */
export function allianceChallengeRotation(): AllianceChallengeDef[] {
  const active = ALLIANCE_CHALLENGES.filter((c) => !c.retired);
  return active.length > 0 ? active : ALLIANCE_CHALLENGES.slice(0, 1);
}

/** Erreurs de la section `allianceChallenges` (garde du serveur et éditeur). */
export function validateAllianceChallenges(list: unknown): string[] {
  if (!Array.isArray(list)) return ["Défis d'alliance : la section doit être une liste."];
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const c of list as Partial<AllianceChallengeDef>[]) {
    const label = `Défi d'alliance ${c?.name || c?.id || "?"}`;
    if (!c || typeof c.id !== "string" || !/^[A-Za-z0-9_]+$/.test(c.id)) errors.push(`${label} : identifiant invalide (lettres, chiffres, _).`);
    else if (ids.has(c.id)) errors.push(`Défis d'alliance : identifiant « ${c.id} » en double.`);
    else ids.add(c.id);
    if (!c) continue;
    if (typeof c.name !== "string" || !c.name.trim()) errors.push(`${label} : nom manquant.`);
    if (typeof c.emoji !== "string") errors.push(`${label} : emoji manquant.`);
    if (typeof c.hint !== "string") errors.push(`${label} : texte manquant.`);
    if (typeof c.metric !== "string" || !(c.metric in METRICS)) errors.push(`${label} : mesure « ${String(c.metric)} » inconnue.`);
    if (c.retired !== undefined && typeof c.retired !== "boolean") errors.push(`${label} : « retiré » doit être oui ou non.`);
  }
  if (!(list as Partial<AllianceChallengeDef>[]).some((c) => c && !c.retired)) errors.push("Défis d'alliance : au moins un défi en rotation.");
  return errors;
}

/** Heures de production cumulée des membres versées au trésor du podium. */
/** 6.9.2 (AU5) : heures de production du podium (1er, 2e, 3e…), réglables (registre « allianceChallenge »). */
export const ALLIANCE_CHALLENGE_RULES = { rewardHours: [6, 4, 2] };

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const ALLIANCE_CHALLENGE_RULES_META = {
  rewardHours: { label: "Podium : heures de production (1re, 2e, 3e alliance)", unit: "h", hint: "Une valeur par place du défi de la semaine des alliances." },
};

export interface AllianceChallengeStanding {
  allianceId: string;
  tag: string;
  name: string;
  score: number;
  /** Membres ayant progressé. */
  contributors: number;
}

export interface AllianceChallengeState {
  weekId: string;
  challengeId: string;
  baselines: Record<string, number>;
  standings: AllianceChallengeStanding[];
  updatedAtMs: number;
  /** 5.15.4 : valeurs du défi de la semaine suivante au dernier relevé (départ de la semaine
   *  prochaine : ce qui est fait entre lundi 0 h et le premier relevé compte bien). */
  next?: { weekId: string; baselines: Record<string, number> } | null;
  previous?: { weekId: string; challengeId: string; results: (AllianceChallengeStanding & { rank: number; reward: Partial<Record<ResourceId, number>> })[] } | null;
}

export function challengeOfWeek(weekId: string): AllianceChallengeDef {
  const index = Math.floor(Date.parse(`${weekId}T00:00:00Z`) / (7 * 24 * 3600_000));
  const rotation = allianceChallengeRotation();
  return rotation[((index % rotation.length) + rotation.length) % rotation.length];
}

/** Défi par identifiant (retirés compris : semaine en cours, podium passé), sinon le premier de la rotation. */
export function findAllianceChallenge(id: string): AllianceChallengeDef {
  return ALLIANCE_CHALLENGES.find((c) => c.id === id) ?? allianceChallengeRotation()[0];
}

export function normalizeAllianceChallenge(raw: unknown, now: number): AllianceChallengeState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<AllianceChallengeState>;
  const weekId = typeof r.weekId === "string" ? r.weekId : allianceWeekId(now);
  return {
    weekId,
    challengeId: typeof r.challengeId === "string" ? r.challengeId : challengeOfWeek(weekId).id,
    baselines: r.baselines && typeof r.baselines === "object" ? r.baselines : {},
    standings: Array.isArray(r.standings) ? r.standings : [],
    updatedAtMs: Number(r.updatedAtMs) || 0,
    previous: r.previous && typeof r.previous === "object" ? r.previous : null,
    next: r.next && typeof r.next === "object" && typeof r.next.weekId === "string" && r.next.baselines && typeof r.next.baselines === "object" ? r.next : null,
  };
}

/** Semaine qui suit `weekId` (lundi suivant). */
function nextAllianceWeekId(weekId: string): string {
  return allianceWeekId(Date.parse(`${weekId}T12:00:00Z`) + 7 * 24 * 3600_000);
}

function value(metric: AchievementMetric, p: PlayerState): number {
  return Math.max(0, Number(METRICS[metric]?.value(p)) || 0);
}

/** Relevé : valeurs de départ des nouveaux venus, classement des alliances. */
export function refreshAllianceChallenge(state: AllianceChallengeState, players: PlayerState[], alliances: { id: string; tag: string; name: string }[], now: number): AllianceChallengeState {
  const metric = findAllianceChallenge(state.challengeId).metric;
  const baselines = { ...state.baselines };
  for (const p of players) if (baselines[p.uid] === undefined) baselines[p.uid] = value(metric, p);
  const byAlliance = new Map<string, { score: number; contributors: number }>();
  for (const p of players) {
    if (!p.allianceId) continue;
    const gain = Math.max(0, value(metric, p) - baselines[p.uid]);
    const cur = byAlliance.get(p.allianceId) ?? { score: 0, contributors: 0 };
    byAlliance.set(p.allianceId, { score: cur.score + gain, contributors: cur.contributors + (gain > 0 ? 1 : 0) });
  }
  const standings = alliances
    .map((a) => ({ allianceId: a.id, tag: a.tag, name: a.name, ...(byAlliance.get(a.id) ?? { score: 0, contributors: 0 }) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
  // Départ de la semaine suivante : valeurs à ce relevé, tant que la semaine n'a pas changé
  // (au relevé qui suit lundi 0 h, on garde celles d'avant minuit).
  let next = state.next ?? null;
  if (allianceWeekId(now) === state.weekId) {
    const weekId = nextAllianceWeekId(state.weekId);
    const nextMetric = challengeOfWeek(weekId).metric;
    next = { weekId, baselines: Object.fromEntries(players.map((p) => [p.uid, value(nextMetric, p)])) };
  }
  return { ...state, baselines, standings, updatedAtMs: now, next };
}

/** Récompense d'une place : heures de production cumulée des membres. */
export function allianceChallengeReward(rank: number, members: Pick<PlayerState, "buildings" | "techLevels">[]): Partial<Record<ResourceId, number>> {
  const hours = ALLIANCE_CHALLENGE_RULES.rewardHours[rank - 1] ?? 0;
  const out: Partial<Record<ResourceId, number>> = {};
  if (!hours) return out;
  for (const m of members) for (const [k, v] of Object.entries(productionHours(m, hours)) as [ResourceId, number][]) out[k] = (out[k] ?? 0) + v;
  return out;
}

/** Nouvelle semaine : défi suivant, valeurs de départ = valeurs actuelles. */
export function startAllianceChallengeWeek(players: PlayerState[], now: number, previous: AllianceChallengeState["previous"], next?: AllianceChallengeState["next"]): AllianceChallengeState {
  const weekId = allianceWeekId(now);
  const challenge = challengeOfWeek(weekId);
  // 5.15.4 : valeurs relevées juste avant lundi 0 h si on les a (sinon : valeurs actuelles).
  const before = next && next.weekId === weekId ? next.baselines : null;
  const baselines: Record<string, number> = {};
  for (const p of players) baselines[p.uid] = Math.min(value(challenge.metric, p), before?.[p.uid] ?? Infinity);
  return { weekId, challengeId: challenge.id, baselines, standings: [], updatedAtMs: now, previous: previous ?? null };
}
