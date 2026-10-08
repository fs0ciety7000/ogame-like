import type { PlayerState } from "@/types/game";

/* =====================================================
   5.16 : rattrapage de production. Une fois par jour, le serveur compare
   le développement de chaque joueur actif (niveaux de bâtiments et de
   technologies) à la médiane des joueurs actifs. Un empire nettement en
   retard reçoit un petit bonus de production, qui fond à mesure qu'il
   se rapproche du peloton :
     ratio ≤ fullBelow       → bonus maximal
     fullBelow < ratio < endsAt → bonus dégressif (linéaire)
     ratio ≥ endsAt          → aucun bonus
   Le bonus est figé pour la journée (bonuses.catchup) : client et serveur
   lisent la même valeur, la production reste identique des deux côtés.
===================================================== */

export const CATCHUP_RULES = {
  enabled: true,
  /** Bonus maximal (0,5 = +50 % de production). 6.14.106 (AU27, AE-15) : 0,25 → 0,5. Hors de la couche empire (I14) :
   *  multiplicateur à part, borné par `catchupFactorAt` et par la validation (≤ +100 %). */
  maxBonus: 0.5,
  /** En dessous de ce ratio de la médiane : bonus maximal. 6.14.106 (AE-15) : 0,1 → 0,2. */
  fullBelow: 0.2,
  /** À partir de ce ratio de la médiane : plus de bonus. */
  endsAt: 0.5,
  /** Nombre minimal de joueurs actifs pour calculer une médiane fiable. */
  minPlayers: 5,
  /** Fenêtre d'activité (jours) pour compter un joueur dans la médiane. */
  activeDays: 7,
};

export type CatchupRules = typeof CATCHUP_RULES;

/** Bonus figé pour la journée. */
export interface CatchupBonus {
  /** Multiplicateur de production (1,15 = +15 %). */
  factor: number;
  /** Valable jusqu'à (ms). */
  untilMs: number;
  /** Ratio du joueur à la médiane, pour l'affichage (0,2 = 20 %). */
  ratio: number;
}

/** Développement d'un empire : niveaux de bâtiments et de technologies cumulés. */
export function developmentScore(p: Pick<PlayerState, "buildings" | "techLevels">): number {
  let total = 0;
  for (const b of Object.values(p.buildings ?? {})) total += Math.max(0, Number((b as { level?: number })?.level) || 0);
  for (const lvl of Object.values(p.techLevels ?? {})) total += Math.max(0, Number(lvl) || 0);
  return total;
}

export function median(values: number[]): number {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (v.length === 0) return 0;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

/** Bonus de rattrapage (0,12 = +12 %) pour un score donné face à la médiane. */
export function catchupBonus(score: number, med: number, rules: CatchupRules = CATCHUP_RULES): number {
  if (!rules.enabled || !(med > 0) || !(rules.maxBonus > 0)) return 0;
  const ratio = Math.max(0, score) / med;
  if (ratio >= rules.endsAt) return 0;
  if (ratio <= rules.fullBelow) return rules.maxBonus;
  const span = rules.endsAt - rules.fullBelow;
  return span > 0 ? rules.maxBonus * ((rules.endsAt - ratio) / span) : 0;
}

/** Multiplicateur de production en vigueur à `at` (1 hors bonus ou bonus expiré). */
export function catchupFactorAt(input: { bonuses?: { catchup?: CatchupBonus | null } | null }, at: number): number {
  const c = input.bonuses?.catchup;
  if (!c || !(Number(c.factor) > 1) || !(at < Number(c.untilMs))) return 1;
  return Math.min(1 + CATCHUP_RULES.maxBonus + 0.0001, Number(c.factor));
}

/** Fin du bonus en cours (0 sans bonus), pour découper le calcul de production. */
export function catchupUntil(input: { bonuses?: { catchup?: CatchupBonus | null } | null }): number {
  const c = input.bonuses?.catchup;
  return c && Number(c.factor) > 1 ? Number(c.untilMs) || 0 : 0;
}

/** Bonus de la journée pour chaque joueur actif (serveur, une fois par jour). */
export function computeCatchup(
  players: { uid: string; score: number; lastActiveMs: number }[],
  now: number,
  rules: CatchupRules = CATCHUP_RULES,
): { median: number; bonuses: Record<string, CatchupBonus | null> } {
  const active = players.filter((p) => now - p.lastActiveMs < rules.activeDays * 86400_000);
  const med = active.length >= rules.minPlayers ? median(active.map((p) => p.score)) : 0;
  const bonuses: Record<string, CatchupBonus | null> = {};
  for (const p of players) {
    const bonus = catchupBonus(p.score, med, rules);
    bonuses[p.uid] = bonus > 0 ? { factor: Math.round((1 + bonus) * 1000) / 1000, untilMs: now + 26 * 3600_000, ratio: Math.round((p.score / med) * 1000) / 1000 } : null;
  }
  return { median: med, bonuses };
}

export function validateCatchupRules(r: Partial<CatchupRules> | undefined): string[] {
  if (!r) return [];
  const errors: string[] = [];
  if (r.maxBonus !== undefined && !(r.maxBonus >= 0 && r.maxBonus <= 1)) errors.push("Rattrapage : bonus maximal entre 0 et 1 (1 = +100 %).");
  const full = r.fullBelow ?? CATCHUP_RULES.fullBelow;
  const ends = r.endsAt ?? CATCHUP_RULES.endsAt;
  if (!(full >= 0 && ends > full && ends <= 1)) errors.push("Rattrapage : il faut 0 ≤ plein bonus < fin du bonus ≤ 1.");
  if (r.minPlayers !== undefined && !(Number.isInteger(r.minPlayers) && r.minPlayers >= 2)) errors.push("Rattrapage : au moins 2 joueurs actifs pour la médiane.");
  if (r.activeDays !== undefined && !(r.activeDays >= 1 && r.activeDays <= 60)) errors.push("Rattrapage : fenêtre d'activité entre 1 et 60 jours.");
  return errors;
}
