import { create } from "zustand";

interface CelebrationState {
  playId: number;
  rankLabel: string;
  rankIcon: string;
}

export const useCelebrationStore = create<CelebrationState>(() => ({ playId: 0, rankLabel: "", rankIcon: "" }));

/** Déclenche la célébration plein écran (confettis + nom du rang) affichée
 *  par <RankUpCelebration/>, montée une seule fois dans AppShell. Un
 *  compteur plutôt qu'un booléen pour que deux montées de rang rapprochées
 *  relancent bien l'animation à chaque fois (cf. useWarpEffectStore). */
export function triggerRankCelebration(rankLabel: string, rankIcon: string) {
  useCelebrationStore.setState((s) => ({ playId: s.playId + 1, rankLabel, rankIcon }));
}
