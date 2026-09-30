import { describe, expect, it } from "vitest";
import { advanceResources, economySnapshot, getFleetUpkeep, protectedAmount } from "@/game/economy";
import { defaultBuildings } from "@/game/buildings";
import { defaultResources } from "@/game/defaults";
import type { Buildings } from "@/types/game";

function base(level = 10): Buildings {
  const b = defaultBuildings();
  for (const id of ["extracteur_ferraille", "reacteur_instable", "extracteur_nanocomposants", "archives_fracturees"]) b[id] = { level, unlocked: true };
  b.entrepot = { level: 10, unlocked: true };
  return b;
}

describe("advanceResources", () => {
  it("produces normally below the warehouse cap", () => {
    const out = advanceResources({ buildings: base(), techLevels: {}, resources: defaultResources() }, 100);
    expect(out.scrap).toBe(100 + 500 * 100);
    expect(out.energy).toBe(50 + 500 * 100);
  });

  it("stops at the warehouse cap and keeps a stock already above it", () => {
    const cap = Math.floor(2_000_000 * 1.6 ** 10);
    const out = advanceResources({ buildings: base(), techLevels: {}, resources: { ...defaultResources(), scrap: cap - 1000, nano: cap + 5_000_000 } }, 3600);
    expect(out.scrap).toBe(cap);
    expect(out.nano).toBe(cap + 5_000_000);
    expect(economySnapshot({ buildings: base(), techLevels: {}, resources: out }).full).toContain("scrap");
  });

  it("charges fleet upkeep in energy, then halves production during an outage", () => {
    const units = { fregate: { level: 1, count: 40_000 } }; // 40 000 places × 0,015 = 600/s > 500/s produits
    expect(getFleetUpkeep(units)).toBeCloseTo(600);
    const input = { buildings: base(), techLevels: {}, units, resources: { ...defaultResources(), energy: 1000 } };
    // −100/s : 1000 d'énergie tiennent 10 s, puis 90 s de panne à 50 %.
    const out = advanceResources(input, 100);
    expect(out.energy).toBe(0);
    expect(out.scrap).toBeCloseTo(100 + 500 * 10 + 250 * 90);
    const snap = economySnapshot({ ...input, resources: out });
    expect(snap.outage).toBe(true);
    expect(snap.net.scrap).toBe(250);
  });

  it("protects 10 % of the warehouse from looting, common resources only", () => {
    const cap = Math.floor(2_000_000 * 1.6 ** 10);
    expect(protectedAmount(base(), "scrap")).toBe(Math.floor(cap * 0.1));
    expect(protectedAmount(base(), "aiFragment")).toBe(0);
  });
});
