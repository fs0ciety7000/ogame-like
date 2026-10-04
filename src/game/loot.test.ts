import { afterEach, describe, expect, it } from "vitest";
import { defaultLootTables, describeLoot, LOOT_SOURCES, LOOT_TABLES, lootDifficulty, rollLoot, setLootTables, validateLootTables } from "@/game/loot";
import { applyGameContent, currentGameContent, validateGameContent } from "@/game/content";
import { relicsState, RELIC_RULES, rollRelic, addRelic } from "@/game/relics";
import { synthesisState, SYNTH_RULES } from "@/game/synthesis";
import { defaultPlayerState } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

const player = () => ({ ...defaultPlayerState("u", "u") }) as PlayerState;
/** Suite de tirages fixée (relique ?, rareté…, capsule ?, type, niveau). */
const seq = (xs: number[]) => {
  let i = 0;
  return () => xs[i++ % xs.length];
};

afterEach(() => applyGameContent({}));

describe("v5.14 tables de butin", () => {
  it("le combat entre joueurs reste le plus avare, les boss les plus généreux", () => {
    const t = defaultLootTables();
    for (const src of LOOT_SOURCES) expect(t.pvp.relicChance).toBeLessThanOrEqual(t[src].relicChance);
    expect(t.worldBoss.relicChance).toBeGreaterThan(t.expedition.relicChance);
    expect(validateLootTables(t)).toEqual([]);
  });

  it("tirage réussi : relique et capsule ajoutées au joueur", () => {
    const p = player();
    const drop = rollLoot(p, "worldBoss", 0, 0, () => 0);
    expect(drop.relic).toBeTruthy();
    expect(drop.capsule?.level).toBe(LOOT_TABLES.worldBoss.capsuleMin);
    expect(relicsState(p).items).toHaveLength(1);
    expect(synthesisState(p).stock[drop.capsule!.type]).toEqual([drop.capsule!.level]);
    expect(describeLoot(drop)).toContain("Capsule");
  });

  it("raté : rien ; podium : chances multipliées", () => {
    const p = player();
    expect(rollLoot(p, "worldBoss", 0, 5, () => 0.99)).toEqual({});
    // 0,3 : au-dessus de 25 % hors podium, sous 25 % × 1,6 sur le podium.
    expect(rollLoot(p, "worldBoss", 0, 9, seq([0.3, 0.99])).relic).toBeUndefined();
    expect(rollLoot(p, "worldBoss", 0, 1, seq([0.3, 0.5, 0.5, 0.99])).relic).toBeTruthy();
  });

  it("inventaire plein, réserve pleine : rien de ce côté", () => {
    const p = player();
    for (let i = 0; i < RELIC_RULES.maxItems; i++) addRelic(p, rollRelic("t", i, () => 0.5));
    const st = synthesisState(p);
    for (const k of Object.keys(st.stock) as (keyof typeof st.stock)[]) st.stock[k] = Array(SYNTH_RULES.maxStock).fill(1);
    p.synthesis = st as PlayerState["synthesis"];
    // 5.15 : les jetons du casino tombent quand même (pas de limite d'inventaire de ce côté).
    const drop = rollLoot(p, "worldBoss", 0, 0, () => 0);
    expect(drop.relic).toBeUndefined();
    expect(drop.capsule).toBeUndefined();
    expect(drop.tokens).toBe(1);
  });

  it("5.15 jetons du casino : chance × difficulté (bornée 0,5 à 2)", () => {
    expect(lootDifficulty(300, 100)).toBe(2);
    expect(lootDifficulty(10, 100)).toBe(0.5);
    expect(lootDifficulty(0, 100)).toBe(1);
    const chance = defaultLootTables().pvp.tokenChance!;
    // Tirage juste au-dessus de la chance de base : raté à difficulté 1, gagné à difficulté 2.
    const at = (v: number) => () => v;
    expect(rollLoot(player(), "pvp", 0, -1, at(chance + 0.01), 1).tokens).toBeUndefined();
    const hard = player();
    expect(rollLoot(hard, "pvp", 0, -1, at(chance + 0.01), 2).tokens).toBe(1);
    expect(hard.casino?.tokens).toBe(1);
    expect(describeLoot({ tokens: 2 })).toMatch(/2 jetons du casino/);
  });

  it("réglable dans l'administration (réglages des reliques), et validé", () => {
    applyGameContent({ relicSettings: { ...currentGameContent().relicSettings, loot: { pvp: { relicChance: 0.5 } } } });
    expect(LOOT_TABLES.pvp.relicChance).toBe(0.5);
    expect(LOOT_TABLES.pvp.capsuleChance).toBe(defaultLootTables().pvp.capsuleChance);
    expect(validateGameContent(currentGameContent())).toEqual([]);
    expect(validateLootTables({ pvp: { relicChance: 2 } }).join()).toMatch(/entre 0 et 1/);
    expect(validateLootTables({ threat: { capsuleMin: 5, capsuleMax: 2 } }).join()).toMatch(/niveaux/);
    setLootTables(undefined);
    expect(LOOT_TABLES.pvp.relicChance).toBe(defaultLootTables().pvp.relicChance);
  });
});
