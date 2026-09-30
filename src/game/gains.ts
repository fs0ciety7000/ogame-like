import { computeElapsedProduction } from "@/game/production";
import type { PlayerState, ResourceId } from "@/types/game";

/** Gains « ponctuels » entre deux états du joueur venus du serveur : ce qui
 *  dépasse la production normale sur l'intervalle (récompense de mission,
 *  don, pillage, échange, vente…). Sert aux micro-animations. */
export function discreteGains(prev: PlayerState, next: PlayerState): Partial<Record<ResourceId, number>> {
  const elapsed = Math.max(0, ((next.resourcesUpdatedAtMs ?? 0) - (prev.resourcesUpdatedAtMs ?? 0)) / 1000);
  const produced = computeElapsedProduction(prev.buildings, prev.techLevels, elapsed);
  const prevRate = computeElapsedProduction(prev.buildings, prev.techLevels, 1);
  const nextRate = computeElapsedProduction(next.buildings, next.techLevels, 1);
  const gains: Partial<Record<ResourceId, number>> = {};
  for (const res of Object.keys(next.resources ?? {}) as ResourceId[]) {
    const expected = (prev.resources?.[res] ?? 0) + (produced[res] ?? 0);
    const delta = (next.resources[res] ?? 0) - expected;
    // Marge : arrondis, et production qui a changé en cours d'intervalle
    // (fin d'une construction ou d'une recherche).
    const rateChange = Math.abs((nextRate[res] ?? 0) - (prevRate[res] ?? 0));
    const tolerance = Math.max(1, rateChange * elapsed, expected * 1e-9);
    if (delta > tolerance) gains[res] = Math.floor(delta);
  }
  return gains;
}
