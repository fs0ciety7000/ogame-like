import { create } from "zustand";

/* 5.26 : bannissement constaté par le serveur (réponse 403 « banned ») :
   l'application bascule sur l'écran de suspension. */
export const useBanStore = create<{ message: string | null }>(() => ({ message: null }));

export function markBanned(message: string) {
  if (useBanStore.getState().message !== message) useBanStore.setState({ message });
}

export function clearBanned() {
  useBanStore.setState({ message: null });
}
