import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { create } from "zustand";
import { COMMON_RESOURCES, economySnapshot } from "@/game/economy";
import { isOnline } from "@/game/retention";
import { RESOURCE_LIST } from "@/game/resources";
import { showBrowserNotification } from "@/store/browserNotifyStore";
import { useDirectoryStore } from "@/store/directoryStore";
import { usePlayerStore } from "@/store/playerStore";

/* =====================================================
   5.16 : rappels choisis par le joueur, propres à l'appareil :
   - entrepôt rempli à X % (une ressource commune, ou n'importe laquelle) ;
   - un joueur suivi vient de se connecter.
   Chaque rappel se déclenche une fois, puis se réarme quand la condition
   redevient fausse (le stock redescend, le joueur se déconnecte).
   Notification du navigateur si elle est autorisée, sinon simple toast.
===================================================== */

export type Reminder = { id: string; kind: "storage"; pct: number } | { id: string; kind: "online"; uid: string; pseudo: string };

const KEY = "cosmic-empires:reminders";
export const REMINDERS_MAX = 12;

function load(): Reminder[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(raw) ? (raw as Reminder[]).filter((r) => r && (r.kind === "storage" || r.kind === "online")).slice(0, REMINDERS_MAX) : [];
  } catch {
    return [];
  }
}

function save(list: Reminder[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* stockage indisponible : les rappels restent pour la session */
  }
}

export const useRemindersStore = create<{ list: Reminder[] }>(() => ({ list: load() }));

export function addReminder(r: { kind: "storage"; pct: number } | { kind: "online"; uid: string; pseudo: string }): void {
  const list = useRemindersStore.getState().list;
  const id = r.kind === "online" ? `online-${r.uid}` : `storage-${r.pct}`;
  if (list.some((x) => x.id === id)) return;
  const next = [...list, { ...r, id } as Reminder].slice(-REMINDERS_MAX);
  save(next);
  useRemindersStore.setState({ list: next });
}

export function removeReminder(id: string): void {
  const next = useRemindersStore.getState().list.filter((r) => r.id !== id);
  save(next);
  useRemindersStore.setState({ list: next });
}

export function hasOnlineReminder(uid: string): boolean {
  return useRemindersStore.getState().list.some((r) => r.kind === "online" && r.uid === uid);
}

/** Ressource commune la plus remplie (part de l'entrepôt), ou null. */
export function fullestStorage(player: Parameters<typeof economySnapshot>[0]): { res: string; pct: number } | null {
  const snap = economySnapshot(player, Date.now());
  if (!(snap.capacity > 0) || !Number.isFinite(snap.capacity)) return null;
  let best: { res: string; pct: number } | null = null;
  for (const res of COMMON_RESOURCES) {
    const pct = (player.resources[res] ?? 0) / snap.capacity;
    if (!best || pct > best.pct) best = { res, pct };
  }
  return best;
}

function fire(title: string, body: string, key: string) {
  toast.info(title, { description: body });
  showBrowserNotification(title, body, key);
}

/** À monter une fois (coque du jeu) : surveille les rappels toutes les 20 s. */
export function useRemindersWatcher(enabled: boolean) {
  const fired = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      const list = useRemindersStore.getState().list;
      if (list.length === 0) return;
      const player = usePlayerStore.getState().player;
      const lastActiveOf = useDirectoryStore.getState().lastActiveOf;
      const now = Date.now();
      for (const r of list) {
        let hit = false;
        let title = "";
        let body = "";
        if (r.kind === "storage" && player) {
          const top = fullestStorage(player);
          hit = !!top && top.pct * 100 >= r.pct;
          if (top) {
            title = `Entrepôt à ${Math.floor(top.pct * 100)} %`;
            body = `${RESOURCE_LIST.find((x) => x.id === top.res)?.name ?? top.res} atteint ton seuil de ${r.pct} %. Dépense ou monte l'entrepôt.`;
          }
        } else if (r.kind === "online") {
          hit = isOnline(lastActiveOf[r.uid], now);
          title = `${r.pseudo} est en ligne`;
          body = "Le joueur que tu suis vient de se connecter.";
        }
        if (hit && !fired.current.has(r.id)) {
          fired.current.add(r.id);
          fire(title, body, `reminder-${r.id}-${Math.floor(now / 60_000)}`);
        } else if (!hit) fired.current.delete(r.id);
      }
    };
    // Premier passage sans alerte : on ne prévient que des changements.
    const prime = () => {
      const player = usePlayerStore.getState().player;
      const lastActiveOf = useDirectoryStore.getState().lastActiveOf;
      for (const r of useRemindersStore.getState().list) {
        if (r.kind === "online" && isOnline(lastActiveOf[r.uid], Date.now())) fired.current.add(r.id);
        if (r.kind === "storage" && player) {
          const top = fullestStorage(player);
          if (top && top.pct * 100 >= r.pct) fired.current.add(r.id);
        }
      }
    };
    const start = setTimeout(prime, 5000);
    const id = setInterval(tick, 20_000);
    return () => {
      clearTimeout(start);
      clearInterval(id);
    };
  }, [enabled]);
}
