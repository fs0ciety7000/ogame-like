import { afterEach, describe, expect, it } from "vitest";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import {
  BUILDING_TIER_RULES,
  buildingTierEffects,
  buildingTierView,
  choiceOptions,
  defenseRebuildBonus,
  familyTierLevels,
  familyTiers,
  hangarFleetSlotBonus,
  hangarWaitingMax,
  setBuildingChoice,
  tierFamily,
  validateBuildingTierRules,
} from "@/game/buildingTiers";
import { findBuilding } from "@/game/buildings";
import { hangarLoad, hasWaitingUnits, playerUnitCapacity, startWaitingUnits, waitingOrders } from "@/game/hangar";
import { actionNeedsAway, performPlayerAction } from "@/game/actions";
import { finishAllTimers } from "@/game/adminTools";
import { flushState } from "@/game/flush";
import { fleetSlots } from "@/game/fleets";
import { getFleetUpkeep } from "@/game/economy";
import { playerModifiers } from "@/game/modifiers";
import { COMBAT_RULES, resolveCombat } from "@/game/combat";
import { findUnit, getUnitBuildTime } from "@/game/units";
import { attackerWinThreshold, budgetDuel } from "@/game/balance/pvpBudget";
import { effectImpactReport } from "@/game/impact";
import { upcomingEvents } from "@/game/timeline";
import type { PlayerState, QueuesState } from "@/types/game";

/* 6.14.145 (PB-L4, docs/proposals/paliers-batiments.md §5.4) : paliers des hangars.
   5 : baies modulaires ; 10 : file d'attente (I2 réécrit) ; 15 : spécialisations ; 20 : Pont de lancement, Casemates.
   Invariant I46 : niveau effectif, choix, circuit d'effets ou lecteur de buildingTiers.ts, sous les plafonds, rien détruit.
   Invariant I47 : file d'attente des hangars (une commande en attente ne prend sa place qu'à son démarrage, dans l'ordre). */

const NOW = Date.UTC(2026, 10, 10, 12);
const HOUR = 3600_000;
const SAVED = structuredClone(BUILDING_TIER_RULES);

afterEach(() => {
  Object.assign(BUILDING_TIER_RULES, structuredClone(SAVED));
});

function player(attack = 1, defense = 1, units: Record<string, number> = {}): PlayerState {
  const p = defaultPlayerState("u1", "Amiral") as PlayerState;
  p.buildings.hangar_attaque = { level: attack, unlocked: true };
  p.buildings.hangar_defense = { level: defense, unlocked: true };
  p.units = { ...p.units, chasseur: { level: 1, count: 0 }, roquette: { level: 1, count: 0 } };
  for (const [id, n] of Object.entries(units)) p.units[id] = { level: 1, count: n };
  p.resources = { ...p.resources, scrap: 1e10, energy: 1e10 };
  p.resourcesUpdatedAtMs = NOW;
  return p;
}

const act = (p: PlayerState, q: QueuesState, action: Parameters<typeof performPlayerAction>[2], now = NOW, away: Record<string, number> = {}) => performPlayerAction(p, q, action, now, away, true);

