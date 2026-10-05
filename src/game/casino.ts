import { parisDay } from "@/game/retention";
import type { ServerPot } from "@/game/serverPot";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   v5.12 : le Casino orbital. Le pot commun du serveur devient le gros lot
   d'une machine à sous « 777 ». Les joueurs reçoivent des jetons (un par
   jour, ou donnés par l'équipe) et tentent leur chance : trois 7 vident
   une part du pot commun, les autres combinaisons rapportent des heures de
   production ou un jeton. Le tirage est fait par le serveur : on choisit
   d'abord le résultat selon les probabilités réglées par l'équipe, puis des
   rouleaux qui l'affichent.

   État du joueur : champ `casino` ; réglages et palmarès : game_config « casino ».
===================================================== */

export const CASINO_KEY = "casino";

export type SlotSymbol = "seven" | "star" | "planet" | "bar" | "cherry" | "skull";

export const SLOT_SYMBOLS: { id: SlotSymbol; label: string }[] = [
  { id: "seven", label: "Sept" },
  { id: "star", label: "Étoile" },
  { id: "planet", label: "Planète" },
  { id: "bar", label: "BAR" },
  { id: "cherry", label: "Cerise" },
  { id: "skull", label: "Crâne" },
];

export type SpinOutcome = "jackpot" | "star3" | "planet3" | "bar3" | "cherry3" | "seven2" | "cherry" | "lose";

export type CasinoMode = "open" | "closed" | "scheduled";

export const CASINO_MODES: { id: CasinoMode; label: string }[] = [
  { id: "scheduled", label: "Programmé (créneaux et/ou week-ends)" },
  { id: "open", label: "Ouvert" },
  { id: "closed", label: "Fermé" },
];

export interface CasinoWindow {
  startMs: number;
  endMs: number;
}

export interface CasinoSettings {
  /** Ouvert, fermé, ou ouvert par le système selon le programme. */
  mode: CasinoMode;
  /** Programme : ouvert chaque week-end (samedi et dimanche, heure de Paris). */
  weekends: boolean;
  /** Programme : créneaux précis (24 au plus). */
  windows: CasinoWindow[];
  /** Jetons offerts chaque jour (heure de Paris). */
  dailyTokens: number;
  /** Au-delà, le jeton du jour n'est pas versé (pas de réserve infinie). */
  maxTokens: number;
  /** Part du pot commun versée au gros lot (0,5 = 50 %). */
  jackpotShare: number;
  /** Gros lot quand le pot est vide : heures de production. */
  jackpotFallbackHours: number;
  /** Probabilité de chaque résultat gagnant (le reste : perdu). */
  odds: Record<Exclude<SpinOutcome, "lose">, number>;
  /** Gains en heures de production. */
  hours: Record<"star3" | "planet3" | "bar3" | "cherry3" | "seven2", number>;
  /** v5.12 : jetons gagnés ailleurs dans le jeu, et tournoi de chaque ouverture. */
  rewards: CasinoRewards;
}

export interface CasinoRewards {
  /** Défi hebdo réussi : jetons par palier atteint (palier 1, palier 2…). */
  challenge: number[];
  /** Boss abattu (Léviathan, boss de saison, boss d'alliance) : jetons par participant. */
  bossWin: number;
  /** En plus pour le premier en dégâts d'un boss abattu (la moitié pour le 2e et le 3e). */
  bossTop: number;
  /** Boss qui s'est retiré : jetons par participant (souvent 0). */
  bossFail: number;
  /** Tournoi : jetons du 1er, du 2e, du 3e… */
  tournament: number[];
  /** Tournoi : titre du vainqueur (gardé jusqu'au tournoi suivant). */
  tournamentTitle: string;
  /** Titre définitif de qui aligne trois 7. */
  jackpotTitle: string;
  /** v5.14.2 : proie d'élite des primes Kesh'Vaar abattue (jetons par chasseur récompensé). */
  elite: number;
  /** v5.14.2 : seigneur de guerre pillé (attaque gagnée contre un PNJ). */
  warlord: number;
}

