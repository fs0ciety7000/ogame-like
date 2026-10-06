import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent, currentGameContent, validateRules, RULE_GROUP_LABELS } from "@/game/content";
import { AUCTION_HISTORY_RULES, AUCTION_RULES, AUCTION_WATCH_RULES } from "@/game/auctions";
import { TRADE_CONTRACT_RULES } from "@/game/tradeContracts";
import { giftDeliveryRate } from "@/game/actions";
import { CONTEST_RULES } from "@/game/contests";
import { OUTCOME_POINTS } from "@/game/casino";
import { WEEKLY_OFFERS } from "@/game/weeklyStock";
import { PATRON_RULES, topPatrons } from "@/game/patrons";

/* 6.9.0 (AU4, COM-1) : chaque chiffre du commerce est réglable dans l'admin (règle n° 2) et pris en compte. */

const set = (patch: object) => applyGameContent({ rules: { ...currentGameContent().rules, ...patch } });
afterEach(() => applyGameContent({}));

describe("6.9.0 commerce réglable", () => {
  it("chaque groupe a son libellé et les valeurs par défaut d'avant", () => {
    for (const g of ["auctions", "tradeContracts", "gifts", "contests", "tournamentPoints", "weeklyStock", "patrons"]) expect(RULE_GROUP_LABELS[g]).toBeTruthy();
    expect(AUCTION_RULES.taxRate).toBe(0.05);
    expect(AUCTION_WATCH_RULES.maxPerPlayer).toBe(5);
    expect(TRADE_CONTRACT_RULES.priorityHours).toBe(24);
    expect(OUTCOME_POINTS.jackpot).toBe(100);
    expect(WEEKLY_OFFERS.find((o) => o.id === "rareRelic")).toMatchObject({ price: 250, quantity: 8 });
    expect(PATRON_RULES.top).toBe(10);
  });

  it("les réglages s'appliquent", () => {
    const r = currentGameContent().rules;
    set({
      auctions: { ...r.auctions, watchMax: 8, historyPerLot: 5, minStart: { amber: 3 } },
      tradeContracts: { ...r.tradeContracts, priorityHours: 12 },
      gifts: { ...r.gifts, outsideAllianceTax: 0.5 },
      contests: { ...r.contests, standingsSize: 3 },
      tournamentPoints: { ...r.tournamentPoints, jackpot: 250 },
      weeklyStock: { prices: { rareRelic: 300 }, quantities: { tokens: 30 } },
      patrons: { top: 3 },
    });
    expect(AUCTION_WATCH_RULES.maxPerPlayer).toBe(8);
    expect(AUCTION_HISTORY_RULES.perLot).toBe(5);
    // Fusion partielle : les autres mises à prix restent.
    expect(AUCTION_RULES.minStart).toEqual({ common: 100, rare: 1, amber: 3 });
    expect(TRADE_CONTRACT_RULES.priorityHours).toBe(12);
    expect(giftDeliveryRate({ allianceId: "" }, { allianceId: "" })).toBeCloseTo(0.5);
    expect(CONTEST_RULES.standingsSize).toBe(3);
    expect(OUTCOME_POINTS.jackpot).toBe(250);
    expect(WEEKLY_OFFERS.find((o) => o.id === "rareRelic")?.price).toBe(300);
    expect(WEEKLY_OFFERS.find((o) => o.id === "tokens")?.quantity).toBe(30);
    expect(WEEKLY_OFFERS.find((o) => o.id === "rarePlan")?.price).toBe(200);
    const byUid = Object.fromEntries(Array.from({ length: 6 }, (_, i) => [`u${i}`, { pseudo: "p", amber: i + 1 }]));
    expect(topPatrons({ month: "2026-10", byUid, last: null })).toHaveLength(3);
  });

  it("valeurs incohérentes refusées", () => {
    const r = currentGameContent().rules;
    const bad = (patch: object) => validateRules({ ...r, ...patch }).join(" ");
    expect(bad({ auctions: { ...r.auctions, taxRate: 1.5 } })).toMatch(/Enchères/);
    expect(bad({ auctions: { ...r.auctions, durationsH: [] } })).toMatch(/durées/);
    expect(bad({ tradeContracts: { ...r.tradeContracts, minHours: 80 } })).toMatch(/Contrats/);
    expect(bad({ gifts: { ...r.gifts, outsideAllianceTax: 1 } })).toMatch(/Cadeaux/);
    expect(bad({ weeklyStock: { prices: { ...r.weeklyStock.prices, tokens: 0 }, quantities: r.weeklyStock.quantities } })).toMatch(/Offre de la semaine/);
    expect(bad({})).toBe("");
  });
});
