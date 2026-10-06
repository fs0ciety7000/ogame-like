import { create } from "zustand";
import { ELITE_TARGET } from "@/game/fleets";
import { normalizeElite, type EliteHunt, type ShopItemId } from "@/game/bounties";
import { callGame } from "@/services/playerService";
import { pb } from "@/lib/pocketbase";
import type { Fleet } from "@/game/fleets";
import type { ResourceId } from "@/types/game";

/* Chasseurs de primes (v3.9) : la proie d'élite est lue dans game_config
   (clé « bounty_elite ») avec le reste du contenu ; le reste passe par les
   routes du serveur. */

export const useEliteStore = create<{ state: EliteHunt | null }>(() => ({ state: null }));

export function applyEliteRecord(raw: unknown) {
  useEliteStore.setState({ state: normalizeElite(raw) });
}

export function useElite(): EliteHunt | null {
  return useEliteStore((s) => s.state);
}

export function sendBountyHunt(bountyId: string, fleet: Record<string, number>, formation: string): Promise<Fleet> {
  return callGame<Fleet>("fleet/send", { mission: "bounty", bountyId, fleet, formation });
}

export function sendEliteAssault(fleet: Record<string, number>, formation: string): Promise<Fleet> {
  return callGame<Fleet>("fleet/send", { mission: "elite", targetUid: ELITE_TARGET, fleet, formation });
}

export function buyBountyItem(item: ShopItemId, buildingId?: string): Promise<{ message: string }> {
  return callGame("bounty", { action: "buy", item, buildingId });
}

export function exchangeBountyAmber(amount: number): Promise<{ gain: Partial<Record<ResourceId, number>> }> {
  return callGame("bounty", { action: "exchange", amount });
}

/** 5.26.3 : couleur de pseudo (objet de prestige du Comptoir). */
export function setBountyNameTone(tone: string): Promise<{ tone: string }> {
  return callGame("bounty", { action: "nameTone", tone });
}

/** 5.26.3 : don d'Ambre au pot commun (badge « Mécène »). */
export function donateAmberToPot(amount: number): Promise<{ amber: number; donated: number }> {
  return callGame("bounty", { action: "donate", amount });
}

export function fireRecallBeacon(fleetId: string): Promise<{ message: string }> {
  return callGame("bounty", { action: "beacon", fleetId });
}

export function adminEliteTick(now?: number) {
  return pb.send<EliteHunt>("/api/cosmic/admin/elite", { method: "POST", body: { now } });
}
