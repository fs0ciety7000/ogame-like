import { defaultPlayerState } from "@/game/defaults";
import { MARKET_RULES, type MarketOffer, type NewOffer } from "@/game/market";
import { getTradeRate, RESOURCE_LIST } from "@/game/resources";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   v5.5 : le Courtier du Comptoir, un marchand PNJ qui garde le marché
   vivant quand les joueurs n'y publient presque rien. Pour chaque
   ressource, s'il y a moins de `MARKET_RULES.makerMinOffers` offres de vente (ou
   d'ordres d'achat) ouvertes, il en publie une, un peu moins avantageuse
   que le taux du comptoir (± MARKET_RULES.makerSpread) : il dépanne sans faire
   concurrence aux joueurs. Il n'a pas de fiche joueur : ce qu'il reçoit
   sort du jeu, ce qu'il donne y entre.
===================================================== */

export const MARKET_MAKER_ID = "market_maker";
export const MARKET_MAKER_PSEUDO = "Courtier du Comptoir";

/** Réglages fixes ; les autres sont dans MARKET_RULES (maker*), modifiables dans l'administration. */
export const MARKET_MAKER_RULES = {
  /** Taille minimale (en équivalent ferraille). */
  minSize: 5_000,
  offerHours: 12,
};

/** Contrepartie virtuelle (jamais enregistrée). */
export function marketMakerPlayer(): PlayerState {
  return { ...defaultPlayerState(MARKET_MAKER_ID, MARKET_MAKER_PSEUDO), createdAt: 0 } as PlayerState;
}

export function isMarketMaker(uid: string | undefined | null): boolean {
  return uid === MARKET_MAKER_ID;
}

/** Monnaie d'échange du courtier : la ferraille, ou l'énergie pour la ferraille elle-même. */
function payWith(res: ResourceId): ResourceId {
  return res === "scrap" ? "energy" : "scrap";
}

type OpenOffer = Pick<MarketOffer, "sellerId" | "giveRes" | "wantRes" | "status" | "kind">;

/**
 * Offres à publier maintenant. `commonPerHour` : production horaire médiane
 * d'une ressource commune chez les joueurs actifs (sert à la taille des offres).
 */
export function planMakerOffers(open: OpenOffer[], commonPerHour: number, now: number): NewOffer[] {
  if (!MARKET_RULES.makerEnabled) return [];
  const live = open.filter((o) => o.status === "open");
  const sizeScrap = Math.max(MARKET_MAKER_RULES.minSize, Math.round(commonPerHour * MARKET_RULES.makerSizeHours));
  const band = Math.max(1, MARKET_RULES.priceBand);
  const spread = Math.max(0, Math.min(MARKET_RULES.makerSpread, band - 1));
  const out: NewOffer[] = [];
  for (const r of RESOURCE_LIST) {
    const res = r.id as ResourceId;
    const pay = payWith(res);
    const size = Math.max(1, Math.round(sizeScrap * getTradeRate("scrap", res)));
    const reference = size * getTradeRate(res, pay);
    const sells = live.filter((o) => (o.kind ?? "sell") === "sell" && o.giveRes === res);
    if (sells.length < MARKET_RULES.makerMinOffers && !sells.some((o) => isMarketMaker(o.sellerId))) {
      out.push({ kind: "sell", giveRes: res, giveAmount: size, wantRes: pay, wantAmount: Math.ceil(reference * (1 + spread)), expiresAtMs: now + MARKET_MAKER_RULES.offerHours * 3600_000 });
    }
    const buys = live.filter((o) => o.kind === "buy" && o.wantRes === res);
    if (buys.length < MARKET_RULES.makerMinOffers && !buys.some((o) => isMarketMaker(o.sellerId))) {
      out.push({ kind: "buy", giveRes: pay, giveAmount: Math.max(1, Math.floor(reference * (1 - spread))), wantRes: res, wantAmount: size, expiresAtMs: now + MARKET_MAKER_RULES.offerHours * 3600_000 });
    }
  }
  return out;
}
