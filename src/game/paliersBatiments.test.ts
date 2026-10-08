import { describe, expect, it, afterEach } from "vitest";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { BUILDINGS, findBuilding, getStorageCapacity } from "@/game/buildings";
import {
  BUILDING_TIER_RULES,
  buildingTierView,
  choiceCooldownLeftMs,
  exchangeTaxCut,
  familyTierLevels,
  familyTiers,
  setBuildingChoice,
  shelterExtraHours,
  storageBufferHours,
  tierReached,
  validateBuildingTierRules,
} from "@/game/buildingTiers";
import { buildSlots } from "@/game/buildPlan";
import { advanceEconomy, advanceResources, ECONOMY_RULES, hourlyProduction, protectedAmount, capacityProtected, storageCapacityOf } from "@/game/economy";
import { flushState } from "@/game/flush";
import { playerCargoCapacity, playerEffectSheet, playerModifiers } from "@/game/modifiers";
import { tradeQuote, EXCHANGE_RULES } from "@/game/resources";
import { performPlayerAction } from "@/game/actions";
import { freeRushWorkshop, sendToWorkshop, workshopFreeRushLeft, workshopRate, workshopState, workshopUnits, dockReady, advanceWorkshop, workshopRushCost } from "@/game/workshop";
import { unitClasses } from "@/game/unitClasses";
import { REGISTERED_RULES } from "@/game/ruleRegistry";
import { validateRules } from "@/game/content";
import { effectImpactReport } from "@/game/impact";
import { GAME_FIELDS } from "@/game/playerFields";
import type { PlayerState, ResourceId } from "@/types/game";
import { readFileSync } from "node:fs";

/* 6.14.142 à 6.14.144 (PB-L1 à PB-L3, docs/proposals/paliers-batiments.md) : paliers des bâtiments de système.
   Invariant I46 (GDD §4) : un effet de palier vient du niveau effectif et du choix du joueur, passe par le circuit d'effets
   ou un lecteur de buildingTiers.ts, reste sous les plafonds ; un choix change au plus une fois par `choiceCooldownHours` ;
   aucun changement de choix ni de réglage ne détruit d'unité ni de ressource. */

const NOW = Date.UTC(2026, 10, 10, 12);
const HOUR = 3600_000;
const SAVED = structuredClone(BUILDING_TIER_RULES);

afterEach(() => {
  Object.assign(BUILDING_TIER_RULES, structuredClone(SAVED));
});

function player(levels: Record<string, number> = {}): PlayerState {
  const p = defaultPlayerState("u1", "Bâtisseur") as PlayerState;
  for (const [id, level] of Object.entries(levels)) p.buildings[id] = { level, unlocked: true };
  p.resourcesUpdatedAtMs = NOW;
  return p;
}

