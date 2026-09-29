import { create } from "zustand";
import type { RecordModel } from "pocketbase";
import { pb } from "@/lib/pocketbase";

/** Utilisateur connecté, sous la même forme que du temps de Firebase
 *  (`uid`, `email`, `displayName`) pour que les écrans n'aient pas à
 *  connaître le format des enregistrements PocketBase. */
export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
}

function toAuthUser(record: RecordModel | null): AuthUser | null {
  if (!record || !pb.authStore.isValid) return null;
  return {
    uid: record.id,
    email: (record.email as string) ?? "",
    displayName: (record.name as string) || (record.username as string) || "",
  };
}

interface AuthState {
  user: AuthUser | null;
}

export const useAuthStore = create<AuthState>(() => ({
  user: toAuthUser(pb.authStore.record),
}));

// Session restaurée depuis le localStorage au démarrage, puis mise à jour à
// chaque connexion/déconnexion/rafraîchissement du jeton.
pb.authStore.onChange((_token, record) => {
  useAuthStore.setState({ user: toAuthUser(record) });
});
