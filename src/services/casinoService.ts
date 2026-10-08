import { useEffect } from "react";
import { create } from "zustand";
import { useIsAdmin } from "@/services/adminService";
import { pb } from "@/lib/pocketbase";
import { CASINO_KEY, casinoOpen, normalizeCasino, type CasinoSettings, type CasinoState, type SlotSymbol, type SpinOutcome } from "@/game/casino";
import type { ResourceId } from "@/types/game";

/* v5.12 : Casino orbital (réglages et palmarès publics, tirage côté serveur). */

export async function fetchCasino(): Promise<CasinoState> {
  try {
    const rec = await pb.collection("game_config").getFirstListItem<{ data: unknown }>(pb.filter("key = {:k}", { k: CASINO_KEY }));
    return normalizeCasino(rec.data);
  } catch {
    return normalizeCasino(null);
  }
}

const useCasinoStore = create<{ state: CasinoState | null }>(() => ({ state: null }));
let polling = false;

/** 6.14.113 : état reçu avec le reste de `game_config` (contentService) : la pastille d'Ordres du jour sait si le jeton du
 *  jour attend, sans requête de plus. */
export function applyCasinoRecord(data: unknown | null) {
  useCasinoStore.setState({ state: normalizeCasino(data) });
}

/** Réglages du casino connus du client (`null` tant qu'ils ne sont pas chargés : rien n'est compté). */
export function useCasinoSettings(): CasinoSettings | null {
  return useCasinoStore((s) => s.state?.settings ?? null);
}

/** Relit l'état du casino (après un tirage, ou toutes les minutes). */
export function refreshCasino() {
  void fetchCasino().then((state) => useCasinoStore.setState({ state }));
}

function startPolling() {
  if (polling) return;
  polling = true;
  refreshCasino();
  setInterval(refreshCasino, 60_000);
}

/** Réglages et palmarès du casino, partagés par la navigation et la page. */
export function useCasino(): [CasinoState | null, () => void] {
  useEffect(() => {
    startPolling();
  }, []);
  return [useCasinoStore((s) => s.state), refreshCasino];
}

/** Casino visible : ouvert (équipe ou programme), ou toujours pour un administrateur. */
export function useCasinoVisible(): boolean {
  const [state] = useCasino();
  const admin = useIsAdmin();
  return admin || (!!state && casinoOpen(state.settings, Date.now()));
}

export interface SpinResult {
  outcome: SpinOutcome;
  reels: SlotSymbol[];
  resources: Partial<Record<ResourceId, number>>;
  token: boolean;
  tokens: number;
  fromPot: boolean;
}

export function spinSlot(): Promise<SpinResult> {
  return pb.send("/api/cosmic/casino", { method: "POST", body: { action: "spin" } });
}

/** 6.14.113 (AC-15) : par l'action du joueur (même chemin que « Tout réclamer », ligne au Journal). */
export async function claimDailyToken(): Promise<{ added: number; tokens: number }> {
  const { claimCasinoDailyAction } = await import("@/services/playerService");
  return claimCasinoDailyAction();
}

export function adminCasinoSettings(settings: CasinoSettings): Promise<{ settings: CasinoSettings }> {
  return pb.send("/api/cosmic/admin/casino", { method: "POST", body: { action: "settings", settings } });
}

export function adminGrantTokens(target: string, tokens: number, note: string): Promise<{ players: number; tokens: number }> {
  return pb.send("/api/cosmic/admin/casino", { method: "POST", body: { action: "grant", target, tokens, note } });
}
