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
}

export const DEFAULT_CASINO: CasinoSettings = {
  mode: "scheduled",
  weekends: true,
  windows: [],
  dailyTokens: 1,
  maxTokens: 20,
  jackpotShare: 0.5,
  jackpotFallbackHours: 12,
  odds: { jackpot: 0.002, star3: 0.006, planet3: 0.012, bar3: 0.025, cherry3: 0.04, seven2: 0.06, cherry: 0.15 },
  hours: { star3: 6, planet3: 4, bar3: 3, cherry3: 2, seven2: 1 },
};

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
  updatedAtMs: number;
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
  };
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

/* ---------- état du joueur ---------- */

export function playerCasino(p: Pick<PlayerState, "casino">): PlayerCasino {
  const c = (p.casino ?? {}) as Partial<PlayerCasino>;
  const int = (v: unknown) => Math.max(0, Math.floor(Number(v) || 0));
  return { tokens: int(c.tokens), dailyDay: typeof c.dailyDay === "string" ? c.dailyDay : "", spins: int(c.spins), wins: int(c.wins), jackpots: int(c.jackpots) };
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
