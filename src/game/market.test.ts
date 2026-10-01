import { describe, expect, it } from "vitest";
import { defaultPlayerState } from "@/game/defaults";
import { acceptOffer, createOffer, MARKET_RULES, marketTax, priceBounds, refundOffer } from "@/game/market";
import type { PlayerState } from "@/types/game";

function player(uid: string, allianceId = ""): PlayerState {
  const p = { ...defaultPlayerState(uid, uid), createdAt: null } as unknown as PlayerState;
  p.uid = uid;
  p.allianceId = allianceId;
  p.resources = { ...p.resources, scrap: 1_000_000, energy: 1_000_000, reinforcedSteel: 10_000 };
  return p;
}

describe("market", () => {
  const now = 1_000_000;

  it("bounds the price around the counter rate", () => {
    expect(priceBounds("scrap", 300, "energy")).toEqual({ min: 100, max: 900, reference: 300 });
    // 1 rare vaut 50 communs au comptoir.
    expect(priceBounds("reinforcedSteel", 10, "scrap").max).toBe(1500);
  });

  it("escrows the goods and validates the offer", () => {
    const s = player("s");
    const offer = createOffer(s, { giveRes: "scrap", giveAmount: 10_000, wantRes: "energy", wantAmount: 12_000 }, 0, now);
    expect(s.resources.scrap).toBe(990_000);
    expect(offer.expiresAtMs).toBe(now + MARKET_RULES.offerHours * 3600_000);
    expect(() => createOffer(s, { giveRes: "scrap", giveAmount: 100, wantRes: "energy", wantAmount: 1000 }, 0, now)).toThrow(/Prix hors limites/);
    expect(() => createOffer(s, { giveRes: "scrap", giveAmount: 100, wantRes: "scrap", wantAmount: 100 }, 0, now)).toThrow(/différentes/);
    expect(() => createOffer(s, { giveRes: "scrap", giveAmount: 100, wantRes: "energy", wantAmount: 100 }, MARKET_RULES.maxOpenOffers, now)).toThrow(/offres ouvertes/);
    expect(() => createOffer(s, { giveRes: "scrap", giveAmount: 1e9, wantRes: "energy", wantAmount: 1e9 }, 0, now)).toThrow(/Pas assez/);
  });

  it("swaps the goods, taxes the seller, lighter within an alliance", () => {
    const offer = { sellerId: "s", sellerAllianceId: "A", giveRes: "scrap" as const, giveAmount: 10_000, wantRes: "energy" as const, wantAmount: 10_000, status: "open" as const, expiresAtMs: now + 1 };
    const s = player("s", "A");
    const b = player("b");
    const res = acceptOffer(offer, b, s, 0, now);
    expect(res.tax).toBe(marketTax(10_000, false));
    expect(b.resources.energy).toBe(990_000);
    expect(b.resources.scrap).toBe(1_010_000);
    expect(s.resources.energy).toBe(1_000_000 + 10_000 - 500);
    const ally = player("c", "A");
    expect(acceptOffer(offer, ally, player("s", "A"), 0, now).tax).toBe(200);
  });

  it("refuses own, expired, over-quota or unaffordable offers; refunds", () => {
    const offer = { sellerId: "s", sellerAllianceId: "", giveRes: "scrap" as const, giveAmount: 10, wantRes: "energy" as const, wantAmount: 10, status: "open" as const, expiresAtMs: now + 1 };
    expect(() => acceptOffer(offer, player("s"), player("s"), 0, now)).toThrow(/propre offre/);
    expect(() => acceptOffer({ ...offer, expiresAtMs: now }, player("b"), player("s"), 0, now)).toThrow(/plus disponible/);
    expect(() => acceptOffer(offer, player("b"), player("s"), MARKET_RULES.maxBuysPerDay, now)).toThrow(/Limite/);
    const poor = player("b");
    poor.resources.energy = 0;
    expect(() => acceptOffer(offer, poor, player("s"), 0, now)).toThrow(/Pas assez/);
    const s = player("s");
    refundOffer(offer, s);
    expect(s.resources.scrap).toBe(1_000_010);
  });
});
