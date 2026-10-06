import { describe, expect, it } from "vitest";
import { addModuleItem, buildModule, MODULE_BUILD_COST, MODULE_RULES, moduleEffects, modulesState, mountModule, recycleModule, rollModulePlan, takeModulePlan, unmountModule, type ModuleItem } from "@/game/modules";
import { empireEffects } from "@/game/modifiers";
import { effectTotal } from "@/game/effects";
import { rollLoot, setLootTables, defaultLootTables } from "@/game/loot";
import { performPlayerAction } from "@/game/actions";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

const NOW = 1_800_000_000_000;
const player = (patch: Partial<PlayerState> = {}): PlayerState => ({ ...defaultPlayerState("a", "A"), createdAtMs: NOW - 1000, resourcesUpdatedAtMs: NOW, ...patch }) as PlayerState;
const plan = (template: string, rarity: ModuleItem["rarity"] = "rare", built = false, id = `${template}-${rarity}`): ModuleItem => ({ id, template, rarity, built, foundAtMs: NOW, source: "test" });
const noPay = () => undefined;

describe("modules de vaisseaux", () => {
  it("tire un plan au moins de la rareté demandée", () => {
    for (let i = 0; i < 50; i++) {
      const p = rollModulePlan("x", NOW, Math.random, "rare");
      expect(p.rarity).not.toBe("common");
      expect(p.built).toBe(false);
    }
  });

  it("fabrique, monte puis donne l'effet ciblé sur la classe", () => {
    const p = player();
    addModuleItem(p, plan("canons_surcharges", "epic"));
    expect(moduleEffects(p)).toHaveLength(0);
    expect(() => mountModule(p, "canons_surcharges-epic", "medium", 0)).toThrow(/Fabrique/);
    buildModule(p, "canons_surcharges-epic", noPay);
    mountModule(p, "canons_surcharges-epic", "medium", 0);
    const fx = moduleEffects(p);
    expect(fx).toEqual([expect.objectContaining({ stat: "unitAttack", target: "class:medium", value: 0.11, layer: "empire" })]);
    expect(effectTotal(empireEffects(p, NOW), "empire", "unitAttack", { target: "class:medium" })).toBeCloseTo(0.11);
  });

  it("refuse une famille sur une classe interdite et un emplacement invalide", () => {
    const p = player();
    addModuleItem(p, plan("soute_modulaire", "common", true));
    expect(() => mountModule(p, "soute_modulaire-common", "heavy", 0)).toThrow(/Soutien/);
    expect(() => mountModule(p, "soute_modulaire-common", "support", 5)).toThrow(/Emplacement/);
    mountModule(p, "soute_modulaire-common", "support", 1);
    expect(modulesState(p).slots.support).toEqual([null, "soute_modulaire-common"]);
  });

  it("un module remonté ailleurs quitte son ancien emplacement", () => {
    const p = player();
    addModuleItem(p, plan("blindage_reactif", "rare", true));
    mountModule(p, "blindage_reactif-rare", "light", 0);
    mountModule(p, "blindage_reactif-rare", "heavy", 1);
    const st = modulesState(p);
    expect(st.slots.light).toEqual([null, null]);
    expect(st.slots.heavy).toEqual([null, "blindage_reactif-rare"]);
    unmountModule(p, "heavy", 1);
    expect(moduleEffects(p)).toHaveLength(0);
  });

  it("recycle (double pour un module fabriqué) et démonte", () => {
    const p = player();
    addModuleItem(p, plan("post_combustion", "legendary", true));
    mountModule(p, "post_combustion-legendary", "support", 0);
    expect(recycleModule(p, "post_combustion-legendary")).toBe(40);
    expect(modulesState(p).items).toHaveLength(0);
    expect(modulesState(p).slots.support).toEqual([null, null]);
  });

  it("seuls les plans se retirent pour les enchères", () => {
    const p = player();
    addModuleItem(p, plan("voile_furtif", "rare", true, "a"));
    addModuleItem(p, plan("voile_furtif", "rare", false, "b"));
    expect(() => takeModulePlan(p, "a")).toThrow(/plans/);
    expect(takeModulePlan(p, "b").id).toBe("b");
  });

  it("inventaire plein : plus de plan ajouté", () => {
    const p = player();
    for (let i = 0; i < MODULE_RULES.maxItems; i++) expect(addModuleItem(p, plan("matrice_de_visee", "common", false, `m${i}`))).toBe(true);
    expect(addModuleItem(p, plan("matrice_de_visee", "common", false, "extra"))).toBe(false);
  });

  it("ignore les données corrompues", () => {
    const p = player({ modules: { items: [{ id: "x", template: "inconnu" }], slots: { light: ["x", "y", "z"] } } as never });
    const st = modulesState(p);
    expect(st.items).toHaveLength(0);
    expect(st.slots.light).toEqual([null, null]);
  });

  it("le butin peut donner un plan", () => {
    setLootTables({ threat: { relicChance: 0, capsuleChance: 0, tokenChance: 0, moduleChance: 1 } });
    const p = player();
    const drop = rollLoot(p, "threat", NOW);
    expect(drop.module).toBeTruthy();
    expect(modulesState(p).items).toHaveLength(1);
    setLootTables(defaultLootTables());
  });

  it("action de jeu : fabrication payée en ressources", () => {
    const p = player();
    for (const [r, n] of Object.entries(MODULE_BUILD_COST.common)) p.resources[r as keyof typeof p.resources] = n! + 10;
    addModuleItem(p, plan("matrice_de_visee", "common"));
    const out = performPlayerAction(p, defaultQueues(), { type: "moduleBuild", moduleId: "matrice_de_visee-common" }, NOW);
    expect(modulesState(out.player).items[0].built).toBe(true);
    expect(Math.floor(out.player.resources.scrap)).toBeLessThan(MODULE_BUILD_COST.common.scrap!);
  });
});
