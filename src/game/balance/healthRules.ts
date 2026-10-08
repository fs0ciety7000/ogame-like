/* =====================================================
   6.14.107 (AU27, lot AE-L4) : seuils d'alerte de la santé de l'équilibre
   (Admin → Équilibrage → Santé). Ils ne changent rien en jeu : ils colorent
   les tuiles et listent les alertes. Valeurs tirées des cibles de l'audit
   AU27 (`docs/audit/2026-10-07-au27-equilibrage.md`, AE-5, AE-10, AE-11,
   AE-15) et des choix Q267 à Q269. Registre « balanceHealth » (règle n° 2).
   Module sans import : le registre et l'admin le lisent sans cycle.
===================================================== */

export const BALANCE_HEALTH_RULES = {
  /** AE-11 : part (0,6 = 60 %) des primes dans l'Ambre gagnée la semaine passée, au-delà de laquelle on alerte (AE-L7 : Ambre des primes). */
  amberBountySharePct: 0.6,
  /** AE-11 : Ambre de la semaine, 9e décile ÷ médiane des joueurs qui en ont gagné (« très actif ≤ 2 × régulier »). */
  amberTopRatio: 2,
  /** AE-10 : part des boss abattus visée (bornes basse et haute ; 0,6 = 60 %). */
  bossKillLow: 0.6,
  bossKillHigh: 0.8,
  /** AE-10 : mort des boss visée entre ces deux durées (médiane, heures après l'ouverture). */
  bossKillHoursLow: 36,
  bossKillHoursHigh: 60,
  /** AE-1, AE-L2 : jour médian de la 1re Ascension visé (jours après l'inscription). */
  ascensionDayLow: 35,
  ascensionDayHigh: 90,
  /** AE-5 : production perdue à entrepôt plein (médiane des actifs, %), au-delà de laquelle on alerte. */
  productionLostPct: 0.2,
  /** AE-15 : écart de production horaire entre le 3e et le 1er quartile des actifs (×). */
  productionSpreadRatio: 5,
  /** Q267 : part des coffres du 7e jour entièrement au plancher, au-delà de laquelle le coffre ne sert plus à rien. */
  chestFloorPct: 0.5,
  /** Fenêtre des coffres comptés (jours). */
  chestWindowDays: 14,
  /** Q268 : part des actifs au plafond du comptoir cette semaine, au-delà de laquelle le plafond mord trop. */
  exchangeCapPlayersPct: 0.1,
  /** Q269 : part des actifs protégés après trop de défaites sur 7 jours, au-delà de laquelle on alerte. */
  defeatProtectedPct: 0.05,
};

/** Libellé, unité, bornes et aide de chaque seuil (admin, Tous les réglages et section dédiée). */
export const BALANCE_HEALTH_RULES_META = {
  amberBountySharePct: { label: "Ambre : part des primes au-delà de laquelle on alerte", unit: "part", min: 0, max: 1, hint: "AE-11 : 79 % chez le profil très actif ; AE-L7 décide de réduire l'Ambre des primes d'un tiers." },
  amberTopRatio: { label: "Ambre : 9e décile ÷ médiane par joueur, au plus", unit: "×", min: 1, max: 50, hint: "Joueurs qui ont gagné de l'Ambre la semaine passée ; cible AE-11 : très actif ≤ 2 × régulier." },
  bossKillLow: { label: "Boss : part abattue visée, bas", unit: "part", min: 0, max: 1 },
  bossKillHigh: { label: "Boss : part abattue visée, haut", unit: "part", min: 0, max: 1 },
  bossKillHoursLow: { label: "Boss : mort visée au plus tôt (médiane)", unit: "h", min: 0, max: 720, hint: "AE-10 : si plus de 85 % meurent avant 36 h, relever hpFactor (Q101)." },
  bossKillHoursHigh: { label: "Boss : mort visée au plus tard (médiane)", unit: "h", min: 0, max: 720 },
  ascensionDayLow: { label: "1re Ascension : jour médian visé, au plus tôt", unit: "j", min: 0, max: 365 },
  ascensionDayHigh: { label: "1re Ascension : jour médian visé, au plus tard", unit: "j", min: 0, max: 365 },
  productionLostPct: { label: "Production perdue (entrepôt plein, médiane), au plus", unit: "part", min: 0, max: 1, hint: "AE-5 : cible < 20 % à J90." },
  productionSpreadRatio: { label: "Écart de production 3e ÷ 1er quartile, au plus", unit: "×", min: 1, max: 1000, hint: "AE-15 : ≤ ×5 à J14." },
  chestFloorPct: { label: "Coffre du 7e jour : part tout au plancher, au plus", unit: "part", min: 0, max: 1, hint: "Q267 : à entrepôt plein, le coffre ne donne que le plancher." },
  chestWindowDays: { label: "Coffre du 7e jour : fenêtre comptée", unit: "j", min: 1, max: 90 },
  exchangeCapPlayersPct: { label: "Comptoir : part des actifs au plafond, au plus", unit: "part", min: 0, max: 1, hint: "Q268 : à resserrer si presque personne ne l'atteint." },
  defeatProtectedPct: { label: "Protection après trop de défaites : part des actifs protégés en 7 j, au plus", unit: "part", min: 0, max: 1, hint: "Q269." },
};
