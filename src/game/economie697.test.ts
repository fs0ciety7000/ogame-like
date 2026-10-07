import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent } from "@/game/content";
import { EXCHANGE_RULES, getTradeRate, tradeQuote } from "@/game/resources";
import { RESEARCH_RULES } from "@/game/technologies";

/* 6.9.7 (AU11) : comptoir d'échange et file du Labo réglables. */

afterEach(() => applyGameContent({}));

describe("6.9.7 économie réglable", () => {
  it("valeurs d'avant par défaut", () => {
    expect(getTradeRate("scrap", "reinforcedSteel")).toBe(0.01);
    expect(getTradeRate("reinforcedSteel", "scrap")).toBe(50);
    expect(getTradeRate("scrap", "energy")).toBe(1);
    expect(tradeQuote("scrap", "energy", 1000).tax).toBe(50);
    expect(RESEARCH_RULES.maxConcurrent).toBe(4);
  });

  it("les réglages s'appliquent", () => {
    applyGameContent({ rules: { exchange: { rareToCommon: 40, taxPct: 0.1 }, research: { maxConcurrent: 5 } } } as never);
    expect(getTradeRate("reinforcedSteel", "scrap")).toBe(40);
    expect(EXCHANGE_RULES.commonToRare).toBe(0.01);
    expect(tradeQuote("scrap", "energy", 1000).tax).toBe(100);
    expect(RESEARCH_RULES.maxConcurrent).toBe(5);
  });
});
