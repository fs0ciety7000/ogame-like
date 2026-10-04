import { create } from "zustand";
import { normalizeLeviathan, type LeviathanState } from "@/game/leviathan";
import { callGame } from "@/services/playerService";
import { pb } from "@/lib/pocketbase";

/* Boss de saison (v4.3) : état lu dans game_config (clé « season_boss »),
   tenu à jour par l'abonnement du contenu du jeu (contentService). */

export const useSeasonBossStore = create<{ state: LeviathanState | null }>(() => ({ state: null }));

export function applySeasonBossRecord(raw: unknown) {
  useSeasonBossStore.setState({ state: normalizeLeviathan(raw) });
}

export function useSeasonBoss(): LeviathanState | null {
  return useSeasonBossStore((s) => s.state);
}

export function sendSeasonBossAssault(fleet: Record<string, number>, formation: string) {
  return callGame("fleet/send", { targetUid: "seasonboss", fleet, mission: "seasonboss", formation });
}

export function adminSeasonBoss(action: "start" | "stop" | "resize" | "reschedule", maxHp?: number, endMs?: number) {
  return pb.send<LeviathanState>("/api/cosmic/admin/seasonboss", { method: "POST", body: { action, maxHp, endMs } });
}