describe("PB-L1 (6.14.142) : moteur commun des paliers", () => {
  it("groupe `buildingTiers` du registre : défauts 5, 10, 15, 20 et validation des niveaux", () => {
    expect(REGISTERED_RULES.buildingTiers.target()).toBe(BUILDING_TIER_RULES);
    expect(BUILDING_TIER_RULES.storageLevels).toEqual([5, 10, 15, 20]);
    expect(BUILDING_TIER_RULES.repairLevels).toEqual([5, 10, 15, 20]);
    expect(BUILDING_TIER_RULES.foundrySlotLevels).toEqual([5, 10]);
    expect(validateBuildingTierRules(BUILDING_TIER_RULES)).toEqual([]);
    expect(validateBuildingTierRules({ storageLevels: [5, 5, 15, 20] })).toHaveLength(1);
    expect(validateBuildingTierRules({ repairLevels: [5, 10, 15] })).toHaveLength(1);
    expect(validateRules({ buildingTiers: { storageLevels: [10, 5, 15, 20] } } as never).join(" ")).toMatch(/Entrepôt/);
    expect(validateRules({ buildingTiers: { choiceCooldownHours: 2000 } } as never).length).toBeGreaterThan(0);
    expect(validateRules({ buildingTiers: { storageLevels: [4, 8, 12, 16] } } as never)).toEqual([]);
  });

  it("palier atteint au niveau effectif : un bâtiment verrouillé n'en a aucun", () => {
    const p = player({ entrepot: 20 });
    expect(tierReached(p.buildings, "storage", 3)).toBe(true);
    p.buildings.entrepot = { level: 20, unlocked: false };
    expect(tierReached(p.buildings, "storage", 0)).toBe(false);
    expect(shelterExtraHours(p, "scrap")).toBe(0);
  });

  it("niveaux réglables : un palier déplacé dans l'admin suit sans autre code", () => {
    const p = player({ entrepot: 8 });
    expect(storageBufferHours(p.buildings)).toBe(0);
    BUILDING_TIER_RULES.storageLevels = [4, 8, 12, 16];
    expect(storageBufferHours(p.buildings)).toBe(BUILDING_TIER_RULES.storageBufferHours);
  });

  it("Atelier 5 = Cale sèche, affichée comme palier (niveau requis par la Cale)", () => {
    const dock = BUILDINGS.find((b) => b.effect?.type === "dock")!;
    expect(familyTierLevels("repair")[0]).toBe(dock.requires!.level);
    expect(familyTiers("repair")[0].name).toBe("Cale sèche");
    const view = buildingTierView(findBuilding("atelier_reparation")!, player({ atelier_reparation: 5 }))!;
    expect(view.tiers[0].reached).toBe(true);
    expect(view.next?.level).toBe(10);
  });

  it("Fonderie quantique : chantiers en plus lus dans la règle (ancien BUILD_SLOT_BONUS_LEVELS)", () => {
    const p = player({ fonderie_quantique: 5 });
    const base = buildSlots(player());
    expect(buildSlots(p)).toBe(base + 1);
    BUILDING_TIER_RULES.foundrySlotLevels = [3, 5, 7];
    expect(buildSlots(p)).toBe(base + 2);
  });

  it("bâtiment de courbe : aucun palier d'effet (jalons seulement)", () => {
    const p = player({ extracteur_ferraille: 20 });
    expect(buildingTierView(findBuilding("extracteur_ferraille")!, p)).toBeNull();
    expect(buildingTierView(findBuilding("generateur_bouclier")!, p)).toBeNull();
  });

  it("choix : palier requis, premier choix libre, un changement par 24 h, option connue", () => {
    const p = player({ entrepot: 4 });
    expect(() => setBuildingChoice(p, "storage.priority", "nano", NOW)).toThrow(/niveau 5/);
    p.buildings.entrepot.level = 5;
    expect(() => setBuildingChoice(p, "storage.nope", "nano", NOW)).toThrow(/inconnu/);
    expect(() => setBuildingChoice(p, "storage.priority", "aiFragment", NOW)).toThrow(/Option inconnue/);
    // Les choix commencent vides : aucun effet imposé.
    expect(p.buildingChoices).toBeUndefined();
    expect(shelterExtraHours(p, "nano")).toBe(0);
    setBuildingChoice(p, "storage.priority", "nano", NOW);
    expect(p.buildingChoices?.["storage.priority"]).toEqual({ v: "nano", at: NOW });
    expect(() => setBuildingChoice(p, "storage.priority", "nano", NOW + HOUR)).toThrow(/déjà/);
    expect(() => setBuildingChoice(p, "storage.priority", "scrap", NOW + HOUR)).toThrow(/dans 23 h/);
    expect(choiceCooldownLeftMs(p, "storage.priority", NOW + HOUR)).toBe(23 * HOUR);
    setBuildingChoice(p, "storage.priority", "scrap", NOW + 24 * HOUR);
    expect(p.buildingChoices?.["storage.priority"]?.v).toBe("scrap");
    // Un autre emplacement a son propre délai (premier choix libre).
    p.buildings.entrepot.level = 15;
    setBuildingChoice(p, "storage.spec", "trade", NOW + 24 * HOUR + 1);
  });

  it("action serveur `buildingChoice` : enregistrée dans un champ sauvé (GAME_FIELDS), schéma PocketBase à jour", () => {
    const p = player({ entrepot: 5 });
    const out = performPlayerAction(p, defaultQueues(), { type: "buildingChoice", slot: "storage.priority", value: "data" }, NOW);
    expect(out.player.buildingChoices?.["storage.priority"]?.v).toBe("data");
    expect(GAME_FIELDS).toContain("buildingChoices");
    expect(GAME_FIELDS).toContain("storageBuffer");
    const schema = readFileSync("pocketbase/pb_schema.json", "utf8");
    expect(schema).toMatch(/"name": "buildingChoices"/);
    expect(schema).toMatch(/"name": "storageBuffer"/);
  });

  it("source « bâtiment » du circuit d'effets (Convoi), sous les plafonds, dans la fiche et le rapport d'impact", () => {
    const p = player({ entrepot: 15 });
    expect(playerModifiers(p).cargo).toBe(0);
    setBuildingChoice(p, "storage.spec", "convoy", NOW);
    expect(playerModifiers(p).cargo).toBeCloseTo(BUILDING_TIER_RULES.storageConvoyCargo, 9);
    const line = playerEffectSheet(p).find((l) => l.stat === "cargo")!;
    expect(line.sources.some((s) => s.source.kind === "building")).toBe(true);
    const row = effectImpactReport().find((r) => r.stat === "cargo" && r.layer === "empire")!;
    expect(row.sources.some((s) => s.kind === "building")).toBe(true);
    expect(row.capped).toBe(false);
    p.units = { cargo: { level: 1, count: 10 } } as never;
    const fleet = { cargo: 10 };
    const without = playerCargoCapacity({ ...p, buildingChoices: null }, fleet);
    expect(without).toBeGreaterThan(0);
    expect(playerCargoCapacity(p, fleet)).toBe(Math.floor(without * (1 + BUILDING_TIER_RULES.storageConvoyCargo)));
    // Palier perdu (Ascension) : le choix reste enregistré mais n'agit plus.
    p.buildings.entrepot.level = 1;
    expect(playerModifiers(p).cargo).toBe(0);
  });
});

