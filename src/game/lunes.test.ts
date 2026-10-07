import { describe, expect, it } from "vitest";
import { performAttack } from "@/game/attack";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { playerModifiers } from "@/game/modifiers";
import { addMoonPity, MOON_RULES, moonBirthChance, moonChance, moonEffects, moonLevel, moonPity, moonPityText, moonShield, moonUpgradeCost, playerMoon, rollMoon } from "@/game/moon";
import { applyGameContent } from "@/game/content";
import { performPlayerAction } from "@/game/actions";
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

  it("6.14.0 : amélioration, coût ×2 par niveau, bouclier +2 % par niveau, plafond de niveau", () => {
    expect(moonUpgradeCost(1)).toEqual({ scrap: 500_000, energy: 250_000 });
    expect(moonUpgradeCost(4)).toEqual({ scrap: 4_000_000, energy: 2_000_000 });
    expect(moonShield({})).toBeCloseTo(0.03);
    expect(moonShield({ level: 5 })).toBeCloseTo(0.11);
    expect(moonLevel({ level: 99 })).toBe(MOON_RULES.maxLevel);
    expect(MOON_RULES.shieldBonus + MOON_RULES.shieldPerLevel * (MOON_RULES.maxLevel - 1)).toBeLessThanOrEqual(0.15);

    const rich = { ...defaultPlayerState("x", "X").resources, scrap: 1e9, energy: 1e9 };
    const base = player("x", { moon: { name: "Io", bornAtMs: NOW - 1, fromDebris: 1 }, resources: rich });
    let p = base;
    for (let lvl = 2; lvl <= MOON_RULES.maxLevel; lvl++) {
      const out = performPlayerAction(p, defaultQueues(), { type: "moonUpgrade" }, NOW);
      p = out.player;
      expect(moonLevel(p.moon)).toBe(lvl);
    }
    expect(p.resources.scrap).toBeLessThan(1e9 - 7_000_000);
    expect(() => performPlayerAction(p, defaultQueues(), { type: "moonUpgrade" }, NOW)).toThrow(/maximal/);
    expect(moonEffects(p).find((e) => e.stat === "shield")?.value).toBeCloseTo(0.11);

    const poor = player("y", { moon: { name: "Io", bornAtMs: NOW - 1, fromDebris: 1 } });
    expect(() => performPlayerAction(poor, defaultQueues(), { type: "moonUpgrade" }, NOW)).toThrow(/insuffisantes/);
    expect(() => performPlayerAction(player("z"), defaultQueues(), { type: "moonUpgrade" }, NOW)).toThrow(/pas encore de lune/);
  });
});

describe("6.14.1 : Codex des lunes", () => {
  it("l'entrée des Légendes se débloque avec sa propre lune", async () => {
    const { codexEntries } = await import("@/game/codex");
    const without = codexEntries(player("c"), new Set(), NOW).find((e) => e.id === "legend:lune");
    expect(without?.unlocked).toBe(false);
    const withMoon = codexEntries(player("c", { moon: { name: "Nyx", bornAtMs: NOW - 1, fromDebris: 1, level: 2 } }), new Set(), NOW).find((e) => e.id === "legend:lune");
    expect(withMoon?.unlocked).toBe(true);
    expect(withMoon?.name).toBe("Lune Nyx");
  });
});

describe("6.14.3 : succès lunaires", () => {
  it("« Clair de lune » à la naissance, « Lune pleine » au niveau maximal (lu à l'usage)", async () => {
    const { ACHIEVEMENTS, checkNewAchievements } = await import("@/game/achievements");
    expect(ACHIEVEMENTS.map((a) => a.id)).toEqual(expect.arrayContaining(["lune_1", "lune_max"]));
    const ids = (p: PlayerState) => checkNewAchievements(p).map((a) => a.id);
    expect(ids(player("s"))).not.toContain("lune_1");
    const born = player("s", { moon: { name: "Io", bornAtMs: NOW - 1, fromDebris: 1 } });
    expect(ids(born)).toContain("lune_1");
    expect(ids(born)).not.toContain("lune_max");
    const full = player("s", { moon: { name: "Io", bornAtMs: NOW - 1, fromDebris: 1, level: MOON_RULES.maxLevel } });
    expect(ids(full)).toContain("lune_max");
    const saved = MOON_RULES.maxLevel;
    try {
      // Sans amélioration possible (niveau maximal 1), « Lune pleine » ne se donne pas d'office.
      MOON_RULES.maxLevel = 1;
      expect(ids(born)).not.toContain("lune_max");
    } finally {
      MOON_RULES.maxLevel = saved;
    }
  });
});

