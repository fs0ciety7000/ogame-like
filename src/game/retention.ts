import { ONBOARDING_STEPS } from "@/game/onboarding";
import { parisHour } from "@/game/stats";
import type { PlayerState } from "@/types/game";

/* =====================================================
   v4.5 : rétention des joueurs (onglet Statistiques de l'administration).
   Chaque synchro note le jour d'activité (heure de Paris) dans les
   statistiques du joueur ; les cohortes D1/D7 ne portent que sur les
   joueurs inscrits depuis le début de ce suivi.
===================================================== */

const DAY = 24 * 3600_000;
export const ACTIVITY_DAYS_KEPT = 60;
/** v4.6 : « en ligne » = synchro réelle depuis moins de 5 min (écrite toutes les 2 min). */
export const PRESENCE_WRITE_MS = 2 * 60_000;
export const ONLINE_MS = 5 * 60_000;

export function isOnline(lastActiveMs: number | undefined, now: number): boolean {
  return !!lastActiveMs && now - lastActiveMs < ONLINE_MS;
}

/** Dernière activité réelle : présence, sinon dernier jour d'activité, sinon dernière mise à jour. */
export function lastActivity(p: Pick<PlayerState, "lastActiveMs" | "stats" | "resourcesUpdatedAtMs">): number {
  if (p.lastActiveMs) return p.lastActiveMs;
  const days = p.stats?.activeDays;
  if (days && days.length > 0) return Date.parse(`${days[days.length - 1]}T23:59:00Z`) - 3600_000;
  return p.resourcesUpdatedAtMs ?? 0;
}

/** Jour calendaire de Paris (AAAA-MM-JJ). */
export function parisDay(now: number): string {
  const offsetHours = (parisHour(now) - new Date(now).getUTCHours() + 24) % 24;
  return new Date(now + offsetHours * 3600_000).toISOString().slice(0, 10);
}

function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY);
}

/** Note le jour d'activité (une fois par jour, 60 jours gardés). */
export function recordActiveDay(player: PlayerState, now: number): void {
  const day = parisDay(now);
  const days = player.stats?.activeDays ?? [];
  if (days[days.length - 1] === day) return;
  player.stats = { ...(player.stats ?? {}), activeDays: [...days.filter((d) => d !== day), day].slice(-ACTIVITY_DAYS_KEPT) };
}

export interface RetentionStats {
  /** Premier jour de suivi (null : aucune donnée encore). */
  trackingSince: string | null;
  /** 30 derniers jours : joueurs actifs et inscriptions. */
  daily: { day: string; active: number; signups: number }[];
  /** Actifs selon la dernière synchro (disponible sans historique). */
  active: { d1: number; d7: number; d30: number; total: number };
  /** Cohortes hebdomadaires d'inscrits (6 dernières semaines). */
  cohorts: { week: string; signups: number; d1Pct: number | null; d7Pct: number | null; activeNowPct: number }[];
  /** Prise en main : part des joueurs récents (60 j) ayant atteint chaque objectif. */
  funnel: { id: string; label: string; reached: number; pct: number }[];
  /** Joueurs récents sans activité depuis 3 jours : objectif où ils se sont arrêtés. */
  dropoff: { id: string; label: string; count: number }[];
  recentPlayers: number;
}

const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0);

export function computeRetention(players: PlayerState[], now: number): RetentionStats {
  const today = parisDay(now);
  const lastSeen = (p: PlayerState) => Math.min(now, lastActivity(p));
  const days = (p: PlayerState) => new Set(p.stats?.activeDays ?? []);
  const signupDay = (p: PlayerState) => (p.createdAtMs ? parisDay(p.createdAtMs) : null);

  const allDays = players.flatMap((p) => p.stats?.activeDays ?? []).sort();
  const trackingSince = allDays[0] ?? null;

  const daily = Array.from({ length: 30 }, (_, i) => {
    const day = parisDay(now - (29 - i) * DAY);
    return {
      day,
      active: players.filter((p) => days(p).has(day)).length,
      signups: players.filter((p) => signupDay(p) === day).length,
    };
  });

  const active = {
    d1: players.filter((p) => now - lastSeen(p) < DAY).length,
    d7: players.filter((p) => now - lastSeen(p) < 7 * DAY).length,
    d30: players.filter((p) => now - lastSeen(p) < 30 * DAY).length,
    total: players.length,
  };

  const cohorts = Array.from({ length: 6 }, (_, i) => {
    const end = now - i * 7 * DAY;
    const start = end - 7 * DAY;
    const members = players.filter((p) => (p.createdAtMs ?? 0) >= start && (p.createdAtMs ?? 0) < end);
    // D1/D7 seulement pour les inscrits suivis depuis leur premier jour.
    const tracked = trackingSince ? members.filter((p) => (signupDay(p) ?? "") >= trackingSince) : [];
    const d1Eligible = tracked.filter((p) => dayDiff(signupDay(p)!, today) >= 1);
    const d7Eligible = tracked.filter((p) => dayDiff(signupDay(p)!, today) >= 7);
    const d1 = d1Eligible.filter((p) => [...days(p)].some((d) => dayDiff(signupDay(p)!, d) === 1)).length;
    const d7 = d7Eligible.filter((p) => [...days(p)].some((d) => dayDiff(signupDay(p)!, d) >= 7)).length;
    return {
      week: parisDay(start),
      signups: members.length,
      d1Pct: d1Eligible.length > 0 ? pct(d1, d1Eligible.length) : null,
      d7Pct: d7Eligible.length > 0 ? pct(d7, d7Eligible.length) : null,
      activeNowPct: pct(members.filter((p) => now - lastSeen(p) < 3 * DAY).length, members.length),
    };
  }).reverse();

  const recent = players.filter((p) => now - (p.createdAtMs ?? 0) < 60 * DAY);
  const funnel = ONBOARDING_STEPS.map((step) => {
    const reached = recent.filter((p) => {
      try {
        return step.done(p);
      } catch {
        return false;
      }
    }).length;
    return { id: step.id, label: step.label, reached, pct: pct(reached, recent.length) };
  });

  const stalled = recent.filter((p) => now - lastSeen(p) >= 3 * DAY);
  const stopAt = new Map<string, number>();
  for (const p of stalled) {
    const step = ONBOARDING_STEPS.find((s) => {
      try {
        return !s.done(p);
      } catch {
        return true;
      }
    });
    const key = step?.id ?? "done";
    stopAt.set(key, (stopAt.get(key) ?? 0) + 1);
  }
  const dropoff = [...stopAt.entries()]
    .map(([id, count]) => ({ id, label: id === "done" ? "Prise en main terminée" : ONBOARDING_STEPS.find((s) => s.id === id)?.label ?? id, count }))
    .sort((a, b) => b.count - a.count);

  return { trackingSince, daily, active, cohorts, funnel, dropoff, recentPlayers: recent.length };
}