describe("PB-L2 (6.14.143) : paliers de l'entrepôt", () => {
  it("5 · ressource prioritaire : son abri passe de 8 h à 12 h ; toujours sous la règle de capacité", () => {
    const p = player({ entrepot: 12, extracteur_nanocomposants: 12, extracteur_ferraille: 12 });
    const at = (res: ResourceId) => protectedAmount(p.buildings, res, p.techLevels, undefined, p, NOW);
    const nano8 = at("nano");
    setBuildingChoice(p, "storage.priority", "nano", NOW);
    const nanoH = hourlyProduction(p.buildings, "nano", p.techLevels);
    const cap = capacityProtected(p.buildings, "nano", p.techLevels, undefined, p);
    expect(at("nano")).toBe(Math.min(cap, Math.max(ECONOMY_RULES.protectedFloor, Math.floor(nanoH * (ECONOMY_RULES.protectedHours + 4)))));
    expect(at("nano")).toBeGreaterThanOrEqual(nano8);
    expect(at("nano")).toBeLessThanOrEqual(cap);
    expect(shelterExtraHours(p, "scrap")).toBe(0);
  });

  it("20 · entrepôt orbital : 12 h pour les 4 ressources, 16 h pour la prioritaire", () => {
    const p = player({ entrepot: 20 });
    expect(shelterExtraHours(p, "scrap")).toBe(4);
    setBuildingChoice(p, "storage.priority", "energy", NOW);
    expect(shelterExtraHours(p, "energy")).toBe(8);
    expect(shelterExtraHours(p, "reinforcedSteel")).toBe(4);
  });

  it("10 · tampon : 2 h de la production en trop gardées, versées dès que la place se libère", () => {
    const p = player({ entrepot: 10, extracteur_ferraille: 10 });
    const cap = storageCapacityOf(p);
    p.resources = { ...p.resources, scrap: cap };
    const perHour = advanceResources({ ...p, resources: { ...p.resources, scrap: 0 } }, 3600).scrap;
    // 1 h à entrepôt plein : 1 h en tampon.
    const one = advanceEconomy(p, 3600, NOW);
    expect(one.resources.scrap).toBe(cap);
    expect(one.buffer.scrap).toBeCloseTo(perHour, -2);
    // 5 h : plafonné à 2 h de production.
    const five = advanceEconomy(p, 5 * 3600, NOW);
    expect(five.buffer.scrap).toBeCloseTo(perHour * BUILDING_TIER_RULES.storageBufferHours, -2);
    // Le joueur dépense : le tampon se verse dans la place libre.
    const spent = { ...p, resources: { ...five.resources, scrap: cap - perHour }, storageBuffer: five.buffer };
    const after = advanceEconomy(spent, 1, NOW);
    // (1 s de production en plus : la ressource est pleine, ce surplus va lui aussi au tampon.)
    expect(after.resources.scrap).toBeCloseTo(cap, -2);
    expect(after.buffer.scrap ?? 0).toBeCloseTo(perHour, -4);
    // Sans le palier : rien n'est gardé (comportement d'avant).
    const low = player({ entrepot: 9, extracteur_ferraille: 10 });
    low.resources = { ...low.resources, scrap: storageCapacityOf(low) };
    expect(advanceEconomy(low, 3600, NOW).buffer.scrap).toBeUndefined();
  });

  it("10 · tampon au rattrapage hors ligne (flushState) : rempli pendant l'absence, versé à la dépense suivante", () => {
    const p = player({ entrepot: 10, extracteur_ferraille: 10 });
    const cap = storageCapacityOf(p);
    p.resources = { ...p.resources, scrap: cap };
    p.resourcesUpdatedAtMs = NOW - 6 * HOUR;
    const out = flushState(p, defaultQueues(), NOW).player;
    expect(out.storageBuffer?.scrap).toBeGreaterThan(0);
    out.resources.scrap = 0;
    out.resourcesUpdatedAtMs = NOW;
    const later = flushState(out, defaultQueues(), NOW + 1000).player;
    expect(later.resources.scrap).toBeGreaterThanOrEqual(out.storageBuffer!.scrap!);
    expect(later.storageBuffer?.scrap ?? 0).toBe(0);
  });

  it("I46 : un réglage changé (tampon à 0) ne détruit pas le tampon déjà gardé", () => {
    const p = player({ entrepot: 10 });
    p.storageBuffer = { scrap: 5000 };
    BUILDING_TIER_RULES.storageBufferHours = 0;
    const out = advanceEconomy(p, 1, NOW);
    expect(out.resources.scrap - (p.resources.scrap ?? 0)).toBeGreaterThanOrEqual(5000);
    expect(out.buffer.scrap).toBeUndefined();
  });

  it("15 · Négoce : taxe du comptoir −2 points, sous le plafond hebdomadaire (même action)", () => {
    const p = player({ entrepot: 15 });
    expect(exchangeTaxCut(p)).toBe(0);
    setBuildingChoice(p, "storage.spec", "trade", NOW);
    expect(exchangeTaxCut(p)).toBe(0.02);
    expect(tradeQuote("reinforcedSteel", "scrap", 10_000, exchangeTaxCut(p)).taxPct).toBeCloseTo(EXCHANGE_RULES.taxPct - 0.02, 9);
    expect(tradeQuote("reinforcedSteel", "scrap", 10_000, 1).tax).toBe(0);
    p.resources = { ...p.resources, reinforcedSteel: 10_000 };
    const out = performPlayerAction(p, defaultQueues(), { type: "trade", sellId: "reinforcedSteel", buyId: "scrap", amount: 10_000 }, NOW).result as { tax: number; gained: number };
    expect(out.tax).toBe(tradeQuote("reinforcedSteel", "scrap", 10_000, 0.02).tax);
    expect(out.tax).toBeLessThan(tradeQuote("reinforcedSteel", "scrap", 10_000).tax);
  });

  it("capacité de l'entrepôt inchangée (la règle n'est pas un bond chiffré)", () => {
    const a = player({ entrepot: 19 });
    const b = player({ entrepot: 20 });
    expect(getStorageCapacity(b.buildings) / getStorageCapacity(a.buildings)).toBeCloseTo(1.6, 5);
  });
});

