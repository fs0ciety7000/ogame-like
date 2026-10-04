import { describe, expect, it } from "vitest";
import { addToPot, emptyServerPot, giftTax, normalizeServerPot, takeFromPot } from "@/game/serverPot";

describe("pot commun « Serveur »", () => {
  it("accumule les taxes par source et garde un journal", () => {
    let pot = emptyServerPot();
    pot = addToPot(pot, "market", { scrap: 500 }, 1);
    pot = addToPot(pot, "gift", { scrap: 200, energy: 50 }, 2);
    pot = addToPot(pot, "gift", { scrap: 0, energy: -3 }, 3);
    expect(pot.resources).toEqual({ scrap: 700, energy: 50 });
    expect(pot.totals.market).toEqual({ scrap: 500 });
    expect(pot.totals.gift).toEqual({ scrap: 200, energy: 50 });
    expect(pot.log).toHaveLength(2);
  });

  it("verse sans jamais passer sous zéro", () => {
    const pot = addToPot(emptyServerPot(), "market", { scrap: 100 }, 1);
    const next = takeFromPot(pot, { scrap: 250, energy: 10 }, 2, "Concours");
    expect(next.resources.scrap).toBe(0);
    expect(next.log.at(-1)).toMatchObject({ source: "admin", resources: { scrap: -100 }, note: "Concours" });
    expect(takeFromPot(next, { scrap: 1 }, 3, "x")).toBe(next);
  });

  it("calcule la part perdue d'un cadeau et relit un état abîmé", () => {
    expect(giftTax({ scrap: 1000, energy: 3 }, { scrap: 800, energy: 2 })).toEqual({ scrap: 200, energy: 1 });
    const pot = normalizeServerPot({ resources: { scrap: "12" }, log: [{ source: "pirate" }, { source: "gift", resources: { scrap: 2 }, atMs: 5 }] });
    expect(pot.resources).toEqual({ scrap: 12 });
    expect(pot.log).toHaveLength(1);
  });
});
