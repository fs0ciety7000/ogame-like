import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number): string {
  const v = Math.floor(value);
  if (Math.abs(v) < 1000) return String(v);
  return new Intl.NumberFormat("fr-FR").format(v);
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 }).format(
    Math.floor(value),
  );
}

/** Débit horaire affiché par seconde, comme l'en-tête de la planète mère. */
export function formatPerSecond(hourly: number): string {
  const v = hourly / 3600;
  if (v >= 1000) return `${formatCompact(v)}/s`;
  if (v >= 10) return `${formatNumber(Math.round(v))}/s`;
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(v)}/s`;
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

/** Compte à rebours : « 4:38 » sous l'heure, « 5 h 06 min » au-delà, « 2 j 03 h » au-delà d'un jour. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (d > 0) return `${d} j ${h.toString().padStart(2, "0")} h`;
  if (h > 0) return `${h} h ${m.toString().padStart(2, "0")} min`;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function timeAgo(ms: number): string {
  const diff = Math.max(0, Date.now() - ms);
  const s = Math.floor(diff / 1000);
  if (s < 60) return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
}

/** Horodatage (millisecondes, ou date ISO pour d'anciennes données) en
 *  millisecondes ; maintenant si la valeur est absente ou illisible. */
export function toMillis(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return Date.now();
}

export function sanitizePseudo(pseudo: string): string {
  return pseudo
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
}

/** Domaine fictif utilisé comme email des comptes
 *  créés avant l'ajout d'un email de récupération réel (voir authService). */
export function legacyPseudoEmail(sanitizedPseudo: string): string {
  return `${sanitizedPseudo}@cosmic-empires.local`;
}
