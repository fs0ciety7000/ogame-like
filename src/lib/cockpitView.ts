import { create } from "zustand";

/* Vue cockpit : l'accueil devient un poste de commande (verrière, écran
   multifonction, console). Choix propre à chaque appareil, comme le thème. */

const KEY = "cosmic-empires:cockpit-view";

function initial(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export const useCockpitView = create<{ enabled: boolean }>(() => ({ enabled: initial() }));

export function setCockpitView(enabled: boolean) {
  try {
    localStorage.setItem(KEY, enabled ? "1" : "0");
  } catch {
    /* non mémorisé */
  }
  useCockpitView.setState({ enabled });
}
