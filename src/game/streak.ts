import { bountyState } from "@/game/bounties";
import { grantTokens } from "@/game/casino";
import { GameActionError } from "@/game/errors";
import { productionHours } from "@/game/pirates";
import { addStartReserve, splitProductionReward } from "@/game/startRewards";
import { storageCapacityOf } from "@/game/economy";
import { parisDay } from "@/game/retention";
import type { PlayerState, ResourceId } from "@/types/game";
import { noteAmber, noteChest } from "@/game/healthTrace";

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
  /** Coffre du 7e jour : bornes des tirages (chaque ressource commune tirée à part).
   *  6.14.72 (AU27, AE-3) : ressources communes [45 M, 280 M] → [2 M, 12 M], soit ≈ 28 M en moyenne (20 h de production d'un
   *  joueur quotidien au 7e jour) au lieu de 650 M (465 h) : l'ancien coffre gelait la production et s'offrait au pillage.
   *  6.14.106 (AU27, AE-L3, Q99) : `commonHours` [6, 18] indexe le coffre sur la production du joueur (heures de production
   *  des extracteurs et technos, tirées à part pour chaque ressource commune) ; `common[0]` reste le plancher (petits empires).
   *  `commonHours` à [0, 0] : ancien coffre, tiré entre les bornes fixes `common`. */
  chest: {
    amber: [50, 300] as [number, number],
    tokens: [1, 25] as [number, number],
    common: [2_000_000, 12_000_000] as [number, number],
    commonHours: [6, 18] as [number, number],
  },
  /** Plancher par ressource commune (petits empires). */
  floor: 2_000,
};

export interface StreakChest {
  amber: number;
  tokens: number;
  resources: Partial<Record<ResourceId, number>>;
}

const COMMONS: ResourceId[] = ["scrap", "energy", "nano", "data"];

/** 6.14.106 : le coffre est-il indexé sur la production (`commonHours` valide, maximum > 0) ? */
export function chestIndexed(chest: { commonHours?: [number, number] | null } = STREAK_RULES.chest): boolean {
  const h = chest.commonHours;
  return Array.isArray(h) && h.length === 2 && Number(h[1]) > 0 && Number(h[0]) >= 0 && Number(h[1]) >= Number(h[0]);
}

/** 6.14.106 : ressource commune du coffre pour `hours` heures de production (`perHour` : production horaire de cette
 *  ressource), dans la limite de la place libre de l'entrepôt (`room`, Infinity : sans limite), mais au moins le plancher
 *  `common[0]` ; arrondie au millier inférieur. Partagée par le tirage et le simulateur. */
export function chestCommonAmount(perHour: number, hours: number, floor: number = STREAK_RULES.chest.common[0], room = Infinity): number {
  const raw = Math.min(Math.max(0, perHour) * Math.max(0, hours), Math.max(0, room));
  return Math.max(Math.max(0, floor), Math.floor(raw / 1000) * 1000);
}

/** Tirage du coffre du 7e jour (entiers dans les bornes). 6.14.106 : ressources communes en heures de production du joueur
 *  (`commonHours`, chaque ressource tirée à part), dans la limite de la place libre de l'entrepôt, plancher `common[0]` ;
 *  sans joueur ou coffre non indexé, entre les bornes fixes `common`, arrondies au million. */
