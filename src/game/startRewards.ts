import { getProductionRatesPerSecond } from "@/game/production";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   6.14.163 (lot S3, docs/proposals/recompenses-du-depart.md) : récompenses du départ.
   Avant, la prime du raid d'initiation valait 4 h de production de chaque ressource commune (216 000 de chaque à 15/s,
   18e minute de jeu), et le Carnet du commandant versait des montants fixes (300 000, puis 2 000 000) dès la fin de la
   prise en main : la progression de la première heure perdait son sens, et les nanocomposants et données s'entassaient.
   Désormais :
   - la prime du raid d'initiation vaut quelques minutes de production, réparties comme les vrais coûts
     (ferraille d'abord, énergie ensuite, un peu de nanocomposants et de données) ;
   - chaque ressource commune versée par le Carnet vaut au plus `guideCapMinutes` minutes de production du joueur au moment
     où il la réclame (au moins `guideCapFloor`) : le montant fixe reste celui d'un joueur avancé.
   Production de référence : extracteurs et technos (`getProductionRatesPerSecond`), comme la série, les succès et les missions.
   `enabled` décoché : anciennes récompenses (prime en heures de la faction, Carnet aux montants fixes).
===================================================== */

const COMMONS: ResourceId[] = ["scrap", "energy", "nano", "data"];

export const START_REWARD_RULES = {
  enabled: true,
  /** Prime du raid d'initiation : minutes de production de chaque ressource commune (0 : rien de cette ressource). */
  tutorialRaidMinutes: { scrap: 30, energy: 15, nano: 5, data: 5 } as Record<string, number>,
  /** Prime du raid d'initiation : au moins ce montant pour chaque ressource dont les minutes sont > 0. */
  tutorialRaidFloor: 1_000,
  /** Carnet du commandant : chaque ressource commune versée vaut au plus N minutes de production (0 : montants fixes). */
  guideCapMinutes: 60,
  /** Carnet du commandant : le plafond ne descend jamais sous ce montant (petits empires). */
  guideCapFloor: 5_000,
};

export const START_REWARD_RULES_META = {
  enabled: { label: "Récompenses du départ indexées sur la production", hint: "Décoché : prime du raid d'initiation en heures de la faction (4 h) et Carnet aux montants fixes (avant la 6.14.163)." },
  tutorialRaidMinutes: {
    label: "Raid d'initiation : minutes de production par ressource",
    hint: "Prime du premier raid de Varan repoussé (scrap, energy, nano, data). La répartition suit les coûts : la ferraille paie presque tout.",
  },
  tutorialRaidFloor: { label: "Raid d'initiation : au moins, par ressource", min: 0, max: 1_000_000 },
  guideCapMinutes: { label: "Carnet : plafond en minutes de production", unit: "min", min: 0, max: 1_440, hint: "Chaque ressource commune d'un objectif du Carnet vaut au plus N minutes de ta production. 0 : montants fixes." },
  guideCapFloor: { label: "Carnet : plafond, au moins", min: 0, max: 100_000_000 },
};

type RewardPlayer = Pick<PlayerState, "buildings" | "techLevels">;

/** Production par seconde des ressources communes (extracteurs et technos). */
function commonRates(player: RewardPlayer): Partial<Record<ResourceId, number>> {
  return getProductionRatesPerSecond(player.buildings ?? {}, player.techLevels ?? {}) as Partial<Record<ResourceId, number>>;
}

/** Prime du raid d'initiation repoussé : `tutorialRaidMinutes` de production par ressource, au moins `tutorialRaidFloor`. */
export function tutorialRaidBounty(player: RewardPlayer): Partial<Record<ResourceId, number>> {
  const rates = commonRates(player);
  const R = START_REWARD_RULES;
  const out: Partial<Record<ResourceId, number>> = {};
  for (const res of COMMONS) {
    const minutes = Math.max(0, Number(R.tutorialRaidMinutes?.[res]) || 0);
    if (!(minutes > 0)) continue;
    const n = Math.max(Math.max(0, Number(R.tutorialRaidFloor) || 0), Math.floor((rates[res] ?? 0) * minutes * 60));
    if (n > 0) out[res] = n;
  }
  return out;
}

/** Plafond d'une ressource commune du Carnet pour ce joueur (Infinity : sans plafond). */
function guideCap(player: RewardPlayer, res: ResourceId): number {
  const R = START_REWARD_RULES;
  const minutes = Math.max(0, Number(R.guideCapMinutes) || 0);
  if (!R.enabled || !(minutes > 0) || !COMMONS.includes(res)) return Infinity;
  return Math.max(Math.max(0, Number(R.guideCapFloor) || 0), Math.floor((commonRates(player)[res] ?? 0) * minutes * 60));
}

/** Récompense réellement versée par un objectif du Carnet : montant réglé, plafonné en minutes de production (communes seules). */
export function cappedGuideReward(reward: Partial<Record<ResourceId, number>>, player: RewardPlayer): Partial<Record<ResourceId, number>> {
  const out: Partial<Record<ResourceId, number>> = {};
  for (const [res, n] of Object.entries(reward) as [ResourceId, number][]) {
    const v = Math.min(Math.max(0, Number(n) || 0), guideCap(player, res));
    if (v > 0) out[res] = v;
  }
  return out;
}
