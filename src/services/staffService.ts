import { create } from "zustand";
import { normalizeStaff, type StaffRole, type StaffState } from "@/game/staff";

/* Rôles de l'équipe (game_config « staff »), reçus avec le reste de la
   configuration par contentService. */
export const useStaffStore = create<StaffState>(() => ({ roles: {} }));

export function applyStaffRecord(data: unknown | null) {
  useStaffStore.setState(normalizeStaff(data));
}

export function useStaffRole(uid: string | null | undefined): StaffRole | null {
  return useStaffStore((s) => (uid ? (s.roles[uid] ?? null) : null));
}
