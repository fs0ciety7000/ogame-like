import { describe, expect, it } from "vitest";
import { claimStreak, streakStatus } from "@/game/streak";
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

  it("le 7e jour donne de l'Ambre, et un jour manqué remet à 1", () => {
    const p = player();
    for (let d = 0; d < 6; d++) claimStreak(p, T0 + d * DAY);
    const seventh = claimStreak(p, T0 + 6 * DAY);
    expect(seventh.count).toBe(7);
    expect(seventh.amber).toBe(15);
    expect(p.bounties?.amber).toBe(15);
    expect(claimStreak(p, T0 + 9 * DAY).count).toBe(1);
    expect(p.streak?.best).toBe(7);
  });
});