export const DEFAULT_CASINO: CasinoSettings = {
  mode: "scheduled",
  weekends: true,
  windows: [],
  dailyTokens: 1,
  maxTokens: 20,
  // v5.14.2 : 90 % du pot au gros lot (contre 50 %).
  jackpotShare: 0.9,
  jackpotFallbackHours: 12,
  // v5.14.2 : 777 à 0,5 % (contre 0,2 %) : environ 170 jetons en moyenne au lieu de 425.
  odds: { jackpot: 0.005, star3: 0.006, planet3: 0.012, bar3: 0.025, cherry3: 0.04, seven2: 0.06, cherry: 0.15 },
  hours: { star3: 6, planet3: 4, bar3: 3, cherry3: 2, seven2: 1 },
  rewards: { challenge: [1, 2], bossWin: 1, bossTop: 2, bossFail: 0, tournament: [5, 3, 2], tournamentTitle: "As du casino", jackpotTitle: "Main d'or", elite: 2, warlord: 1 },
};

/** Points de tournoi de chaque résultat (indépendants de la taille de l'empire). */
export const OUTCOME_POINTS: Record<SpinOutcome, number> = { jackpot: 100, star3: 30, planet3: 20, bar3: 15, cherry3: 10, seven2: 5, cherry: 1, lose: 0 };

export const OUTCOME_LABELS: Record<SpinOutcome, string> = {
  jackpot: "GROS LOT 7-7-7",
  star3: "Trois étoiles",
  planet3: "Trois planètes",
  bar3: "Triple BAR",
  cherry3: "Trois cerises",
  seven2: "Deux 7",
  cherry: "Une cerise : jeton rendu",
  lose: "Perdu",
};

export interface PlayerCasino {
  tokens: number;
  /** Jour (Paris) du dernier jeton quotidien versé. */
  dailyDay: string;
  spins: number;
  wins: number;
  jackpots: number;
  /** v5.12 : bilan de la semaine en cours (lundi → dimanche, UTC). */
  week: CasinoWeek;
  /** 5.15.12 : derniers tirages (le plus récent d'abord, 20 au plus). */
  history?: CasinoHistoryEntry[];
  /** 5.16 : jetons gagnés en combat cette semaine (plafond hebdomadaire). */
  lootWeek?: { id: string; tokens: number };
}

export interface CasinoHistoryEntry {
  atMs: number;
  outcome: SpinOutcome;
  resources: Partial<Record<ResourceId, number>>;
}

export const CASINO_HISTORY_MAX = 20;

export interface CasinoWeek {
  id: string;
  spins: number;
  wins: number;
  points: number;
  resources: Partial<Record<ResourceId, number>>;
}

export interface CasinoWin {
  uid: string;
  pseudo: string;
  atMs: number;
  outcome: SpinOutcome;
  resources: Partial<Record<ResourceId, number>>;
  /** Jeton rendu (cerise). */
  token?: boolean;
}

export interface CasinoState {
  settings: CasinoSettings;
  /** Derniers gains (40 au plus) et tous les gros lots (30 au plus). */
  recent: CasinoWin[];
  jackpots: CasinoWin[];
  totalSpins: number;
  /** Dernière ouverture annoncée aux joueurs (voir casinoOpeningId). */
  announcedId: string;
  /** v5.12 : tournoi de l'ouverture en cours, et podium du précédent. */
  tournament: CasinoTournament | null;
  lastTournament: CasinoTournamentResult | null;
  updatedAtMs: number;
}

export interface CasinoTournament {
  id: string;
  startMs: number;
  scores: Record<string, { pseudo: string; points: number; spins: number }>;
}

export interface CasinoTournamentResult {
  id: string;
  endedAtMs: number;
  participants: number;
  podium: { uid: string; pseudo: string; points: number; tokens: number }[];
  /** Détenteur du titre du tournoi (retiré au tournoi suivant). */
  titleUid: string;
}

const num = (v: unknown, def: number, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};

