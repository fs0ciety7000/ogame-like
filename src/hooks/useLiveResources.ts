import { useEffect, useState } from "react";
import { advanceEconomy, economySnapshot } from "@/game/economy";
import type { PlayerState, Resources } from "@/types/game";

/** Ressources affichées côté client, incrémentées en douceur chaque seconde
 *  entre deux synchros serveur (aucune écriture réseau ici). */
export function useLiveResources(player: PlayerState | null): Resources | null {
  const [display, setDisplay] = useState<Resources | null>(null);

  useEffect(() => {
    if (!player) {
      setDisplay(null);
      return;
    }

    const baseAt = player.resourcesUpdatedAtMs;

    // Même calcul que le serveur : plafond de l'entrepôt, entretien, panne ; 6.14.143 : tampon de l'entrepôt (palier 10).
    const tick = () => setDisplay(advanceEconomy(player, (Date.now() - baseAt) / 1000, baseAt).resources);

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [player]);

  return display;
}

/** Variation nette par seconde (production − entretien, entrepôt plein = 0). */
export function useProductionRates(player: PlayerState | null, resources?: Resources | null): Partial<Resources> {
  if (!player) return {};
  return economySnapshot({ ...player, resources: resources ?? player.resources }, Date.now()).net;
}
