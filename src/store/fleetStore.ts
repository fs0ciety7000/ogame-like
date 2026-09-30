import { create } from "zustand";
import type { Fleet } from "@/game/fleets";

/** Flottes du joueur et flottes hostiles en approche (abonnement temps réel
 *  ouvert par useGameSync). */
export const useFleetStore = create<{ fleets: Fleet[] }>(() => ({ fleets: [] }));

export function setFleets(fleets: Fleet[]) {
  useFleetStore.setState({ fleets });
}
