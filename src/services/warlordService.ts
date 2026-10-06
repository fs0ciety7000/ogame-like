import { create } from "zustand";
import { pb } from "@/lib/pocketbase";
import { callGame, endVacation } from "@/services/playerService";
import type { Vendetta, WarlordPowerAlert, WarlordPublic } from "@/game/warlords";
import type { VacationState } from "@/game/vacation";
import type { Coalition } from "@/game/coalition";

/* v4.2 : seigneurs de guerre (fiches publiques, vendettas) et mode vacances. */

export interface WarlordsView {
  warlords: WarlordPublic[];
  history: Vendetta[];
  /** v4.7 : coalition en cours (ou la dernière terminée). */
  coalition?: Coalition | null;
  /** 5.23 : administration seulement : seigneurs trop forts face au 2e joueur. */
  balance?: { second: number; alerts: WarlordPowerAlert[] };
}

export function fetchWarlords(): Promise<WarlordsView> {
  return pb.send<WarlordsView>("/api/cosmic/warlords", { method: "GET" });
}

/** Seigneurs connus (badge PNJ, portraits) : chargés une fois par session. */
export const useWarlordsStore = create<{ list: WarlordPublic[]; loadedAtMs: number; coalition: Coalition | null }>(() => ({ list: [], loadedAtMs: 0, coalition: null }));

export async function loadWarlords(force = false): Promise<WarlordPublic[]> {
  const st = useWarlordsStore.getState();
  if (!force && st.loadedAtMs > 0 && Date.now() - st.loadedAtMs < 5 * 60_000) return st.list;
  const view = await fetchWarlords();
  useWarlordsStore.setState({ list: view.warlords, loadedAtMs: Date.now(), coalition: view.coalition ?? null });
  return view.warlords;
}

/** recall (5.26.3) : rappelle un seigneur en fuite avec un Jeton de vendetta du Comptoir. */
export function declareVendetta(warlordId: string, scope: "player" | "alliance", recall = false) {
  return callGame<Vendetta>("warlords", { action: "vendetta", warlordId, scope, recall });
}

export function startVacation(days: number) {
  return callGame<VacationState>("vacation", { days });
}

export { endVacation };
