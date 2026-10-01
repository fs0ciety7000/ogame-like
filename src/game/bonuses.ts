import { allianceForgeFactor } from "@/game/alliances";
import { buildTimeFactor, researchTimeFactor } from "@/game/events";
import { techReductionFactor } from "@/game/technologies";
import type { PlayerState } from "@/types/game";

/* =====================================================
   Multiplicateurs de durée d'un joueur : événement en cours, technologies,
   Anneau-forge de l'alliance (v3.3). Un seul calcul pour le serveur et
   l'affichage.
===================================================== */

type TimePlayer = Pick<PlayerState, "techLevels" | "allianceResearch">;

export function playerBuildTimeFactor(player: TimePlayer, now: number): number {
  return buildTimeFactor(now) * techReductionFactor(player.techLevels, "building_time") * allianceForgeFactor(player.allianceResearch);
}

export function playerResearchTimeFactor(player: TimePlayer, now: number): number {
  return researchTimeFactor(now) * techReductionFactor(player.techLevels, "research_time") * allianceForgeFactor(player.allianceResearch);
}
