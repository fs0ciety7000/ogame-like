import { create } from "zustand";
import { normalizeChallengeState, type ChallengeState } from "@/game/challenges";

/* Défi hebdomadaire (v3.8) : état reçu avec le reste de game_config. */
export const useChallengeStore = create<ChallengeState>(() => normalizeChallengeState(null));

export function applyChallengeRecord(data: unknown | null) {
  useChallengeStore.setState(normalizeChallengeState(data));
}
