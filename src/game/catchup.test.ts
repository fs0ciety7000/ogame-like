import { afterEach, describe, expect, it } from "vitest";
import { CATCHUP_RULES, catchupBonus, catchupFactorAt, computeCatchup, developmentScore, median, validateCatchupRules } from "@/game/catchup";
import { advanceResources } from "@/game/economy";
import { defaultPlayerState } from "@/game/defaults";
import type { PlayerState } from "@/types/game";
const createInitialPlayerState = (uid: string, pseudo: string) => defaultPlayerState(uid, pseudo) as PlayerState;
import { LOOT_TABLES, LOOT_TOKEN_RULES, lootTokensThisWeek, rollLoot, setLootTables } from "@/game/loot";

const saved = { ...CATCHUP_RULES };
afterEach(() => Object.assign(CATCHUP_RULES, saved));

describe("rattrapage de production (5.16)", () => {
  it("bonus plein, dégressif, puis nul selon la part de la médiane", () => {
    // 6.14.106 (AE-15) : +50 % sous 20 % de la médiane, dégressif jusqu'à 50 %.
    expect(catchupBonus(5, 100)).toBeCloseTo(0.5);
    expect(catchupBonus(20, 100)).toBeCloseTo(0.5);
    expect(catchupBonus(35, 100)).toBeCloseTo(0.25);
    expect(catchupBonus(50, 100)).toBe(0);
    expect(catchupBonus(80, 100)).toBe(0);
    expect(catchupBonus(5, 0)).toBe(0);
    expect(catchupBonus(5, 100, { ...CATCHUP_RULES, enabled: false })).toBe(0);
  });

  it("médiane des seuls joueurs actifs, et pas de bonus sous le nombre minimal", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    const now = Date.UTC(2026, 9, 5);
    const active = (uid: string, score: number) => ({ uid, score, lastActiveMs: now - 3600_000 });
    const players = [active("a", 100), active("b", 100), active("c", 100), active("d", 100), active("small", 5), { uid: "gone", score: 1, lastActiveMs: now - 30 * 86400_000 }];
    const res = computeCatchup(players, now);
    expect(res.median).toBe(100);
    expect(res.bonuses.small?.factor).toBe(1.5);
    expect(res.bonuses.a).toBeNull();
    expect(computeCatchup(players.slice(0, 3), now).median).toBe(0);
  });

  it("la production suit le bonus figé, puis revient à la normale à son expiration", () => {
    const p = createInitialPlayerState("x", "X");
    const start = Date.UTC(2026, 9, 5, 12);
    const base = advanceResources(p, 3600, start);
    const boosted = advanceResources({ ...p, bonuses: { ...p.bonuses, catchup: { factor: 1.2, untilMs: start + 3600_000, ratio: 0.1 } } }, 3600, start);
    const gainBase = base.scrap - (p.resources.scrap ?? 0);
    const gainBoost = boosted.scrap - (p.resources.scrap ?? 0);
    expect(gainBoost).toBeGreaterThan(gainBase * 1.15);
    expect(catchupFactorAt({ bonuses: { catchup: { factor: 1.2, untilMs: start, ratio: 0 } } }, start + 1)).toBe(1);
    expect(developmentScore({ buildings: { a: { level: 3 } } as never, techLevels: { t: 2 } as never })).toBe(5);
  });
});

describe("6.14.106 (AE-15) : rattrapage relevé, toujours borné", () => {
  it("défauts 0,5 / 0,2 ; un bonus figé ne dépasse jamais 1 + maxBonus ; validation au plus +100 %", () => {
    expect(CATCHUP_RULES.maxBonus).toBe(0.5);
    expect(CATCHUP_RULES.fullBelow).toBe(0.2);
    expect(catchupFactorAt({ bonuses: { catchup: { factor: 3, untilMs: Date.now() + 3600_000, ratio: 0 } } }, Date.now())).toBeLessThanOrEqual(1.5001);
    expect(validateCatchupRules({ maxBonus: 1.5 }).join(" ")).toMatch(/entre 0 et 1/);
    expect(validateCatchupRules({ maxBonus: 0.5, fullBelow: 0.2 })).toEqual([]);
    expect(validateCatchupRules({ fullBelow: 0.6 }).join(" ")).toMatch(/plein bonus/);
  });
});

describe("plafond hebdomadaire des jetons de combat (5.16)", () => {
  afterEach(() => setLootTables(undefined));
  it("les jetons de butin s'arrêtent au plafond de la semaine", () => {
    setLootTables({ pvp: { ...LOOT_TABLES.pvp, relicChance: 0, capsuleChance: 0, tokenChance: 1, tokenMin: 2, tokenMax: 2 } }, 5);
    expect(LOOT_TOKEN_RULES.weeklyCap).toBe(5);
    const p = createInitialPlayerState("x", "X");
    const now = Date.UTC(2026, 9, 7);
    const got = [0, 1, 2, 3].map(() => rollLoot(p, "pvp", now, -1, () => 0).tokens ?? 0);
    expect(got).toEqual([2, 2, 1, 0]);
    expect(lootTokensThisWeek(p, now)).toEqual({ used: 5, cap: 5, left: 0 });
    // Nouvelle semaine : le compteur repart.
    expect(lootTokensThisWeek(p, now + 7 * 86400_000).used).toBe(0);
    setLootTables(undefined, 0);
    expect(lootTokensThisWeek(p, now).left).toBeNull();
  });
});