export function normalizeCasinoSettings(raw: unknown): CasinoSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<CasinoSettings>;
  const d = DEFAULT_CASINO;
  const odds = {} as CasinoSettings["odds"];
  for (const k of Object.keys(d.odds) as (keyof CasinoSettings["odds"])[]) odds[k] = num(r.odds?.[k], d.odds[k], 0, 1);
  const hours = {} as CasinoSettings["hours"];
  for (const k of Object.keys(d.hours) as (keyof CasinoSettings["hours"])[]) hours[k] = num(r.hours?.[k], d.hours[k], 0, 168);
  const legacy = (r as { enabled?: boolean }).enabled;
  const mode: CasinoMode = r.mode === "open" || r.mode === "closed" || r.mode === "scheduled" ? r.mode : legacy === false ? "closed" : d.mode;
  const windows = (Array.isArray(r.windows) ? r.windows : [])
    .map((w) => ({ startMs: Math.floor(Number(w?.startMs) || 0), endMs: Math.floor(Number(w?.endMs) || 0) }))
    .filter((w) => w.startMs > 0 && w.endMs > w.startMs)
    .sort((a, b) => a.startMs - b.startMs)
    .slice(0, 24);
  return {
    mode,
    weekends: r.weekends === undefined ? d.weekends : r.weekends === true,
    windows,
    dailyTokens: Math.floor(num(r.dailyTokens, d.dailyTokens, 0, 10)),
    maxTokens: Math.floor(num(r.maxTokens, d.maxTokens, 1, 1000)),
    jackpotShare: num(r.jackpotShare, d.jackpotShare, 0, 1),
    jackpotFallbackHours: num(r.jackpotFallbackHours, d.jackpotFallbackHours, 0, 168),
    odds,
    hours,
    rewards: normalizeRewards(r.rewards),
  };
}

function normalizeRewards(raw: unknown): CasinoRewards {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<CasinoRewards>;
  const d = DEFAULT_CASINO.rewards;
  const list = (v: unknown, def: number[]) => (Array.isArray(v) ? v.slice(0, 10).map((x) => Math.floor(num(x, 0, 0, 100))) : [...def]);
  const label = (v: unknown, def: string) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 40) : def);
  return {
    challenge: list(r.challenge, d.challenge),
    bossWin: Math.floor(num(r.bossWin, d.bossWin, 0, 100)),
    bossTop: Math.floor(num(r.bossTop, d.bossTop, 0, 100)),
    bossFail: Math.floor(num(r.bossFail, d.bossFail, 0, 100)),
    tournament: list(r.tournament, d.tournament),
    tournamentTitle: label(r.tournamentTitle, d.tournamentTitle),
    jackpotTitle: label(r.jackpotTitle, d.jackpotTitle),
    elite: Math.floor(num(r.elite, d.elite, 0, 100)),
    warlord: Math.floor(num(r.warlord, d.warlord, 0, 100)),
  };
}

function cleanTournament(raw: unknown): CasinoTournament | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Partial<CasinoTournament>;
  if (typeof t.id !== "string" || !t.id) return null;
  const scores: CasinoTournament["scores"] = {};
  for (const [uid, v] of Object.entries(t.scores ?? {})) {
    const x = (v ?? {}) as Partial<CasinoTournament["scores"][string]>;
    scores[uid] = { pseudo: String(x.pseudo ?? ""), points: Math.max(0, Math.floor(Number(x.points) || 0)), spins: Math.max(0, Math.floor(Number(x.spins) || 0)) };
  }
  return { id: t.id, startMs: Number(t.startMs) || 0, scores };
}

function cleanResult(raw: unknown): CasinoTournamentResult | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<CasinoTournamentResult>;
  if (typeof r.id !== "string") return null;
  const podium = (Array.isArray(r.podium) ? r.podium : []).slice(0, 10).map((p) => ({ uid: String(p?.uid ?? ""), pseudo: String(p?.pseudo ?? ""), points: Math.floor(Number(p?.points) || 0), tokens: Math.floor(Number(p?.tokens) || 0) }));
  return { id: r.id, endedAtMs: Number(r.endedAtMs) || 0, participants: Math.floor(Number(r.participants) || 0), podium, titleUid: typeof r.titleUid === "string" ? r.titleUid : "" };
}

