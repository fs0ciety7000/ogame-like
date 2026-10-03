import { beforeEach, describe, expect, it } from "vitest";
import { applyGameContent } from "@/game/content";
import { defaultPlayerState } from "@/game/defaults";
import { acceptOffer, fillBuyOrder, MARKET_RULES, priceBounds, type MarketOffer } from "@/game/market";
import { MARKET_MAKER_ID, marketMakerPlayer, planMakerOffers } from "@/game/marketMaker";
import { RESOURCE_LIST } from "@/game/resources";
import type { PlayerState } from "@/types/game";

const NOW = Date.UTC(2026, 9, 3, 12);
const offer = (o: Partial<MarketOffer>): MarketOffer => ({ id: "x", sellerId: "u1", sellerPseudo: "A", sellerAllianceId: "", giveRes: "scrap", giveAmount: 10, wantRes: "energy", wantAmount: 10, status: "open", createdAtMs: NOW, expiresAtMs: NOW + 3_600_000, buyerId: "", buyerPseudo: "", filledAtMs: 0, tax: 0, kind: "sell", filled: 0, ...o });

beforeEach(() => applyGameContent({}));

describe("v5.5 Courtier du Comptoir", () => {
  it("marché vide : une vente et un ordre d'achat par ressource, dans la fourchette de prix", () => {
    const plan = planMakerOffers([], 100_000, NOW);
    expect(plan).toHaveLength(RESOURCE_LIST.length * 2);
    for (const o of plan) {
      const b = priceBounds(o.giveRes, o.giveAmount, o.wantRes);
      expect(o.wantAmount).toBeGreaterThanOrEqual(b.min);
      expect(o.wantAmount).toBeLessThanOrEqual(b.max);
    }
    const scrapSell = plan.find((o) => o.kind === "sell" && o.giveRes === "scrap")!;
    expect(scrapSell.giveAmount).toBe(200_000);
    expect(scrapSell.wantAmount).toBe(Math.ceil(200_000 * (1 + MARKET_RULES.makerSpread)));
  });

  it("n'intervient pas quand les joueurs publient assez, ni deux fois", () => {
    const busy = Array.from({ length: MARKET_RULES.makerMinOffers }, () => offer({ giveRes: "scrap" }));
    expect(planMakerOffers(busy, 100_000, NOW).some((o) => o.kind === "sell" && o.giveRes === "scrap")).toBe(false);
    const already = [offer({ sellerId: MARKET_MAKER_ID, giveRes: "nano" })];
    expect(planMakerOffers(already, 100_000, NOW).some((o) => o.kind === "sell" && o.giveRes === "nano")).toBe(false);
    MARKET_RULES.makerEnabled = false;
    expect(planMakerOffers([], 100_000, NOW)).toEqual([]);
    MARKET_RULES.makerEnabled = true;
  });

  it("un joueur achète au courtier et remplit ses ordres comme avec un joueur", () => {
    const buyer = { ...defaultPlayerState("b", "Acheteur"), createdAt: NOW } as PlayerState;
    buyer.resources.energy = 1_000_000;
    buyer.resources.scrap = 1_000_000;
    const [sell] = planMakerOffers([], 10_000, NOW).filter((o) => o.kind === "sell" && o.giveRes === "nano");
    acceptOffer(offer({ ...sell, sellerId: MARKET_MAKER_ID }), buyer, marketMakerPlayer(), 0, NOW);
    expect(buyer.resources.nano).toBeGreaterThanOrEqual(sell.giveAmount);
    const [buy] = planMakerOffers([], 10_000, NOW).filter((o) => o.kind === "buy" && o.wantRes === "energy");
    const before = buyer.resources.scrap;
    const fill = fillBuyOrder(offer({ ...buy, sellerId: MARKET_MAKER_ID }), buyer, marketMakerPlayer(), buy.wantAmount, 1, NOW);
    expect(fill.done).toBe(true);
    expect(buyer.resources.scrap).toBe(before + buy.giveAmount);
  });
});
