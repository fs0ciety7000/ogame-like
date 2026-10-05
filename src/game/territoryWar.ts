import { weekendWindow } from "@/game/events";
import { SECTOR_COUNT, sectorLabel, type SectorControl } from "@/game/territories";

/* =====================================================
   5.17 : guerre de territoire. Un week-end sur deux (vendredi 18 h →
   dimanche 22 h, heure de Paris), les alliances se disputent les 24
   secteurs de la galaxie. Chaque secteur a son propre tableau de points :
   - victoire en attaque sur une planète du secteur (joueur) : +10 ;
   - pillage d'un seigneur de guerre situé dans le secteur : +4 ;
   - défense tenue dans le secteur (contre un joueur ou un seigneur) : +6 ;
   - chaque heure, l'alliance qui contrôle le secteur (territoires) : +5.
   Entre deux mêmes joueurs, seuls les 3 premiers combats comptent.
   À la fin, l'alliance en tête d'un secteur le remporte. Chaque membre
   reçoit des jetons selon les secteurs remportés par son alliance, et
   l'alliance qui en remporte le plus gagne un titre.
   L'état vit dans game_config (clé « territory_war ») : carte en direct.
===================================================== */

export const TERRITORY_WAR_KEY = "territory_war";

export const TERRITORY_WAR_RULES = {
  enabled: true,
  /** Un week-end sur N (numéro de semaine modulo N = décalage). */
  everyWeeks: 2,
  weekOffset: 0,
  /** Fin le dimanche, heures avant minuit (2 → 22 h). */
  endHoursBeforeMidnight: 2,
  /** Combats comptés au plus entre deux mêmes joueurs (contre l'entente entre alliances). */
  maxPerPair: 3,
  points: { pvpWin: 10, warlordWin: 4, defenseWin: 6, holdPerHour: 5 },
  rewards: { tokensPerSector: 3, maxTokens: 15, winnerTokens: 10, winnerTitle: "Conquérant des secteurs" },
};

export type TerritoryWarRules = typeof TERRITORY_WAR_RULES;

export interface TerritoryWarEvent {
  t: number;
  sector: number;
  allianceId: string;
  tag: string;
  pts: number;
  text: string;
}

export interface TerritoryWarResult {
  allianceId: string;
  tag: string;
  sectors: number[];
  points: number;
}

export interface TerritoryWarState {
  id: string;
  startMs: number;
  endMs: number;
  status: "active" | "closed";
  /** Points par secteur puis par alliance. */
  points: Record<string, Record<string, number>>;
  tags: Record<string, string>;
  feed: TerritoryWarEvent[];
  /** Combats déjà comptés par paire de joueurs (« attaquant>défenseur »). */
  pairs?: Record<string, number>;
  /** Dernière distribution des points de contrôle (une par heure). */
  lastHoldMs?: number;
  closedAtMs?: number;
  results?: TerritoryWarResult[];
  rewarded?: boolean;
  /** Ouverte à la main par l'équipe (hors calendrier). */
  manual?: boolean;
}

const FEED_MAX = 40;

/** Guerre en cours selon le calendrier (null hors week-end de guerre). */
export function territoryWarWindow(now: number, rules: TerritoryWarRules = TERRITORY_WAR_RULES): { id: string; startMs: number; endMs: number } | null {
  if (!rules.enabled) return null;
  const w = weekendWindow(now);
  const endMs = w.endMs - rules.endHoursBeforeMidnight * 3600_000;
  if (now < w.startMs || now >= endMs) return null;
  if (((w.week % rules.everyWeeks) + rules.everyWeeks) % rules.everyWeeks !== rules.weekOffset % rules.everyWeeks) return null;
  return { id: `tw-${w.week}`, startMs: w.startMs, endMs };
}

/** Prochaine guerre (ou celle en cours), pour le compte à rebours. */
export function nextTerritoryWar(now: number, rules: TerritoryWarRules = TERRITORY_WAR_RULES): { id: string; startMs: number; endMs: number } | null {
  if (!rules.enabled) return null;
  for (let k = 0; k <= rules.everyWeeks * 2 + 1; k++) {
    const w = weekendWindow(now, k);
    const endMs = w.endMs - rules.endHoursBeforeMidnight * 3600_000;
    if (endMs <= now) continue;
    if (((w.week % rules.everyWeeks) + rules.everyWeeks) % rules.everyWeeks === rules.weekOffset % rules.everyWeeks) return { id: `tw-${w.week}`, startMs: w.startMs, endMs };
  }
  return null;
}

