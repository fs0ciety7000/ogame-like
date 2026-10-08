import { currentSeasonId } from "@/game/seasons";
import type { PlayerState, PlayerTitle } from "@/types/game";

/* =====================================================
   5.15 : divisions du classement de saison (remplacent les ligues de la
   5.10.5, en pause depuis la 5.14.2). Six divisions, Bronze → Mythique.
   - Placement d'entrée selon la puissance de l'empire (XP totale).
   - Chaque semaine (du lundi 0 h UTC au suivant), on se mesure dans sa
     division à l'XP gagnée depuis lundi. Le premier cinquième monte, le
     dernier cinquième (et les inactifs) descend.
   - Récompenses de la semaine : jetons du casino selon la division, et le
     titre « Champion <division> » pour le premier.
   Tout est rangé dans game_config « leagues » (même clé qu'avant).
===================================================== */

export const LEAGUES_KEY = "leagues";

export type LeagueTier = "bronze" | "argent" | "or" | "platine" | "diamant" | "mythique";

export interface DivisionDef {
  id: LeagueTier;
  label: string;
  /** Couleur de la division (jeton du thème : médailles et raretés). */
  color: string;
  /** Jetons du casino versés à chaque participant actif de la division. */
  tokens: number;
  /** Part des joueurs placés dans cette division à l'entrée (du haut vers le bas). */
  placementPct: number;
}

/** 6.14.104 (AA3, AA-7) : jetons et part de placement lus dans LEAGUE_RULES.tiers (admin, Divisions) ; ids, noms et couleurs en dur. */
const division = (id: LeagueTier, label: string, color: string): DivisionDef => ({
  id,
  label,
  color,
  get tokens() {
    return Math.max(0, Math.floor(Number(LEAGUE_RULES.tiers[id]?.tokens) || 0));
  },
  get placementPct() {
    const v = Number(LEAGUE_RULES.tiers[id]?.placementPct);
    return Number.isFinite(v) && v >= 0 ? v : 0;
  },
});

export const LEAGUE_TIERS: DivisionDef[] = [
  division("bronze", "Bronze", "var(--th-medal-bronze)"),
  division("argent", "Argent", "var(--th-medal-silver)"),
  division("or", "Or", "var(--th-medal-gold)"),
  division("platine", "Platine", "var(--th-rarity-rare)"),
  division("diamant", "Diamant", "var(--th-rarity-epic)"),
  division("mythique", "Mythique", "var(--th-rarity-mythic)"),
];

export const LEAGUE_RULES = {
  /** Part de chaque division qui monte / descend à la fin de la semaine. */
  promotePct: 0.2,
  relegatePct: 0.2,
  /** Semaines gardées dans l'historique de chaque joueur. */
  historyWeeks: 8,
  /** 6.14.104 (AA3, AA-7) : jetons du casino par participant actif, et part des joueurs placés à l'entrée (total 1). */
  tiers: {
    bronze: { tokens: 1, placementPct: 0.25 },
    argent: { tokens: 1, placementPct: 0.25 },
    or: { tokens: 2, placementPct: 0.2 },
    platine: { tokens: 2, placementPct: 0.15 },
    diamant: { tokens: 3, placementPct: 0.1 },
    mythique: { tokens: 4, placementPct: 0.05 },
  } as Record<LeagueTier, { tokens: number; placementPct: number }>,
};

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const LEAGUE_RULES_META = {
  promotePct: { label: "Part qui monte chaque semaine", unit: "part", min: 0, max: 0.5 },
  relegatePct: { label: "Part qui descend chaque semaine", unit: "part", min: 0, max: 0.5 },
  historyWeeks: { label: "Semaines gardées dans l'historique", unit: "semaines", min: 1, max: 104 },
  tiers: { label: "Jetons et placement de chaque division", hint: "tokens : jetons du casino par participant actif (entier, 0 à 100) ; placementPct : part des joueurs placés à l'entrée. La somme des parts vaut 1 (100 %)." },
};

const WEEK_MS = 7 * 24 * 3600 * 1000;

/** Début de la semaine (lundi 0 h UTC) contenant `now`. */
function leagueWeekStart(now: number): number {
  const d = new Date(now);
  const day = (d.getUTCDay() + 6) % 7; // lundi = 0
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day);
}

/** Identifiant de semaine : date du lundi (AAAA-MM-JJ). */
export function leagueWeekId(now: number): string {
  return new Date(leagueWeekStart(now)).toISOString().slice(0, 10);
}

export function leagueWeekEnd(now: number): number {
  return leagueWeekStart(now) + WEEK_MS;
}

/** « semaine du 6 oct. » */
export function leagueWeekLabel(weekId: string): string {
  const months = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  const [, m, d] = weekId.split("-").map(Number);
  return `semaine du ${d ?? "?"} ${months[(m ?? 1) - 1] ?? ""}`.trim();
}

export interface LeagueHistoryEntry {
  weekId: string;
  tier: LeagueTier;
  rank: number;
  /** XP gagnée pendant la semaine. */
  score: number;
  move: "up" | "down" | "stay";
}

