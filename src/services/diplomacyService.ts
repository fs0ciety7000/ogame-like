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

/* ---------- non lus du canal diplomatique ---------- */

const READ_KEY = "cosmic-empires:pact-read";

function readMarks(uid: string): Record<string, number> {
  try {
    return (JSON.parse(localStorage.getItem(`${READ_KEY}:${uid}`) ?? "{}") as Record<string, number>) ?? {};
  } catch {
    return {};
  }
}

export const usePactUnreadStore = create<{ unread: Record<string, number> }>(() => ({ unread: {} }));

let lastMessages: PactMessage[] = [];
let lastUid = "";

function recount() {
  const marks = readMarks(lastUid);
  const unread: Record<string, number> = {};
  for (const m of lastMessages) {
    if (m.authorUid === lastUid || m.createdAtMs <= (marks[m.pactId] ?? 0)) continue;
    unread[m.pactId] = (unread[m.pactId] ?? 0) + 1;
  }
  usePactUnreadStore.setState({ unread });
}

/** Le joueur a lu le canal de ce pacte (mémorisé dans ce navigateur). */
export function markPactRead(uid: string, pactId: string) {
  try {
    localStorage.setItem(`${READ_KEY}:${uid}`, JSON.stringify({ ...readMarks(uid), [pactId]: Date.now() }));
  } catch {
    /* stockage indisponible */
  }
  recount();
}

/** Messages récents des canaux de l'alliance, pour les pastilles « non lu ». */
export function subscribePactUnread(uid: string, allianceId: string): () => void {
  let active = true;
  lastUid = uid;
  const filter = pb.filter("allianceA = {:a} || allianceB = {:a}", { a: allianceId });
  const refresh = () => {
    pb.collection("pact_messages")
      .getList<PactMessage>(1, 200, { filter, sort: "-createdAtMs" })
      .then((res) => {
        if (!active) return;
        lastMessages = res.items;
        recount();
      })
      .catch(() => {});
  };
  refresh();
  const unsubscribe = subscribeRecords("pact_messages", "*", refresh, filter);
  return () => {
    active = false;
    unsubscribe();
    usePactUnreadStore.setState({ unread: {} });
  };
}