describe("PB-L4 (6.14.145) : familles et réglages des hangars", () => {
  it("deux familles visées par l'effet (catégorie), niveaux 5/10/15/20 réglables et validés", () => {
    expect(tierFamily(findBuilding("hangar_attaque")!)).toBe("hangarAttack");
    expect(tierFamily(findBuilding("hangar_defense")!)).toBe("hangarDefense");
    expect(familyTierLevels("hangarAttack")).toEqual([5, 10, 15, 20]);
    expect(validateBuildingTierRules({ hangarDefenseLevels: [5, 10, 10, 20] })).toHaveLength(1);
    expect(validateBuildingTierRules({ hangarAttackLevels: [5, 10, 15] })).toHaveLength(1);
    BUILDING_TIER_RULES.hangarAttackLevels = [3, 6, 9, 12];
    expect(familyTiers("hangarAttack").map((t) => t.level)).toEqual([3, 6, 9, 12]);
  });

  it("textes lus dans les règles (aucun chiffre recopié)", () => {
    BUILDING_TIER_RULES.hangarWaitingQueueMax = 7;
    BUILDING_TIER_RULES.hangarDefenseRebuildBonus = 0.2;
    expect(familyTiers("hangarAttack")[1].text).toContain("7 commandes");
    expect(familyTiers("hangarDefense")[3].text).toContain("80 %");
    expect(familyTiers("hangarDefense")[3].text).toContain(`${Math.round(COMBAT_RULES.defenseRebuildPct * 100)} %`);
  });

  it("carte : ligne « Paliers » des deux hangars, choix ouverts aux paliers 5 et 15", () => {
    const p = player(15, 4);
    const view = buildingTierView(findBuilding("hangar_attaque")!, p)!;
    expect(view.family).toBe("hangarAttack");
    expect(view.pending).toEqual(["hangarAttack.lend", "hangarAttack.spec"]);
    expect(view.next?.level).toBe(20);
    expect(buildingTierView(findBuilding("hangar_defense")!, p)!.tiers.every((t) => !t.reached)).toBe(true);
    expect(choiceOptions("hangarDefense.spec").map((o) => o.id)).toEqual(["turrets", "upkeep"]);
  });
});

describe("PB-L4 : palier 5, baies modulaires", () => {
  it("prêter 10 % des places du hangar d'attaque : la capacité passe d'un hangar à l'autre, le total ne change pas", () => {
    const p = player(10, 10);
    const before = playerUnitCapacity(p, "attack", NOW) + playerUnitCapacity(p, "defense", NOW);
    setBuildingChoice(p, "hangarAttack.lend", "lend", NOW);
    expect(playerUnitCapacity(p, "attack", NOW)).toBe(18_000);
    expect(playerUnitCapacity(p, "defense", NOW)).toBe(22_000);
    expect(playerUnitCapacity(p, "attack", NOW) + playerUnitCapacity(p, "defense", NOW)).toBe(before);
    expect(hangarLoad(p, defaultQueues(), {}, "defense", NOW).lent).toBe(2000);
    // Hangar de défense d'une colonie : pas de prêt.
    expect(playerUnitCapacity(p, "defense", NOW, "colonies")).toBe(20_000);
  });

  it("refusé sous le palier 5 ; un prêt qui créerait une surcharge est refusé, rien n'est enregistré", () => {
    expect(() => setBuildingChoice(player(4, 4), "hangarAttack.lend", "lend", NOW)).toThrow(/niveau 5/);
    // Hangar d'attaque 10 (20 000 places) presque plein : prêter 2 000 places le mettrait en surcharge.
    const p = player(10, 10, { chasseur: 9500 });
    expect(() => act(p, defaultQueues(), { type: "buildingChoice", slot: "hangarAttack.lend", value: "lend" })).toThrow(/surcharge/);
    // Hangar de défense : le même prêt passe (rien n'y est).
    const ok = act(p, defaultQueues(), { type: "buildingChoice", slot: "hangarDefense.lend", value: "lend" });
    expect(playerUnitCapacity(ok.player, "attack", NOW)).toBe(22_000);
    // Reprendre ses places (« Garder ») quand le prêt est occupé : refusé aussi.
    const full = player(10, 10, { chasseur: 10_900 });
    full.buildingChoices = { "hangarDefense.lend": { v: "lend", at: NOW - 48 * HOUR } };
    expect(() => act(full, defaultQueues(), { type: "buildingChoice", slot: "hangarDefense.lend", value: "keep" })).toThrow(/surcharge/);
    expect(full.units.chasseur.count).toBe(10_900);
  });

  it("I46 : un réglage changé par l'admin ne détruit rien (surcharge visible, aucune unité retirée)", () => {
    const p = player(10, 10, { chasseur: 9000 });
    setBuildingChoice(p, "hangarAttack.lend", "lend", NOW);
    BUILDING_TIER_RULES.hangarLendShare = 0.5;
    const load = hangarLoad(p, defaultQueues(), {}, "attack", NOW);
    expect(load.overflow).toBeGreaterThan(0);
    const out = act(p, defaultQueues(), { type: "sync" }, NOW + HOUR);
    expect(out.player.units.chasseur.count).toBe(9000);
  });
});

