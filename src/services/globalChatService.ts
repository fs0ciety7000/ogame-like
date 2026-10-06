import { useEffect, useState } from "react";
import { pb, subscribeRecords } from "@/lib/pocketbase";
import { coalesce } from "@/lib/sharedSubscriptions";
import { GLOBAL_CHAT_RULES } from "@/game/globalChat";

/* 5.26 : canal global du serveur (messages publics, modérés par le serveur). */

export interface GlobalMessage {
  id: string;
  uid: string;
  pseudo: string;
  allianceTag: string;
  text: string;
  createdAtMs: number;
  masked: boolean;
}

async function loadRecent(): Promise<GlobalMessage[]> {
  const res = await pb.collection("global_messages").getList<GlobalMessage>(1, GLOBAL_CHAT_RULES.page, { sort: "-createdAtMs", requestKey: null });
  return res.items.reverse();
}

/** Derniers messages, tenus à jour en direct (relecture regroupée, et chaque minute pour retirer les masqués). */
export function useGlobalMessages(): { messages: GlobalMessage[]; loaded: boolean; remove: (id: string) => void } {
  const [messages, setMessages] = useState<GlobalMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    const refresh = () =>
      void loadRecent()
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
  }, []);
  return { messages, loaded, remove: (id) => setMessages((m) => m.filter((x) => x.id !== id)) };
}

function errorMessage(err: unknown, fallback: string) {
  return (err as { response?: { message?: string } })?.response?.message || fallback;
}

export async function sendGlobalMessage(text: string): Promise<{ masked: boolean }> {
  try {
    return await pb.send<{ masked: boolean }>("/api/cosmic/global/send", { method: "POST", body: { text } });
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
