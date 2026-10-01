/* =====================================================
   Mode maintenance (v2.5) : activé depuis l'administration, il ferme le jeu
   à tous sauf aux administrateurs. Stocké dans game_config (clé
   "maintenance") : lisible par tous, modifiable via la route
   POST /api/cosmic/admin/maintenance.
===================================================== */

export interface MaintenanceState {
  enabled: boolean;
  /** Message affiché aux joueurs. */
  message: string;
  /** Version visée (ex. « 2.5.0 »), vide si non précisée. */
  version: string;
  startedAtMs: number;
  /** Fin prévue ; null = durée indéterminée. */
  endsAtMs: number | null;
}

export const MAINTENANCE_KEY = "maintenance";

export const DEFAULT_MAINTENANCE_MESSAGE =
  "Nos techniciens interviennent sur les serveurs de la galaxie. Ta progression est sauvegardée : production, flottes en vol et files d'attente reprendront normalement à la réouverture.";

export const MAINTENANCE_OFF: MaintenanceState = { enabled: false, message: "", version: "", startedAtMs: 0, endsAtMs: null };

const MAX_MESSAGE = 600;
const MAX_VERSION = 20;

/** Lecture tolérante (enregistrement absent, champs manquants ou faussés). */
export function normalizeMaintenance(raw: unknown): MaintenanceState {
  if (!raw || typeof raw !== "object") return { ...MAINTENANCE_OFF };
  const r = raw as Record<string, unknown>;
  const endsAt = Number(r.endsAtMs);
  return {
    enabled: r.enabled === true,
    message: typeof r.message === "string" ? r.message.slice(0, MAX_MESSAGE) : "",
    version: typeof r.version === "string" ? r.version.slice(0, MAX_VERSION) : "",
    startedAtMs: Number(r.startedAtMs) || 0,
    endsAtMs: Number.isFinite(endsAt) && endsAt > 0 ? endsAt : null,
  };
}

/** Nouvel état demandé par un administrateur. Une maintenance déjà en cours
 *  garde son heure de début (le temps de pause compte depuis l'ouverture). */
export function nextMaintenance(
  previous: MaintenanceState,
  request: { enabled?: unknown; message?: unknown; version?: unknown; endsAtMs?: unknown },
  now: number,
): MaintenanceState {
  const enabled = request.enabled === true;
  if (!enabled) return { ...previous, enabled: false, endsAtMs: null };
  const endsAt = Number(request.endsAtMs);
  return {
    enabled: true,
    message: (typeof request.message === "string" ? request.message.trim() : "").slice(0, MAX_MESSAGE),
    version: (typeof request.version === "string" ? request.version.trim() : "").slice(0, MAX_VERSION),
    startedAtMs: previous.enabled && previous.startedAtMs > 0 ? previous.startedAtMs : now,
    endsAtMs: Number.isFinite(endsAt) && endsAt > now ? Math.round(endsAt) : null,
  };
}

/** Temps restant avant la fin prévue (0 si dépassée, null si indéterminée). */
export function maintenanceRemainingMs(m: MaintenanceState, now: number): number | null {
  if (!m.enabled || m.endsAtMs === null) return null;
  return Math.max(0, m.endsAtMs - now);
}

/** Avancement de 0 à 1 entre le début et la fin prévue (null si indéterminée). */
export function maintenanceProgress(m: MaintenanceState, now: number): number | null {
  if (!m.enabled || m.endsAtMs === null || m.endsAtMs <= m.startedAtMs) return null;
  return Math.min(1, Math.max(0, (now - m.startedAtMs) / (m.endsAtMs - m.startedAtMs)));
}

/**
 * Fin de maintenance : les ultimatums des factions encore ouverts au début
 * de la coupure sont prolongés de sa durée, pour que personne ne subisse un
 * raid sans avoir pu répondre. Renvoie null si rien ne change.
 */
export function extendUltimatums(pirates: unknown, startedAtMs: number, now: number): unknown | null {
  const pausedMs = now - startedAtMs;
  if (!pirates || typeof pirates !== "object" || startedAtMs <= 0 || pausedMs <= 0) return null;
  const shift = (state: Record<string, unknown>): boolean => {
    const u = state.ultimatum as { expiresAtMs?: number } | null | undefined;
    if (!u || typeof u.expiresAtMs !== "number" || u.expiresAtMs <= startedAtMs) return false;
    state.ultimatum = { ...u, expiresAtMs: u.expiresAtMs + pausedMs };
    return true;
  };
  const copy = JSON.parse(JSON.stringify(pirates)) as Record<string, unknown>;
  let changed = false;
  if ("notoriety" in copy || "nextListAtMs" in copy) changed = shift(copy);
  else for (const state of Object.values(copy)) if (state && typeof state === "object" && shift(state as Record<string, unknown>)) changed = true;
  return changed ? copy : null;
}
