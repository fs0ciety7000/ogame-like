import { recordChronicle } from "@/game/chronicles";
import { COMMANDER_XP, grantCommanderXp } from "@/game/commanders";
import { GameActionError } from "@/game/errors";
import { getTradeRate, RESOURCE_LIST } from "@/game/resources";
import { bumpStat } from "@/game/stats";
import { formatInt } from "@/game/format";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   Marché entre joueurs (v3.0) : un joueur publie une offre (« je donne X
   contre Y ») ; ce qu'il vend est bloqué dès la publication. Un autre
   joueur l'accepte : l'échange est immédiat. Une taxe est prélevée sur ce
   que reçoit le vendeur et versée au pot commun du serveur (v5.10) (moins entre membres d'une même
   alliance). Le prix doit rester proche du taux du comptoir pour empêcher
   les transferts déguisés vers un double compte.
===================================================== */

export const MARKET_RULES = {
  /** Taxe sur ce que reçoit le vendeur (0,05 = 5 %), versée au pot commun du serveur (v5.10). */
  taxPct: 0.05,
  /** Taxe entre membres d'une même alliance. */
  allianceTaxPct: 0.02,
  /** Offres ouvertes par joueur. */
  maxOpenOffers: 5,
  /** Offres acceptées par joueur et par jour (UTC). */
  maxBuysPerDay: 20,
  /** Durée de vie d'une offre (h) ; à l'expiration, le vendeur est remboursé. */
  offerHours: 48,
  /** Écart maximal au taux du comptoir, dans un sens comme dans l'autre (×). */
  priceBand: 3,
};

export type OfferStatus = "open" | "filled" | "cancelled" | "expired";

export interface MarketOffer {
  id: string;
  sellerId: string;
  sellerPseudo: string;
  sellerAllianceId: string;
  giveRes: ResourceId;
  giveAmount: number;
  wantRes: ResourceId;
  wantAmount: number;
  status: OfferStatus;
  createdAtMs: number;
  expiresAtMs: number;
  buyerId: string;
  buyerPseudo: string;
  filledAtMs: number;
  /** Taxe prélevée (en ressource demandée). */
  tax: number;
  /** v5.1 : « sell » (offre classique, prise d'un bloc) ou « buy » (ordre d'achat, rempli en plusieurs fois). */
  kind?: OfferKind;
  /** v5.1 : quantité déjà livrée sur un ordre d'achat (en ressource demandée). */
  filled?: number;
}

export type OfferKind = "sell" | "buy";

const RESOURCE_IDS = new Set(RESOURCE_LIST.map((r) => r.id as string));
const label = (res: string) => RESOURCE_LIST.find((r) => r.id === res)?.name.toLowerCase() ?? res;

function amount(raw: unknown, what: string): number {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n <= 0 || n > 1e13) throw new GameActionError(`${what} invalide.`);
  return n;
}

/** Bornes du prix accepté : quantité demandée min et max pour `giveAmount`. */
export function priceBounds(giveRes: ResourceId, giveAmount: number, wantRes: ResourceId): { min: number; max: number; reference: number } {
  const reference = giveAmount * getTradeRate(giveRes, wantRes);
  const band = Math.max(1, MARKET_RULES.priceBand);
  return { min: Math.max(1, Math.ceil(reference / band)), max: Math.floor(reference * band), reference: Math.round(reference) };
}

/** Taxe due par le vendeur sur ce qu'il reçoit. */
export function marketTax(wantAmount: number, sameAlliance: boolean): number {
  return Math.floor(wantAmount * (sameAlliance ? MARKET_RULES.allianceTaxPct : MARKET_RULES.taxPct));
}

export interface NewOffer {
  kind: OfferKind;
  giveRes: ResourceId;
  giveAmount: number;
  wantRes: ResourceId;
  wantAmount: number;
  expiresAtMs: number;
}

