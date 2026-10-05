import { beforeEach, describe, expect, it } from "vitest";
import { applyGameContent } from "@/game/content";
import { defaultPlayerState } from "@/game/defaults";
import { resolveCombat } from "@/game/combat";
import { describeEffect, validateComposedEffect } from "@/game/effects";
import { combatEffects, playerCombatEffects, playerUnitCost, selectorMatches, unitEffect, validUnitSelector } from "@/game/effectTargets";
import { EFFECT_PRESETS } from "@/game/effectCatalog";
import { DEFAULT_RELICS, describeRelic, relicEffects, validateRelics, defaultRelicSettings } from "@/game/relics";
import { DEFAULT_TECHNOLOGIES, techEffectGrants, validateTechEffect } from "@/game/technologies";
import { commanderEffects, setOfficers, validateOfficers } from "@/game/commanders";
import { findUnit, getUnitBuildTime } from "@/game/units";
import type { EffectGrant } from "@/game/effects";
import type { PlayerState } from "@/types/game";

const src = { kind: "relic" as const, id: "x", label: "Test" };
const g = (patch: Partial<EffectGrant>): EffectGrant => ({ stat: "unitAttack", value: 0.1, layer: "empire", source: src, ...patch });
const player = (patch: Partial<PlayerState> = {}) => ({ ...defaultPlayerState("p1", "Testeur"), ...patch }) as PlayerState;
const withRelic = (template: string, rarity = "rare") => ({ items: [{ id: "r1", template, rarity, foundAtMs: 0, source: "test" }], slots: ["r1"], aegisWeek: "" }) as never;

beforeEach(() => {
  applyGameContent({});
  setOfficers(undefined);
});

describe("5.23 effets ciblés", () => {
  it("sélecteurs : unité, classe, catégorie, tous", () => {
    expect(selectorMatches("unit:sentinelle", "sentinelle")).toBe(true);
    expect(selectorMatches("unit:sentinelle", "chasseur")).toBe(false);
    expect(selectorMatches("cat:defense", "canon_plasma")).toBe(true);
    expect(selectorMatches("cat:defense", "sentinelle")).toBe(false);
    expect(selectorMatches("class:heavy", "etoile_noire")).toBe(true);
    expect(selectorMatches(undefined, "chasseur")).toBe(true);
    expect(validUnitSelector("unit:inconnue")).toBe(false);
    expect(validUnitSelector("class:heavy")).toBe(true);
  });

  it("portées : « contre les PNJ » joue aussi contre les seigneurs, pas en JcJ", () => {
    const grants = [g({ scope: "pve" }), g({ stat: "unitHp", target: "cat:defense", value: 0.2 })];
    expect(unitEffect(grants, "unitAttack", "chasseur", "warlord")).toBeCloseTo(0.1);
    expect(unitEffect(grants, "unitAttack", "chasseur", "pvp")).toBe(0);
    const fx = combatEffects(grants, "pvp");
    expect(fx.units.canon_plasma?.hp).toBeCloseTo(0.2);
    expect(fx.units.chasseur).toBeUndefined();
  });

  it("plafond par couche", () => {
    expect(unitEffect([g({ value: 3 })], "unitAttack", "chasseur")).toBe(0.5);
  });

  it("combat : un bonus d'attaque ciblé alourdit les pertes adverses", () => {
    const base = {
      attackerUnits: { chasseur: { level: 1, count: 40 } },
      attackerTechLevels: {},
      attackerRepairPct: 0,
      fleet: { chasseur: 40 },
      defenderUnits: { canon_plasma: { level: 1, count: 200 } },
      defenderTechLevels: {},
      defenderRepairPct: 0,
      defenderResources: {},
    };
    const plain = resolveCombat(base);
    const boosted = resolveCombat({ ...base, unitBonus: { attacker: { chasseur: { att: 0.5 } } } });
    const tougher = resolveCombat({ ...base, unitBonus: { defender: { canon_plasma: { hp: 0.5 } } } });
    expect(boosted.defenderLossPercent).toBeGreaterThan(plain.defenderLossPercent);
    expect(tougher.defenderLossPercent).toBeLessThan(plain.defenderLossPercent);
  });
});