describe("PB-L4 : palier 10, file d'attente (I2 réécrit, I47)", () => {
  it("commande au-delà de la place libre : la part sans place attend, payée, hors capacité ; rien n'entre au-delà", () => {
    const p = player(10, 1, { chasseur: 9990 });
    const scrapBefore = p.resources.scrap;
    const out = act(p, defaultQueues(), { type: "buildUnits", unitId: "chasseur", qty: 30 });
    expect(out.result).toEqual({ waiting: 20, started: 10 });
    expect(out.player.resources.scrap).toBeLessThan(scrapBefore);
    expect(waitingOrders(out.queues.unitQueues.attack)).toEqual([{ unitId: "chasseur", index: 10, count: 20, places: 40 }]);
    const load = hangarLoad(out.player, out.queues, {}, "attack", NOW);
    expect(load.used).toBe(load.capacity);
    expect(load.waiting).toBe(40);
    // Le rattrapage ne démarre jamais une entrée en attente ; « tout terminer » (compte test, admin) non plus.
    const flushed = flushState(out.player, out.queues, NOW + 48 * HOUR);
    expect(flushed.queues.unitQueues.attack.every((e) => e.wait)).toBe(true);
    const q2 = structuredClone(out.queues);
    finishAllTimers(q2, NOW);
    expect(q2.unitQueues.attack.filter((e) => e.wait)).toHaveLength(20);
    // La frise ne compte que les commandes démarrées.
    expect(upcomingEvents(out.queues, NOW).find((e) => e.kind === "units")?.label).toContain("10 unités");
  });

  it("une place libérée (vente) démarre la file dans l'ordre, sans dépasser la capacité, avec une ligne au Journal", () => {
    const p = player(10, 1, { chasseur: 9990 });
    const a = act(p, defaultQueues(), { type: "buildUnits", unitId: "chasseur", qty: 30 });
    const b = act(a.player, a.queues, { type: "sync" }, NOW + 48 * HOUR);
    expect(b.player.units.chasseur.count).toBe(10_000);
    expect(hasWaitingUnits(b.queues)).toBe(true);
    const c = act(b.player, b.queues, { type: "sellUnits", unitId: "chasseur", qty: 5 }, NOW + 48 * HOUR);
    expect(c.queues.unitQueues.attack.filter((e) => !e.wait)).toHaveLength(5);
    expect(c.queues.unitQueues.attack[0].endTime).not.toBeNull();
    expect(c.notifications.some((n) => n.title.includes("File d'attente"))).toBe(true);
    const load = hangarLoad(c.player, c.queues, {}, "attack", NOW + 48 * HOUR);
    expect(load.used).toBeLessThanOrEqual(load.capacity);
  });

  it("les flottes en vol comptent : sans elles lues, rien ne démarre (I8) ; en vacances non plus", () => {
    const p = player(10, 1, { chasseur: 9990 });
    const a = act(p, defaultQueues(), { type: "buildUnits", unitId: "chasseur", qty: 30 });
    a.player.units.chasseur.count = 9000; // 2 000 places rendues…
    expect(startWaitingUnits(a.player, structuredClone(a.queues), { chasseur: 1000 }, NOW)).toEqual([]); // …mais 1 000 chasseurs en vol.
    const noAway = performPlayerAction(a.player, structuredClone(a.queues), { type: "sync" }, NOW, {}, false);
    expect(noAway.queues.unitQueues.attack.filter((e) => e.wait)).toHaveLength(20);
    const v = structuredClone(a.player);
    v.vacation = { startedAtMs: NOW - HOUR, untilMs: NOW + 48 * HOUR } as PlayerState["vacation"];
    const onVac = performPlayerAction(v, structuredClone(a.queues), { type: "sync" }, NOW, {}, true);
    expect(onVac.queues.unitQueues.attack.filter((e) => e.wait)).toHaveLength(20);
    const back = performPlayerAction(a.player, structuredClone(a.queues), { type: "sync" }, NOW, {}, true);
    expect(back.queues.unitQueues.attack.filter((e) => e.wait).length).toBeLessThan(20);
  });

  it("au plus `hangarWaitingQueueMax` commandes ; une commande plus grande que le hangar est refusée ; sans palier 10, refus", () => {
    BUILDING_TIER_RULES.hangarWaitingQueueMax = 2;
    const p = player(10, 1, { chasseur: 10_000, fregate: 0 });
    let s = act(p, defaultQueues(), { type: "buildUnits", unitId: "chasseur", qty: 5 });
    s = act(s.player, s.queues, { type: "buildUnits", unitId: "chasseur", qty: 5 }); // même lot : fusionné
    expect(waitingOrders(s.queues.unitQueues.attack)).toHaveLength(1);
    s = act(s.player, s.queues, { type: "buildUnits", unitId: "fregate", qty: 1 });
    expect(() => act(s.player, s.queues, { type: "buildUnits", unitId: "chasseur", qty: 1 })).toThrow(/2 \/ 2 commandes/);
    expect(() => act(player(10, 1, { chasseur: 10_000 }), defaultQueues(), { type: "buildUnits", unitId: "chasseur", qty: 10_001 })).toThrow(/trop grande/);
    expect(hangarWaitingMax(player(9, 9).buildings, "attack")).toBe(0);
    expect(() => act(player(9, 1, { chasseur: 9000 }), defaultQueues(), { type: "buildUnits", unitId: "chasseur", qty: 1 })).toThrow(/insuffisante/);
  });

  it("annuler une commande en attente rembourse tout ; la file démarrée n'est pas touchée", () => {
    const p = player(10, 1, { chasseur: 9990 });
    const a = act(p, defaultQueues(), { type: "buildUnits", unitId: "chasseur", qty: 30 });
    const scrap = a.player.resources.scrap;
    const index = waitingOrders(a.queues.unitQueues.attack)[0].index;
    const c = act(a.player, a.queues, { type: "cancel", target: { kind: "units", category: "attack", index } });
    expect(c.queues.unitQueues.attack).toHaveLength(10);
    expect(c.queues.unitQueues.attack.every((e) => !e.wait)).toBe(true);
    const each = findUnit("chasseur")!.cost.scrap;
    expect(c.player.resources.scrap - scrap).toBeGreaterThanOrEqual(20 * each * 0.99);
  });

  it("le serveur lit les flottes en vol quand une commande attend ou qu'un prêt change", () => {
    const p = player(10, 1);
    const q = defaultQueues();
    expect(actionNeedsAway(p, { type: "sync" }, q)).toBe(false);
    q.unitQueues.attack.push({ unitId: "chasseur", endTime: null, wait: true });
    expect(actionNeedsAway(p, { type: "sync" }, q)).toBe(true);
    expect(actionNeedsAway(p, { type: "buildingChoice", slot: "hangarAttack.lend" }, defaultQueues())).toBe(true);
    expect(actionNeedsAway(p, { type: "buildingChoice", slot: "storage.spec" }, defaultQueues())).toBe(false);
  });
});