/** Publication : valide l'offre et bloque ce qui est vendu (côté serveur). */
export function createOffer(seller: PlayerState, input: Record<string, unknown>, openOffers: number, now: number): NewOffer {
  const giveRes = String(input.giveRes ?? "") as ResourceId;
  const wantRes = String(input.wantRes ?? "") as ResourceId;
  if (!RESOURCE_IDS.has(giveRes) || !RESOURCE_IDS.has(wantRes)) throw new GameActionError("Ressource inconnue.");
  if (giveRes === wantRes) throw new GameActionError("Choisis deux ressources différentes.");
  const giveAmount = amount(input.giveAmount, "Quantité proposée");
  const wantAmount = amount(input.wantAmount, "Quantité demandée");
  if (openOffers >= MARKET_RULES.maxOpenOffers) throw new GameActionError(`Tu as déjà ${MARKET_RULES.maxOpenOffers} offres ouvertes : annule-en une ou attends qu'elles partent.`);
  const { min, max } = priceBounds(giveRes, giveAmount, wantRes);
  if (wantAmount < min || wantAmount > max) {
    throw new GameActionError(`Prix hors limites : pour ${formatInt(giveAmount)} ${label(giveRes)}, demande entre ${formatInt(min)} et ${formatInt(max)} ${label(wantRes)}.`);
  }
  if ((seller.resources[giveRes] ?? 0) < giveAmount) throw new GameActionError(`Pas assez de ${label(giveRes)}.`);
  seller.resources[giveRes] -= giveAmount;
  const kind: OfferKind = input.kind === "buy" ? "buy" : "sell";
  return { kind, giveRes, giveAmount, wantRes, wantAmount, expiresAtMs: now + MARKET_RULES.offerHours * 3600_000 };
}

/** Acceptation : l'acheteur paie, le vendeur reçoit (moins la taxe), l'acheteur reçoit la marchandise. */
export function acceptOffer(
  offer: Pick<MarketOffer, "sellerId" | "sellerAllianceId" | "giveRes" | "giveAmount" | "wantRes" | "wantAmount" | "status" | "expiresAtMs">,
  buyer: PlayerState,
  seller: PlayerState,
  buysToday: number,
  now: number,
): { tax: number; sameAlliance: boolean } {
  if (offer.status !== "open" || now >= offer.expiresAtMs) throw new GameActionError("Cette offre n'est plus disponible.");
  if (offer.sellerId === buyer.uid) throw new GameActionError("Tu ne peux pas accepter ta propre offre.");
  if (buysToday >= MARKET_RULES.maxBuysPerDay) throw new GameActionError(`Limite de ${MARKET_RULES.maxBuysPerDay} achats par jour atteinte.`);
  if ((buyer.resources[offer.wantRes] ?? 0) < offer.wantAmount) throw new GameActionError(`Pas assez de ${label(offer.wantRes)} pour cette offre.`);
  const sameAlliance = !!offer.sellerAllianceId && offer.sellerAllianceId === (buyer.allianceId ?? "");
  const tax = marketTax(offer.wantAmount, sameAlliance);
  buyer.resources[offer.wantRes] -= offer.wantAmount;
  buyer.resources[offer.giveRes] = (buyer.resources[offer.giveRes] ?? 0) + offer.giveAmount;
  seller.resources[offer.wantRes] = (seller.resources[offer.wantRes] ?? 0) + offer.wantAmount - tax;
  bumpStat(buyer, "marketTrades");
  bumpStat(seller, "marketTrades");
  bumpStat(seller, "marketTax", tax);
  bumpStat(buyer, "marketVolume", offer.giveAmount);
  recordChronicle(buyer, "market", now);
  bumpStat(seller, "marketVolume", offer.wantAmount - tax);
  // v5.6 : l'Intendant en poste progresse des deux côtés de l'échange.
  grantCommanderXp(buyer, "steward", COMMANDER_XP.marketTrade);
  grantCommanderXp(seller, "steward", COMMANDER_XP.marketTrade);
  return { tax, sameAlliance };
}