export function openTerritoryWar(win: { id: string; startMs: number; endMs: number }, manual = false): TerritoryWarState {
  return { id: win.id, startMs: win.startMs, endMs: win.endMs, status: "active", points: {}, tags: {}, feed: [], ...(manual ? { manual: true } : {}) };
}

export function isTerritoryWarActive(state: TerritoryWarState | null | undefined, now: number): boolean {
  return !!state && state.status === "active" && now >= state.startMs && now < state.endMs;
}

/** Ajoute des points à une alliance dans un secteur (sans effet hors guerre active). */
export function scoreTerritoryWar(
  state: TerritoryWarState,
  ev: { sector: number; allianceId: string; tag: string; pts: number; text: string; pair?: string },
  now: number,
  rules: TerritoryWarRules = TERRITORY_WAR_RULES,
): TerritoryWarState {
  if (!isTerritoryWarActive(state, now) || !ev.allianceId || !(ev.pts > 0) || ev.sector < 0 || ev.sector >= SECTOR_COUNT) return state;
  const used = ev.pair ? (state.pairs?.[ev.pair] ?? 0) : 0;
  if (ev.pair && used >= rules.maxPerPair) return state;
  const key = String(ev.sector);
  const sector = { ...(state.points[key] ?? {}) };
  sector[ev.allianceId] = (sector[ev.allianceId] ?? 0) + Math.round(ev.pts);
  return {
    ...state,
    points: { ...state.points, [key]: sector },
    tags: ev.tag ? { ...state.tags, [ev.allianceId]: ev.tag } : state.tags,
    feed: [...state.feed, { t: now, sector: ev.sector, allianceId: ev.allianceId, tag: ev.tag, pts: Math.round(ev.pts), text: ev.text }].slice(-FEED_MAX),
    ...(ev.pair ? { pairs: { ...(state.pairs ?? {}), [ev.pair]: used + 1 } } : {}),
  };
}

/** Points de contrôle de l'heure : l'alliance qui tient chaque secteur (territoires). Une fois par heure au plus. */
export function scoreHoldHour(state: TerritoryWarState, sectors: (Pick<SectorControl, "id" | "allianceId"> & { tag?: string })[], now: number, rules: TerritoryWarRules = TERRITORY_WAR_RULES): TerritoryWarState {
  if (!isTerritoryWarActive(state, now) || (state.lastHoldMs && now - state.lastHoldMs < 50 * 60_000)) return state;
  let s = state;
  for (const sec of sectors) {
    if (!sec.allianceId) continue;
    s = scoreTerritoryWar(s, { sector: sec.id, allianceId: sec.allianceId, tag: sec.tag ?? "", pts: rules.points.holdPerHour, text: `[${sec.tag ?? "?"}] tient ${sectorLabel(sec.id)}` }, now, rules);
  }
  return { ...s, lastHoldMs: now };
}

/** Meneur de chaque secteur (null : aucun point, ou égalité parfaite en tête). */
export function sectorLeaders(state: Pick<TerritoryWarState, "points" | "tags">): { sector: number; allianceId: string | null; tag: string; points: number; runnerUp: number }[] {
  return Array.from({ length: SECTOR_COUNT }, (_, sector) => {
    const entries = Object.entries(state.points[String(sector)] ?? {}).sort((a, b) => b[1] - a[1]);
    const [first, second] = entries;
    const tie = !!first && !!second && first[1] === second[1];
    const allianceId = first && !tie ? first[0] : null;
    return { sector, allianceId, tag: allianceId ? (state.tags[allianceId] ?? "") : "", points: first?.[1] ?? 0, runnerUp: second?.[1] ?? 0 };
  });
}

