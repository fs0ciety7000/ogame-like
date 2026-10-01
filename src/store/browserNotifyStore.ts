import { create } from "zustand";

/* Notifications système du navigateur (API Notification) : affichées tant
 * qu'un onglet du jeu est ouvert mais en arrière-plan. Préférence propre à
 * chaque navigateur. */

const STORAGE_KEY = "cosmic-empires:browser-notifications";

export type BrowserPermission = NotificationPermission | "unsupported";

function supported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

function readEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function currentPermission(): BrowserPermission {
  return supported() ? Notification.permission : "unsupported";
}

interface BrowserNotifyState {
  enabled: boolean;
  permission: BrowserPermission;
}

export const useBrowserNotifyStore = create<BrowserNotifyState>(() => ({ enabled: readEnabled(), permission: currentPermission() }));

function saveEnabled(enabled: boolean) {
  useBrowserNotifyStore.setState({ enabled });
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    /* stockage indisponible : préférence non retenue */
  }
}

/** Active (en demandant l'autorisation au besoin) ou désactive. */
export async function setBrowserNotifications(enabled: boolean): Promise<BrowserPermission> {
  if (!enabled) {
    saveEnabled(false);
    return currentPermission();
  }
  if (!supported()) {
    useBrowserNotifyStore.setState({ permission: "unsupported" });
    return "unsupported";
  }
  let permission = Notification.permission;
  if (permission === "default") permission = await Notification.requestPermission();
  useBrowserNotifyStore.setState({ permission });
  saveEnabled(permission === "granted");
  return permission;
}

/** Affiche une notification système si l'onglet est caché. */
export function showBrowserNotification(title: string, body: string, tag?: string) {
  const { enabled } = useBrowserNotifyStore.getState();
  if (!enabled || !supported() || Notification.permission !== "granted") return;
  if (typeof document !== "undefined" && !document.hidden) return;
  try {
    const n = new Notification(title, { body, tag, icon: "/assets/logo/favicon-64.png" });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    /* certains navigateurs mobiles n'acceptent que les notifications de service worker */
  }
}