function cleanWin(w: unknown): CasinoWin | null {
  if (!w || typeof w !== "object") return null;
  const x = w as Partial<CasinoWin>;
  if (typeof x.uid !== "string" || !(String(x.outcome) in OUTCOME_LABELS)) return null;
  const resources: Partial<Record<ResourceId, number>> = {};
  for (const [k, v] of Object.entries(x.resources ?? {})) if (Number(v) > 0) resources[k as ResourceId] = Math.floor(Number(v));
  return { uid: x.uid, pseudo: String(x.pseudo ?? ""), atMs: Number(x.atMs) || 0, outcome: x.outcome as SpinOutcome, resources, ...(x.token ? { token: true } : {}) };
}

export function normalizeCasino(raw: unknown): CasinoState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<CasinoState>;
  const list = (v: unknown, max: number) => (Array.isArray(v) ? v : []).map(cleanWin).filter((w): w is CasinoWin => !!w).slice(0, max);
  return {
    settings: normalizeCasinoSettings(r.settings),
    recent: list(r.recent, 40),
    jackpots: list(r.jackpots, 30),
    totalSpins: Math.max(0, Math.floor(Number(r.totalSpins) || 0)),
    announcedId: typeof r.announcedId === "string" ? r.announcedId : "",
    tournament: cleanTournament(r.tournament),
    lastTournament: cleanResult(r.lastTournament),
    updatedAtMs: Number(r.updatedAtMs) || 0,
  };
}

export function validateCasinoSettings(s: CasinoSettings): string[] {
  const errors: string[] = [];
  const total = Object.values(s.odds).reduce((a, b) => a + b, 0);
  if (total > 0.9) errors.push(`Les probabilités de gain dépassent 90 % (${Math.round(total * 100)} %).`);
  if (s.odds.jackpot > 0.05) errors.push("Le gros lot ne peut pas sortir plus d'une fois sur 20.");
  if (s.jackpotShare > 0.9) errors.push("Le gros lot ne peut pas vider plus de 90 % du pot.");
  if (s.mode === "scheduled" && !s.weekends && s.windows.length === 0) errors.push("Programme vide : coche les week-ends ou ajoute un créneau.");
  if (s.rewards.tournament.length === 0) errors.push("Tournoi : au moins une place récompensée.");
  return errors;
}

/* ---------- ouverture (équipe ou programme) ---------- */

const DAY = 86_400_000;

/** Samedi ou dimanche, heure de Paris. */
function parisWeekend(now: number): boolean {
  const d = new Date(`${parisDay(now)}T12:00:00Z`).getUTCDay();
  return d === 0 || d === 6;
}

/** Identifiant de la période d'ouverture en cours (null : fermé). Sert aussi à n'annoncer qu'une fois. */
export function casinoOpeningId(s: CasinoSettings, now: number): string | null {
  if (s.mode === "open") return "open";
  if (s.mode === "closed") return null;
  const w = s.windows.find((x) => now >= x.startMs && now < x.endMs);
  if (w) return `w-${w.startMs}`;
  if (s.weekends && parisWeekend(now)) {
    const day = parisDay(now);
    const sat = new Date(`${day}T12:00:00Z`).getUTCDay() === 6 ? day : parisDay(now - DAY);
    return `we-${sat}`;
  }
  return null;
}

export function casinoOpen(s: CasinoSettings, now: number): boolean {
  return casinoOpeningId(s, now) !== null;
}