describe("6.14.44 : pitié lunaire (I21 modifié, Q36)", () => {
  it("+5 % par combat subi sur la planète mère sans lune ; garantie au 20e combat", () => {
    const d: Partial<PlayerState> = {};
    for (let i = 1; i <= 19; i++) addMoonPity(d, { onColony: false });
    expect(d.moonPity).toBeCloseTo(0.95);
    // Tirage le plus défavorable (rand juste sous 1) : rien au 19e combat, la lune au 20e.
    const worst = () => 0.999999;
    expect(rollMoon(d, 0, { now: NOW, onColony: false, rand: worst })).toBeNull();
    addMoonPity(d, { onColony: false });
    expect(d.moonPity).toBe(1);
    expect(moonBirthChance(d, 0)).toBe(1);
    expect(rollMoon(d, 0, { now: NOW, onColony: false, rand: worst })).not.toBeNull();
    addMoonPity(d, { onColony: false });
    expect(d.moonPity).toBe(1);
  });

  it("chance = min(1, moonChance(débris) + moonPity) ; moonChance reste sous maxChance", () => {
    expect(moonBirthChance({ moonPity: 0.3 }, 1_000_000)).toBeCloseTo(0.4);
    expect(moonBirthChance({ moonPity: 0.95 }, 50_000_000)).toBe(1);
    expect(moonChance(1e12)).toBeLessThanOrEqual(MOON_RULES.maxChance);
    expect(rollMoon({ moonPity: 0.3 }, 0, { now: NOW, onColony: false, rand: () => 0.29 })).not.toBeNull();
    expect(rollMoon({ moonPity: 0.3 }, 0, { now: NOW, onColony: false, rand: () => 0.31 })).toBeNull();
    expect(moonPityText({ moonPity: 0.3 })).toBe("Les débris s'accumulent en orbite : 35 % de chance de lune au prochain combat.");
  });

  it("jamais sur une colonie, pour un PNJ, ni avec une lune ; colonie et PNJ exclus du tirage même à 100 %", () => {
    const moon = { name: "Io", bornAtMs: NOW - 1, fromDebris: 1 };
    const col: Partial<PlayerState> = {};
    addMoonPity(col, { onColony: true });
    expect(col.moonPity).toBeUndefined();
    const npc = { npc: "brannoc" } as Partial<PlayerState>;
    addMoonPity(npc, { onColony: false });
    expect(npc.moonPity).toBeUndefined();
    const owner: Partial<PlayerState> = { moon };
    addMoonPity(owner, { onColony: false });
    expect(owner.moonPity).toBeUndefined();
    expect(rollMoon({ moonPity: 1 }, 0, { now: NOW, onColony: true, rand: () => 0 })).toBeNull();
    expect(rollMoon({ moonPity: 1, npc: "brannoc" } as never, 0, { now: NOW, onColony: false, rand: () => 0 })).toBeNull();
  });

  it("pityPerDefense = 0 : rien ne s'ajoute, la réserve en base reste sans effet", () => {
    applyGameContent({ rules: { moon: { pityPerDefense: 0 } } } as never);
    try {
      const d: Partial<PlayerState> = { moonPity: 0.8 };
      addMoonPity(d, { onColony: false });
      expect(d.moonPity).toBe(0.8);
      expect(moonPity(d)).toBe(0);
      expect(moonBirthChance(d, 0)).toBe(0);
      expect(moonPityText(d)).toBeNull();
    } finally {
      applyGameContent({});
    }
    expect(MOON_RULES.pityPerDefense).toBe(0.05);
  });

  it("au combat : un petit pillage remplit la réserve ; la naissance la remet à 0", () => {
    const attack = (moonPity: number) => {
      const attacker = player("att", { units: { ...defaultPlayerState("att", "ATT").units, fregate: { level: 1, count: 5 } } });
      const defender = player("def", { moonPity });
      const out = performAttack({
        now: NOW,
        attackerUid: "att",
        attacker,
        attackerQueues: defaultQueues(),
        defenderUid: "def",
        defender,
        defenderQueues: defaultQueues(),
        fleet: { fregate: 5 },
        lastAttackOnTargetMs: null,
        defenderXpLostLast24h: 0,
        inFlight: true,
        rand: () => 0.999999,
      });
      if (!out.ok) throw new Error(out.message);
      expect(out.debris.scrap + out.debris.energy).toBeLessThan(MOON_RULES.debrisPerPercent);
      return out.defender;
    };
    const first = attack(0);
    expect(first.moonPity).toBeCloseTo(0.05);
    expect(playerMoon(first)).toBeNull();
    const twentieth = attack(0.95);
    expect(playerMoon(twentieth)).not.toBeNull();
    expect(twentieth.moonPity).toBe(0);
  });
});
