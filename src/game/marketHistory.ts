import { getTradeRate } from "@/game/resources";
import type { MarketOffer } from "@/game/market";
import type { ResourceId } from "@/types/game";

/* =====================================================
   v4.8 : historique des prix du marché. Chaque échange conclu donne un
   prix relatif au taux du comptoir (1 = prix du comptoir, 2 = deux fois
   plus cher). Pour une ressource, on retient la médiane par jour sur
   30 jours ; une offre à plus de 2 fois (ou moins de la moitié) de la
   médiane est signalée « prix anormal ».
===================================================== */

export const MARKET_HISTORY_RULES = {
  days: 30,
  /** Échanges minimum sur la période pour juger un prix. */
  minTrades: 3,
  highFactor: 2,
  lowFactor: 0.5,
};

const DAY = 86400_000;

type Trade = Pick<MarketOffer, "giveRes" | "giveAmount" | "wantRes" | "wantAmount" | "filledAtMs">;

/** Prix de la ressource vendue, relatif au comptoir (1 = prix du comptoir). */
export function offerRatio(o: Pick<MarketOffer, "giveRes" | "giveAmount" | "wantRes" | "wantAmount">): number {
  const reference = o.giveAmount * getTradeRate(o.giveRes, o.wantRes);
  return reference > 0 ? o.wantAmount / reference : 1;
}

/** Prix de `res` dans un échange : vendue (ratio) ou achetée (inverse). */
function priceOf(t: Trade, res: ResourceId): number | null {
  if (t.giveRes === res) return offerRatio(t);
  if (t.wantRes === res) {
    const r = offerRatio(t);
    return r > 0 ? 1 / r : null;
  }
  return null;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export interface PricePoint {
  /** Début du jour (UTC). */
  day: number;
  median: number;
  trades: number;
}

/** Médiane par jour sur la période (jours sans échange absents). */
export function priceHistory(trades: Trade[], res: ResourceId, now: number, days = MARKET_HISTORY_RULES.days): PricePoint[] {
  const since = now - days * DAY;
  const byDay = new Map<number, number[]>();
  for (const t of trades) {
    if (!(t.filledAtMs >= since && t.filledAtMs <= now)) continue;
    const p = priceOf(t, res);
    if (p === null || !Number.isFinite(p)) continue;
    const day = Math.floor(t.filledAtMs / DAY) * DAY;
    byDay.set(day, [...(byDay.get(day) ?? []), p]);
  }
  return [...byDay.entries()].sort((a, b) => a[0] - b[0]).map(([day, v]) => ({ day, median: median(v), trades: v.length }));
}

/** Prix de référence sur la période (médiane de tous les échanges), ou null si trop peu d'échanges. */
export function referencePrice(trades: Trade[], res: ResourceId, now: number): { median: number; trades: number } | null {
  const since = now - MARKET_HISTORY_RULES.days * DAY;
  const prices = trades.filter((t) => t.filledAtMs >= since && t.filledAtMs <= now).map((t) => priceOf(t, res)).filter((p): p is number => p !== null && Number.isFinite(p));
  if (prices.length < MARKET_HISTORY_RULES.minTrades) return null;
  return { median: median(prices), trades: prices.length };
}

/** Offre anormalement chère ou bradée par rapport au prix habituel de la ressource vendue. */
export function priceFlag(offer: Pick<MarketOffer, "giveRes" | "giveAmount" | "wantRes" | "wantAmount">, trades: Trade[], now: number): { kind: "high" | "low"; factor: number } | null {
  const ref = referencePrice(trades, offer.giveRes, now);
  if (!ref || ref.median <= 0) return null;
  const factor = offerRatio(offer) / ref.median;
  if (factor > MARKET_HISTORY_RULES.highFactor) return { kind: "high", factor };
  if (factor < MARKET_HISTORY_RULES.lowFactor) return { kind: "low", factor };
  return null;
}
