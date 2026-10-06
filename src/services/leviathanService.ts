import { create } from "zustand";
import { normalizeLeviathan, type LeviathanState } from "@/game/leviathan";
import { launchFleet } from "@/services/playerService";
import { pb } from "@/lib/pocketbase";

/* Léviathan (v3.1) : état lu dans game_config (clé « leviathan »), tenu à
   jour par l'abonnement du contenu du jeu (contentService). */

export const useLeviathanStore = create<{ state: LeviathanState | null }>(() => ({ state: null }));

export function applyLeviathanRecord(raw: unknown) {
  useLeviathanStore.setState({ state: normalizeLeviathan(raw) });
}

export function useLeviathan(): LeviathanState | null {
  return useLeviathanStore((s) => s.state);
}

export function sendLeviathanAssault(fleet: Record<string, number>, formation: string) {
  return launchFleet({ targetUid: "leviathan", fleet, mission: "leviathan", formation }, "boss mondial");
}

export function adminLeviathan(action: "start" | "stop" | "resize" | "reschedule", maxHp?: number, endMs?: number, bossId?: string) {
  return pb.send<LeviathanState>("/api/cosmic/admin/leviathan", { method: "POST", body: { action, maxHp, endMs, bossId } });
}
