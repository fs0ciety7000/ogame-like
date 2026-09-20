import { create } from "zustand";
import type { PlayerState, QueuesState } from "@/types/game";

interface PlayerStoreState {
  player: PlayerState | null;
  queues: QueuesState | null;
  loading: boolean;
}

export const usePlayerStore = create<PlayerStoreState>(() => ({
  player: null,
  queues: null,
  loading: true,
}));

export function setPlayerData(player: PlayerState | null) {
  usePlayerStore.setState({ player, loading: false });
}

export function setQueuesData(queues: QueuesState | null) {
  usePlayerStore.setState({ queues });
}

export function resetPlayerStore() {
  usePlayerStore.setState({ player: null, queues: null, loading: true });
}
