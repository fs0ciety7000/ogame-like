import { create } from "zustand";
import type { Fleet } from "@/game/fleets";
import { synthesisState } from "@/game/synthesis";
import { usePlayerStore } from "@/store/playerStore";

/** Flottes du joueur et flottes hostiles en approche (abonnement temps réel
 *  ouvert par useGameSync). */
export const useFleetStore = create<{ fleets: Fleet[] }>(() => ({ fleets: [] }));

let raw: Fleet[] = [];

/** v4.0 : une flotte leurrée montre une fausse composition à tout le monde ;
 *  son propriétaire retrouve la vraie dans son Labo de synthèse. */
function ownView(fleets: Fleet[]): Fleet[] {
  const player = usePlayerStore.getState().player;
  if (!player) return fleets;
  const decoys = synthesisState(player).decoys;
  if (Object.keys(decoys).length === 0) return fleets;
  return fleets.map((f) => (f.ownerUid === player.uid && decoys[f.id] ? { ...f, units: decoys[f.id], decoyed: true } : f));
}

export function setFleets(fleets: Fleet[]) {
  raw = fleets;
  useFleetStore.setState({ fleets: ownView(raw) });
}

usePlayerStore.subscribe((s, prev) => {
  if (s.player?.synthesis !== prev.player?.synthesis) useFleetStore.setState({ fleets: ownView(raw) });
});
