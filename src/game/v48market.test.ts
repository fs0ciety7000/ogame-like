import { describe, expect, it } from "vitest";
import { offerRatio, priceFlag, priceHistory, referencePrice } from "@/game/marketHistory";

const NOW = Date.UTC(2026, 9, 20, 12);
const DAY = 86400_000;
const trade = (give: string, ga: number, want: string, wa: number, daysAgo: number) => ({ giveRes: give, giveAmount: ga, wantRes: want, wantAmount: wa, filledAtMs: NOW - daysAgo * DAY }) as never;

describe("v4.8 : historique des prix du marché", () => {
  it("exprime un prix relatif au comptoir", () => {
    // Ferraille contre énergie : comptoir 1 pour 1.
    expect(offerRatio({ giveRes: "scrap", giveAmount: 1000, wantRes: "energy", wantAmount: 1500 })).toBeCloseTo(1.5);
    // Ressource rare contre commune : comptoir 50.
    expect(offerRatio({ giveRes: "aiFragment", giveAmount: 10, wantRes: "scrap", wantAmount: 500 })).toBeCloseTo(1);
  });

  it("médiane par jour, ventes et achats confondus, sur 30 jours", () => {
    const trades = [trade("scrap", 100, "energy", 100, 1), trade("scrap", 100, "energy", 300, 1), trade("energy", 100, "scrap", 50, 2), trade("scrap", 100, "energy", 100, 40)];
    const pts = priceHistory(trades, "scrap", NOW);
    expect(pts).toHaveLength(2);
    expect(pts[0].median).toBeCloseTo(2); // achat de ferraille à moitié prix en énergie : ferraille × 2
    expect(pts[1].median).toBeCloseTo(2);
    expect(pts[1].trades).toBe(2);
  });

  it("signale un prix anormal seulement avec assez d'échanges", () => {
    const few = [trade("scrap", 100, "energy", 100, 1)];
    expect(referencePrice(few, "scrap", NOW)).toBeNull();
    expect(priceFlag({ giveRes: "scrap", giveAmount: 100, wantRes: "energy", wantAmount: 290 } as never, few, NOW)).toBeNull();
    const many = [1, 2, 3, 4].map((d) => trade("scrap", 100, "energy", 100, d));
    expect(priceFlag({ giveRes: "scrap", giveAmount: 100, wantRes: "energy", wantAmount: 250 } as never, many, NOW)).toMatchObject({ kind: "high" });
    expect(priceFlag({ giveRes: "scrap", giveAmount: 100, wantRes: "energy", wantAmount: 40 } as never, many, NOW)).toMatchObject({ kind: "low" });
    expect(priceFlag({ giveRes: "scrap", giveAmount: 100, wantRes: "energy", wantAmount: 150 } as never, many, NOW)).toBeNull();
  });
});
