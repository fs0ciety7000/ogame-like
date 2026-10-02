import { create } from "zustand";
import { pb } from "@/lib/pocketbase";
import { gazetteState, type GazetteIssue, type GazetteState } from "@/game/gazette";

/* v4.6 : Gazette du secteur, reçue avec game_config (clé « gazette »). */

export const useGazetteStore = create<GazetteState>(() => gazetteState(null));

export function applyGazetteRecord(data: unknown | null) {
  useGazetteStore.setState(gazetteState(data), true);
}

/** Administration : publie un numéro tout de suite. */
export function adminPublishGazette() {
  return pb.send<GazetteIssue>("/api/cosmic/admin/gazette", { method: "POST" });
}
