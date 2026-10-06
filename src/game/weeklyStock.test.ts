import { describe, expect, it } from "vitest";
import { defaultPlayerState } from "@/game/defaults";
import { bountyState } from "@/game/bounties";
import { buyWeeklyOffer, nextRestockMs, offerOfWeek, WEEKLY_OFFERS, weeklyStock, weekKey } from "@/game/weeklyStock";
import { addPatronage, patronsState, topPatrons } from "@/game/patrons";
import type { PlayerState } from "@/types/game";

// Mardi 6 octobre 2026, 12 h UTC.
const NOW = Date.UTC(2026, 9, 6, 12);
const DAY = 86_400_000;

function player(uid = "u1"): PlayerState {
  const p = { ...defaultPlayerState(uid, uid), createdAt: null } as unknown as PlayerState;
  p.uid = uid;
  p.bounties = { ...bountyState(p), amber: 2000 };
  return p;
}

describe("5.27 stock tournant du Comptoir", () => {
  it("change d'offre chaque lundi, la même pour tout le serveur", () => {
    expect(weekKey(NOW)).toBe("2026-10-05");
    expect(nextRestockMs(NOW)).toBe(Date.UTC(2026, 9, 12));
    const offers = [0, 1, 2, 3].map((w) => offerOfWeek(NOW + w * 7 * DAY).id);
    expect(new Set(offers).size).toBe(WEEKLY_OFFERS.length);
    expect(offerOfWeek(NOW).id).toBe(offerOfWeek(NOW + 3 * DAY).id);
  });

  it("un exemplaire par joueur, quantité limitée, remis à neuf la semaine suivante", () => {
    let stock: unknown = null;
    const offer = offerOfWeek(NOW);
    for (let i = 0; i < offer.quantity; i++) stock = buyWeeklyOffer(player(`p${i}`), `p${i}`, stock, NOW, () => 0.5).stock;
    expect(() => buyWeeklyOffer(player("late"), "late", stock, NOW)).toThrow(/Épuisé/);
    expect(() => buyWeeklyOffer(player("p0"), "p0", stock, NOW)).toThrow(/Déjà/);
    expect(weeklyStock(stock, NOW + 7 * DAY).sold).toBe(0);
    const p = player("x");
    buyWeeklyOffer(p, "x", null, NOW, () => 0.5);
    expect(bountyState(p).amber).toBe(2000 - offer.price);
    expect(bountyState(p).history.at(-1)?.item).toBe(`weekly:${offer.id}`);
  });
});

describe("5.27 mécènes du mois", () => {
  it("cumule par joueur, classe, archive le podium au changement de mois", () => {
    let st = addPatronage(null, "a", "Alice", 50, NOW);
    st = addPatronage(st, "b", "Bob", 120, NOW);
    st = addPatronage(st, "a", "Alice", 100, NOW);
    expect(topPatrons(st).map((e) => [e.pseudo, e.amber])).toEqual([
      ["Alice", 150],
      ["Bob", 120],
    ]);
    const next = patronsState(st, Date.UTC(2026, 10, 2));
    expect(next.byUid).toEqual({});
    expect(next.last?.month).toBe("2026-10");
    expect(next.last?.top[0].pseudo).toBe("Alice");
  });
});
