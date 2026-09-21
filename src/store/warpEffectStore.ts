import { create } from "zustand";

interface WarpEffectState {
  playId: number;
}

export const useWarpEffectStore = create<WarpEffectState>(() => ({ playId: 0 }));

/** Déclenche l'animation de "saut" plein écran (ex: lancement de mission).
 *  Incrémente un compteur plutôt qu'un simple booléen pour que deux
 *  déclenchements rapprochés relancent bien l'animation à chaque fois. */
export function triggerWarpEffect() {
  useWarpEffectStore.setState((s) => ({ playId: s.playId + 1 }));
}
