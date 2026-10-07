import { describe, expect, it } from "vitest";
import { claimStreak, rollStreakChest, streakStatus } from "@/game/streak";
import { defaultPlayerState } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 9, 5, 10); // midi à Paris

function player(): PlayerState {
  return defaultPlayerState("u", "U") as PlayerState;
}

describe("v5.3 série de connexion", () => {
  it("une fois par jour, puis la série monte", () => {
    const p = player();
    const scrap = p.resources.scrap;
    const first = claimStreak(p, T0);
    expect(first.count).toBe(1);
    expect(p.resources.scrap).toBeGreaterThan(scrap);
    expect(() => claimStreak(p, T0 + 3_600_000)).toThrow(/déjà réclamée/);
    expect(claimStreak(p, T0 + DAY).count).toBe(2);
    expect(streakStatus(p, T0 + DAY).claimed).toBe(true);
  });

  it("5.15.6 : 2 jetons par jour, 35 Ambre au 6e jour, coffre au 7e ; un jour manqué remet à 1", () => {
    const p = player();
    const first = claimStreak(p, T0);
    expect(first.tokens).toBe(2);
    expect(p.casino?.tokens).toBe(2);
    expect(first.chest).toBeNull();
    for (let d = 1; d < 5; d++) claimStreak(p, T0 + d * DAY);
    const sixth = claimStreak(p, T0 + 5 * DAY);
    expect(sixth.amber).toBe(35);
    expect(p.bounties?.amber).toBe(35);
    // Coffre : tirage bas puis haut (bornes incluses).
    const scrap = p.resources.scrap;
    const seventh = claimStreak(p, T0 + 6 * DAY, () => 0);
    expect(seventh.count).toBe(7);
    expect(seventh.chest).toMatchObject({ amber: 50, tokens: 1 });
    // 6.14.72 (AU27, AE-3) : bornes [45 M, 280 M] → [2 M, 12 M].
    expect(seventh.chest?.resources.scrap).toBe(2_000_000);
    expect(p.resources.scrap).toBeGreaterThanOrEqual(scrap + 2_000_000);
    expect(p.bounties?.amber).toBe(35 + 50);
    expect(p.casino?.tokens).toBe(7 * 2 + 1);
    const top = rollStreakChest(() => 0.999999);
    expect(top).toMatchObject({ amber: 300, tokens: 25 });
    expect(top.resources.data).toBe(12_000_000);
    expect(claimStreak(p, T0 + 9 * DAY).count).toBe(1);
    expect(p.streak?.best).toBe(7);
  });
});
