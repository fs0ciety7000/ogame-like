import { describe, expect, it } from "vitest";
import { economySnapshot, productionBonuses } from "@/game/economy";
import { defaultPlayerState } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

function player(): PlayerState {
  const p = defaultPlayerState("u", "U") as PlayerState;
  p.buildings = { ...p.buildings, extracteur_ferraille: { level: 10, unlocked: true } };
  return p;
}

describe("v5.2 bonus de production", () => {
  it("le secteur d'alliance s'applique même sans officier ni relique", () => {
    const base = economySnapshot(player()).gross.scrap ?? 0;
    const p = { ...player(), territory: { pct: 0.04, sectors: [1, 2], untilMs: Date.now() + 3_600_000 } } as PlayerState;
    expect(p.commanders ?? null).toBeNull();
    expect(economySnapshot(p).gross.scrap).toBeCloseTo(base * 1.04, 5);
    expect(productionBonuses(p, Date.now(), "scrap")).toContainEqual({ label: "Secteurs d'alliance", pct: 0.04 });
  });

  it("les talents de production s'appliquent aussi", () => {
    const base = economySnapshot(player()).gross.scrap ?? 0;
    const p = { ...player(), ascensions: 1, talents: { ranks: { fonderies: 3 } } } as unknown as PlayerState;
    const asc = economySnapshot({ ...player(), ascensions: 1 } as PlayerState).gross.scrap ?? 0;
    expect(asc).toBeGreaterThan(base);
    expect(economySnapshot(p).gross.scrap).toBeCloseTo(asc * 1.06, 5);
    expect(productionBonuses(p, Date.now(), "scrap").map((b) => b.label)).toContain("Reliques et talents");
  });
});
