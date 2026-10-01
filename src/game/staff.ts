import type { PlayerState } from "@/types/game";

/* =====================================================
   Équipe du jeu (v2.5) : rôle affiché par un badge à côté du pseudo et
   un titre « Développeur » ou « Administrateur ». Stocké dans game_config
   (clé "staff", lisible par tous) et tenu à jour par le serveur quand on
   nomme ou retire un administrateur.
===================================================== */

export type StaffRole = "developer" | "admin";

export const STAFF_KEY = "staff";
export const STAFF_ROLES: StaffRole[] = ["developer", "admin"];
export const STAFF_LABELS: Record<StaffRole, string> = { developer: "Développeur", admin: "Administrateur" };
/** Saison fictive des titres d'équipe (les distingue des titres de saison). */
export const STAFF_TITLE_SEASON = "staff";
/** Rôles de départ, appliqués une seule fois aux administrateurs existants. */
export const DEFAULT_STAFF_BY_PSEUDO: Record<string, StaffRole> = { Nicotine: "developer", Tartiflex: "admin" };

export interface StaffState {
  roles: Record<string, StaffRole>;
}

export function isStaffRole(v: unknown): v is StaffRole {
  return v === "developer" || v === "admin";
}

export function normalizeStaff(raw: unknown): StaffState {
  const roles: Record<string, StaffRole> = {};
  const src = raw && typeof raw === "object" ? (raw as { roles?: unknown }).roles : null;
  if (src && typeof src === "object") for (const [uid, role] of Object.entries(src)) if (isStaffRole(role)) roles[uid] = role;
  return { roles };
}

/**
 * Met le titre d'équipe du joueur en accord avec son rôle (null = aucun) :
 * retire l'ancien, ajoute le nouveau. `display` l'affiche tout de suite ; un
 * titre d'équipe affiché puis retiré laisse la place vide.
 */
export function applyStaffTitle(player: Pick<PlayerState, "titles" | "activeTitle">, role: StaffRole | null, display = false): boolean {
  const before = JSON.stringify([player.titles ?? [], player.activeTitle ?? ""]);
  const staffLabels = Object.values(STAFF_LABELS);
  const kept = (player.titles ?? []).filter((t) => t.seasonId !== STAFF_TITLE_SEASON);
  const label = role ? STAFF_LABELS[role] : null;
  player.titles = label ? [{ label, rank: 0, seasonId: STAFF_TITLE_SEASON }, ...kept] : kept;
  if (player.activeTitle && staffLabels.includes(player.activeTitle) && player.activeTitle !== label) player.activeTitle = "";
  if (label && display) player.activeTitle = label;
  return JSON.stringify([player.titles, player.activeTitle ?? ""]) !== before;
}
