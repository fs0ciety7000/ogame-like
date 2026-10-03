import { RESOURCE_LIST } from "@/game/resources";
import { commandersState } from "@/game/commanders";
import type { PlayerState, QueuesState, ResourceId } from "@/types/game";

/* =====================================================
   v5.5 : outils d'administration sur un joueur.
   - Compte test (player.testMode, écrit par le serveur seulement) :
     constructions, recherches, unités et missions se terminent à la
     mise à jour suivante, sans délai entre deux changements de poste.
   - « Tout terminer », lever les délais d'officiers, rendre des ressources.
===================================================== */

export interface FinishReport {
  buildings: number;
  researches: number;
  units: number;
  missions: number;
}

/** Ramène toutes les échéances à `now` (le flush suivant les termine). */
export function finishAllTimers(queues: QueuesState, now: number): FinishReport {
  const out: FinishReport = { buildings: 0, researches: 0, units: 0, missions: 0 };
  for (const entry of Object.values(queues.buildingUpgrades ?? {})) {
    if (entry && entry.endTime > now) {
      entry.endTime = now;
      out.buildings++;
    }
  }
  for (const r of queues.activeResearches ?? []) {
    if (r.endTime > now) {
      r.endTime = now;
      out.researches++;
    }
  }
  for (const category of ["attack", "defense"] as const) {
    for (const e of queues.unitQueues?.[category] ?? []) {
      if (e.endTime === null || e.endTime > now) {
        e.endTime = now;
        out.units++;
      }
    }
  }
  for (const m of queues.activeMissions ?? []) {
    if (m.endTime > now) {
      m.endTime = now;
      out.missions++;
    }
  }
  return out;
}

/** Lève le délai de 24 h entre deux changements de poste des officiers. */
export function clearOfficerCooldowns(player: PlayerState): number {
  const st = commandersState(player);
  const n = Object.keys(st.movedAtMs).length;
  player.commanders = { ...st, movedAtMs: {} };
  return n;
}

/** Ressources rendues par l'administration (montants positifs, ressources connues). */
export function grantResources(player: PlayerState, input: unknown): Partial<Record<ResourceId, number>> {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const given: Partial<Record<ResourceId, number>> = {};
  for (const r of RESOURCE_LIST) {
    const n = Math.floor(Number(raw[r.id]) || 0);
    if (n <= 0) continue;
    player.resources[r.id] = (player.resources[r.id] ?? 0) + n;
    given[r.id] = n;
  }
  return given;
}
