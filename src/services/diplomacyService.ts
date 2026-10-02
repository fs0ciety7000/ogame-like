import { create } from "zustand";
import { pb, subscribeRecords } from "@/lib/pocketbase";
import { callGame } from "@/services/playerService";
import type { AlliancePact } from "@/game/diplomacy";

/* Diplomatie (v3.8) : pactes (lisibles par tous les joueurs connectés) et
   canal partagé de chaque relation (membres des deux alliances). */

export interface PactMessage {
  id: string;
  pactId: string;
  authorUid: string;
  authorPseudo: string;
  authorTag: string;
  text: string;
  createdAtMs: number;
}

export const usePactStore = create<{ pacts: AlliancePact[] }>(() => ({ pacts: [] }));

/** Tous les pactes non clos des 200 derniers, tenus à jour. */
export function subscribePacts(cb?: (pacts: AlliancePact[]) => void): () => void {
  let active = true;
  const refresh = () => {
    pb.collection("alliance_pacts")
      .getList<AlliancePact>(1, 200, { sort: "-createdAtMs" })
      .then((res) => {
        if (!active) return;
        usePactStore.setState({ pacts: res.items });
        cb?.(res.items);
      })
      .catch(() => {});
  };
  refresh();
  const unsubscribe = subscribeRecords("alliance_pacts", "*", refresh);
  return () => {
    active = false;
    unsubscribe();
  };
}

export function subscribePactMessages(pactId: string, cb: (messages: PactMessage[]) => void): () => void {
  let active = true;
  const filter = pb.filter("pactId = {:pactId}", { pactId });
  const refresh = () => {
    pb.collection("pact_messages")
      .getList<PactMessage>(1, 80, { filter, sort: "-createdAtMs" })
      .then((res) => active && cb(res.items.reverse()))
      .catch(() => {});
  };
  refresh();
  const unsubscribe = subscribeRecords("pact_messages", "*", refresh, filter);
  return () => {
    active = false;
    unsubscribe();
  };
}

export function diplomacy(action: "propose", payload: { targetAllianceId: string }): Promise<AlliancePact>;
export function diplomacy(action: "accept" | "decline" | "cancel" | "break", payload: { pactId: string }): Promise<AlliancePact>;
export function diplomacy(action: "message", payload: { pactId: string; text: string }): Promise<PactMessage>;
export function diplomacy(action: string, payload: Record<string, unknown>) {
  return callGame("diplomacy", { action, ...payload });
}
