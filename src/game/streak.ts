import { bountyState } from "@/game/bounties";
import { GameActionError } from "@/game/errors";
import { productionHours } from "@/game/pirates";
import { parisDay } from "@/game/retention";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   v5.3 : série de connexion quotidienne. Une récompense par jour (heure de
   Paris), réclamée depuis l'en-tête. Elle grandit sur 7 jours (heures de
   production, Ambre au 7e jour) puis recommence ; un jour manqué remet la
   série à 1.
===================================================== */

export const STREAK_RULES = {
  /** Heures de production des ressources communes, jours 1 à 7. */
  hours: [1, 1.5, 2, 2.5, 3, 3.5, 5],
  /** Ambre offerte au 7e jour du cycle. */
  amberDay7: 15,
  /** Plancher par ressource commune (petits empires). */
  floor: 2_000,
};

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

export function streakReward(player: Pick<PlayerState, "buildings" | "techLevels">, count: number): { resources: Partial<Record<ResourceId, number>>; amber: number } {
  const day = cycleDay(count);
  const raw = productionHours(player, STREAK_RULES.hours[day - 1]);
  const resources: Partial<Record<ResourceId, number>> = {};
  for (const res of ["scrap", "energy", "nano", "data"] as ResourceId[]) resources[res] = Math.max(STREAK_RULES.floor, raw[res] ?? 0);
  return { resources, amber: day === 7 ? STREAK_RULES.amberDay7 : 0 };
}

/** Situation du jour : déjà réclamé ? quel jour de série serait réclamé ? */
export function streakStatus(player: Pick<PlayerState, "streak">, now: number): { today: string; claimed: boolean; next: number; current: number } {
  const st = streakState(player);
  const today = parisDay(now);
  if (st.lastDay === today) return { today, claimed: true, next: st.count + 1, current: st.count };
  const alive = st.lastDay === previousDay(today);
  return { today, claimed: false, next: alive ? st.count + 1 : 1, current: alive ? st.count : 0 };
}

export function claimStreak(player: PlayerState, now: number): { count: number; resources: Partial<Record<ResourceId, number>>; amber: number } {
  const status = streakStatus(player, now);
  if (status.claimed) throw new GameActionError("Récompense du jour déjà réclamée : reviens demain !");
  const st = streakState(player);
  const count = status.next;
  const reward = streakReward(player, count);
  for (const [res, n] of Object.entries(reward.resources) as [ResourceId, number][]) player.resources[res] = (player.resources[res] ?? 0) + n;
  if (reward.amber > 0) {
    const b = bountyState(player);
    b.amber += reward.amber;
    b.amberEarned = (b.amberEarned ?? 0) + reward.amber;
    player.bounties = b;
  }
  player.streak = { count, lastDay: status.today, best: Math.max(st.best, count), total: st.total + 1 };
  return { count, ...reward };
}
