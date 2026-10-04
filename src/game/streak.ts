import { bountyState } from "@/game/bounties";
import { grantTokens } from "@/game/casino";
import { GameActionError } from "@/game/errors";
import { productionHours } from "@/game/pirates";
import { parisDay } from "@/game/retention";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   v5.3 : série de connexion quotidienne. Une récompense par jour (heure de
   Paris), réclamée depuis l'en-tête. Elle grandit sur 7 jours (heures de
   production) puis recommence ; un jour manqué remet la série à 1.
   5.15.6 : 2 jetons du casino chaque jour, 35 Ambre au 6e jour, et au 7e
   jour (cycle réussi) un coffre tiré au hasard : Ambre, jetons et ressources
   communes.
===================================================== */

export const STREAK_RULES = {
  /** Heures de production des ressources communes, jours 1 à 7. */
  hours: [1, 1.5, 2, 2.5, 3, 3.5, 5],
  /** Jetons du casino chaque jour. */
  dailyTokens: 2,
  /** Ambre du 6e jour du cycle. */
  amberDay6: 35,
  /** Coffre du 7e jour : bornes des tirages (chaque ressource commune tirée à part). */
  chest: { amber: [50, 300] as [number, number], tokens: [1, 25] as [number, number], common: [45_000_000, 280_000_000] as [number, number] },
  /** Plancher par ressource commune (petits empires). */
  floor: 2_000,
};

export interface StreakChest {
  amber: number;
  tokens: number;
  resources: Partial<Record<ResourceId, number>>;
}

/** Tirage du coffre du 7e jour (entiers dans les bornes, ressources arrondies au million). */
export function rollStreakChest(random: () => number = Math.random): StreakChest {
  const c = STREAK_RULES.chest;
  const int = ([lo, hi]: [number, number]) => Math.floor(lo + random() * (hi - lo + 1));
  const resources: Partial<Record<ResourceId, number>> = {};
  for (const res of ["scrap", "energy", "nano", "data"] as ResourceId[]) resources[res] = Math.min(c.common[1], Math.round(int(c.common) / 1_000_000) * 1_000_000);
  return { amber: int(c.amber), tokens: int(c.tokens), resources };
}

export interface StreakState {
  /** Jours consécutifs réclamés (série en cours). */
  count: number;
  /** Dernier jour réclamé (AAAA-MM-JJ, heure de Paris). */
  lastDay: string;
  best: number;
  total: number;
}

export function streakState(player: Pick<PlayerState, "streak">): StreakState {
  const raw = (player.streak ?? {}) as Partial<StreakState>;
  return { count: Number(raw.count) || 0, lastDay: String(raw.lastDay ?? ""), best: Number(raw.best) || 0, total: Number(raw.total) || 0 };
}

function previousDay(day: string): string {
  return new Date(Date.parse(`${day}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
}

/** Jour du cycle (1 à 7) pour une série de `count` jours. */
export function cycleDay(count: number): number {
  return ((Math.max(1, count) - 1) % 7) + 1;
}

/** Récompense fixe d'un jour (le coffre du 7e jour est tiré à la réclamation). */
export function streakReward(player: Pick<PlayerState, "buildings" | "techLevels">, count: number): { resources: Partial<Record<ResourceId, number>>; amber: number; tokens: number; chest: boolean } {
  const day = cycleDay(count);
  const raw = productionHours(player, STREAK_RULES.hours[day - 1]);
  const resources: Partial<Record<ResourceId, number>> = {};
  for (const res of ["scrap", "energy", "nano", "data"] as ResourceId[]) resources[res] = Math.max(STREAK_RULES.floor, raw[res] ?? 0);
  return { resources, amber: day === 6 ? STREAK_RULES.amberDay6 : 0, tokens: STREAK_RULES.dailyTokens, chest: day === 7 };
}

/** Situation du jour : déjà réclamé ? quel jour de série serait réclamé ? */
export function streakStatus(player: Pick<PlayerState, "streak">, now: number): { today: string; claimed: boolean; next: number; current: number } {
  const st = streakState(player);
  const today = parisDay(now);
  if (st.lastDay === today) return { today, claimed: true, next: st.count + 1, current: st.count };
  const alive = st.lastDay === previousDay(today);
  return { today, claimed: false, next: alive ? st.count + 1 : 1, current: alive ? st.count : 0 };
}

export function claimStreak(
  player: PlayerState,
  now: number,
  random: () => number = Math.random,
): { count: number; resources: Partial<Record<ResourceId, number>>; amber: number; tokens: number; chest: StreakChest | null } {
  const status = streakStatus(player, now);
  if (status.claimed) throw new GameActionError("Récompense du jour déjà réclamée : reviens demain !");
  const st = streakState(player);
  const count = status.next;
  const reward = streakReward(player, count);
  const chest = reward.chest ? rollStreakChest(random) : null;
  const resources = { ...reward.resources };
  if (chest) for (const [res, n] of Object.entries(chest.resources) as [ResourceId, number][]) resources[res] = (resources[res] ?? 0) + n;
  for (const [res, n] of Object.entries(resources) as [ResourceId, number][]) player.resources[res] = (player.resources[res] ?? 0) + n;
  const amber = reward.amber + (chest?.amber ?? 0);
  if (amber > 0) {
    const b = bountyState(player);
    b.amber += amber;
    b.amberEarned = (b.amberEarned ?? 0) + amber;
    player.bounties = b;
  }
  const tokens = reward.tokens + (chest?.tokens ?? 0);
  if (tokens > 0) grantTokens(player, tokens);
  player.streak = { count, lastDay: status.today, best: Math.max(st.best, count), total: st.total + 1 };
  return { count, resources: reward.resources, amber: reward.amber, tokens: reward.tokens, chest };
}

/** 5.15.9 : ce que rapporte une semaine complète de série (aperçu admin).
 *  Le coffre compte pour sa valeur moyenne (milieu des bornes). */
export function streakWeekSummary(rules: typeof STREAK_RULES): { hours: number; tokens: number; amber: number; chestCommon: number } {
  const mid = ([lo, hi]: [number, number]) => (lo + hi) / 2;
  return {
    hours: rules.hours.reduce((a, h) => a + h, 0),
    tokens: rules.dailyTokens * rules.hours.length + mid(rules.chest.tokens),
    amber: rules.amberDay6 + mid(rules.chest.amber),
    chestCommon: mid(rules.chest.common),
  };
}
