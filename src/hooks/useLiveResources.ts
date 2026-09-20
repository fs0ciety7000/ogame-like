import { useEffect, useState } from "react";
import { computeElapsedProduction, getProductionRatesPerSecond } from "@/game/production";
import type { PlayerState, Resources } from "@/types/game";

/** Ressources affichées côté client, incrémentées en douceur chaque seconde
 *  entre deux synchros Firestore (aucune écriture réseau ici). */
export function useLiveResources(player: PlayerState | null): Resources | null {
  const [display, setDisplay] = useState<Resources | null>(null);

  useEffect(() => {
    if (!player) {
      setDisplay(null);
      return;
    }

    const base = player.resources;
    const baseAt = player.resourcesUpdatedAtMs;
    const buildings = player.buildings;
    const techLevels = player.techLevels;

    const tick = () => {
      const elapsed = (Date.now() - baseAt) / 1000;
      const gains = computeElapsedProduction(buildings, techLevels, elapsed);
      const next = { ...base };
      for (const [res, amount] of Object.entries(gains)) {
        next[res as keyof Resources] = (next[res as keyof Resources] ?? 0) + (amount ?? 0);
      }
      setDisplay(next);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [player]);

  return display;
}

export function useProductionRates(player: PlayerState | null) {
  if (!player) return {};
  return getProductionRatesPerSecond(player.buildings, player.techLevels);
}
