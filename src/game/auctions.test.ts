import { describe, expect, it } from "vitest";
import { AUCTION_RULES, canCancel, creditBid, currencyBalance, debitBid, minStartFor, giveLot, minNextBid, placeBid, settleAuction, takeLot, validateListing, type Auction } from "@/game/auctions";
import { addModuleItem, modulesState } from "@/game/modules";
import { relicsState } from "@/game/relics";
import { defaultPlayerState } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

const NOW = 1_800_000_000_000;
const player = (patch: Partial<PlayerState> = {}): PlayerState => ({ ...defaultPlayerState("a", "A"), ...patch }) as PlayerState;
const auction = (patch: Partial<Auction> = {}): Auction => ({
  id: "x", sellerId: "s", sellerPseudo: "S", kind: "relic", item: { id: "r1", template: "t", rarity: "rare", foundAtMs: 0, source: "" }, label: "L", rarity: "rare",
  res: "scrap", startPrice: 1000, bid: 0, bidderId: "", bidderPseudo: "", bids: 0, status: "open", createdAtMs: NOW, endsAtMs: NOW + 3_600_000, closedAtMs: 0, tax: 0, ...patch,
});

describe("hôtel des enchères", () => {
  it("valide une mise en vente", () => {
    expect(validateListing({ kind: "relic", itemId: "a", res: "scrap", startPrice: 5000, durationH: 24 }, 0).startPrice).toBe(5000);
    expect(validateListing({ kind: "relic", itemId: "a", res: "aiFragment", startPrice: 3, durationH: 24 }, 0).res).toBe("aiFragment");
    expect(validateListing({ kind: "module", itemId: "a", res: "amber", startPrice: 1, durationH: 6 }, 0).res).toBe("amber");
    expect(() => validateListing({ kind: "relic", itemId: "a", res: "pierre", startPrice: 5000, durationH: 24 }, 0)).toThrow(/inconnue/);
    expect(() => validateListing({ kind: "relic", itemId: "a", res: "scrap", startPrice: 50, durationH: 24 }, 0)).toThrow(/au moins 100/);
    expect(() => validateListing({ kind: "relic", itemId: "a", res: "scrap", startPrice: 5000, durationH: 7 }, 0)).toThrow(/Durée/);
    expect(() => validateListing({ kind: "relic", itemId: "a", res: "scrap", startPrice: 5000, durationH: 24 }, AUCTION_RULES.maxOpenPerSeller)).toThrow(/ouvertes/);
  });

  it("première enchère à la mise à prix, puis +5 %", () => {
    const a = auction();
    expect(minNextBid(a)).toBe(1000);
    expect(() => placeBid(a, "b", "B", 999, NOW)).toThrow(/minimale/);
    const first = placeBid(a, "b", "B", 1000, NOW);
    expect(first).toMatchObject({ refund: null, charge: 1000 });
    expect(minNextBid(a)).toBe(1050);
    const second = placeBid(a, "c", "C", 1050, NOW);
    expect(second.refund).toEqual({ uid: "b", amount: 1000 });
    expect(second.charge).toBe(1050);
  });

  it("surenchérir sur soi-même ne coûte que la différence", () => {
    const a = auction({ bid: 2000, bidderId: "b", bidderPseudo: "B" });
    expect(placeBid(a, "b", "B", 3000, NOW)).toMatchObject({ refund: null, charge: 1000 });
  });

  it("le vendeur n'enchérit pas, une vente close refuse", () => {
    expect(() => placeBid(auction(), "s", "S", 5000, NOW)).toThrow(/propre/);
    expect(() => placeBid(auction({ endsAtMs: NOW - 1 }), "b", "B", 5000, NOW)).toThrow(/close/);
  });

  it("anti-dernière seconde : la fin recule à 5 minutes", () => {
    const a = auction({ endsAtMs: NOW + 60_000 });
    expect(placeBid(a, "b", "B", 1000, NOW).endsAtMs).toBe(NOW + AUCTION_RULES.antiSnipeMs);
    const far = auction();
    expect(placeBid(far, "b", "B", 1000, NOW).endsAtMs).toBe(NOW + 3_600_000);
  });

  it("clôture : 5 % de taxe au pot, sinon retour au vendeur", () => {
    expect(settleAuction({ bid: 10_000, bidderId: "b", sellerId: "s" })).toEqual({ status: "sold", receiver: "b", payout: 9500, tax: 500 });
    expect(settleAuction({ bid: 0, bidderId: "", sellerId: "s" })).toEqual({ status: "expired", receiver: "s", payout: 0, tax: 0 });
    expect(canCancel({ status: "open", bid: 0 })).toBe(true);
    expect(canCancel({ status: "open", bid: 5 })).toBe(false);
  });

  it("retire une relique libre, refuse une équipée ou mythique", () => {
    const p = player({ relics: { items: [
      { id: "a", template: "soute_pliee", rarity: "rare", foundAtMs: 0, source: "" },
      { id: "b", template: "soute_pliee", rarity: "rare", foundAtMs: 0, source: "" },
      { id: "m", template: "coeur_leviathan", rarity: "mythic", foundAtMs: 0, source: "" },
    ], slots: ["b", null, null], aegisWeek: "" } });
    expect(() => takeLot(p, "relic", "b")).toThrow(/emplacement/);
    expect(() => takeLot(p, "relic", "m")).toThrow(/mythique/);
    const lot = takeLot(p, "relic", "a");
    expect(relicsState(p).items.map((r) => r.id)).toEqual(["b", "m"]);
    giveLot(p, "relic", lot.item);
    expect(relicsState(p).items).toHaveLength(3);
  });

  it("seuls les plans de module se vendent, et reviennent en plan", () => {
    const p = player();
    addModuleItem(p, { id: "p", template: "voile_furtif", rarity: "epic", built: false, foundAtMs: 0, source: "" });
    addModuleItem(p, { id: "q", template: "voile_furtif", rarity: "epic", built: true, foundAtMs: 0, source: "" });
    expect(() => takeLot(p, "module", "q")).toThrow(/plans/);
    const lot = takeLot(p, "module", "p");
    expect(lot.label).toMatch(/^Plan : Voile furtif/);
    const other = player();
    giveLot(other, "module", lot.item);
    expect(modulesState(other).items[0]).toMatchObject({ id: "p", built: false });
  });

  it("débit refusé sans les ressources", () => {
    const p = player();
    p.resources.scrap = 10;
    expect(() => debitBid(p, "scrap", 11)).toThrow(/insuffisantes/);
    debitBid(p, "scrap", 10);
    expect(p.resources.scrap).toBe(0);
  });

  it("monnaies : ressources rares et Ambre, débitées et créditées au bon endroit", () => {
    expect(minStartFor("scrap")).toBe(100);
    expect(minStartFor("aiFragment")).toBe(1);
    expect(minStartFor("amber")).toBe(1);
    const p = player({ bounties: { amber: 30 } as PlayerState["bounties"] });
    expect(currencyBalance(p, "amber")).toBe(30);
    expect(() => debitBid(p, "amber", 31)).toThrow(/Ambre/);
    debitBid(p, "amber", 12);
    expect(currencyBalance(p, "amber")).toBe(18);
    creditBid(p, "amber", 5);
    expect(currencyBalance(p, "amber")).toBe(23);
    p.resources.aiFragment = 4;
    debitBid(p, "aiFragment", 3);
    expect(p.resources.aiFragment).toBe(1);
  });
});
