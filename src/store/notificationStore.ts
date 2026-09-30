import { create } from "zustand";
import type { GameNotification } from "@/types/game";

interface NotificationState {
  items: GameNotification[];
  /** Cloche ouverte (pilotable depuis un toast « Voir »). */
  bellOpen: boolean;
}

export const useNotificationStore = create<NotificationState>(() => ({ items: [], bellOpen: false }));

export function setBellOpen(open: boolean) {
  useNotificationStore.setState({ bellOpen: open });
}

export function setNotifications(items: GameNotification[]) {
  useNotificationStore.setState({ items });
}