/** Prochaine ouverture programmée (null si aucune dans les 14 jours). */
export function nextCasinoOpening(s: CasinoSettings, now: number): number | null {
  if (s.mode !== "scheduled") return null;
  const win = s.windows.find((w) => w.startMs > now)?.startMs ?? null;
  let we: number | null = null;
  if (s.weekends) {
    for (let h = 1; h <= 14 * 24; h++) {
      const t = now + h * 3600_000;
      if (parisWeekend(t)) {
        // Début du samedi à Paris : on recule heure par heure jusqu'à minuit.
        let start = t - (t % 3600_000);
        while (parisWeekend(start - 3600_000) && start - 3600_000 > now) start -= 3600_000;
        we = start;
        break;
      }
    }
  }
  const list = [win, we].filter((x): x is number => x !== null);
  return list.length ? Math.min(...list) : null;
}

/** Fin de l'ouverture en cours (null : fermé, ou ouvert sans fin prévue). */
export function casinoClosesAt(s: CasinoSettings, now: number): number | null {
  const id = casinoOpeningId(s, now);
  if (!id || id === "open") return null;
  if (id.startsWith("w-")) {
    const w = s.windows.find((x) => now >= x.startMs && now < x.endMs);
    // Créneau qui déborde sur un week-end : on prend la fin la plus tardive.
    if (w && !(s.weekends && parisWeekend(w.endMs))) return w.endMs;
  }
  // Week-end : première heure pleine qui n'est plus un samedi ou un dimanche à Paris.
  let t = now - (now % 3600_000) + 3600_000;
  for (let i = 0; i < 24 * 4 && parisWeekend(t); i++) t += 3600_000;
  const w = s.windows.find((x) => x.startMs <= t && x.endMs > t);
  return w ? w.endMs : t;
}

/* ---------- tournoi de chaque ouverture ---------- */

/** Identifiant du tournoi : une ouverture, ou une semaine quand le casino est ouvert sans fin. */
export function tournamentId(s: CasinoSettings, now: number): string | null {
  const id = casinoOpeningId(s, now);
  if (!id) return null;
  return id === "open" ? `open-${casinoWeekId(now)}` : id;
}

/** Tournoi terminé à clôturer, et nouveau tournoi pour l'ouverture en cours. */
export function rollTournament(state: CasinoState, now: number): { state: CasinoState; closed: CasinoTournament | null } {
  const id = tournamentId(state.settings, now);
  const cur = state.tournament;
  if (cur && cur.id === id) return { state, closed: null };
  const closed = cur && Object.keys(cur.scores).length > 0 ? cur : null;
  return { state: { ...state, tournament: id ? { id, startMs: now, scores: {} } : null }, closed };
}

/** Ajoute les points d'un tirage au tournoi en cours. */
export function scoreSpin(state: CasinoState, uid: string, pseudo: string, outcome: SpinOutcome): CasinoState {
  const t = state.tournament;
  if (!t) return state;
  const prev = t.scores[uid] ?? { pseudo, points: 0, spins: 0 };
  return { ...state, tournament: { ...t, scores: { ...t.scores, [uid]: { pseudo, points: prev.points + OUTCOME_POINTS[outcome], spins: prev.spins + 1 } } } };
}

/** Classement : points, puis moins de tirages (le plus efficace), puis pseudo. */
export function tournamentRanking(t: CasinoTournament | null): { uid: string; pseudo: string; points: number; spins: number }[] {
  if (!t) return [];
  return Object.entries(t.scores)
    .map(([uid, v]) => ({ uid, ...v }))
    .filter((x) => x.spins > 0)
    .sort((a, b) => b.points - a.points || a.spins - b.spins || (a.pseudo < b.pseudo ? -1 : a.pseudo > b.pseudo ? 1 : 0));
}

/** Podium du tournoi clôturé : jetons des premières places, titre au vainqueur (s'il a marqué). */
export function tournamentResult(t: CasinoTournament, s: CasinoSettings, now: number): CasinoTournamentResult {
  const ranking = tournamentRanking(t);
  const podium = ranking.slice(0, Math.max(3, s.rewards.tournament.length)).map((x, i) => ({ uid: x.uid, pseudo: x.pseudo, points: x.points, tokens: x.points > 0 ? (s.rewards.tournament[i] ?? 0) : 0 }));
  return { id: t.id, endedAtMs: now, participants: ranking.length, podium, titleUid: podium[0] && podium[0].points > 0 ? podium[0].uid : "" };
}

