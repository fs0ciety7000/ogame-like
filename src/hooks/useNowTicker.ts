import { useSyncExternalStore } from "react";

/* 5.29 (P2) : une seule horloge partagée pour tous les décomptes en direct.
   Avant, chaque composant lançait son propre setInterval (une cinquantaine sur une page chargée), à des
   instants décalés : autant de rendus séparés par seconde. Désormais un seul intervalle, aligné sur la
   seconde, réveille tous les abonnés dans le même lot de rendu. Onglet masqué : l'horloge s'arrête et
   repart (avec un tic immédiat) au retour. */

const listeners = new Set<() => void>();
let tick = 0;
let timer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  tick += 1;
  for (const l of listeners) l();
}

function hidden(): boolean {
  return typeof document !== "undefined" && document.visibilityState === "hidden";
}

function schedule() {
  if (timer !== null || listeners.size === 0 || hidden()) return;
  // Aligné sur la seconde pleine : les compteurs changent tous en même temps.
  timer = setTimeout(() => {
    timer = null;
    emit();
    schedule();
  }, 1000 - (Date.now() % 1000) + 5);
}

function stop() {
  if (timer !== null) clearTimeout(timer);
  timer = null;
}

function onVisibility() {
  if (hidden()) stop();
  else {
    emit();
    schedule();
  }
}

export function subscribeNowTicker(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1 && typeof document !== "undefined") document.addEventListener("visibilitychange", onVisibility);
  schedule();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      stop();
      if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onVisibility);
    }
  };
}

const snapshot = () => tick;

/** Force un re-render chaque seconde, pour les décomptes en direct (horloge partagée). */
export function useNowTicker(): number {
  return useSyncExternalStore(subscribeNowTicker, snapshot, snapshot);
}

/** Pour les tests : nombre d'abonnés et état de l'horloge. */
export function nowTickerDebug(): { listeners: number; running: boolean } {
  return { listeners: listeners.size, running: timer !== null };
}
