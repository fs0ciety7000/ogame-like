import { create } from "zustand";
import { chronicleOf } from "@/game/chronicles";

/* v4.3 : habillage de saison (teinte du mois des Chroniques), désactivable
   sur chaque appareil. */

const KEY = "cosmic-empires:season-skin";

function initial(): boolean {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export const useSeasonSkinStore = create<{ enabled: boolean }>(() => ({ enabled: initial() }));

export function setSeasonSkin(enabled: boolean) {
  try {
    localStorage.setItem(KEY, enabled ? "on" : "off");
  } catch {
    /* le choix ne survivra pas au rechargement */
  }
  useSeasonSkinStore.setState({ enabled });
}

/** Teinte du mois, ou null (désactivée, ou pas de chronique ce mois-ci). */
export function useSeasonAccent(): { accent: string; label: string } | null {
  const enabled = useSeasonSkinStore((s) => s.enabled);
  if (!enabled) return null;
  return chronicleOf(Date.now())?.theme ?? null;
}
