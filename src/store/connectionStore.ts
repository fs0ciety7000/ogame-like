import { create } from "zustand";
import { pb } from "@/lib/pocketbase";

interface ConnectionState {
  /** Navigateur en ligne (API navigator.onLine — ne garantit pas que
   *  le serveur soit réellement joignable, d'où `synced` ci-dessous). */
  online: boolean;
  /** true si le serveur PocketBase a répondu et que le flux temps réel
   *  n'est pas coupé — le vrai indicateur de connexion au backend. */
  synced: boolean;
}

export const useConnectionStore = create<ConnectionState>(() => ({
  online: typeof navigator === "undefined" || navigator.onLine,
  synced: false,
}));

export function setSyncedFromServer(fromServer: boolean) {
  useConnectionStore.setState({ synced: fromServer });
}

let started = false;
export function startConnectionListeners() {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("online", () => useConnectionStore.setState({ online: true }));
  window.addEventListener("offline", () => useConnectionStore.setState({ online: false, synced: false }));
  // Flux temps réel PocketBase coupé : il se reconnecte tout seul, et
  // l'évènement suivant reçu repasse `synced` à true.
  pb.realtime.onDisconnect = () => useConnectionStore.setState({ synced: false });
}
