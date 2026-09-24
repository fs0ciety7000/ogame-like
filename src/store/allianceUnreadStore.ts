import { create } from "zustand";

interface AllianceUnreadState {
  count: number;
}

export const useAllianceUnreadStore = create<AllianceUnreadState>(() => ({ count: 0 }));

export function setAllianceUnreadCount(count: number) {
  useAllianceUnreadStore.setState({ count });
}