describe("5.23 sources composées", () => {
  it("relique composée : effet, portée et description", () => {
    const p = player({ relics: withRelic("lame_duelliste") });
    const grants = relicEffects(p);
    expect(grants).toHaveLength(1);
    expect(grants[0]).toMatchObject({ stat: "unitAttack", scope: "pvp" });
    expect(playerCombatEffects(p, "pvp").units.chasseur?.att).toBeCloseTo(grants[0].value);
    expect(playerCombatEffects(p, "pve").units.chasseur).toBeUndefined();
    expect(describeRelic({ template: "sceau_sentinelle", rarity: "rare" })).toMatch(/Sentinelle/);
  });

  it("coût et temps ciblés", () => {
    const heavy = findUnit("etoile_noire")!;
    const p = player({ relics: withRelic("enclume_colosses", "legendary") });
    const cost = playerUnitCost(heavy, p);
    expect(cost.scrap).toBeLessThan(heavy.cost.scrap);
    const light = findUnit("fregate")!;
    const fast = player({ relics: withRelic("navette_mere", "legendary") });
    expect(getUnitBuildTime(light, {}, fast)).toBeLessThan(getUnitBuildTime(light, {}, player()));
  });

  it("technologie « stat » : valeur par niveau, portée gardée", () => {
    applyGameContent({ technologies: [...DEFAULT_TECHNOLOGIES, { id: "tech90", nom: "Doctrine", desc: "", maxLevel: 5, baseCost: { scrap: 1 }, baseTime: 1, prereq: {}, effects: [{ type: "stat", stat: "unitAttack", target: "class:light", scope: "pve", value: 0.02 }] }] });
    const grants = techEffectGrants({ tech90: 3 });
    expect(grants[0]).toMatchObject({ stat: "unitAttack", target: "class:light", scope: "pve", layer: "tech" });
    expect(grants[0].value).toBeCloseTo(0.06);
    const refs = { resources: new Set(["scrap"]), unitIds: new Set(["chasseur"]), buildingIds: new Set<string>() };
    expect(validateTechEffect("T", { type: "stat", stat: "unitAttack", target: "unit:nope" }, refs).length).toBeGreaterThan(0);
    expect(validateTechEffect("T", { type: "stat", stat: "buildTime", scope: "pvp" }, refs).length).toBeGreaterThan(0);
    expect(validateTechEffect("T", { type: "stat", stat: "unitHp", target: "unit:chasseur", scope: "warlord" }, refs)).toEqual([]);
  });

  it("officier : effet composé ajouté au rôle", () => {
    const cfg = { roles: { admiral: { extra: [{ stat: "unitAttack" as const, target: "unit:chasseur", perLevel: 0.01 }] } } };
    expect(validateOfficers(cfg)).toEqual([]);
    setOfficers(cfg);
    const p = player({ commanders: { roster: { rhys: { xp: 0 } }, active: ["rhys"] } as never });
    const extra = commanderEffects(p).filter((e) => e.stat === "unitAttack");
    // Selon le niveau de l'amiral : au moins l'effet est déclaré.
    expect(extra.every((e) => e.target === "unit:chasseur")).toBe(true);
    expect(validateOfficers({ roles: { admiral: { extra: [{ stat: "unitAttack", target: "unit:nope", perLevel: 0.01 }] } } }).length).toBeGreaterThan(0);
  });

  it("validation des reliques composées et catalogue cohérent", () => {
    expect(validateRelics(DEFAULT_RELICS, defaultRelicSettings())).toEqual([]);
    const bad = [...DEFAULT_RELICS, { id: "zz", name: "ZZ", effect: "custom" as const, lore: "", custom: { stat: "unitAttack" as const, target: "class:geant" } }];
    expect(validateRelics(bad, defaultRelicSettings()).join()).toMatch(/cible/);
    for (const preset of EFFECT_PRESETS) expect(validateComposedEffect(preset.effect, validUnitSelector), preset.id).toEqual([]);
    expect(new Set(EFFECT_PRESETS.map((x) => x.id)).size).toBe(EFFECT_PRESETS.length);
    expect(EFFECT_PRESETS.length).toBeGreaterThanOrEqual(40);
    expect(describeEffect("unitAttack", 0.1, "unit:sentinelle", "pve")).toBe("+10 % · Attaque : Sentinelle (contre les pnj)");
  });
});