export function rollStreakChest(random: () => number = Math.random, player?: (Pick<PlayerState, "buildings" | "techLevels"> & Partial<PlayerState>) | null): StreakChest {
  const c = STREAK_RULES.chest;
  const int = ([lo, hi]: [number, number]) => Math.floor(lo + random() * (hi - lo + 1));
  const resources: Partial<Record<ResourceId, number>> = {};
  if (player && chestIndexed(c)) {
    const perHour = productionHours(player, 1);
    const cap = player.resources ? storageCapacityOf(player as PlayerState) : Infinity;
    const [lo, hi] = c.commonHours;
    for (const res of COMMONS) {
      const room = Number.isFinite(cap) ? cap - (player.resources?.[res] ?? 0) : Infinity;
      resources[res] = chestCommonAmount(perHour[res] ?? 0, lo + random() * (hi - lo), c.common[0], room);
    }
  } else for (const res of COMMONS) resources[res] = Math.min(c.common[1], Math.round(int(c.common) / 1_000_000) * 1_000_000);
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

/** Récompense fixe d'un jour (le coffre du 7e jour est tiré à la réclamation).
 *  6.14.165 (S6, NJ-25) : avec `now`, un compte jeune reçoit au plus `startRewards.youngCapMinutes` de production
 *  (plancher compris) ; `deferred` est la part mise en réserve du départ à la réclamation. */
export function streakReward(
  player: Pick<PlayerState, "buildings" | "techLevels" | "createdAtMs">,
  count: number,
  now?: number,
): { resources: Partial<Record<ResourceId, number>>; deferred: Partial<Record<ResourceId, number>>; amber: number; tokens: number; chest: boolean } {
  const day = cycleDay(count);
  const hours = STREAK_RULES.hours[day - 1];
  const { paid: raw, deferred } = now === undefined ? { paid: productionHours(player, hours), deferred: {} } : splitProductionReward(player, hours, now);
  const resources: Partial<Record<ResourceId, number>> = {};
  for (const res of COMMONS) resources[res] = Math.max(STREAK_RULES.floor, raw[res] ?? 0);
  return { resources, deferred, amber: day === 6 ? STREAK_RULES.amberDay6 : 0, tokens: STREAK_RULES.dailyTokens, chest: day === 7 };
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
  const reward = streakReward(player, count, now);
  addStartReserve(player, reward.deferred);
  const chest = reward.chest ? rollStreakChest(random, player) : null;
  const resources = { ...reward.resources };
  if (chest) for (const [res, n] of Object.entries(chest.resources) as [ResourceId, number][]) resources[res] = (resources[res] ?? 0) + n;
  for (const [res, n] of Object.entries(resources) as [ResourceId, number][]) player.resources[res] = (player.resources[res] ?? 0) + n;
  const amber = reward.amber + (chest?.amber ?? 0);
  if (amber > 0) {
    const b = bountyState(player);
    b.amber += amber;
    b.amberEarned = (b.amberEarned ?? 0) + amber;
    player.bounties = b;
    noteAmber(player, "streak", amber, now);
  }
  // 6.14.107 (AE-L4) : dernier coffre du 7e jour (santé de l'équilibre : montant, tirages au plancher, Q267).
  if (chest) noteChest(player, chest.resources, STREAK_RULES.chest.common[0], now);
  const tokens = reward.tokens + (chest?.tokens ?? 0);
  if (tokens > 0) grantTokens(player, tokens);
  player.streak = { count, lastDay: status.today, best: Math.max(st.best, count), total: st.total + 1 };
  return { count, resources: reward.resources, amber: reward.amber, tokens: reward.tokens, chest };
}

/** 5.15.9 : ce que rapporte une semaine complète de série (aperçu admin).
 *  Le coffre compte pour sa valeur moyenne (milieu des bornes). 6.14.106 : `chestHours` = heures de production moyennes
 *  du coffre indexé (null : coffre aux bornes fixes, `chestCommon` est alors sa moyenne par ressource). */
export function streakWeekSummary(rules: typeof STREAK_RULES): { hours: number; tokens: number; amber: number; chestCommon: number; chestHours: number | null } {
  const mid = ([lo, hi]: [number, number]) => (lo + hi) / 2;
  return {
    hours: rules.hours.reduce((a, h) => a + h, 0),
    tokens: rules.dailyTokens * rules.hours.length + mid(rules.chest.tokens),
    amber: rules.amberDay6 + mid(rules.chest.amber),
    chestCommon: mid(rules.chest.common),
    chestHours: chestIndexed(rules.chest) ? mid(rules.chest.commonHours) : null,
  };
}

/** 6.14.106 : texte joueur du coffre, lu dans la règle (« 6 à 18 h de production, au moins 2 M »). */
export function chestCommonLabel(chest: typeof STREAK_RULES.chest = STREAK_RULES.chest, compact: (n: number) => string = (n) => String(n)): string {
  if (!chestIndexed(chest)) return `${compact(chest.common[0])} à ${compact(chest.common[1])}`;
  const [lo, hi] = chest.commonHours;
  const h = (n: number) => String(n).replace(".", ",");
  return `${lo === hi ? h(hi) : `${h(lo)} à ${h(hi)}`} h de production, dans la place libre de l'entrepôt${chest.common[0] > 0 ? ` (au moins ${compact(chest.common[0])})` : ""}`;
}
