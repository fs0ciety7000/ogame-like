import { describe, expect, it } from "vitest";
import { combatValue, unitBalanceAudit, unitClasses } from "@/game/unitClasses";
import { findUnit, UNITS } from "@/game/units";

describe("5.18 classes d'unités et audit d'équilibrage", () => {
  it("range chaque catégorie en tiers faible / moyen / fort, les sondes en soutien", () => {
    const cls = unitClasses();
    expect(cls.sonde_espionnage).toBe("support");
    expect(cls.etoile_noire).toBe("heavy");
    expect(cls.roquette).toBe("light");
    for (const cat of ["attack", "defense"] as const) {
      const ids = UNITS.filter((u) => u.category === cat && u.stats.attaque > 0).map((u) => u.id);
      expect(ids.some((id) => cls[id] === "light")).toBe(true);
      expect(ids.some((id) => cls[id] === "heavy")).toBe(true);
    }
  });

  it("valeur de combat = √(attaque × points de vie), croissante avec le niveau", () => {
    const ch = findUnit("chasseur")!;
    expect(combatValue(ch)).toBeCloseTo(Math.sqrt(245 * 10 * 30));
    expect(combatValue(ch, 10)).toBeGreaterThan(combatValue(ch));
  });

  it("aucune unité de combat n'écrase toutes les autres par coût et par place", () => {
    const rows = unitBalanceAudit();
    expect(rows.length).toBeGreaterThanOrEqual(12);
    expect(rows.filter((r) => r.flag === "strong").map((r) => r.id)).toEqual([]);
  });
});
