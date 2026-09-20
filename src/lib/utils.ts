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

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function sanitizePseudo(pseudo: string): string {
  return pseudo
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
}

/** Domaine fictif utilisé comme identifiant Firebase Auth pour les comptes
 *  créés avant l'ajout d'un email de récupération réel (voir authService). */
export function legacyPseudoEmail(sanitizedPseudo: string): string {
  return `${sanitizedPseudo}@cosmic-empires.local`;
}
