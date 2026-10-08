import { isTargetedMetric, METRICS, type AchievementMetric } from "@/game/achievements";
import type { ServerPot } from "@/game/serverPot";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   v5.10.5 : concours du pot commun. L'équipe crée un concours (titre,
   critère = une mesure du joueur, début, fin, part du pot, répartition
   entre les premières places). Le score est la progression de la mesure
   pendant le concours. Le serveur relève le classement régulièrement
   et verse les prix depuis le pot à la fin (game_config « contests »).
===================================================== */

export const CONTESTS_KEY = "contests";
export const CONTEST_RULES = {
  /** Concours gardés (les plus anciens terminés sont oubliés). */
  maxKept: 20,
  /** Places affichées au classement. */
  standingsSize: 20,
  /** Part du pot qu'un concours peut engager, au plus. */
  maxPotShare: 0.8,
};

export type ContestStatus = "scheduled" | "running" | "done" | "cancelled";

export interface ContestStanding {
  uid: string;
  pseudo: string;
  score: number;
}

export interface Contest {
  id: string;
  title: string;
  description: string;
  metric: AchievementMetric;
  startMs: number;
  endMs: number;
  /** Part du pot engagée à la fin (0,25 = 25 %). */
  potShare: number;
  /** 5.26.2 : part de la réserve d'Ambre du pot engagée à la fin (0 : aucune). */
  amberShare?: number;
  /** Répartition entre les premières places (somme ≤ 1), ex. [0,5, 0,3, 0,2]. */
  places: number[];
  status: ContestStatus;
  /** Valeur de la mesure de chaque joueur au début (ou à sa première apparition). */
  baselines: Record<string, number>;
  standings: ContestStanding[];
  updatedAtMs: number;
  /** Prix versés à la fin. */
  results?: { uid: string; pseudo: string; rank: number; score: number; resources: Partial<Record<ResourceId, number>>; amber?: number }[];
  createdBy?: string;
}

export interface ContestsState {
  list: Contest[];
}