/** Classement des alliances : secteurs menés, puis points totaux. */
export function territoryWarStandings(state: Pick<TerritoryWarState, "points" | "tags">): TerritoryWarResult[] {
  const by = new Map<string, TerritoryWarResult>();
  const row = (id: string) => {
    if (!by.has(id)) by.set(id, { allianceId: id, tag: state.tags[id] ?? "", sectors: [], points: 0 });
    return by.get(id)!;
  };
  for (const sec of Object.values(state.points)) for (const [id, pts] of Object.entries(sec)) row(id).points += pts;
  for (const l of sectorLeaders(state)) if (l.allianceId) row(l.allianceId).sectors.push(l.sector);
  return [...by.values()].sort((a, b) => b.sectors.length - a.sectors.length || b.points - a.points);
}

export function closeTerritoryWar(state: TerritoryWarState, now: number): TerritoryWarState {
  return { ...state, status: "closed", closedAtMs: now, results: territoryWarStandings(state) };
}

/** Récompense de chaque membre, par alliance. */
export function territoryWarRewards(results: TerritoryWarResult[], rules: TerritoryWarRules = TERRITORY_WAR_RULES): Record<string, { tokens: number; title: string | null; sectors: number; rank: number }> {
  const out: Record<string, { tokens: number; title: string | null; sectors: number; rank: number }> = {};
  results.forEach((r, i) => {
    if (r.sectors.length === 0) return;
    const winner = i === 0;
    const tokens = Math.min(rules.rewards.maxTokens, r.sectors.length * rules.rewards.tokensPerSector) + (winner ? rules.rewards.winnerTokens : 0);
    out[r.allianceId] = { tokens, title: winner && rules.rewards.winnerTitle ? rules.rewards.winnerTitle : null, sectors: r.sectors.length, rank: i + 1 };
  });
  return out;
}

export function normalizeTerritoryWar(raw: unknown): TerritoryWarState | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<TerritoryWarState>;
  if (!r.id || !(Number(r.endMs) > 0)) return null;
  return {
    id: String(r.id),
    startMs: Number(r.startMs) || 0,
    endMs: Number(r.endMs),
    status: r.status === "closed" ? "closed" : "active",
    points: r.points && typeof r.points === "object" ? r.points : {},
    tags: r.tags && typeof r.tags === "object" ? r.tags : {},
    feed: Array.isArray(r.feed) ? r.feed.filter((f) => f && Number.isFinite(f.t)).slice(-FEED_MAX) : [],
    ...(r.pairs && typeof r.pairs === "object" ? { pairs: r.pairs } : {}),
    ...(r.lastHoldMs ? { lastHoldMs: Number(r.lastHoldMs) } : {}),
    ...(r.closedAtMs ? { closedAtMs: Number(r.closedAtMs) } : {}),
    ...(Array.isArray(r.results) ? { results: r.results } : {}),
    ...(r.rewarded ? { rewarded: true } : {}),
    ...(r.manual ? { manual: true } : {}),
  };
}

export function validateTerritoryWarRules(r: Partial<TerritoryWarRules> | undefined): string[] {
  if (!r) return [];
  const errors: string[] = [];
  if (r.everyWeeks !== undefined && !(Number.isInteger(r.everyWeeks) && r.everyWeeks >= 1 && r.everyWeeks <= 8)) errors.push("Guerre de territoire : un week-end sur 1 à 8.");
  if (r.weekOffset !== undefined && !(Number.isInteger(r.weekOffset) && r.weekOffset >= 0)) errors.push("Guerre de territoire : décalage entier positif.");
  if (r.maxPerPair !== undefined && !(Number.isInteger(r.maxPerPair) && r.maxPerPair >= 1)) errors.push("Guerre de territoire : au moins un combat compté par paire de joueurs.");
  if (r.endHoursBeforeMidnight !== undefined && !(r.endHoursBeforeMidnight >= 0 && r.endHoursBeforeMidnight <= 12)) errors.push("Guerre de territoire : fin entre 12 h et minuit le dimanche.");
  for (const [k, v] of Object.entries(r.points ?? {})) if (!(Number(v) >= 0)) errors.push(`Guerre de territoire : points « ${k} » positifs.`);
  for (const [k, v] of Object.entries(r.rewards ?? {})) if (k !== "winnerTitle" && !(Number(v) >= 0)) errors.push(`Guerre de territoire : récompense « ${k} » positive.`);
  return errors;
}
