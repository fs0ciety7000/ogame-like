import { describe, expect, it } from "vitest";
import { ascend, ascensionShieldUntil, canAscend, upkeepFreeUntil } from "@/game/ascension";
import { BUILDINGS, keptOnAscension } from "@/game/buildings";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { advanceResources, economySnapshot } from "@/game/economy";
import { playerBuildTimeFactor } from "@/game/bonuses";
import { checkAttackAllowed } from "@/game/pvp";
import type { PlayerState } from "@/types/game";

const NOW = Date.UTC(2026, 9, 7, 12);
const DAY = 24 * 3600_000;

function maxed(): PlayerState {
  const p = { ...defaultPlayerState("u", "Ascète"), createdAt: null } as unknown as PlayerState;
  for (const b of BUILDINGS) p.buildings[b.id] = { level: b.maxLevel, unlocked: true };
  p.resources = { ...p.resources, scrap: 5e9, reinforcedSteel: 1e6 };
  p.techLevels = { tech1: 3 };
  p.units = { chasseur: { level: 2, count: 5000 } };
  p.xp = 9000;
  return p;
}

describe("ascension", () => {
  it("requires every building at its maximum level and no construction in progress", () => {
    const p = maxed();
    p.buildings[BUILDINGS[0].id].level -= 1;
    expect(canAscend(p, defaultQueues(), NOW)).toMatchObject({ ok: false, missing: [{ id: BUILDINGS[0].id }] });
    const q = { ...defaultQueues(), buildingUpgrades: { x: { endTime: NOW + 1 } } };
    expect(canAscend(maxed(), q, NOW).ok).toBe(false);
    expect(canAscend(maxed(), defaultQueues(), NOW).ok).toBe(true);
  });

  it("resets buildings and resources, keeps techs, fleet and xp, and grants the bonuses", () => {
    const p = maxed();
    const before = economySnapshot(p).gross.scrap ?? 0;
    ascend(p, defaultQueues(), NOW);
    expect(BUILDINGS.filter((b) => !keptOnAscension(b)).every((b) => p.buildings[b.id].level === 1 && p.buildings[b.id].unlocked)).toBe(true);
    // Bâtiments de fin de partie : conservés.
    expect(p.buildings.fonderie_quantique.level).toBe(10);
    // 5.27.2 (I4) : hangars conservés, la flotte garde sa place.
    expect(p.buildings.hangar_attaque.level).toBe(20);
    expect(p.buildings.hangar_defense.level).toBe(20);
    expect(p.resources.scrap).toBe(100);
    expect(p.resources.reinforcedSteel).toBe(0);
    expect(p.techLevels).toEqual({ tech1: 3 });
    expect(p.units.chasseur.count).toBe(5000);
    expect(p.xp).toBe(9000);
    expect(p.ascensions).toBe(1);
    expect(p.stats?.ascensions).toBe(1);
    const same = { ...p, ascensions: 0 };
    expect((economySnapshot(p).gross.scrap ?? 0) / (economySnapshot(same).gross.scrap ?? 1)).toBeCloseTo(1.1);
    expect(before).toBeGreaterThan(0);
    expect(playerBuildTimeFactor(p, NOW) / playerBuildTimeFactor(same, NOW)).toBeCloseTo(0.95);
  });

  it("enforces the cooldown and the maximum", () => {
    const p = maxed();
    ascend(p, defaultQueues(), NOW);
    for (const b of BUILDINGS) p.buildings[b.id].level = b.maxLevel;
    expect(canAscend(p, defaultQueues(), NOW + 6 * DAY).reason).toMatch(/jour/);
    expect(canAscend(p, defaultQueues(), NOW + 7 * DAY).ok).toBe(true);
    p.ascensions = 5;
    expect(canAscend(p, defaultQueues(), NOW + 30 * DAY).reason).toMatch(/maximum/);
  });

  it("suspends the fleet upkeep for 7 days and shields the base for 72 h", () => {
    const p = maxed();
    ascend(p, defaultQueues(), NOW);
    p.resources.energy = 0;
    expect(economySnapshot(p, NOW + DAY).upkeep).toBe(0);
    expect(economySnapshot(p, NOW + 8 * DAY).upkeep).toBeGreaterThan(0);
    expect(upkeepFreeUntil(p)).toBe(NOW + 7 * DAY);
    // Sans entretien, l'énergie monte ; après la suspension, la panne revient.
    const during = advanceResources(p, 3600, NOW + DAY);
    expect(during.energy).toBeGreaterThan(0);
    const after = advanceResources({ ...p, resources: { ...p.resources, energy: 0 } }, 3600, NOW + 8 * DAY);
    expect(after.energy).toBe(0);
    const ctx = { now: NOW + DAY, attackerUid: "a", attackerXp: 9000, defenderUid: "u", defenderXp: 9000, defenderCreatedAtMs: 0, defenderHasAttacked: true, lastAttackOnTargetMs: null, lastDefenderDefeatMs: null, defenderAscendedAtMs: p.ascendedAtMs };
    expect(checkAttackAllowed(ctx)).toMatchObject({ allowed: false, reason: "shield", until: ascensionShieldUntil(p) });
    expect(checkAttackAllowed({ ...ctx, now: NOW + 4 * DAY }).allowed).toBe(true);
  });
});
