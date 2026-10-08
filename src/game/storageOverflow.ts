import { COMMON_RESOURCES, storageCapacityOf } from "@/game/economy";
import { describeGain } from "@/game/format";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   6.14.155 (revue AU28, lot R8 / AE-L8, constat AE-14) : gains versés au-delà de l'entrepôt, dits au joueur.

   La règle ne change pas (invariant I6) : une récompense (coffre et récompense de série, missions, objectifs,
   passe, Chroniques…) est versée en entier, même au-dessus de la capacité de l'entrepôt. Le stock en trop est
   gardé, mais la production de la ressource s'arrête tant qu'il dépasse la capacité. Ce module mesure la part
   d'un gain qui tombe au-delà (ressources communes seules : les rares n'ont pas de plafond) et l'écrit dans la
   ligne du Journal ; la carte « Ce que tu risques » (page Ressources) montre le stock au-delà, ressource par ressource.
===================================================== */

export const STORAGE_OVERFLOW_RULES = {
  /** Dire au joueur la part d'une récompense versée au-delà de l'entrepôt (Journal et carte « Ce que tu risques »). */
  enabled: true,
  /** Seuil : en dessous de ce montant au-delà (par ressource), rien n'est dit (arrondis, poussière). */
  minAmount: 1000,
  /** Ligne ajoutée au Journal. {list} : montants au-delà (« 1 200 000 ferraille, 300 000 énergie »). */
  journalText: "Au-delà de l'entrepôt : {list}. Leur production est arrêtée tant que tu n'as pas dépensé ce surplus.",
  /** Rappel de la carte « Ce que tu risques » quand au moins une ressource dépasse l'entrepôt. */
  cardText: "Au-delà de l'entrepôt, le stock est gardé mais la production de la ressource s'arrête. Dépense-le, échange-le au comptoir ou améliore l'entrepôt.",
};

/** 6.14.155 : libellé, unité, bornes et aide de chaque réglage (Admin → Règles → Tous les réglages). */
export const STORAGE_OVERFLOW_RULES_META = {
  enabled: { label: "Dire les gains versés au-delà de l'entrepôt", hint: "Ligne au Journal et mention sur la carte « Ce que tu risques ». Le versement lui-même ne change pas (I6)." },
  minAmount: { label: "Montant au-delà minimal pour le dire", unit: "ressources", min: 0, max: 1_000_000_000, hint: "Par ressource commune. En dessous, rien n'est écrit." },
  journalText: { label: "Texte du Journal", hint: "{list} : montants au-delà de l'entrepôt, par ressource." },
  cardText: { label: "Texte de la carte « Ce que tu risques »", hint: "Affiché quand au moins une ressource commune dépasse l'entrepôt." },
};

export type ResourceAmounts = Partial<Record<ResourceId, number>>;

/** Capacité de l'entrepôt du joueur (Infinity si inconnue). */
function capacityOf(player: PlayerState): number {
  try {
    const cap = storageCapacityOf(player);
    return Number.isFinite(cap) && cap > 0 ? cap : Infinity;
  } catch {
    return Infinity;
  }
}

/** Part de chaque gain versée au-delà de l'entrepôt, mesurée sur le stock après versement :
 *  min(gain, stock après − capacité). Ressources communes seules ; sous le seuil `minAmount`, rien. */
export function overflowOfGain(player: PlayerState, gain: ResourceAmounts, capacity: number = capacityOf(player)): ResourceAmounts {
  const out: ResourceAmounts = {};
  if (!STORAGE_OVERFLOW_RULES.enabled || !Number.isFinite(capacity)) return out;
  const min = Math.max(0, Number(STORAGE_OVERFLOW_RULES.minAmount) || 0);
  for (const res of COMMON_RESOURCES) {
    const g = Math.floor(Number(gain[res]) || 0);
    if (!(g > 0)) continue;
    const over = Math.floor(Math.min(g, (Number(player.resources?.[res]) || 0) - capacity));
    if (over > 0 && over >= min) out[res] = over;
  }
  return out;
}

/** Ligne du Journal (vide s'il n'y a rien au-delà). */
export function overflowSentence(overflow: ResourceAmounts): string {
  if (!Object.keys(overflow).length) return "";
  return String(STORAGE_OVERFLOW_RULES.journalText ?? "").split("{list}").join(describeGain(overflow));
}

/** Stock au-delà de l'entrepôt, par ressource commune (carte « Ce que tu risques »). */
export function storageOverflowView(player: PlayerState): { capacity: number; over: ResourceAmounts; any: boolean } {
  const capacity = capacityOf(player);
  const over: ResourceAmounts = {};
  if (STORAGE_OVERFLOW_RULES.enabled && Number.isFinite(capacity)) {
    for (const res of COMMON_RESOURCES) {
      const n = Math.floor((Number(player.resources?.[res]) || 0) - capacity);
      if (n > 0) over[res] = n;
    }
  }
  return { capacity, over, any: Object.keys(over).length > 0 };
}