/* ---------- jetons gagnés ailleurs ---------- */

/** Jetons d'un participant à un boss terminé (rank : 0 pour le premier en dégâts). */
export function bossTokens(s: CasinoSettings, won: boolean, rank: number): number {
  if (!won) return s.rewards.bossFail;
  const podium = rank === 0 ? s.rewards.bossTop : rank === 1 || rank === 2 ? Math.floor(s.rewards.bossTop / 2) : 0;
  return s.rewards.bossWin + podium;
}

/** v5.14.2 : chances exactes du 7-7-7, par jeton (une cerise rend le jeton : on rejoue).
 *  `perToken` : chance qu'un jeton finisse sur le gros lot ; `meanTokens` : jetons en moyenne ;
 *  `medianTokens` : la moitié des joueurs l'ont avant ; `within(n)` : chance de l'avoir en n jetons. */
export function jackpotOdds(s: Pick<CasinoSettings, "odds">): { perToken: number; meanTokens: number; medianTokens: number; within: (tokens: number) => number } {
  const p = Math.max(0, s.odds.jackpot);
  const c = Math.min(0.99, Math.max(0, s.odds.cherry));
  // Un jeton ne donne rien quand la suite de tirages finit sur autre chose qu'une cerise ou un 7-7-7.
  const miss = c >= 1 ? 1 : Math.max(0, (1 - p - c) / (1 - c));
  const perToken = 1 - miss;
  return {
    perToken,
    meanTokens: perToken > 0 ? 1 / perToken : Infinity,
    medianTokens: perToken > 0 && miss > 0 ? Math.ceil(Math.log(0.5) / Math.log(miss)) : perToken > 0 ? 1 : Infinity,
    within: (tokens: number) => (perToken > 0 ? 1 - Math.pow(miss, Math.max(0, tokens)) : 0),
  };
}

/** Jetons d'un défi hebdo réussi, selon le palier atteint (index 0 : premier palier). */
export function challengeTokens(s: CasinoSettings, tierIndex: number): number {
  if (tierIndex < 0) return 0;
  const list = s.rewards.challenge;
  return list[Math.min(tierIndex, list.length - 1)] ?? 0;
}

/** Donne un titre (sans doublon) ; active=true l'affiche aussitôt. */
export function giveTitle(p: PlayerState, label: string, source: string, active = false): void {
  if (!label) return;
  if (!(p.titles ?? []).some((t) => t.label === label)) p.titles = [...(p.titles ?? []), { label, seasonId: source, rank: 1 }];
  if (active) p.activeTitle = label;
}

/** Retire un titre (tournoi suivant). */
export function removeTitle(p: PlayerState, label: string): void {
  p.titles = (p.titles ?? []).filter((t) => t.label !== label);
  if (p.activeTitle === label) p.activeTitle = p.titles[0]?.label;
}

export const tokensLabel = (n: number) => `${n} jeton${n > 1 ? "s" : ""} du casino`;

/* ---------- état du joueur ---------- */

export function playerCasino(p: Pick<PlayerState, "casino">): PlayerCasino {
  const c = (p.casino ?? {}) as Partial<PlayerCasino>;
  const int = (v: unknown) => Math.max(0, Math.floor(Number(v) || 0));
  const w = (c.week ?? {}) as Partial<CasinoWeek>;
  const resources: CasinoWeek["resources"] = {};
  for (const [k, v] of Object.entries(w.resources ?? {})) if (Number(v) > 0) resources[k as ResourceId] = Math.floor(Number(v));
  const week: CasinoWeek = { id: typeof w.id === "string" ? w.id : "", spins: int(w.spins), wins: int(w.wins), points: int(w.points), resources };
  const history = (Array.isArray(c.history) ? c.history : [])
    .filter((h): h is CasinoHistoryEntry => !!h && typeof h === "object" && Number.isFinite(Number(h.atMs)) && typeof h.outcome === "string" && h.outcome in OUTCOME_POINTS)
    .slice(0, CASINO_HISTORY_MAX);
  const lw = (c.lootWeek ?? null) as Partial<{ id: string; tokens: number }> | null;
  return {
    tokens: int(c.tokens),
    dailyDay: typeof c.dailyDay === "string" ? c.dailyDay : "",
    spins: int(c.spins),
    wins: int(c.wins),
    jackpots: int(c.jackpots),
    week,
    history,
    ...(lw && typeof lw.id === "string" ? { lootWeek: { id: lw.id, tokens: int(lw.tokens) } } : {}),
  };
}