describe("PB-L4 : palier 15, spécialisations (circuit d'effets)", () => {
  it("Pont d'envol et Tourelles en série : −10 % sur leur catégorie seulement", () => {
    const p = player(15, 15);
    const ch = findUnit("chasseur")!;
    const ro = findUnit("roquette")!;
    const t0 = { ch: getUnitBuildTime(ch, p.techLevels, p), ro: getUnitBuildTime(ro, p.techLevels, p) };
    setBuildingChoice(p, "hangarAttack.spec", "deck", NOW);
    expect(getUnitBuildTime(ch, p.techLevels, p)).toBe(Math.max(1, Math.round(t0.ch * 0.9)));
    expect(getUnitBuildTime(ro, p.techLevels, p)).toBe(t0.ro);
    setBuildingChoice(p, "hangarDefense.spec", "turrets", NOW);
    expect(getUnitBuildTime(ro, p.techLevels, p)).toBe(Math.max(1, Math.round(t0.ro * 0.9)));
  });

  it("Réacteurs : temps de vol en couche empire ; Entretien réduit : défenses seules", () => {
    const p = player(15, 15, { chasseur: 1000, roquette: 1000 });
    setBuildingChoice(p, "hangarAttack.spec", "engines", NOW);
    expect(playerModifiers(p, NOW).fleetSpeed).toBeCloseTo(BUILDING_TIER_RULES.hangarSpecFleetSpeed);
    const before = getFleetUpkeep(p.units, p.techLevels, 0, 0);
    setBuildingChoice(p, "hangarDefense.spec", "upkeep", NOW);
    const m = playerModifiers(p, NOW);
    expect(m.fleetUpkeep).toBe(0);
    expect(m.fleetUpkeepDefense).toBeCloseTo(0.2);
    const attackPart = getFleetUpkeep({ chasseur: p.units.chasseur }, p.techLevels);
    const defensePart = getFleetUpkeep({ roquette: p.units.roquette }, p.techLevels);
    expect(getFleetUpkeep(p.units, p.techLevels, m.fleetUpkeep, m.fleetUpkeepDefense)).toBeCloseTo(attackPart + defensePart * 0.8);
    expect(before).toBeCloseTo(attackPart + defensePart);
    // Source « bâtiment » du circuit, cible « cat:defense ».
    expect(buildingTierEffects(p).find((g) => g.stat === "fleetUpkeep")?.target).toBe("cat:defense");
  });

  it("aucun maximum théorique de la couche empire ne dépasse son plafond (rapport d'impact)", () => {
    expect(effectImpactReport().filter((r) => r.capped)).toEqual([]);
    expect(effectImpactReport().some((r) => r.sources.some((s) => s.label === "Hangar de défense : Entretien réduit"))).toBe(true);
  });
});