export interface LeagueState {
  version: 2;
  /** Semaine en cours (lundi, AAAA-MM-JJ) ; vide tant que le serveur n'a pas démarré les divisions. */
  weekId: string;
  tiers: Record<string, LeagueTier>;
  /** XP totale de chacun au début de la semaine (le score = ce qu'il a gagné depuis). */
  base: Record<string, number>;
  /** Dernière clôture : mouvements de chacun. */
  last: { weekId: string; moves: Record<string, { from: LeagueTier; to: LeagueTier; rank: number }> } | null;
  history: Record<string, LeagueHistoryEntry[]>;
}

const TIER_IDS = new Set<string>(LEAGUE_TIERS.map((t) => t.id));

export function normalizeLeagues(raw: unknown): LeagueState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<LeagueState> & { version?: number };
  // Les anciennes ligues (mensuelles, sans « version ») repartent de zéro : placement par puissance.
  if (r.version !== 2) return { version: 2, weekId: "", tiers: {}, base: {}, last: null, history: {} };
  const tiers: Record<string, LeagueTier> = {};
  for (const [uid, t] of Object.entries(r.tiers && typeof r.tiers === "object" ? r.tiers : {})) if (TIER_IDS.has(t)) tiers[uid] = t;
  const base: Record<string, number> = {};
  for (const [uid, v] of Object.entries(r.base && typeof r.base === "object" ? r.base : {})) if (Number.isFinite(Number(v))) base[uid] = Math.max(0, Number(v));
  const history: Record<string, LeagueHistoryEntry[]> = {};
  for (const [uid, list] of Object.entries(r.history && typeof r.history === "object" ? r.history : {})) {
    if (!Array.isArray(list)) continue;
    history[uid] = list.filter((h) => h && typeof h.weekId === "string" && TIER_IDS.has(h.tier)).slice(-LEAGUE_RULES.historyWeeks);
  }
  return { version: 2, weekId: typeof r.weekId === "string" ? r.weekId : "", tiers, base, last: r.last && typeof r.last === "object" ? r.last : null, history };
}

export function leagueInfo(tier: LeagueTier): DivisionDef {
  return LEAGUE_TIERS.find((t) => t.id === tier) ?? LEAGUE_TIERS[0];
}

const index = (tier: LeagueTier) => LEAGUE_TIERS.findIndex((t) => t.id === tier);

/** Joueur classable : pseudo et XP totale (la « puissance » de l'empire au classement). */
export interface LeagueEntry {
  uid: string;
  pseudo: string;
  xp?: number;
  npc?: string;
}

const xpOf = (e: LeagueEntry) => Math.max(0, Number(e.xp) || 0);

/** Division d'entrée selon le rang de puissance (XP totale) parmi tous les joueurs :
 *  par centile (5 % en Mythique, 10 % en Diamant…), et toujours Bronze sans XP. */
export function placementTiers(entries: LeagueEntry[]): Record<string, LeagueTier> {
  const sorted = entries.filter((e) => !e.npc).sort((a, b) => xpOf(b) - xpOf(a) || (a.uid < b.uid ? -1 : 1));
  const n = sorted.length;
  const out: Record<string, LeagueTier> = {};
  // Bornes cumulées du haut vers le bas : Mythique ≤ 5 %, Diamant ≤ 15 %, …, Bronze ≤ 100 %.
  const fromTop = [...LEAGUE_TIERS].reverse();
  sorted.forEach((e, i) => {
    if (xpOf(e) <= 0) {
      out[e.uid] = "bronze";
      return;
    }
    const f = (i + 0.5) / n;
    let acc = 0;
    out[e.uid] = fromTop.find((t) => (acc += t.placementPct) >= f - 1e-9)?.id ?? "bronze";
  });
  return out;
}

/** Division d'un joueur (placement provisoire d'après sa puissance s'il vient d'arriver). */
export function leagueTier(state: LeagueState | null | undefined, uid: string, entries?: LeagueEntry[]): LeagueTier {
  const t = state?.tiers[uid];
  if (t) return t;
  return (entries && placementTiers(entries)[uid]) || "bronze";
}

/** XP gagnée depuis lundi. */
export function weeklyScore(state: LeagueState, e: LeagueEntry): number {
  const base = state.base[e.uid];
  return base === undefined ? 0 : Math.max(0, xpOf(e) - base);
}

export interface LeagueRow {
  uid: string;
  pseudo: string;
  score: number;
  rank: number;
  zone: "up" | "down" | "stay";
}

