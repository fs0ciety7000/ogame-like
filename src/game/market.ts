import { GameActionError } from "@/game/errors";
import { getTradeRate, RESOURCE_LIST } from "@/game/resources";
import { bumpStat } from "@/game/stats";
import { formatInt } from "@/game/format";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   Marché entre joueurs (v3.0) : un joueur publie une offre (« je donne X
   contre Y ») ; ce qu'il vend est bloqué dès la publication. Un autre
   joueur l'accepte : l'échange est immédiat. Une taxe est prélevée sur ce
   que reçoit le vendeur et retirée du jeu (moins entre membres d'une même
   alliance). Le prix doit rester proche du taux du comptoir pour empêcher
   les transferts déguisés vers un double compte.
===================================================== */

export const MARKET_RULES = {
  /** Taxe sur ce que reçoit le vendeur (0,05 = 5 %), retirée du jeu. */
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
}

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
  return { giveRes, giveAmount, wantRes, wantAmount, expiresAtMs: now + MARKET_RULES.offerHours * 3600_000 };
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
  return { tax, sameAlliance };
}

/** Annulation ou expiration : la marchandise bloquée revient au vendeur. */
export function refundOffer(offer: Pick<MarketOffer, "giveRes" | "giveAmount">, seller: PlayerState): void {
  seller.resources[offer.giveRes] = (seller.resources[offer.giveRes] ?? 0) + offer.giveAmount;
}

/** « 1 200 ferraille » (notifications du serveur). */
export function describeAmount(res: string, n: number): string {
  return `${formatInt(n)} ${label(res)}`;
}

/** Début du jour UTC (quota d'achats). */
export function utcDayStart(now: number): number {
  return Math.floor(now / 86_400_000) * 86_400_000;
}
