import type { PlayerState } from "@/types/game";

/* =====================================================
   v5.10 : résumé de la semaine. Un instantané des compteurs du joueur est
   pris au début de chaque semaine (lundi 00 h UTC) ; au premier passage
   de la semaine suivante, la différence devient le résumé (butin,
   victoires, missions, XP, succès, titres) et une notification l'annonce.
===================================================== */

const DAY = 86_400_000;

export interface WeeklySnapshot {
  weekId: string;
  loot: number;
  victories: number;
  defeats: number;
  missions: number;
  xp: number;
  achievements: number;
  titles: number;
  contracts: number;
  expeditions: number;
}

export interface WeeklyRecap extends Omit<WeeklySnapshot, "weekId"> {
  /** Semaine résumée (lundi, AAAA-MM-JJ). */
  weekId: string;
}

/** Lundi 00 h UTC de la semaine de `now` (AAAA-MM-JJ). */
export function weekIdOf(now: number): string {
  const d = new Date(now);
  const monday = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - ((d.getUTCDay() + 6) % 7) * DAY;
  return new Date(monday).toISOString().slice(0, 10);
}

function weeklySnapshot(player: PlayerState, weekId: string): WeeklySnapshot {
  const s = player.stats ?? {};
  return {
    weekId,
    loot: s.loot ?? 0,
    victories: player.victories ?? 0,
    defeats: player.defeats ?? 0,
    missions: s.missions ?? 0,
    xp: player.xp ?? 0,
    achievements: (player.unlockedAchievements ?? []).length,
    titles: (player.titles ?? []).length,
    contracts: s.contracts ?? 0,
    expeditions: s.expeditions ?? 0,
  };
}

/** Activité notable dans un résumé (sinon : pas de notification). */
function recapHasActivity(r: WeeklyRecap): boolean {
  return r.loot > 0 || r.victories > 0 || r.missions > 0 || r.xp > 0 || r.achievements > 0 || r.titles > 0 || r.contracts > 0 || r.expeditions > 0;
}

/**
 * Avance l'instantané hebdomadaire. Retourne le résumé de la semaine
 * écoulée au premier passage d'une nouvelle semaine (sinon null).
 */
export function advanceWeeklyRecap(player: PlayerState, now: number): WeeklyRecap | null {
  const weekId = weekIdOf(now);
  const stats = player.stats ?? {};
  const prev = stats.weekStart;
  if (prev && prev.weekId === weekId) return null;
  const current = weeklySnapshot(player, weekId);
  let recap: WeeklyRecap | null = null;
  if (prev) {
    recap = {
      weekId: prev.weekId,
      loot: Math.max(0, current.loot - prev.loot),
      victories: Math.max(0, current.victories - prev.victories),
      defeats: Math.max(0, current.defeats - prev.defeats),
      missions: Math.max(0, current.missions - prev.missions),
      xp: current.xp - prev.xp,
      achievements: Math.max(0, current.achievements - prev.achievements),
      titles: Math.max(0, current.titles - prev.titles),
      contracts: Math.max(0, current.contracts - prev.contracts),
      expeditions: Math.max(0, current.expeditions - prev.expeditions),
    };
  }
  player.stats = { ...stats, weekStart: current, ...(recap ? { lastWeek: recap } : {}) };
  return recap && recapHasActivity(recap) ? recap : null;
}

/** « semaine du 28 septembre » */
export function weekLabel(weekId: string): string {
  const [y, m, d] = weekId.split("-").map(Number);
  const months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  return y ? `semaine du ${d} ${months[(m - 1) % 12]}` : weekId;
}
