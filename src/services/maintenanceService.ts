import { useEffect, useState } from "react";
import { create } from "zustand";
import { pb } from "@/lib/pocketbase";
import { checkIsAdmin } from "@/services/adminService";
import { useAuthStore } from "@/store/authStore";
import { MAINTENANCE_OFF, normalizeMaintenance, type MaintenanceState } from "@/game/maintenance";

/* Mode maintenance (v2.5) : l'état arrive avec le reste de game_config
   (contentService), en direct. */

interface MaintenanceStore {
  state: MaintenanceState;
  /** true dès la première lecture de game_config (réussie ou non). */
  loaded: boolean;
}

export const useMaintenanceStore = create<MaintenanceStore>(() => ({ state: MAINTENANCE_OFF, loaded: false }));

export function applyMaintenanceRecord(data: unknown | null) {
  useMaintenanceStore.setState({ state: normalizeMaintenance(data), loaded: true });
}

export function useMaintenance(): MaintenanceState {
  return useMaintenanceStore((s) => s.state);
}

/** Statut administrateur du compte connecté : null pendant la vérification. */
export function useAdminStatus(): boolean | null {
  const uid = useAuthStore((s) => s.user?.uid);
  const [status, setStatus] = useState<{ uid: string; admin: boolean } | null>(null);
  useEffect(() => {
    if (!uid) return;
    let active = true;
    checkIsAdmin(uid).then((admin) => active && setStatus({ uid, admin }));
    return () => {
      active = false;
    };
  }, [uid]);
  if (!uid) return false;
  return status?.uid === uid ? status.admin : null;
}

/** Active, modifie ou termine la maintenance (administrateurs). */
export async function setMaintenance(request: { enabled: boolean; message?: string; version?: string; endsAtMs?: number | null }): Promise<MaintenanceState & { extended: number }> {
  try {
    const out = await pb.send<MaintenanceState & { extended: number }>("/api/cosmic/admin/maintenance", { method: "POST", body: request });
    applyMaintenanceRecord(out);
    return out;
  } catch (err) {
    const data = (err as { response?: { message?: string } }).response;
    throw new Error(data?.message || "Action impossible.");
  }
}
