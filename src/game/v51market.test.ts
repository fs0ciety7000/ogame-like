import { describe, expect, it } from "vitest";
import { defaultPlayerState } from "@/game/defaults";
import { buyOrderPaid, createOffer, fillBuyOrder, MARKET_RULES, offerReserved, refundOffer, type MarketOffer } from "@/game/market";
import type { PlayerState } from "@/types/game";

function player(uid: string): PlayerState {
  const p = { ...defaultPlayerState(uid, uid), createdAt: null } as unknown as PlayerState;
  p.uid = uid;
  p.resources = { ...p.resources, scrap: 1_000_000, energy: 1_000_000 };
  return p;
}

const NOW = 1_000_000;

describe("v5.1 : ordres d'achat", () => {
  it("réserve le paiement, se remplit en plusieurs livraisons au prorata, rembourse le reste", () => {
    const owner = player("o");
    const created = createOffer(owner, { kind: "buy", giveRes: "scrap", giveAmount: 10_000, wantRes: "energy", wantAmount: 9_999 }, 0, NOW);
    expect(created.kind).toBe("buy");
    expect(owner.resources.scrap).toBe(990_000);
    const order = { ...created, sellerId: "o", sellerAllianceId: "", status: "open", filled: 0 } as unknown as MarketOffer;

    const a = player("a");
    const r1 = fillBuyOrder(order, a, owner, 3_333, 0, NOW + 1);
    expect(r1).toMatchObject({ qty: 3_333, filled: 3_333, done: false });
    expect(r1.payment).toBe(buyOrderPaid(order, 3_333));
    expect(a.resources.scrap).toBe(1_000_000 + r1.payment);
    expect(owner.resources.energy).toBe(1_000_000 + 3_333 - r1.tax);
    expect(r1.tax).toBe(Math.floor(3_333 * MARKET_RULES.taxPct));
    order.filled = r1.filled;

    // La livraison est plafonnée au reste ; le total versé ne dépasse jamais le paiement réservé.
    const b = player("b");
    const r2 = fillBuyOrder(order, b, owner, 50_000, 0, NOW + 2);
    expect(r2).toMatchObject({ qty: 6_666, filled: 9_999, done: true });
    expect(r1.payment + r2.payment).toBe(10_000);
    order.filled = r2.filled;
    expect(offerReserved(order)).toBe(0);
  });

  it("refuse son propre ordre, un stock insuffisant et un ordre expiré", () => {
    const owner = player("o");
    const created = createOffer(owner, { kind: "buy", giveRes: "scrap", giveAmount: 1_000, wantRes: "energy", wantAmount: 1_000 }, 0, NOW);
    const order = { ...created, sellerId: "o", sellerAllianceId: "", status: "open", filled: 0 } as unknown as MarketOffer;
    expect(() => fillBuyOrder(order, owner, owner, 10, 0, NOW)).toThrow(/propre ordre/);
    const poor = player("p");
    poor.resources.energy = 5;
    expect(() => fillBuyOrder(order, poor, owner, 10, 0, NOW)).toThrow(/Pas assez/);
    expect(() => fillBuyOrder(order, player("x"), owner, 10, 0, order.expiresAtMs)).toThrow(/plus disponible/);
  });

  it("à l'expiration, seule la part non versée revient", () => {
    const owner = player("o");
    const created = createOffer(owner, { kind: "buy", giveRes: "scrap", giveAmount: 1_000, wantRes: "energy", wantAmount: 1_000 }, 0, NOW);
    const order = { ...created, sellerId: "o", sellerAllianceId: "", status: "open", filled: 400 } as unknown as MarketOffer;
    const before = owner.resources.scrap;
    expect(refundOffer(order, owner)).toBe(600);
    expect(owner.resources.scrap).toBe(before + 600);
  });
});