describe("PB-L3 (6.14.144) : paliers de l'Atelier", () => {
  const atelier = (level: number, chasseurs = 20_000) => {
    const p = player({ atelier_reparation: level });
    p.units = { chasseur: { level: 1, count: chasseurs } } as PlayerState["units"];
    return p;
  };
  const total = (p: PlayerState) => (p.units.chasseur?.count ?? 0) + (workshopUnits(p).chasseur ?? 0) + (dockReady(p).chasseur ?? 0);

  it("10 · premiers soins : un lot de 15 min ou moins rentre aussitôt ; pas avant le palier", () => {
    const p = atelier(10);
    sendToWorkshop(p, { chasseur: 5 }, NOW, "raid", true);
    const before = total(p);
    advanceWorkshop(p, NOW);
    expect(workshopState(p).jobs).toHaveLength(0);
    expect(total(p)).toBe(before);
    const q = atelier(9);
    sendToWorkshop(q, { chasseur: 5 }, NOW, "raid", true);
    advanceWorkshop(q, NOW);
    expect(workshopState(q).jobs).toHaveLength(1);
    // Un gros lot reste en file.
    const r = atelier(10);
    sendToWorkshop(r, { chasseur: 10_000 }, NOW, "raid", true);
    advanceWorkshop(r, NOW);
    expect(workshopState(r).jobs).toHaveLength(1);
  });

  it("15 · atelier spécialisé : la classe choisie est réparée 50 % plus vite (file, délais et coût en Ambre)", () => {
    const cls = unitClasses().chasseur;
    const p = atelier(15);
    sendToWorkshop(p, { chasseur: 10_000 }, NOW, "raid", true);
    const plain = structuredClone(p);
    const costPlain = workshopRushCost(plain).seconds;
    setBuildingChoice(p, "workshop.class", cls, NOW);
    expect(workshopRushCost(p).seconds).toBeLessThan(costPlain);
    const hp = workshopState(p).jobs[0].hpLeft;
    advanceWorkshop(plain, NOW + 60_000);
    advanceWorkshop(p, NOW + 60_000);
    const donePlain = hp - workshopState(plain).jobs[0].hpLeft;
    const doneFast = hp - workshopState(p).jobs[0].hpLeft;
    expect(doneFast / donePlain).toBeCloseTo(1 + BUILDING_TIER_RULES.workshopClassSpeed, 5);
    expect(donePlain).toBeCloseTo(workshopRate(plain) * 60, 0);
  });

  it("20 · réparation d'urgence : 2 h offertes, une fois par jour ; rien n'est créé", () => {
    const p = atelier(20, 200_000);
    sendToWorkshop(p, { chasseur: 150_000 }, NOW, "raid", true);
    const before = total(p);
    expect(workshopFreeRushLeft(p, NOW)).toMatchObject({ left: 1, seconds: 7200 });
    const hp = workshopState(p).jobs[0].hpLeft;
    const out = freeRushWorkshop(p, NOW);
    expect(out.left).toBe(0);
    expect(hp - workshopState(p).jobs[0].hpLeft).toBeCloseTo(workshopRate(p) * 7200, -1);
    expect(total(p)).toBe(before);
    expect(() => freeRushWorkshop(p, NOW + HOUR)).toThrow(/demain/);
    expect(workshopFreeRushLeft(p, NOW + 24 * HOUR).left).toBe(1);
    // Sans file : refus propre ; sous le palier : refus.
    const empty = atelier(20);
    expect(() => freeRushWorkshop(empty, NOW)).toThrow(/Aucune unité/);
    const low = atelier(19);
    sendToWorkshop(low, { chasseur: 10_000 }, NOW, "raid", true);
    expect(() => freeRushWorkshop(low, NOW)).toThrow(/Signature/);
  });

  it("le sauvetage ne monte pas (audit E2) : seuls les paliers ci-dessus s'ajoutent", () => {
    const def = findBuilding("atelier_reparation")!;
    expect(def.effect).toMatchObject({ type: "repair", max: 0.7 });
  });
});