/** Lundi 00 h (UTC) de la semaine : identifiant du bilan hebdomadaire. */
export function casinoWeekId(now: number): string {
  const day = new Date(now).getUTCDay();
  const midnight = Math.floor(now / DAY) * DAY;
  return `wk-${new Date(midnight - ((day + 6) % 7) * DAY).toISOString().slice(0, 10)}`;
}

/** Bilan de la semaine en cours (remis à zéro le lundi). */
export function casinoWeek(p: Pick<PlayerState, "casino">, now: number): CasinoWeek {
  const w = playerCasino(p).week;
  return w.id === casinoWeekId(now) ? w : { id: casinoWeekId(now), spins: 0, wins: 0, points: 0, resources: {} };
}

/** Compte un tirage : jeton dépensé (ou rendu), statistiques et bilan de la semaine. */
export function applySpin(p: PlayerState, outcome: SpinOutcome, gained: Partial<Record<ResourceId, number>>, now: number): PlayerCasino {
  const c = playerCasino(p);
  const won = outcome !== "lose";
  const w = casinoWeek(p, now);
  const resources = { ...w.resources };
  for (const [k, v] of Object.entries(gained)) if (Number(v) > 0) resources[k as ResourceId] = (resources[k as ResourceId] ?? 0) + Math.floor(Number(v));
  const next: PlayerCasino = {
    ...c,
    tokens: c.tokens - 1 + (outcome === "cherry" ? 1 : 0),
    spins: c.spins + 1,
    wins: c.wins + (won ? 1 : 0),
    jackpots: c.jackpots + (outcome === "jackpot" ? 1 : 0),
    week: { id: w.id, spins: w.spins + 1, wins: w.wins + (won ? 1 : 0), points: w.points + OUTCOME_POINTS[outcome], resources },
    history: [{ atMs: now, outcome, resources: Object.fromEntries(Object.entries(gained).filter(([, v]) => Number(v) > 0).map(([k, v]) => [k, Math.floor(Number(v))])) }, ...(c.history ?? [])].slice(0, CASINO_HISTORY_MAX),
  };
  p.casino = next;
  return next;
}

export function dailyTokenReady(p: Pick<PlayerState, "casino">, settings: CasinoSettings, now: number): boolean {
  const c = playerCasino(p);
  return casinoOpen(settings, now) && settings.dailyTokens > 0 && c.dailyDay !== parisDay(now) && c.tokens < settings.maxTokens;
}

/** Verse le jeton du jour (sans dépasser la réserve maximale). */
export function claimDailyTokens(p: PlayerState, settings: CasinoSettings, now: number): number {
  if (!dailyTokenReady(p, settings, now)) return 0;
  const c = playerCasino(p);
  const add = Math.min(settings.dailyTokens, settings.maxTokens - c.tokens);
  p.casino = { ...c, tokens: c.tokens + add, dailyDay: parisDay(now) };
  return add;
}

export function grantTokens(p: PlayerState, n: number): number {
  const c = playerCasino(p);
  const add = Math.max(0, Math.min(1000, Math.floor(n)));
  p.casino = { ...c, tokens: c.tokens + add };
  return add;
}

/* ---------- tirage ---------- */

