import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { getRankIcon, getRankIndex, getRankLabel } from "@/game/ranks";
import type { PlayerState } from "@/types/game";

/** Fête discrètement chaque montée de rang (comparaison avec le dernier XP
 *  observé), sans rien afficher au tout premier chargement du profil. */
export function useRankCelebration(player: PlayerState | null) {
  const lastRankIndex = useRef<number | null>(null);

  useEffect(() => {
    if (!player) return;
    const currentIndex = getRankIndex(player.xp);

    if (lastRankIndex.current === null) {
      lastRankIndex.current = currentIndex;
      return;
    }

    if (currentIndex > lastRankIndex.current) {
      lastRankIndex.current = currentIndex;
      toast.success(`Nouveau rang : ${getRankLabel(player.xp)} !`, {
        description: "Ton empire gagne en réputation dans la galaxie.",
        icon: <img src={getRankIcon(player.xp)} alt="" className="h-6 w-6 object-contain" />,
        duration: 6000,
      });
    } else {
      lastRankIndex.current = currentIndex;
    }
  }, [player?.xp]); // eslint-disable-line react-hooks/exhaustive-deps
}
