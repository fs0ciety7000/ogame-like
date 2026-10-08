import { COMMON_RESOURCES, economySnapshot, storageCapacityOf } from "@/game/economy";
import { weekIdOf } from "@/game/weeklyRecap";
import type { PlayerState, Resources } from "@/types/game";

/* =====================================================
   6.14.107 (AU27, lot AE-L4) : traces de la santé de l'équilibre.
   Quatre relevés que le serveur ne pouvait pas reconstituer : l'Ambre
   gagnée par source (semaine en cours et précédente), la production perdue
   à entrepôt plein (même découpage), le dernier coffre du 7e jour et la
   date de la 1re Ascension. Tout vit dans `player.stats` (écrit par le
   serveur, refusé au client), en taille fixe : deux semaines au plus,
   une entrée par source connue, quelques nombres. Les agrégats (anonymes)
   sont calculés par `balance/health.ts`.
===================================================== */

/** Sources d'Ambre suivies. Une source nouvelle s'ajoute ici et à `AMBER_SOURCE_LABELS`. */
export const AMBER_SOURCES = ["bounties", "elite", "streak", "pass", "chronicles", "codex", "season", "boss", "referral", "recycle", "guide", "other"] as const;
export type AmberSource = (typeof AMBER_SOURCES)[number];

export const AMBER_SOURCE_LABELS: Record<AmberSource, string> = {
  bounties: "Primes",
  elite: "Proie d'élite",
  streak: "Série et coffre",
  pass: "Passe",
  chronicles: "Chroniques",
  codex: "Codex",
  season: "Fin de saison",
  boss: "Boss (reliques en trop)",
  referral: "Parrainage",
  recycle: "Recyclage",
  guide: "Guide",
  other: "Autres",
};

export type AmberBySource = Partial<Record<AmberSource, number>>;

export interface AmberWeekTrace {
  /** Semaine (lundi 00 h UTC, AAAA-MM-JJ). */
  week: string;
  by: AmberBySource;
  /** Semaine précédente, gardée au changement de semaine. */
  prev?: { week: string; by: AmberBySource } | null;
}

export interface ProductionLossTrace {
  week: string;
  /** Production possible des ressources communes (hors énergie) sur la semaine. */
  pot: number;
  /** Part perdue parce que l'entrepôt était plein. */
  lost: number;
  prev?: { week: string; pot: number; lost: number } | null;
}

export interface ChestTrace {
  atMs: number;
  /** Ressources communes du coffre, additionnées. */
  common: number;
  /** Ressources tirées au plancher, sur `n`. */
  floors: number;
  n: number;
}

const DAY = 86_400_000;
const isSource = (s: unknown): s is AmberSource => typeof s === "string" && (AMBER_SOURCES as readonly string[]).includes(s);
const num = (x: unknown) => (Number.isFinite(Number(x)) ? Number(x) : 0);

/** Semaine précédant `week` (AAAA-MM-JJ d'un lundi). */
export function previousWeekId(week: string): string {
  return new Date(Date.parse(`${week}T00:00:00Z`) - 7 * DAY).toISOString().slice(0, 10);
}

function cleanBy(raw: unknown): AmberBySource {
  const out: AmberBySource = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) if (isSource(k) && num(v) > 0) out[k] = Math.floor(num(v));
  return out;
}

/** Compte `amount` Ambre gagnée par `source` dans la semaine de `now` (taille fixe : deux semaines au plus). */
export function noteAmber(player: Pick<PlayerState, "stats">, source: AmberSource, amount: number, now: number = Date.now()): void {
  const n = Math.floor(num(amount));
  if (!(n > 0)) return;
  const src = isSource(source) ? source : "other";
  const week = weekIdOf(now);
  const raw = (player.stats?.amberWeek ?? null) as AmberWeekTrace | null;
  let cur: AmberWeekTrace;
  if (raw && raw.week === week) cur = { week, by: cleanBy(raw.by), prev: raw.prev ?? null };
  else if (raw && typeof raw.week === "string" && raw.week < week) cur = { week, by: {}, prev: raw.week === previousWeekId(week) ? { week: raw.week, by: cleanBy(raw.by) } : null };
  else cur = { week, by: {}, prev: null };
  cur.by[src] = (cur.by[src] ?? 0) + n;
  player.stats = { ...(player.stats ?? {}), amberWeek: cur };
}

