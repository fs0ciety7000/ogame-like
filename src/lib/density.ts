import { create } from "zustand";

/* 5.26.2 : mode compact des cartes (grandes listes). Marges et espacements
   resserrés dans le contenu des pages ; choix propre à chaque appareil. */

const KEY = "cosmic-empires:density";

function initial(): boolean {
  try {
    return localStorage.getItem(KEY) === "compact";
  } catch {
    return false;
  }
}

export const useCompactCards = create<{ enabled: boolean }>(() => ({ enabled: initial() }));

function apply(enabled: boolean) {
  if (typeof document === "undefined") return;
  if (enabled) document.documentElement.dataset.density = "compact";
  else delete document.documentElement.dataset.density;
}

export function setCompactCards(enabled: boolean) {
  try {
    localStorage.setItem(KEY, enabled ? "compact" : "normal");
  } catch {
    /* non mémorisé */
  }
  apply(enabled);
  useCompactCards.setState({ enabled });
}

apply(useCompactCards.getState().enabled);