const num = (v: unknown, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

export function normalizeContests(raw: unknown): ContestsState {
  const list = raw && typeof raw === "object" && Array.isArray((raw as ContestsState).list) ? (raw as ContestsState).list : [];
  return {
    list: list
      .filter((c): c is Contest => !!c && typeof c === "object" && typeof c.id === "string" && (c.metric as string) in METRICS)
      .map((c) => ({
        id: c.id,
        title: String(c.title ?? "").slice(0, 80),
        description: String(c.description ?? "").slice(0, 400),
        metric: c.metric,
        startMs: num(c.startMs),
        endMs: num(c.endMs),
        potShare: Math.min(CONTEST_RULES.maxPotShare, Math.max(0, num(c.potShare))),
        ...(num(c.amberShare) > 0 ? { amberShare: Math.min(CONTEST_RULES.maxPotShare, num(c.amberShare)) } : {}),
        places: (Array.isArray(c.places) ? c.places : []).map((p) => Math.max(0, num(p))).slice(0, 10),
        status: (["scheduled", "running", "done", "cancelled"] as ContestStatus[]).includes(c.status) ? c.status : "scheduled",
        baselines: c.baselines && typeof c.baselines === "object" ? c.baselines : {},
        standings: Array.isArray(c.standings) ? c.standings.slice(0, CONTEST_RULES.standingsSize) : [],
        updatedAtMs: num(c.updatedAtMs),
        ...(Array.isArray(c.results) ? { results: c.results } : {}),
        ...(c.createdBy ? { createdBy: String(c.createdBy) } : {}),
      })),
  };
}

export function validateContest(c: Pick<Contest, "title" | "metric" | "startMs" | "endMs" | "potShare" | "places" | "amberShare">, now: number): string[] {
  const errors: string[] = [];
  if (!c.title?.trim()) errors.push("Donne un titre au concours.");
  if (!((c.metric as string) in METRICS)) errors.push("Critère inconnu.");
  // 6.14.129 : une mesure ciblée (par unité, par bâtiment) n'a pas de contenu visé dans un concours.
  else if (isTargetedMetric(c.metric)) errors.push("Critère réservé aux succès par contenu.");
  if (!(c.endMs > c.startMs)) errors.push("La fin doit suivre le début.");
  if (!(c.endMs > now)) errors.push("La fin doit être dans le futur.");
  if (c.endMs - c.startMs > 60 * 24 * 3600_000) errors.push("Un concours dure 60 jours au plus.");
  const max = CONTEST_RULES.maxPotShare;
  const amber = c.amberShare ?? 0;
  if (!(c.potShare >= 0 && c.potShare <= max) || !(amber >= 0 && amber <= max)) errors.push(`Parts du pot entre 0 et ${Math.round(max * 100)} %.`);
  else if (!(c.potShare > 0 || amber > 0)) errors.push("Engage une part des ressources ou de l'Ambre du pot.");
  const sum = c.places.reduce((a, b) => a + b, 0);
  if (c.places.length === 0 || c.places.some((p) => !(p > 0))) errors.push("Indique au moins une place récompensée.");
  if (sum > 1.0001) errors.push("La répartition des places dépasse 100 %.");
  return errors;
}

export function contestPhase(c: Contest, now: number): "scheduled" | "running" | "ending" | "done" | "cancelled" {
  if (c.status === "done" || c.status === "cancelled") return c.status;
  if (now < c.startMs) return "scheduled";
  return now < c.endMs ? "running" : "ending";
}

export function metricValue(c: Pick<Contest, "metric">, player: PlayerState): number {
  const m = METRICS[c.metric];
  return m ? Math.max(0, Number(m.value(player)) || 0) : 0;
}

/** Score d'un joueur : progression de la mesure depuis sa valeur de départ. */
export function contestScore(c: Contest, player: PlayerState): number {
  const base = c.baselines[player.uid];
  return base === undefined ? 0 : Math.max(0, metricValue(c, player) - base);
}

/** Relevé : valeurs de départ des nouveaux joueurs, classement à jour. */
export function refreshContest(c: Contest, players: PlayerState[], now: number): Contest {
  const baselines = { ...c.baselines };
  for (const p of players) if (baselines[p.uid] === undefined) baselines[p.uid] = metricValue(c, p);
  const next = { ...c, baselines };
  const standings = players
    .map((p) => ({ uid: p.uid, pseudo: p.pseudo, score: contestScore(next, p) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, CONTEST_RULES.standingsSize);
  return { ...next, standings, updatedAtMs: now };
}

/** Enveloppe engagée : part du pot (ressource par ressource). */
export function contestPurse(c: Pick<Contest, "potShare">, pot: Pick<ServerPot, "resources">): Partial<Record<ResourceId, number>> {
  const out: Partial<Record<ResourceId, number>> = {};
  for (const [k, v] of Object.entries(pot.resources) as [ResourceId, number][]) {
    const n = Math.floor((v ?? 0) * c.potShare);
    if (n > 0) out[k] = n;
  }
  return out;
}

/** 5.26.2 : Ambre engagée (part de la réserve d'Ambre du pot). */
export function contestAmberPurse(c: Pick<Contest, "amberShare">, pot: Pick<ServerPot, "amber">): number {
  return Math.max(0, Math.floor((pot.amber ?? 0) * (c.amberShare ?? 0)));
}

/** Prix par place (à partir du classement final et de l'enveloppe ; Ambre en plus si engagée). */
export function contestPrizes(c: Contest, purse: Partial<Record<ResourceId, number>>, amberPurse = 0): { uid: string; pseudo: string; rank: number; score: number; resources: Partial<Record<ResourceId, number>>; amber: number }[] {
  return c.standings.slice(0, c.places.length).map((s, i) => {
    const resources: Partial<Record<ResourceId, number>> = {};
    for (const [k, v] of Object.entries(purse) as [ResourceId, number][]) {
      const n = Math.floor(v * c.places[i]);
      if (n > 0) resources[k] = n;
    }
    return { uid: s.uid, pseudo: s.pseudo, rank: i + 1, score: s.score, resources, amber: Math.floor(amberPurse * c.places[i]) };
  });
}

/** Concours à afficher aux joueurs : en cours d'abord, puis à venir, puis les derniers terminés. */
export function visibleContests(state: ContestsState, now: number): Contest[] {
  const order = { running: 0, ending: 0, scheduled: 1, done: 2, cancelled: 3 } as const;
  return state.list
    .filter((c) => c.status !== "cancelled")
    .sort((a, b) => order[contestPhase(a, now)] - order[contestPhase(b, now)] || b.endMs - a.endMs)
    .slice(0, 6);
}

/** Les plus anciens concours terminés sont oubliés au-delà de la limite. */
export function pruneContests(list: Contest[]): Contest[] {
  const open = list.filter((c) => c.status === "scheduled" || c.status === "running");
  const closed = list.filter((c) => !(c.status === "scheduled" || c.status === "running")).sort((a, b) => b.endMs - a.endMs);
  return [...open, ...closed].slice(0, CONTEST_RULES.maxKept);
}
