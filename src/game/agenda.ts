import { bossWindows, weekendEventsBetween } from "@/game/events";
import { leviathanSchedule, worldBossForStart } from "@/game/leviathan";
import { chroniclesConfig, episodeUnlockMs, seasonBossSchedule } from "@/game/chronicles";
import { seasonEndMs } from "@/game/seasons";

/* =====================================================
   v5.10.5 : frise des prochains rendez-vous (accueil, planificateur
   admin) : boss mondiaux, événements du week-end, épisodes des
   Chroniques, fin de saison. Calculée à partir des règles en vigueur.
===================================================== */

export type AgendaKind = "leviathan" | "seasonboss" | "event" | "chronicle" | "season" | "contest";

export interface AgendaItem {
  id: string;
  kind: AgendaKind;
  title: string;
  startMs: number;
  /** Absent : un instant (épisode, fin de saison). */
  endMs?: number;
  link: string;
  /** Apparition à date précise (déplaçable dans le planificateur). */
  fixed?: boolean;
  emoji?: string;
  /** Combat déjà terminé dans cette fenêtre (affichage). */
  done?: boolean;
  /** Règle d'origine, pour le planificateur (date précise d'un boss, événement programmé). */
  source?: { type: "levDate" | "sbDate"; startMs: number } | { type: "scheduled"; id: string };
}

export const AGENDA_COLORS: Record<AgendaKind, string> = {
  leviathan: "#ff5c7a",
  seasonboss: "#ff8a4c",
  event: "#4be8ff",
  chronicle: "#a78bfa",
  season: "#ffd86b",
  contest: "#5cf2b0",
};

export const AGENDA_LABELS: Record<AgendaKind, string> = {
  leviathan: "Léviathan",
  seasonboss: "Boss de saison",
  event: "Événement du week-end",
  chronicle: "Épisode des Chroniques",
  season: "Fin de saison",
  contest: "Concours",
};

const DAY = 24 * 3600_000;

export function upcomingAgenda(now: number, days = 30, extra: AgendaItem[] = []): AgendaItem[] {
  const to = now + days * DAY;
  const items: AgendaItem[] = [];
  for (const w of bossWindows(now, leviathanSchedule(), 6)) {
    if (w.startMs < to) items.push({ id: `lev-${w.startMs}`, kind: "leviathan", title: worldBossForStart(w.startMs).name, startMs: w.startMs, endMs: w.endMs, link: "/game/leviathan", fixed: w.fixed, emoji: "🐋", ...(w.fixed ? { source: { type: "levDate" as const, startMs: w.startMs } } : {}) });
  }
  const months = chroniclesConfig().months;
  for (const w of bossWindows(now, seasonBossSchedule(), 6)) {
    if (w.startMs >= to) continue;
    const local = new Date(w.startMs + 2 * 3600_000);
    const monthId = `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, "0")}`;
    const month = months.find((m) => m.id === monthId);
    if (month) items.push({ id: `boss-${w.startMs}`, kind: "seasonboss", title: month.boss.name, startMs: w.startMs, endMs: w.endMs, link: "/game/boss", fixed: w.fixed, emoji: "⚔️", ...(w.fixed ? { source: { type: "sbDate" as const, startMs: w.startMs } } : {}) });
  }
  for (const e of weekendEventsBetween(now, to))
    items.push({ id: e.key, kind: "event", title: e.type.name, startMs: e.startMs, endMs: e.endMs, link: "/game", emoji: e.type.emoji, ...(e.scheduled ? { fixed: true, source: { type: "scheduled" as const, id: e.key.slice(0, e.key.lastIndexOf(":")) } } : {}) });
  for (const m of months) {
    for (let i = 0; i < 4; i++) {
      const at = episodeUnlockMs(m.id, i);
      if (at > now && at < to) items.push({ id: `ep-${m.id}-${i}`, kind: "chronicle", title: `Chroniques : épisode ${i + 1}${m.title ? ` (${m.title})` : ""}`, startMs: at, link: "/game/passe", emoji: "📜" });
    }
  }
  for (let t = seasonEndMs(now); t < to; t = seasonEndMs(t + DAY)) items.push({ id: `season-${t}`, kind: "season", title: "Fin de la saison", startMs: t, link: "/game/palmares", emoji: "🏆" });
  return [...items, ...extra.filter((x) => (x.endMs ?? x.startMs) > now && x.startMs < to)].sort((a, b) => a.startMs - b.startMs);
}
