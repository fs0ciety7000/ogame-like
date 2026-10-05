import { create } from "zustand";
import type { CombatLog } from "@/types/game";

/* 5.23 : synchronisation du replay 3D et du curseur des tours du rapport.
   La scène publie le tour en cours (« scene ») ; le rapport publie un tour
   choisi par le joueur (« report »), que la scène rejoint. Le déroulé est
   identifié par l'objet `log` partagé par les deux composants. */

interface ReplaySync {
  log: CombatLog | null;
  round: number;
  from: "scene" | "report";
  /** Incrémenté à chaque demande du rapport (même tour redemandé). */
  tick: number;
}

export const useReplaySync = create<ReplaySync>(() => ({ log: null, round: 0, from: "scene", tick: 0 }));

export function publishSceneRound(log: CombatLog | undefined, round: number): void {
  if (!log) return;
  useReplaySync.setState({ log, round, from: "scene" });
}

export function requestRound(log: CombatLog | undefined, round: number): void {
  if (!log) return;
  useReplaySync.setState((s) => ({ log, round, from: "report", tick: s.tick + 1 }));
}
