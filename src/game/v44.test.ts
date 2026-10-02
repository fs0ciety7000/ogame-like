import { describe, expect, it } from "vitest";
import { defaultPlayerState } from "@/game/defaults";
import { currentTiers, newTierUps, tierBonusText } from "@/game/tierUp";

describe("v4.4 building tiers", () => {
  it("detects crossed tiers once, highest per building", () => {
    const p = defaultPlayerState("u1", "u1");
    p.buildings.extracteur_ferraille = { level: 4, unlocked: true };
    const seen = currentTiers(p.buildings);
    expect(newTierUps(seen, p.buildings)).toEqual([]);
    p.buildings.extracteur_ferraille = { level: 11, unlocked: true };
    const ups = newTierUps(seen, p.buildings);
    expect(ups).toEqual([{ buildingId: "extracteur_ferraille", tier: 10, level: 11 }]);
    expect(newTierUps({ ...seen, extracteur_ferraille: 10 }, p.buildings)).toEqual([]);
    // Bâtiment verrouillé : pas de palier.
    p.buildings.entrepot = { level: 20, unlocked: false };
    expect(newTierUps(seen, p.buildings).some((u) => u.buildingId === "entrepot")).toBe(false);
  });

  it("describes what the tier brings", () => {
    expect(tierBonusText("extracteur_ferraille", 10)).toMatch(/\/s de ferraille/);
    expect(tierBonusText("entrepot", 5)).toMatch(/stockage/);
    expect(tierBonusText("hangar_defense", 5)).toMatch(/places de hangar/);
  });
});
