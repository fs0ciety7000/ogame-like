import { create } from "zustand";
import type { GameNotification } from "@/types/game";

interface NotificationState {
  items: GameNotification[];
}

export const useNotificationStore = create<NotificationState>(() => ({ items: [] }));

export function setNotifications(items: GameNotification[]) {
  useNotificationStore.setState({ items });
}