/** Ambre de la semaine de `now` et de la semaine précédente (vides si la trace est plus ancienne). */
export function amberWeeks(player: Pick<PlayerState, "stats">, now: number): { week: string; current: AmberBySource; last: AmberBySource } {
  const week = weekIdOf(now);
  const before = previousWeekId(week);
  const raw = (player.stats?.amberWeek ?? null) as AmberWeekTrace | null;
  if (!raw || typeof raw.week !== "string") return { week, current: {}, last: {} };
  if (raw.week === week) return { week, current: cleanBy(raw.by), last: raw.prev?.week === before ? cleanBy(raw.prev.by) : {} };
  if (raw.week === before) return { week, current: {}, last: cleanBy(raw.by) };
  return { week, current: {}, last: {} };
}

/** Production perdue à entrepôt plein sur un intervalle de production (`before` → `after`, `elapsedSeconds` à partir de
 *  `startMs`). Une ressource commune (hors énergie) qui finit au plafond a perdu ce que sa production brute aurait dû
 *  ajouter au-delà du gain réel. Le calcul de la production ne se fait que dans ce cas (rien à payer sinon). */
export function noteProductionLoss(player: PlayerState, before: Partial<Resources>, after: Partial<Resources>, elapsedSeconds: number, startMs: number, now: number, buffered?: Partial<Record<string, number>>): void {
  if (!(elapsedSeconds > 0)) return;
  const ids = COMMON_RESOURCES.filter((r) => r !== "energy");
  let pot = 0;
  let lost = 0;
  let capacity: number | null = null;
  let gross: Partial<Record<string, number>> | null = null;
  for (const id of ids) {
    const b = num(before[id]);
    const a = num(after[id]);
    const gain = Math.max(0, a - b);
    if (capacity === null) capacity = storageCapacityOf(player);
    let wasted = 0;
    if (a >= capacity) {
      if (gross === null) gross = economySnapshot({ ...player, resources: before as Resources }, startMs).gross;
      // 6.14.143 (PB-L2) : la production gardée en tampon n'est pas perdue.
      wasted = Math.max(0, num(gross[id]) * elapsedSeconds - gain - num(buffered?.[id]));
    }
    pot += gain + wasted + num(buffered?.[id]);
    lost += wasted;
  }
  if (!(pot > 0)) return;
  const week = weekIdOf(now);
  const raw = (player.stats?.prodLoss ?? null) as ProductionLossTrace | null;
  let cur: ProductionLossTrace;
  if (raw && raw.week === week) cur = { week, pot: num(raw.pot), lost: num(raw.lost), prev: raw.prev ?? null };
  else if (raw && typeof raw.week === "string" && raw.week < week)
    cur = { week, pot: 0, lost: 0, prev: raw.week === previousWeekId(week) ? { week: raw.week, pot: num(raw.pot), lost: num(raw.lost) } : null };
  else cur = { week, pot: 0, lost: 0, prev: null };
  cur.pot = Math.round(cur.pot + pot);
  cur.lost = Math.round(cur.lost + lost);
  player.stats = { ...(player.stats ?? {}), prodLoss: cur };
}

/** Part de production perdue (0 à 1) de la dernière semaine complète, sinon de la semaine en cours (null : rien de relevé). */
export function productionLossShare(player: Pick<PlayerState, "stats">, now: number, minPot = 1): number | null {
  const week = weekIdOf(now);
  const before = previousWeekId(week);
  const raw = (player.stats?.prodLoss ?? null) as ProductionLossTrace | null;
  if (!raw || typeof raw.week !== "string") return null;
  const pick = raw.week === week ? (raw.prev?.week === before ? raw.prev : { pot: raw.pot, lost: raw.lost }) : raw.week === before ? raw : null;
  if (!pick || !(num(pick.pot) >= minPot)) return null;
  return Math.min(1, Math.max(0, num(pick.lost) / num(pick.pot)));
}

/** Garde le dernier coffre du 7e jour (montant commun et tirages au plancher). */
export function noteChest(player: Pick<PlayerState, "stats">, resources: Partial<Record<string, number>>, floor: number, now: number): void {
  const vals = Object.values(resources).map(num);
  const trace: ChestTrace = { atMs: now, common: Math.round(vals.reduce((a, b) => a + b, 0)), floors: vals.filter((v) => v <= floor).length, n: vals.length };
  player.stats = { ...(player.stats ?? {}), lastChest: trace };
}

/** Date de la 1re Ascension (relevée depuis 6.14.107 ; avant : `ascendedAtMs` quand le joueur n'en a fait qu'une). */
export function firstAscensionAtMs(player: Pick<PlayerState, "stats" | "ascensions" | "ascendedAtMs">): number | null {
  const traced = num(player.stats?.firstAscensionAtMs);
  if (traced > 0) return traced;
  if (Math.floor(num(player.ascensions)) === 1 && num(player.ascendedAtMs) > 0) return num(player.ascendedAtMs);
  return null;
}
