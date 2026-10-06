import { useEffect, useState } from "react";
import { pb, subscribeRecords } from "@/lib/pocketbase";
import { coalesce } from "@/lib/sharedSubscriptions";
import { create } from "zustand";
import { GLOBAL_CHAT_RULES, normalizeReactions, type ChatReactions, type ChatRoom } from "@/game/globalChat";

/* 5.26 : canal global du serveur (messages publics, modérés par le serveur). */

export interface GlobalMessage {
  id: string;
  uid: string;
  pseudo: string;
  allianceTag: string;
  text: string;
  createdAtMs: number;
  masked: boolean;
  /** 5.26.2 : salon (vide : canal global) et réactions. */
  room?: string;
  reactions?: ChatReactions;
}

async function loadRecent(room: string): Promise<GlobalMessage[]> {
  const res = await pb.collection("global_messages").getList<GlobalMessage>(1, GLOBAL_CHAT_RULES.page, { filter: pb.filter("room = {:r}", { r: room }), sort: "-createdAtMs", requestKey: null });
  return res.items.reverse().map((m) => ({ ...m, reactions: normalizeReactions(m.reactions) }));
}

/** Derniers messages, tenus à jour en direct (relecture regroupée, et chaque minute pour retirer les masqués). */
export function useGlobalMessages(room = ""): { messages: GlobalMessage[]; loaded: boolean; remove: (id: string) => void; patch: (id: string, m: Partial<GlobalMessage>) => void } {
  const [messages, setMessages] = useState<GlobalMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    setLoaded(false);
    const refresh = () =>
      void loadRecent(room)
        .then((m) => {
          if (!alive) return;
          setMessages(m);
          setLoaded(true);
        })
        .catch(() => alive && setLoaded(true));
    refresh();
    const unsubscribe = subscribeRecords<GlobalMessage>("global_messages", "*", coalesce(refresh, 150));
    const id = window.setInterval(refresh, 60_000);
    return () => {
      alive = false;
      unsubscribe();
      window.clearInterval(id);
    };
  }, [room]);
  return {
    messages,
    loaded,
    remove: (id) => setMessages((m) => m.filter((x) => x.id !== id)),
    patch: (id, p) => setMessages((m) => m.map((x) => (x.id === id ? { ...x, ...p } : x))),
  };
}

function errorMessage(err: unknown, fallback: string) {
  return (err as { response?: { message?: string } })?.response?.message || fallback;
}

export async function sendGlobalMessage(text: string, room = ""): Promise<{ masked: boolean }> {
  try {
    return await pb.send<{ masked: boolean }>("/api/cosmic/global/send", { method: "POST", body: { text, room } });
  } catch (err) {
    throw new Error(errorMessage(err, "Envoi impossible."));
  }
}

export async function reportGlobalMessage(id: string): Promise<{ hidden: boolean }> {
  try {
    return await pb.send<{ hidden: boolean }>("/api/cosmic/global/report", { method: "POST", body: { id } });
  } catch (err) {
    throw new Error(errorMessage(err, "Signalement impossible."));
  }
}

/* Sourdine personnelle : joueurs masqués chez moi (sur cet appareil). */
const MUTE_KEY = "cosmic-empires:global-muted";

export function readPersonalMutes(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(MUTE_KEY) ?? "[]") as unknown;
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string").slice(0, 200) : [];
  } catch {
    return [];
  }
}

export function writePersonalMutes(list: string[]) {
  try {
    localStorage.setItem(MUTE_KEY, JSON.stringify(list.slice(0, 200)));
  } catch {
    /* gardé pour la session */
  }
}

/* 5.26.2 : messages du canal global non lus (badge « Communications »). La date du
   dernier passage sur le canal est gardée sur l'appareil. */
const SEEN_KEY = "cosmic-empires:global-seen";

function readSeen(): number {
  try {
    return Number(localStorage.getItem(SEEN_KEY)) || 0;
  } catch {
    return 0;
  }
}

export const useGlobalSeen = create<{ seenMs: number }>(() => ({ seenMs: readSeen() }));

/** Le canal vient d'être lu (onglet ouvert, nouveau message affiché). */
export function markGlobalSeen(ms = Date.now()) {
  if (ms <= useGlobalSeen.getState().seenMs) return;
  try {
    localStorage.setItem(SEEN_KEY, String(ms));
  } catch {
    /* non mémorisé */
  }
  useGlobalSeen.setState({ seenMs: ms });
}

/** Nombre de messages des autres joueurs arrivés depuis le dernier passage (99 au plus). */
export function useGlobalUnreadCount(uid: string | null | undefined): number {
  const seenMs = useGlobalSeen((s) => s.seenMs);
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!uid) {
      return;
    }
    let alive = true;
    // Jamais venu sur le canal : on ne compte que la dernière journée.
    const since = seenMs || Date.now() - 86_400_000;
    const refresh = () =>
      void pb
        .collection("global_messages")
        .getList(1, 1, { filter: pb.filter("createdAtMs > {:t} && uid != {:u} && masked = false && room = ''", { t: since, u: uid }), fields: "id", requestKey: null })
        .then((r) => alive && setCount(Math.min(99, r.totalItems)))
        .catch(() => {});
    refresh();
    const unsubscribe = subscribeRecords<GlobalMessage>("global_messages", "*", coalesce(refresh, 500));
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [uid, seenMs]);
  return uid ? count : 0;
}

/* 5.26.2 : réactions et salons thématiques. */

export async function reactGlobalMessage(id: string, emoji: string): Promise<{ reactions: ChatReactions }> {
  try {
    return await pb.send<{ reactions: ChatReactions }>("/api/cosmic/global/react", { method: "POST", body: { id, emoji } });
  } catch (err) {
    throw new Error(errorMessage(err, "Réaction impossible."));
  }
}

export function useChatRooms(): { rooms: ChatRoom[]; reload: () => void } {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    const refresh = () =>
      void pb
        .collection("chat_rooms")
        .getFullList<ChatRoom>({ sort: "-lastMessageAtMs", requestKey: null })
        .then((r) => alive && setRooms(r))
        .catch(() => {});
    refresh();
    const unsubscribe = subscribeRecords<ChatRoom>("chat_rooms", "*", coalesce(refresh, 300));
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [tick]);
  return { rooms, reload: () => setTick((t) => t + 1) };
}

export async function createChatRoom(name: string, topic: string): Promise<ChatRoom> {
  try {
    return await pb.send<ChatRoom>("/api/cosmic/global/room", { method: "POST", body: { action: "create", name, topic } });
  } catch (err) {
    throw new Error(errorMessage(err, "Création du salon impossible."));
  }
}

export async function closeChatRoom(id: string): Promise<void> {
  try {
    await pb.send("/api/cosmic/global/room", { method: "POST", body: { action: "close", id } });
  } catch (err) {
    throw new Error(errorMessage(err, "Fermeture impossible."));
  }
}