describe("PB-L4 : palier 20, Pont de lancement et Casemates", () => {
  it("+1 emplacement de flotte au hangar d'attaque 20", () => {
    expect(fleetSlots(player(19, 1))).toBe(10);
    expect(fleetSlots(player(20, 1))).toBe(11);
    expect(hangarFleetSlotBonus(player(20, 1).buildings)).toBe(1);
  });

  it("Casemates : 70 % des défenses détruites reconstruites au lieu de 60 %", () => {
    expect(defenseRebuildBonus(player(1, 19).buildings)).toBe(0);
    expect(defenseRebuildBonus(player(1, 20).buildings)).toBeCloseTo(0.1);
    const fight = (bonus: number) =>
      resolveCombat({
        attackerUnits: {},
        attackerTechLevels: {},
        attackerRepairPct: 0,
        fleet: {},
        attackerPowerOverride: 1e9,
        defenderUnits: { roquette: { level: 1, count: 1000 } },
        defenderTechLevels: {},
        defenderRepairPct: 0,
        defenderResources: {},
        defenseRebuildBonus: bonus,
      });
    const base = fight(0);
    const casemates = fight(0.1);
    const lost = (base.defenderLosses.roquette ?? 0) + (base.defenderRebuilt?.roquette ?? 0);
    expect(base.defenderRebuilt?.roquette).toBe(Math.floor(lost * 0.6));
    expect(casemates.defenderRebuilt?.roquette).toBe(Math.floor(lost * 0.7));
  });

  it("mesure JcJ (pvpBudget) : seuils de victoire inchangés, défenses seules ≥ ×2 ; perte nette en défenses −25 %", () => {
    const mixed = attackerWinThreshold("mixed");
    const defenses = attackerWinThreshold("defenses");
    expect(attackerWinThreshold("mixed", { defenseRebuildBonus: 0.1 })).toBe(mixed);
    expect(attackerWinThreshold("defenses", { defenseRebuildBonus: 0.1 })).toBe(defenses);
    expect(defenses).toBeGreaterThanOrEqual(2);
    const at = defenses ?? 3;
    const a = budgetDuel(at, "defenses");
    const b = budgetDuel(at, "defenses", { defenseRebuildBonus: 0.1 });
    expect(b.outcome).toBe(a.outcome);
    expect(b.defenseNetLoss).toBeLessThan(a.defenseNetLoss);
    expect(b.defenseNetLoss / a.defenseNetLoss).toBeCloseTo(0.75, 1);
  });
});
