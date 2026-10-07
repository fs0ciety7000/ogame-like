import { describe, expect, it } from "vitest";
import { performAttack } from "@/game/attack";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { playerModifiers } from "@/game/modifiers";
import { MOON_RULES, moonChance, moonEffects, playerMoon, rollMoon } from "@/game/moon";
import type { PlayerState } from "@/types/game";

/* 6.13.0 (proposals/lunes.md) : invariant I21. */

const NOW = 1_800_000_000_000;
const player = (uid: string, patch: Partial<PlayerState> = {}): PlayerState =>
  ({ ...defaultPlayerState(uid, uid.toUpperCase()), createdAtMs: NOW - 30 * 864e5, resourcesUpdatedAtMs: NOW, xp: 5000, ...patch }) as PlayerState;

describe("lunes (I21)", () => {
  it("chance : 1 % par 100 000 de débris, 20 % au plus, rien sous le seuil", () => {
    expect(moonChance(99_999)).toBe(0);
    expect(moonChance(100_000)).toBeCloseTo(0.01);
    expect(moonChance(1_550_000)).toBeCloseTo(0.15);
    expect(moonChance(50_000_000)).toBeCloseTo(MOON_RULES.maxChance);
  });

  it("jamais sur une colonie, pour un PNJ ou un joueur qui a déjà une lune", () => {
    const always = () => 0;
    expect(rollMoon({}, 5_000_000, { now: NOW, onColony: false, rand: always })).not.toBeNull();
    expect(rollMoon({}, 5_000_000, { now: NOW, onColony: true, rand: always })).toBeNull();
    expect(rollMoon({ npc: "brannoc" } as never, 5_000_000, { now: NOW, onColony: false, rand: always })).toBeNull();
    const moon = { name: "Io", bornAtMs: NOW - 1, fromDebris: 1 };
    expect(rollMoon({ moon }, 5_000_000, { now: NOW, onColony: false, rand: always })).toBeNull();
    expect(rollMoon({}, 5_000_000, { now: NOW, onColony: false, rand: () => 0.99 })).toBeNull();
  });

  it("ses effets passent par la couche empire", () => {
    const moon = { name: "Io", bornAtMs: NOW - 1, fromDebris: 1 };
    expect(moonEffects({})).toEqual([]);
    expect(moonEffects({ moon }).map((e) => [e.stat, e.layer, e.source.kind])).toEqual([
      ["shield", "empire", "moon"],
      ["protectedStorage", "empire", "moon"],
    ]);
    expect(playerModifiers(player("x", { moon })).protectedStorage).toBeCloseTo(MOON_RULES.protectedStorageBonus);
  });

  it("un gros combat sur la planète mère fait naître la lune du défenseur", () => {
    const attacker = player("att", { units: { ...defaultPlayerState("att", "ATT").units, fregate: { level: 1, count: 800 } } });
    const defender = player("def", { units: { ...defaultPlayerState("def", "DEF").units, fregate: { level: 1, count: 800 } } });
    const out = performAttack({
      now: NOW,
      attackerUid: "att",
      attacker,
      attackerQueues: defaultQueues(),
      defenderUid: "def",
      defender,
      defenderQueues: defaultQueues(),
      fleet: { fregate: 800 },
      lastAttackOnTargetMs: null,
      defenderXpLostLast24h: 0,
      inFlight: true,
      rand: () => 0,
    });
    if (!out.ok) throw new Error(out.message);
    const total = out.debris.scrap + out.debris.energy;
    expect(total).toBeGreaterThanOrEqual(MOON_RULES.debrisPerPercent);
    expect(playerMoon(out.defender)?.fromDebris).toBe(total);
    expect(playerMoon(out.attacker)).toBeNull();
    expect(out.defenderNotifications.some((n) => /lune est née/.test(n.title))).toBe(true);
  });
});
