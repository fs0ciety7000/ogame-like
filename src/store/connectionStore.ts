import { create } from "zustand";

interface ConnectionState {
  /** Navigateur en ligne (API navigator.onLine — ne garantit pas que
   *  Firestore soit réellement joignable, d'où `synced` ci-dessous). */
  online: boolean;
  /** true si la dernière donnée reçue vient du serveur (pas du cache local
   *  hors-ligne de Firestore) — le vrai indicateur de connexion au backend. */
  synced: boolean;
}

export const useConnectionStore = create<ConnectionState>(() => ({
  online: typeof navigator === "undefined" || navigator.onLine,
  synced: false,
}));

export function setSyncedFromServer(fromCache: boolean) {
  useConnectionStore.setState({ synced: !fromCache });
}

let started = false;
export function startConnectionListeners() {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("online", () => useConnectionStore.setState({ online: true }));
  window.addEventListener("offline", () => useConnectionStore.setState({ online: false, synced: false }));
}
