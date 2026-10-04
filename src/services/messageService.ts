import { create } from "zustand";
import { pb, subscribeRecords } from "@/lib/pocketbase";
import { callGame } from "@/services/playerService";
import type { PrivateMessage } from "@/game/messages";

/* Messagerie privée (v3.7) : lecture directe (règles PocketBase), envoi et
   accusés de lecture par le serveur (quota, blocage, notification). */

export const useMessagesStore = create<{ messages: PrivateMessage[]; loaded: boolean }>(() => ({ messages: [], loaded: false }));

/** Mes 300 derniers messages (envoyés et reçus), tenus à jour en temps réel. */
export function subscribeMyMessages(uid: string): () => void {
  let active = true;
  const filter = pb.filter("fromUid = {:uid} || toUid = {:uid}", { uid });
  const refresh = () => {
    pb.collection("private_messages")
      .getList<PrivateMessage>(1, 300, { filter, sort: "-createdAtMs" })
      .then((res) => active && useMessagesStore.setState({ messages: res.items, loaded: true }))
      .catch((err) => console.error("Lecture des messages impossible :", err));
  };
  refresh();
  const unsubscribe = subscribeRecords("private_messages", "*", refresh, filter);
  return () => {
    active = false;
    unsubscribe();
    useMessagesStore.setState({ messages: [], loaded: false });
  };
}

export function useUnreadMessageCount(uid: string | null | undefined): number {
  return useMessagesStore((s) => (uid ? s.messages.filter((m) => m.toUid === uid && !m.readAtMs).length : 0));
}

export function sendPrivateMessage(to: string, text: string) {
  return callGame<PrivateMessage>("messages/send", { to, text });
}

export function markConversationRead(other: string) {
  return callGame<{ read: number }>("messages/read", { with: other });
}

export interface MessageBlock {
  id: string;
  ownerUid: string;
  blockedUid: string;
  blockedPseudo: string;
}

export async function listBlocks(uid: string): Promise<MessageBlock[]> {
  return pb.collection("message_blocks").getFullList<MessageBlock>({ filter: pb.filter("ownerUid = {:uid}", { uid }) });
}

export async function blockPlayer(uid: string, blockedUid: string, blockedPseudo: string) {
  return pb.collection("message_blocks").create<MessageBlock>({ ownerUid: uid, blockedUid, blockedPseudo, createdAtMs: Date.now() });
}

export async function unblock(id: string) {
  await pb.collection("message_blocks").delete(id);
}

/* ---------- v5.14.2 : « … écrit » (comme le chat d'alliance) ---------- */

let lastTyping = { to: "", at: 0 };

/** Signale à l'autre qu'on lui écrit (au plus une fois toutes les 3 s). */
export function sendMessageTyping(to: string) {
  const now = Date.now();
  if (!to || (lastTyping.to === to && now - lastTyping.at < 3000)) return;
  lastTyping = { to, at: now };
  void pb.send("/api/cosmic/messages/typing", { method: "POST", body: { to } }).catch(() => undefined);
}

/** Joueurs en train de m'écrire (signal éphémère, oublié après 5 s) : uid → instant. */
export function subscribeMessageTyping(selfUid: string, cb: (typing: Record<string, number>) => void): () => void {
  const typing: Record<string, number> = {};
  const emit = () => {
    const now = Date.now();
    for (const [uid, at] of Object.entries(typing)) if (now - at > 5000) delete typing[uid];
    cb({ ...typing });
  };
  let unsubscribe: (() => Promise<void>) | null = null;
  let cancelled = false;
  pb.realtime
    .subscribe(`dmtyping_${selfUid}`, (e: { uid?: string }) => {
      if (!e?.uid || e.uid === selfUid) return;
      typing[e.uid] = Date.now();
      emit();
    })
    .then((fn) => {
      if (cancelled) void fn();
      else unsubscribe = fn;
    })
    .catch(() => undefined);
  const timer = setInterval(emit, 1500);
  return () => {
    cancelled = true;
    clearInterval(timer);
    void unsubscribe?.();
  };
}