export function rollOutcome(settings: CasinoSettings, random: () => number): SpinOutcome {
  let r = random();
  for (const k of ["jackpot", "star3", "planet3", "bar3", "cherry3", "seven2", "cherry"] as const) {
    if (r < settings.odds[k]) return k;
    r -= settings.odds[k];
  }
  return "lose";
}

const pick = <T>(list: T[], random: () => number): T => list[Math.min(list.length - 1, Math.floor(random() * list.length))];

/** Combinaison gagnante d'un trio (pour vérifier les rouleaux). */
export function evaluateReels(reels: SlotSymbol[]): SpinOutcome {
  const [a, b, c] = reels;
  if (a === b && b === c) {
    if (a === "seven") return "jackpot";
    if (a === "star") return "star3";
    if (a === "planet") return "planet3";
    if (a === "bar") return "bar3";
    if (a === "cherry") return "cherry3";
    return "lose";
  }
  if (reels.filter((s) => s === "seven").length === 2) return "seven2";
  if (reels.includes("cherry")) return "cherry";
  return "lose";
}

/** Rouleaux qui affichent le résultat tiré. */
export function reelsFor(outcome: SpinOutcome, random: () => number): SlotSymbol[] {
  const triple: Partial<Record<SpinOutcome, SlotSymbol>> = { jackpot: "seven", star3: "star", planet3: "planet", bar3: "bar", cherry3: "cherry" };
  const t = triple[outcome];
  if (t) return [t, t, t];
  const shuffle = (r: SlotSymbol[]) => {
    const a = [...r];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  if (outcome === "seven2") return shuffle(["seven", "seven", pick(["star", "planet", "bar", "skull"] as SlotSymbol[], random)]);
  if (outcome === "cherry") {
    // Une ou deux cerises, sans brelan ni double 7.
    const others = ["star", "planet", "bar", "skull", "seven"] as SlotSymbol[];
    const a = pick(others, random);
    const b = pick(others.filter((s) => s !== a), random);
    return shuffle(random() < 0.25 ? ["cherry", "cherry", a] : ["cherry", a, b]);
  }
  // Perdu : jamais de cerise, de brelan ni de double 7 ; souvent un « presque ».
  for (let guard = 0; guard < 50; guard++) {
    const pool = ["seven", "star", "planet", "bar", "skull"] as SlotSymbol[];
    const reels = random() < 0.35 ? shuffle(["seven", pick(["star", "planet", "bar", "skull"] as SlotSymbol[], random), pick(["star", "planet", "bar", "skull"] as SlotSymbol[], random)]) : [pick(pool, random), pick(pool, random), pick(pool, random)];
    if (evaluateReels(reels) === "lose") return reels;
  }
  return ["skull", "bar", "star"];
}

/** Gros lot : la part réglée de chaque ressource du pot. */
export function jackpotAmounts(pot: Pick<ServerPot, "resources">, share: number): Partial<Record<ResourceId, number>> {
  const out: Partial<Record<ResourceId, number>> = {};
  for (const [k, v] of Object.entries(pot.resources)) {
    const n = Math.floor((Number(v) || 0) * share);
    if (n > 0) out[k as ResourceId] = n;
  }
  return out;
}

/** Ajoute un gain au palmarès (récents et gros lots). */
export function recordWin(state: CasinoState, win: CasinoWin): CasinoState {
  return {
    ...state,
    recent: win.outcome === "lose" ? state.recent : [win, ...state.recent].slice(0, 40),
    jackpots: win.outcome === "jackpot" ? [win, ...state.jackpots].slice(0, 30) : state.jackpots,
    totalSpins: state.totalSpins + 1,
    updatedAtMs: win.atMs,
  };
}

/** Espérance de gain d'un jeton, en heures de production (hors gros lot) : aide au réglage. */
export function expectedHours(s: CasinoSettings): number {
  return s.odds.star3 * s.hours.star3 + s.odds.planet3 * s.hours.planet3 + s.odds.bar3 * s.hours.bar3 + s.odds.cherry3 * s.hours.cherry3 + s.odds.seven2 * s.hours.seven2;
}
