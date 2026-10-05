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

/** Teinte du mois, ou null (désactivée, ou pas de chronique ce mois-ci).
 *  5.16 : `accent` est mêlée à l'accent du thème choisi (le mois colore, le thème reste maître) ;
 *  `raw` garde la couleur pure du mois (illustrations, liserés de boss). */
export function useSeasonAccent(): { accent: string; raw: string; label: string } | null {
  const enabled = useSeasonSkinStore((s) => s.enabled);
  if (!enabled) return null;
  const theme = chronicleOf(Date.now())?.theme;
  if (!theme) return null;
  return { ...theme, raw: theme.accent, accent: `color-mix(in srgb, ${theme.accent} 30%, var(--th-accent))` };
}