/** Classement d'une division : rang à l'XP de la semaine et zones de montée / descente. */
export function leagueStandings(entries: LeagueEntry[], state: LeagueState, tier: LeagueTier): LeagueRow[] {
  const placed = placementTiers(entries);
  const members = entries
    .filter((e) => !e.npc && (state.tiers[e.uid] ?? placed[e.uid] ?? "bronze") === tier)
    .map((e) => ({ uid: e.uid, pseudo: e.pseudo, score: weeklyScore(state, e) }))
    .sort((a, b) => b.score - a.score || (a.pseudo < b.pseudo ? -1 : 1));
  const n = members.length;
  const top = index(tier) === LEAGUE_TIERS.length - 1;
  const up = top ? 0 : Math.ceil(n * LEAGUE_RULES.promotePct);
  const down = index(tier) > 0 ? Math.floor(n * LEAGUE_RULES.relegatePct) : 0;
  return members.map((m, i) => ({
    ...m,
    rank: i + 1,
    // Les inactifs (0 XP dans la semaine) ne montent jamais et descendent toujours (hors Bronze).
    zone: m.score > 0 && i < up ? "up" : index(tier) > 0 && (m.score <= 0 || i >= n - down) ? "down" : "stay",
  }));
}

export interface LeagueReward {
  uid: string;
  tier: LeagueTier;
  to: LeagueTier;
  rank: number;
  score: number;
  move: "up" | "down" | "stay";
  tokens: number;
  /** « Champion <division> » pour le premier (s'il a joué). */
  title: string;
}

export function championTitle(tier: LeagueTier): string {
  return `Champion ${leagueInfo(tier).label}`;
}

/**
 * Tâche du serveur (chaque heure) :
 * - premier passage : placement de tout le monde par puissance ;
 * - nouvelle semaine : clôture (mouvements, récompenses, historique) ;
 * - sinon : place les nouveaux venus et note leur XP de départ.
 */
export function leagueTick(stateIn: LeagueState, entries: LeagueEntry[], now: number): { state: LeagueState; rewards: LeagueReward[]; closedWeekId: string | null } {
  const players = entries.filter((e) => !e.npc);
  const week = leagueWeekId(now);
  const baseOf = () => Object.fromEntries(players.map((e) => [e.uid, xpOf(e)]));
  if (!stateIn.weekId) {
    return { state: { version: 2, weekId: week, tiers: placementTiers(players), base: baseOf(), last: null, history: stateIn.history ?? {} }, rewards: [], closedWeekId: null };
  }
  if (stateIn.weekId === week) {
    const placed = placementTiers(players);
    const tiers = { ...stateIn.tiers };
    const base = { ...stateIn.base };
    let changed = false;
    for (const e of players) {
      if (!tiers[e.uid]) {
        tiers[e.uid] = placed[e.uid] ?? "bronze";
        changed = true;
      }
      if (base[e.uid] === undefined) {
        base[e.uid] = xpOf(e);
        changed = true;
      }
    }
    return { state: changed ? { ...stateIn, tiers, base } : stateIn, rewards: [], closedWeekId: null };
  }
  // Nouvelle semaine : on fige la précédente.
  const state: LeagueState = { ...stateIn, tiers: { ...stateIn.tiers } };
  for (const e of players) if (!state.tiers[e.uid]) state.tiers[e.uid] = "bronze";
  const tiers: Record<string, LeagueTier> = { ...state.tiers };
  const moves: Record<string, { from: LeagueTier; to: LeagueTier; rank: number }> = {};
  const history: Record<string, LeagueHistoryEntry[]> = { ...state.history };
  const rewards: LeagueReward[] = [];
  for (const t of LEAGUE_TIERS) {
    for (const row of leagueStandings(players, state, t.id)) {
      const to = row.zone === "up" ? LEAGUE_TIERS[index(t.id) + 1].id : row.zone === "down" ? LEAGUE_TIERS[index(t.id) - 1].id : t.id;
      tiers[row.uid] = to;
      moves[row.uid] = { from: t.id, to, rank: row.rank };
      history[row.uid] = [...(history[row.uid] ?? []), { weekId: stateIn.weekId, tier: t.id, rank: row.rank, score: row.score, move: row.zone }].slice(-LEAGUE_RULES.historyWeeks);
      if (row.score > 0) rewards.push({ uid: row.uid, tier: t.id, to, rank: row.rank, score: row.score, move: row.zone, tokens: t.tokens, title: row.rank === 1 ? championTitle(t.id) : "" });
    }
  }
  // Les comptes disparus sortent des divisions.
  const alive = new Set(players.map((e) => e.uid));
  for (const uid of Object.keys(tiers)) if (!alive.has(uid)) delete tiers[uid];
  for (const uid of Object.keys(history)) if (!alive.has(uid)) delete history[uid];
  return { state: { version: 2, weekId: week, tiers, base: baseOf(), last: { weekId: stateIn.weekId, moves }, history }, rewards, closedWeekId: stateIn.weekId };
}

/** Donne le titre « Champion <division> » (un seul exemplaire par division). */
export function grantLeagueTitle(player: PlayerState, title: string, rank: number, now: number): void {
  if (!title) return;
  const entry: PlayerTitle = { label: title, seasonId: currentSeasonId(now), rank };
  player.titles = [...(player.titles ?? []).filter((t) => t.label !== title), entry];
  if (!player.activeTitle) player.activeTitle = title;
}
