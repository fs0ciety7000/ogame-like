import { create } from "zustand";
import { normalizeChallengeState, type ChallengeState } from "@/game/challenges";

/* Défi hebdomadaire (v3.8) : état reçu avec le reste de game_config. */
export const useChallengeStore = create<ChallengeState>(() => normalizeChallengeState(null));

export function applyChallengeRecord(data: unknown | null) {
  useChallengeStore.setState(normalizeChallengeState(data));
}

/** v5.10 : récupère la récompense du défi terminé (le serveur crédite et note la réclamation). */
export async function claimChallenge(): Promise<{ gain: Partial<Record<string, number>>; tokens?: number }> {
  // 6.14.113 (AC-15) : par l'action du joueur (même chemin que « Tout réclamer »).
  const { claimChallengeAction } = await import("@/services/playerService");
  const out = await claimChallengeAction();
  const st = useChallengeStore.getState();
  const uid = (await import("@/store/authStore")).useAuthStore.getState().user?.uid;
  if (st.previous && uid) useChallengeStore.setState({ previous: { ...st.previous, claimed: [...(st.previous.claimed ?? []), uid] } });
  return out;
}
