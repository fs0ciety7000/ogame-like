import { beforeEach, describe, expect, it } from "vitest";
import { applyGameContent } from "@/game/content";
import { defaultPlayerState } from "@/game/defaults";
import { advanceColony, foundColony } from "@/game/colonies";
import { acceptOffer, fillBuyOrder } from "@/game/market";
import { COMMANDER_SOURCES, COMMANDER_XP, COMMANDERS } from "@/game/commanders";
import type { PlayerState } from "@/types/game";

const NOW = Date.UTC(2026, 9, 3, 12);

function withOfficer(uid: string, id: "steward" | "engineer"): PlayerState {
  const p = { ...defaultPlayerState(uid, uid), uid } as PlayerState;
  p.resources = { ...p.resources, scrap: 10_000, energy: 10_000 };
  p.commanders = { roster: { [id]: { xp: 0 } }, active: [id], movedAtMs: {}, dossiers: 0 };
  return p;
}

beforeEach(() => applyGameContent({}));

describe("v5.6 progression des officiers", () => {
  it("l'Intendant progresse des deux côtés d'un échange entre joueurs", () => {
    const seller = withOfficer("s", "steward");
    const buyer = withOfficer("b", "steward");
    const offer = { sellerId: "s", sellerAllianceId: "", giveRes: "scrap" as const, giveAmount: 100, wantRes: "energy" as const, wantAmount: 100, status: "open" as const, expiresAtMs: NOW + 3_600_000 };
    acceptOffer(offer, buyer, seller, 0, NOW);
    expect(buyer.commanders?.roster.steward?.xp).toBe(COMMANDER_XP.marketTrade);
    expect(seller.commanders?.roster.steward?.xp).toBe(COMMANDER_XP.marketTrade);

    const owner = withOfficer("o", "steward");
    const supplier = withOfficer("p", "steward");
    fillBuyOrder({ ...offer, sellerId: "o", kind: "buy", filled: 0 } as never, supplier, owner, 50, 0, NOW);
    expect(supplier.commanders?.roster.steward?.xp).toBe(COMMANDER_XP.marketTrade);
    expect(owner.commanders?.roster.steward?.xp).toBe(COMMANDER_XP.marketTrade);
  });

  it("un officier en réserve ne progresse pas", () => {
    const seller = withOfficer("s", "steward");
    seller.commanders = { roster: { steward: { xp: 0 } }, active: [], movedAtMs: {}, dossiers: 0 };
    const buyer = withOfficer("b", "steward");
    acceptOffer({ sellerId: "s", sellerAllianceId: "", giveRes: "scrap", giveAmount: 100, wantRes: "energy", wantAmount: 100, status: "open", expiresAtMs: NOW + 3_600_000 }, buyer, seller, 0, NOW);
    expect(seller.commanders?.roster.steward?.xp).toBe(0);
  });

  it("l'Ingénieure progresse avec les chantiers des colonies", () => {
    const p = withOfficer("u", "engineer");
    const colony = foundColony("u", { slot: 1, name: "Nova", startedAtMs: NOW, readyAtMs: NOW } as never, NOW - 10_000);
    colony.building = { id: Object.keys(colony.buildings)[0], level: 2, endTime: NOW - 1000, startedAtMs: NOW - 5000, paid: {} } as never;
    advanceColony(colony, p, NOW);
    expect(colony.building).toBeNull();
    expect(p.commanders?.roster.engineer?.xp).toBe(COMMANDER_XP.buildingDone);
  });

  it("chaque officier affiche ce qui le fait progresser", () => {
    for (const c of COMMANDERS) expect(COMMANDER_SOURCES[c.id].length).toBeGreaterThan(0);
  });
});
