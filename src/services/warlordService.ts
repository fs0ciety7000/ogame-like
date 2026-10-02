import { create } from "zustand";
import { pb } from "@/lib/pocketbase";
import { callGame, endVacation } from "@/services/playerService";
import type { Vendetta, WarlordPublic } from "@/game/warlords";
import type { VacationState } from "@/game/vacation";

/* v4.2 : seigneurs de guerre (fiches publiques, vendettas) et mode vacances. */

export interface WarlordsView {
  warlords: WarlordPublic[];
  history: Vendetta[];
}

export function fetchWarlords(): Promise<WarlordsView> {
  return pb.send<WarlordsView>("/api/cosmic/warlords", { method: "GET" });
}

/** Seigneurs connus (badge PNJ, portraits) : chargés une fois par session. */
export const useWarlordsStore = create<{ list: WarlordPublic[]; loadedAtMs: number }>(() => ({ list: [], loadedAtMs: 0 }));

export async function loadWarlords(force = false): Promise<WarlordPublic[]> {
  const st = useWarlordsStore.getState();
  if (!force && st.loadedAtMs > 0 && Date.now() - st.loadedAtMs < 5 * 60_000) return st.list;
  const view = await fetchWarlords();
  useWarlordsStore.setState({ list: view.warlords, loadedAtMs: Date.now() });
  return view.warlords;
}

export function declareVendetta(warlordId: string, scope: "player" | "alliance") {
  return callGame<Vendetta>("warlords", { action: "vendetta", warlordId, scope });
}

export function startVacation(days: number) {
  return callGame<VacationState>("vacation", { days });
}

export { endVacation };
