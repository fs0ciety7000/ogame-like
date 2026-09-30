import { create } from "zustand";
import type { ResourceId } from "@/types/game";

/* =====================================================
   Micro-animations globales : ressources qui s'envolent vers l'en-tête
   quand le joueur en gagne d'un coup (mission, don, pillage, échange…).
===================================================== */

export interface ResourceFlight {
  id: number;
  res: ResourceId;
  amount: number;
  from: { x: number; y: number };
  delay: number;
}

interface FxState {
  flights: ResourceFlight[];
  /** Compteur par ressource, incrémenté à l'arrivée : fait « pulser » la puce de l'en-tête. */
  hudPulse: Partial<Record<ResourceId, number>>;
}

export const useFxStore = create<FxState>(() => ({ flights: [], hudPulse: {} }));

let nextId = 1;
let lastPointer: { x: number; y: number; at: number } | null = null;

/** Mémorise le dernier clic : l'envol part de là s'il est récent (bouton
 *  « Échanger », « Vendre »…), sinon du centre de l'écran. */
export function trackPointer() {
  const onDown = (e: PointerEvent) => {
    lastPointer = { x: e.clientX, y: e.clientY, at: Date.now() };
  };
  window.addEventListener("pointerdown", onDown, { passive: true });
  return () => window.removeEventListener("pointerdown", onDown);
}

function origin() {
  if (lastPointer && Date.now() - lastPointer.at < 4000) return { x: lastPointer.x, y: lastPointer.y };
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

export function flyResources(gains: Partial<Record<ResourceId, number>>) {
  const from = origin();
  const entries = Object.entries(gains).filter(([, v]) => (v ?? 0) > 0) as [ResourceId, number][];
  if (entries.length === 0) return;
  const flights = entries.slice(0, 8).map(([res, amount], i) => ({ id: nextId++, res, amount, from, delay: i * 0.08 }));
  useFxStore.setState((s) => ({ flights: [...s.flights, ...flights].slice(-16) }));
}

export function landFlight(id: number) {
  useFxStore.setState((s) => {
    const flight = s.flights.find((f) => f.id === id);
    if (!flight) return s;
    return {
      flights: s.flights.filter((f) => f.id !== id),
      hudPulse: { ...s.hudPulse, [flight.res]: (s.hudPulse[flight.res] ?? 0) + 1 },
    };
  });
}
