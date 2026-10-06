import { GameActionError } from "@/game/errors";
import { bountyState, SHOP_HISTORY_MAX } from "@/game/bounties";
import { addRelic, rollRelic, RELIC_RULES } from "@/game/relics";
import { addModuleItem, MODULE_RULES, modulesState, rollModulePlan } from "@/game/modules";
import { grantTokens } from "@/game/casino";
import type { PlayerState } from "@/types/game";

/* =====================================================
   5.27 : stock tournant du Comptoir de la Ruche. Chaque semaine (lundi,
   minuit UTC), un objet rare en quantité limitée pour tout le serveur,
   un exemplaire par joueur. L'état vit dans game_config (« weekly_stock »).
===================================================== */

export type WeeklyOfferId = "rareRelic" | "rarePlan" | "epicPlan" | "tokens";

export interface WeeklyOffer {
  id: WeeklyOfferId;
  name: string;
  description: string;
  price: number;
  /** Exemplaires pour tout le serveur. */
  quantity: number;
}

/** 6.9.0 (AU4) : prix (Ambre) et exemplaires réglables dans l'admin (GameRules.weeklyStock). */
export const WEEKLY_STOCK_RULES = {
  prices: { rareRelic: 250, rarePlan: 200, epicPlan: 450, tokens: 120 } as Record<WeeklyOfferId, number>,
  quantities: { rareRelic: 8, rarePlan: 10, epicPlan: 4, tokens: 15 } as Record<WeeklyOfferId, number>,
};

const offer = (id: WeeklyOfferId, name: string, description: string): WeeklyOffer => ({
  id,
  name,
  description,
  get price() {
    return Math.max(1, Math.round(WEEKLY_STOCK_RULES.prices[id] ?? 1));
  },
  get quantity() {
    return Math.max(1, Math.round(WEEKLY_STOCK_RULES.quantities[id] ?? 1));
  },
});

export const WEEKLY_OFFERS: WeeklyOffer[] = [
  offer("rareRelic", "Relique de l'Essaim", "Une relique tirée au hasard, rare au moins."),
  offer("rarePlan", "Plan de module rare", "Un plan de module tiré au hasard, rare au moins."),
  offer("epicPlan", "Plan de module épique", "Un plan de module tiré au hasard, épique au moins."),
  offer("tokens", "Sac de jetons", "25 jetons pour la machine à sous du pot commun."),
];

export const WEEKLY_STOCK_KEY = "weekly_stock";
const DAY = 86_400_000;
const WEEK = 7 * DAY;

/** Lundi 00:00 UTC de la semaine de `now`. */
export function weekStartMs(now: number): number {
  const midnight = Math.floor(now / DAY) * DAY;
  return midnight - ((new Date(now).getUTCDay() + 6) % 7) * DAY;
}

export function weekKey(now: number): string {
  return new Date(weekStartMs(now)).toISOString().slice(0, 10);
}

/** Offre de la semaine : rotation fixe, la même pour tout le serveur. */
export function offerOfWeek(now: number): WeeklyOffer {
  return WEEKLY_OFFERS[Math.floor(weekStartMs(now) / WEEK) % WEEKLY_OFFERS.length];
}

export function nextRestockMs(now: number): number {
  return weekStartMs(now) + WEEK;
}

export interface WeeklyStock {
  week: string;
  offer: WeeklyOfferId;
  sold: number;
  buyers: string[];
}

/** Lecture tolérante ; une nouvelle semaine remet le stock à neuf. */
export function weeklyStock(raw: unknown, now: number): WeeklyStock {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<WeeklyStock>;
  const week = weekKey(now);
  const offer = offerOfWeek(now).id;
  if (r.week !== week) return { week, offer, sold: 0, buyers: [] };
  return { week, offer, sold: Math.max(0, Math.floor(Number(r.sold) || 0)), buyers: Array.isArray(r.buyers) ? r.buyers.map(String) : [] };
}

export function weeklyLeft(stock: WeeklyStock): number {
  const offer = WEEKLY_OFFERS.find((o) => o.id === stock.offer)!;
  return Math.max(0, offer.quantity - stock.sold);
}

/** Pourquoi le joueur ne peut pas acheter l'offre (null : achat possible). */
export function weeklyBlocker(player: Pick<PlayerState, "bounties" | "relics" | "modules">, uid: string, stock: WeeklyStock): string | null {
  const offer = WEEKLY_OFFERS.find((o) => o.id === stock.offer)!;
  if (stock.buyers.includes(uid)) return "Déjà acheté cette semaine.";
  if (weeklyLeft(stock) <= 0) return "Épuisé : retour lundi.";
  if (offer.id === "rareRelic" && ((player.relics as { items?: unknown[] } | undefined)?.items?.length ?? 0) >= RELIC_RULES.maxItems) return "Inventaire de reliques plein.";
  if ((offer.id === "rarePlan" || offer.id === "epicPlan") && modulesState(player).items.length >= MODULE_RULES.maxItems) return "Inventaire de modules plein.";
  if (bountyState(player).amber < offer.price) return "Pas assez d'Ambre.";
  return null;
}

/** Achat de l'offre de la semaine : débite l'Ambre, remet l'objet et réserve l'exemplaire. */
export function buyWeeklyOffer(player: PlayerState, uid: string, rawStock: unknown, now: number, random: () => number = Math.random): { stock: WeeklyStock; message: string } {
  const stock = weeklyStock(rawStock, now);
  const offer = WEEKLY_OFFERS.find((o) => o.id === stock.offer)!;
  const blocker = weeklyBlocker(player, uid, stock);
  if (blocker) throw new GameActionError(blocker);
  let message: string;
  if (offer.id === "rareRelic") {
    const relic = rollRelic("weekly", now, random, "rare");
    addRelic(player, relic);
    message = "Relique de l'Essaim reçue : retrouve-la dans tes reliques.";
  } else if (offer.id === "rarePlan" || offer.id === "epicPlan") {
    addModuleItem(player, rollModulePlan("weekly", now, random, offer.id === "rarePlan" ? "rare" : "epic"));
    message = `${offer.name} reçu : retrouve-le dans État-major → Modules.`;
  } else {
    grantTokens(player, 25);
    message = "25 jetons ajoutés à ta réserve du casino.";
  }
  const st = bountyState(player);
  st.amber -= offer.price;
  st.history = [...st.history, { atMs: now, item: `weekly:${offer.id}`, amber: offer.price }].slice(-SHOP_HISTORY_MAX);
  player.bounties = st;
  return { stock: { ...stock, sold: stock.sold + 1, buyers: [...stock.buyers, uid] }, message };
}
