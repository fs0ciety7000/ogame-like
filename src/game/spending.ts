import { GameActionError } from "@/game/errors";
import { bumpStat } from "@/game/stats";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   6.14.110 (AU27, lot AC-D, constat AC-5) : un seul chemin de dépense.
   Toute dépense de ressources de la planète mère ou d'Ambre passe par
   ces deux fonctions : elles vérifient le solde, débitent et tracent
   (statistique `spent` et objectif du jour « Dépenser » pour les
   ressources, statistique `amberSpent` pour l'Ambre). Avant, 6 chemins
   (fondation d'une colonie, lune, capsule, traité, repaire, file
   planifiée) débitaient eux-mêmes, sans compter la dépense.
   Les transferts (marché, contrats de commerce, cargaison d'une flotte,
   dépôt d'alliance, enchères, comptoir) ne sont pas des dépenses : ils
   restent à part, listés dans la garde `spending.test.ts`.
   Sans import du moteur (hors erreurs et statistiques) : l'objectif du
   jour « Dépenser » est branché par `contracts.ts` (`onSpend`), ce qui
   garde l'ordre de chargement du moteur intact (colonies.ts l'importe tôt).
===================================================== */

let spendHook: ((player: PlayerState, total: number, now: number) => void) | null = null;

/** Branché une fois par `contracts.ts` : compte une dépense dans l'objectif du jour « Dépenser ». */
export function onSpend(hook: (player: PlayerState, total: number, now: number) => void): void {
  spendHook = hook;
}

/** L'objectif du jour est-il branché ? (garde de test) */
export function spendHookReady(): boolean {
  return spendHook !== null;
}

export type Cost = Partial<Record<string, number>>;

export interface SpendOptions {
  /** Message de refus quand le solde ne suffit pas (défaut : « Ressources insuffisantes. »). */
  message?: string | ((cost: Cost) => string);
  /** Compter la dépense (statistique `spent` et objectif « Dépenser ») ; faux pour un cadeau (v5.9). */
  count?: boolean;
}

/** Le joueur a-t-il de quoi payer `cost` ? (montants négatifs ou non numériques refusés) */
export function canSpendResources(player: Pick<PlayerState, "resources">, cost: Cost): boolean {
  return Object.entries(cost).every(([res, val]) => {
    const n = Number(val ?? 0);
    return Number.isFinite(n) && n >= 0 && (player.resources[res as ResourceId] ?? 0) >= n;
  });
}

/** Vérifie, débite et trace une dépense de ressources. Rend le total dépensé. Rien n'est débité si le solde manque. */
export function spendResources(player: PlayerState, cost: Cost, now: number, opts: SpendOptions = {}): number {
  if (!canSpendResources(player, cost)) {
    const m = opts.message;
    throw new GameActionError(typeof m === "function" ? m(cost) : (m ?? "Ressources insuffisantes."));
  }
  let total = 0;
  for (const [res, val] of Object.entries(cost)) {
    const n = Number(val ?? 0);
    if (!(n > 0)) continue;
    player.resources[res as ResourceId] = (player.resources[res as ResourceId] ?? 0) - n;
    total += n;
  }
  if (opts.count !== false && total > 0) {
    spendHook?.(player, total, now);
    bumpStat(player, "spent", total);
  }
  return total;
}

/** Vérifie, débite et trace une dépense d'Ambre sur le portefeuille `wallet` (état des primes déjà lu par l'appelant,
 *  qui le réécrit dans `player.bounties`). `message` : refus quand le solde manque. */
export function spendAmber(player: PlayerState, wallet: { amber: number }, amountIn: number, message?: string): number {
  const amount = Math.floor(Number(amountIn));
  if (!(amount > 0)) return 0;
  if (!((wallet.amber ?? 0) >= amount)) throw new GameActionError(message ?? `Pas assez d'Ambre (${amount} requis).`);
  wallet.amber -= amount;
  bumpStat(player, "amberSpent", amount);
  return amount;
}
