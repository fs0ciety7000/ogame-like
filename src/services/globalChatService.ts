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
  /** 5.26.3 : couleur de pseudo (Comptoir), jeton du thème. */
  nameTone?: string;
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

type ListedRoom = ChatRoom & { pending?: boolean };

export function useChatRooms(): { rooms: ChatRoom[]; loaded: boolean; reload: () => void; add: (room: ChatRoom) => void } {
  const [rooms, setRooms] = useState<ListedRoom[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    const refresh = () =>
      void pb
        .collection("chat_rooms")
        .getFullList<ChatRoom>({ sort: "-lastMessageAtMs", requestKey: null })
        .then((r) => {
          if (!alive) return;
          // Un salon tout juste créé peut manquer à la liste (temps réel en retard) : on le garde.
          setRooms((prev) => [...r, ...prev.filter((p) => p.pending && Date.now() - p.createdAtMs < 60_000 && !r.some((x) => x.id === p.id))]);
          setLoaded(true);
        })
        .catch(() => {});
    refresh();
    const unsubscribe = subscribeRecords<ChatRoom>("chat_rooms", "*", coalesce(refresh, 300));
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [tick]);
  return {
    rooms,
    loaded,
    reload: () => setTick((t) => t + 1),
    add: (room) => setRooms((prev) => [{ ...room, pending: true }, ...prev.filter((p) => p.id !== room.id)]),
  };
}

export async function createChatRoom(name: string, topic: string): Promise<ChatRoom> {
  try {
    return await pb.send<ChatRoom>("/api/cosmic/global/room", { method: "POST", body: { action: "create", name, topic } });
  } catch (err) {
    throw new Error(errorMessage(err, "Création du salon impossible."));
  }
}

/** 5.27 : message épinglé (vide : retire l'épingle) et événement programmé (atMs 0 : retiré). */
export async function pinRoomMessage(id: string, messageId: string): Promise<void> {
  try {
    await pb.send("/api/cosmic/global/room", { method: "POST", body: { action: "pin", id, messageId } });
  } catch (err) {
    throw new Error(errorMessage(err, "Épingle impossible."));
  }
}

export async function setRoomEvent(id: string, label: string, atMs: number): Promise<void> {
  try {
    await pb.send("/api/cosmic/global/room", { method: "POST", body: { action: "event", id, label, atMs } });
  } catch (err) {
    throw new Error(errorMessage(err, "Événement impossible à programmer."));
  }
}

/* 5.27 : messages non lus par salon (dernier passage mémorisé dans ce navigateur). */
const ROOM_SEEN_KEY = "cosmic:room-seen";

function readRoomSeen(): Record<string, number> {
  try {
    const raw = JSON.parse(localStorage.getItem(ROOM_SEEN_KEY) ?? "{}") as Record<string, unknown>;
    return Object.fromEntries(Object.entries(raw).filter(([, v]) => typeof v === "number")) as Record<string, number>;
  } catch {
    return {};
  }
}

export const useRoomSeen = create<{ seen: Record<string, number> }>(() => ({ seen: readRoomSeen() }));

export function markRoomSeen(room: string, ms = Date.now()) {
  const seen = useRoomSeen.getState().seen;
  if (ms <= (seen[room] ?? 0)) return;
  const next = { ...seen, [room]: ms };
  try {
    localStorage.setItem(ROOM_SEEN_KEY, JSON.stringify(next));
  } catch {
    /* non mémorisé */
  }
  useRoomSeen.setState({ seen: next });
}

/** Non-lus par salon (99 au plus) : seuls les salons actifs depuis le dernier passage sont interrogés. */
export function useRoomUnread(uid: string, rooms: ChatRoom[], current: string): Record<string, number> {
  const seen = useRoomSeen((s) => s.seen);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const key = rooms.map((r) => `${r.id}:${r.lastMessageAtMs}`).join(",");
  useEffect(() => {
    let alive = true;
    const dayAgo = Date.now() - 86_400_000;
    const stale = rooms.filter((r) => r.id !== current && r.lastMessageAtMs > Math.max(seen[r.id] ?? 0, dayAgo));
    void Promise.all(
      stale.map((r) =>
        pb
          .collection("global_messages")
          .getList(1, 1, { filter: pb.filter("room = {:r} && createdAtMs > {:t} && uid != {:u} && masked = false", { r: r.id, t: Math.max(seen[r.id] ?? 0, dayAgo), u: uid }), fields: "id", requestKey: null })
          .then((res) => [r.id, Math.min(99, res.totalItems)] as const)
          .catch(() => [r.id, 0] as const),
      ),
    ).then((list) => {
      if (alive) setCounts(Object.fromEntries(list.filter(([, n]) => n > 0)));
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key résume la liste des salons.
  }, [key, seen, current, uid]);
  return counts;
}

/** 5.26.3 : icône du salon (Bannière de salon, Comptoir). */
export async function setChatRoomIcon(id: string, icon: string): Promise<void> {
  try {
    await pb.send("/api/cosmic/global/room", { method: "POST", body: { action: "icon", id, icon } });
  } catch (err) {
    throw new Error(errorMessage(err, "Icône impossible à changer."));
  }
}

export async function closeChatRoom(id: string): Promise<void> {
  try {
    await pb.send("/api/cosmic/global/room", { method: "POST", body: { action: "close", id } });
  } catch (err) {
    throw new Error(errorMessage(err, "Fermeture impossible."));
  }
}