/** v5.1 : part du paiement déjà versée pour `filled` unités livrées (arrondi vers le bas). */
export function buyOrderPaid(order: Pick<MarketOffer, "giveAmount" | "wantAmount">, filled: number): number {
  return Math.floor((order.giveAmount * Math.min(filled, order.wantAmount)) / order.wantAmount);
}

/** Ce qui reste bloqué sur l'offre (tout pour une vente, le paiement non versé pour un ordre d'achat). */
export function offerReserved(offer: Pick<MarketOffer, "giveAmount" | "wantAmount" | "kind" | "filled">): number {
  return offer.kind === "buy" ? offer.giveAmount - buyOrderPaid(offer, offer.filled ?? 0) : offer.giveAmount;
}

/**
 * v5.1 : livraison sur un ordre d'achat. Le vendeur livre `qty` (ressource demandée), reçoit sa part
 * du paiement réservé ; le donneur d'ordre reçoit la marchandise moins la taxe.
 */
export function fillBuyOrder(
  order: Pick<MarketOffer, "sellerId" | "sellerAllianceId" | "giveRes" | "giveAmount" | "wantRes" | "wantAmount" | "status" | "expiresAtMs" | "filled">,
  supplier: PlayerState,
  owner: PlayerState,
  qtyRaw: unknown,
  buysToday: number,
  now: number,
): { qty: number; payment: number; tax: number; filled: number; done: boolean } {
  if (order.status !== "open" || now >= order.expiresAtMs) throw new GameActionError("Cet ordre d'achat n'est plus disponible.");
  if (order.sellerId === supplier.uid) throw new GameActionError("Tu ne peux pas remplir ton propre ordre.");
  if (buysToday >= MARKET_RULES.maxBuysPerDay) throw new GameActionError(`Limite de ${MARKET_RULES.maxBuysPerDay} échanges par jour atteinte.`);
  const already = order.filled ?? 0;
  const remaining = order.wantAmount - already;
  const qty = Math.min(remaining, amount(qtyRaw ?? remaining, "Quantité livrée"));
  if ((supplier.resources[order.wantRes] ?? 0) < qty) throw new GameActionError(`Pas assez de ${label(order.wantRes)} pour livrer.`);
  const filled = already + qty;
  const payment = buyOrderPaid(order, filled) - buyOrderPaid(order, already);
  if (payment <= 0) throw new GameActionError("Quantité trop faible : livre davantage pour être payé.");
  const sameAlliance = !!order.sellerAllianceId && order.sellerAllianceId === (supplier.allianceId ?? "");
  const tax = marketTax(qty, sameAlliance);
  supplier.resources[order.wantRes] -= qty;
  supplier.resources[order.giveRes] = (supplier.resources[order.giveRes] ?? 0) + payment;
  owner.resources[order.wantRes] = (owner.resources[order.wantRes] ?? 0) + qty - tax;
  bumpStat(supplier, "marketTrades");
  bumpStat(owner, "marketTrades");
  bumpStat(owner, "marketTax", tax);
  bumpStat(supplier, "marketVolume", qty);
  bumpStat(owner, "marketVolume", qty - tax);
  recordChronicle(supplier, "market", now);
  grantCommanderXp(supplier, "steward", COMMANDER_XP.marketTrade);
  grantCommanderXp(owner, "steward", COMMANDER_XP.marketTrade);
  return { qty, payment, tax, filled, done: filled >= order.wantAmount };
}

/** Annulation ou expiration : ce qui reste bloqué revient au vendeur (ou au donneur d'ordre). */
export function refundOffer(offer: Pick<MarketOffer, "giveRes" | "giveAmount" | "wantAmount" | "kind" | "filled">, seller: PlayerState): number {
  const back = offerReserved(offer);
  seller.resources[offer.giveRes] = (seller.resources[offer.giveRes] ?? 0) + back;
  return back;
}

/** « 1 200 ferraille » (notifications du serveur). */
export function describeAmount(res: string, n: number): string {
  return `${formatInt(n)} ${label(res)}`;
}

/** Début du jour UTC (quota d'achats). */
export function utcDayStart(now: number): number {
  return Math.floor(now / 86_400_000) * 86_400_000;
}
