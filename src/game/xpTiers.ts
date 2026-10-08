import { missionRewardFactor } from "@/game/events";
import { parisDay } from "@/game/retention";
import type { XpSource } from "@/game/xpAudit";
import type { PlayerState } from "@/types/game";

/* =====================================================
   5.18 : paliers d'XP par source et par jour (heure de Paris).
   Chaque source a deux seuils : l'XP est pleine jusqu'au premier, réduite
   (50 %) jusqu'au second, puis très réduite (25 %). Le compteur repart à
   minuit. Objectif : récompenser le jeu varié plutôt que la répétition
   d'une seule activité. Les succès ne sont pas concernés (gains uniques).
   Bonus au jeu actif : multiplicateurs par source (expéditions, primes),
   appliqués avant les paliers.
===================================================== */

export type TieredSource = Exclude<XpSource, "achievement" | "other">;

export const TIERED_SOURCES: TieredSource[] = ["mission", "expedition", "bounty", "attack", "defense", "pirate", "contract"];

export const XP_TIER_RULES = {
  enabled: true,
  /** Taux entre le premier et le second seuil, puis au-delà. */
  midRate: 0.5,
  highRate: 0.25,
  /** Pendant un week-end à bonus de missions, les seuils des missions suivent le bonus. */
  eventScaling: true,
  /** Seuils journaliers (XP avant réduction) : [plein tarif jusqu'à, demi-tarif jusqu'à]. */
  // 5.18 : le jeu actif (expéditions, primes, combats, factions) rapporte plus que les missions.
  tiers: {
    mission: [2000, 4000],
    expedition: [4000, 8000],
    bounty: [4000, 8000],
    attack: [3000, 6000],
    defense: [2500, 5000],
    pirate: [3000, 6000],
    contract: [1500, 3000],
  } as Record<TieredSource, [number, number]>,
  /** Bonus au jeu actif (appliqués avant les paliers). */
  multipliers: { expedition: 1.5, bounty: 1.5, attack: 1.5, pirate: 1.5, defense: 1.25 } as Partial<Record<XpSource, number>>,
};

export type XpTierRules = typeof XP_TIER_RULES;

export interface XpDayState {
  day: string;
  /** XP brute de la journée par source (avant réduction), pour situer le palier. */
  gross: Partial<Record<XpSource, number>>;
  /** XP réellement créditée par source. */
  applied: Partial<Record<XpSource, number>>;
}

/** Seuils d'une source à cet instant (bonus d'événement compris pour les missions). */
function tierThresholds(source: XpSource, now: number, rules: XpTierRules = XP_TIER_RULES): [number, number] | null {
  const t = (rules.tiers as Partial<Record<XpSource, [number, number]>>)[source];
  if (!t) return null;
  const scale = source === "mission" && rules.eventScaling ? Math.max(1, missionRewardFactor(now)) : 1;
  return [t[0] * scale, Math.max(t[0], t[1]) * scale];
}

/** XP créditée pour un gain brut, sachant ce qui a déjà été gagné aujourd'hui (intégrale par morceaux). */
export function tieredAmount(before: number, gain: number, thresholds: [number, number], rules: Pick<XpTierRules, "midRate" | "highRate"> = XP_TIER_RULES): number {
  const [a, b] = thresholds;
  const seg = (lo: number, hi: number) => Math.max(0, Math.min(before + gain, hi) - Math.max(before, lo));
  return seg(0, a) + seg(a, b) * rules.midRate + seg(b, Infinity) * rules.highRate;
}

/** État du jour (remis à zéro à minuit, heure de Paris). */
export function xpDayState(player: Pick<PlayerState, "stats">, now: number): XpDayState {
  const day = parisDay(now);
  const st = player.stats?.xpDay;
  return st && st.day === day ? { day, gross: { ...st.gross }, applied: { ...st.applied } } : { day, gross: {}, applied: {} };
}

/**
 * Applique bonus et paliers à un gain d'XP positif et met à jour le compteur du jour.
 * Retourne l'XP à créditer (arrondie). Les pertes et les sources hors paliers passent telles quelles.
 */
export function applyXpTiers(player: Pick<PlayerState, "stats">, source: XpSource, raw: number, now: number, rules: XpTierRules = XP_TIER_RULES): number {
  if (!rules.enabled || !(raw > 0)) return raw;
  const gross = raw * (rules.multipliers[source] ?? 1);
  const st = xpDayState(player, now);
  const thresholds = tierThresholds(source, now, rules);
  const before = st.gross[source] ?? 0;
  const applied = Math.round(thresholds ? tieredAmount(before, gross, thresholds, rules) : gross);
  st.gross[source] = before + gross;
  st.applied[source] = (st.applied[source] ?? 0) + applied;
  player.stats = { ...(player.stats ?? {}), xpDay: st };
  return applied;
}

/** Où en est le joueur aujourd'hui, source par source (pour la jauge de la page Missions et l'audit). */
export function xpTierStatus(player: Pick<PlayerState, "stats">, now: number, rules: XpTierRules = XP_TIER_RULES): { source: TieredSource; gross: number; applied: number; thresholds: [number, number]; rate: number }[] {
  const st = xpDayState(player, now);
  return TIERED_SOURCES.map((source) => {
    const thresholds = tierThresholds(source, now, rules) ?? [0, 0];
    const gross = st.gross[source] ?? 0;
    const rate = !rules.enabled ? 1 : gross < thresholds[0] ? 1 : gross < thresholds[1] ? rules.midRate : rules.highRate;
    return { source, gross, applied: st.applied[source] ?? 0, thresholds, rate };
  });
}

export function validateXpTierRules(r: Partial<XpTierRules> | undefined): string[] {
  if (!r) return [];
  const errors: string[] = [];
  if (r.midRate !== undefined && !(r.midRate >= 0 && r.midRate <= 1)) errors.push("Paliers d'XP : taux intermédiaire entre 0 et 1.");
  if (r.highRate !== undefined && !(r.highRate >= 0 && r.highRate <= 1)) errors.push("Paliers d'XP : taux au-delà du second seuil entre 0 et 1.");
  for (const [k, t] of Object.entries(r.tiers ?? {})) {
    if (!Array.isArray(t) || t.length !== 2 || !t.every((v) => Number.isFinite(v) && v >= 0)) errors.push(`Paliers d'XP : seuils de « ${k} » invalides.`);
    else if (t[1] < t[0]) errors.push(`Paliers d'XP : le second seuil de « ${k} » doit dépasser le premier.`);
  }
  for (const [k, v] of Object.entries(r.multipliers ?? {})) if (!(Number(v) >= 0 && Number(v) <= 5)) errors.push(`Paliers d'XP : bonus de « ${k} » entre 0 et 5.`);
  return errors;
}
