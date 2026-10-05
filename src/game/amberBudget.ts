import { BOUNTY_RULES, SHOP_ITEMS } from "@/game/bounties";
import { chronicleBonus, codexRewards } from "@/game/chronicles";
import { activePass } from "@/game/seasonPass";
import { SEASON_RULES } from "@/game/seasons";
import { STREAK_RULES } from "@/game/streak";

/* =====================================================
   5.15.12 : budget d'Ambre d'un joueur sur un mois (aperçu admin). L'Ambre
   vient des primes, de la proie d'élite, de la série, des Chroniques, du
   passe, de la saison et (une fois) du Codex ; elle se dépense au Comptoir.
   Les profils sont des hypothèses de jeu, pas des mesures.
===================================================== */

export interface AmberProfile {
  id: string;
  label: string;
  /** Primes remplies par jour, et palier moyen (1 à 4). */
  bountiesPerDay: number;
  bountyTier: 1 | 2 | 3 | 4;
  /** Proies d'élite abattues par mois (une par semaine au plus). */
  elitePerMonth: number;
  /** Jours de série réclamés sur 30 (6e jour atteint toutes les semaines complètes). */
  streakDays: number;
  /** Épisodes des Chroniques terminés (0 à 4). */
  episodes: number;
  /** Palier du passe atteint (0 à 30). */
  passTier: number;
}

export function defaultAmberProfiles(): AmberProfile[] {
  return [
    { id: "casual", label: "Occasionnel", bountiesPerDay: 1, bountyTier: 1, elitePerMonth: 0, streakDays: 12, episodes: 2, passTier: 8 },
    { id: "median", label: "Régulier", bountiesPerDay: 2, bountyTier: 2, elitePerMonth: 2, streakDays: 24, episodes: 4, passTier: 20 },
    { id: "active", label: "Très actif", bountiesPerDay: 4, bountyTier: 3, elitePerMonth: 4, streakDays: 30, episodes: 4, passTier: 30 },
  ];
}

export interface AmberLine {
  label: string;
  amount: number;
}

/** Ambre gagnée en un mois, par source. `codex` : gain unique (toutes catégories complètes). */
export function amberMonth(p: AmberProfile, seasonId?: string): { lines: AmberLine[]; total: number; codexOnce: number } {
  const tier = BOUNTY_RULES.tiers[p.bountyTier];
  const weeks = Math.floor(p.streakDays / 7);
  const chest = (STREAK_RULES.chest.amber[0] + STREAK_RULES.chest.amber[1]) / 2;
  const bonus = chronicleBonus();
  const pass = activePass(seasonId).tiers.slice(0, Math.max(0, Math.min(30, p.passTier)));
  const passAmber = pass.reduce((a, rewards) => a + rewards.reduce((b, r) => b + (r.kind === "amber" ? r.amount : 0), 0), 0);
  const lines: AmberLine[] = [
    { label: "Primes", amount: Math.round(p.bountiesPerDay * 30 * (tier?.amber ?? 0)) },
    { label: "Proie d'élite", amount: p.elitePerMonth * 150 },
    { label: "Série (6e jour + coffre)", amount: Math.round(weeks * (STREAK_RULES.amberDay6 + chest)) },
    { label: "Chroniques", amount: p.episodes * bonus.episode.amber + (p.episodes >= 4 ? bonus.chapter.amber : 0) },
    { label: "Passe", amount: passAmber },
    { label: "Fin de saison (participation)", amount: SEASON_RULES.participation.amber },
  ];
  const codexOnce = Object.values(codexRewards()).reduce((a, r) => a + r.amber, 0);
  return { lines, total: lines.reduce((a, l) => a + l.amount, 0), codexOnce };
}

/** Coût du Comptoir : tout ce qui ne s'achète qu'une fois (plan + cosmétiques). */
export function shopOneTimeCost(): number {
  return SHOP_ITEMS.filter((i) => i.group !== "consumable").reduce((a, i) => a + i.price, 0);
}
