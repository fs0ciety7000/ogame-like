import { create } from "zustand";
import { chronicleMonthId } from "@/game/chronicles";

/* v4.8 : thème d'hiver (neige légère sur le fond), du 1er décembre au
   28 février (heure de Paris), désactivable sur chaque appareil. */

const KEY = "cosmic-empires:winter";

function initial(): boolean {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export const useWinterStore = create<{ enabled: boolean; preview: boolean }>(() => ({ enabled: initial(), preview: false }));

/** Aperçu de 15 s hors saison (Réglages). */
export function previewWinter() {
  useWinterStore.setState({ preview: true });
  setTimeout(() => useWinterStore.setState({ preview: false }), 15_000);
}

export function setWinter(enabled: boolean) {
  try {
    localStorage.setItem(KEY, enabled ? "on" : "off");
  } catch {
    /* le choix ne survivra pas au rechargement */
  }
  useWinterStore.setState({ enabled });
}

export function isWinter(now: number): boolean {
  const m = Number(chronicleMonthId(now).slice(5, 7));
  return m === 12 || m === 1 || m === 2;
}

export function useWinterActive(): boolean {
  const enabled = useWinterStore((s) => s.enabled);
  const preview = useWinterStore((s) => s.preview);
  return preview || (enabled && isWinter(Date.now()));
}
