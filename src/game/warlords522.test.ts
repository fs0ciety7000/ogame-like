import { describe, expect, it } from "vitest";
import { resolveCombat } from "@/game/combat";
import { defaultPlayerState } from "@/game/defaults";
import { assertEliteBuildable, assertEliteMission, eliteStatus, recordVendettaWin, refreshEliteUnlocks, withoutElite } from "@/game/eliteUnits";
import { addThreat, DEFAULT_RANK_RULES, dropRank, normalizeRankRules, rankForThreat, rankPowerFactor, traitValues, validateRankRules, warlordCombatMods } from "@/game/warlordRanks";
import { DEFAULT_WARLORDS, desiredArmy, openVendetta, vendettaTitle, warlordsState } from "@/game/warlords";
import { TECHNOLOGIES } from "@/game/technologies";
import { ELITE_UNIT_IDS, UNITS } from "@/game/units";
import { unitClasses } from "@/game/unitClasses";
import type { PlayerState } from "@/types/game";

const R = DEFAULT_RANK_RULES;
const NOW = Date.UTC(2026, 9, 6, 12);
const player = (patch: Partial<PlayerState> = {}) => ({ ...defaultPlayerState("p1", "Testeur"), ...patch }) as PlayerState;
const maxedLab = () => Object.fromEntries(TECHNOLOGIES.map((t) => [t.id, t.maxLevel]));

describe("5.22 rangs des seigneurs", () => {
  it("le rang suit la menace, plafonnée, et chute de deux rangs après une vendetta perdue", () => {
    expect(rankForThreat(0, R)).toBe(1);
    expect(rankForThreat(R.thresholds[0], R)).toBe(2);
    expect(rankForThreat(R.thresholds[3] + 1, R)).toBe(5);
    const up = addThreat({ threat: 0, rank: 1 }, 1000, R);
    expect(up.to).toBe(5);
    expect(up.rt.threat).toBe(R.thresholds[3] * 1.5);
    const down = dropRank(up.rt, R);
    expect(down.to).toBe(3);
    expect(down.rt.threat).toBe(R.thresholds[1]);
    expect(addThreat({ threat: 1, rank: 1 }, -10, R).rt.threat).toBe(0);
  });

  it("rangs désactivés : tout le monde au rang I, sans trait", () => {
    const off = normalizeRankRules({ enabled: false });
    expect(rankForThreat(500, off)).toBe(1);
    expect(traitValues("builder", 5, off).shield).toBe(0);
  });

  it("puissance visée et traits croissent avec le rang", () => {
    expect(rankPowerFactor(1, R)).toBe(1);
    expect(rankPowerFactor(5, R)).toBeCloseTo(1 + 4 * R.powerPerRank);
    expect(traitValues("opportunist", 1, R).evade).toBe(0);
    expect(traitValues("opportunist", 5, R).evade).toBeCloseTo(4 * R.traits.opportunist.evadePerRank);
    expect(traitValues("aggressive", 3, R).edge).toBeCloseTo(2 * R.traits.aggressive.edgePerRank);
    expect(traitValues("merchant", 5, R)).toEqual({ evade: 0, retreatEarlier: 0, loot: 0, shield: 0, defense: 0, edge: 0 });
  });

  it("réglages invalides refusés", () => {
    expect(validateRankRules({ thresholds: [10, 5, 20, 30] }).length).toBeGreaterThan(0);
    expect(validateRankRules({ traits: { ...R.traits, opportunist: { ...R.traits.opportunist, evadePerRank: 0.5 } } }).length).toBeGreaterThan(0);
    expect(validateRankRules(R)).toEqual([]);
  });

  it("chaque unité d'élite contre son trait", () => {
    const opp = warlordCombatMods("opportunist", 5, "defender", {}, R, 0.5);
    expect(opp.homeFleetFactor).toBeCloseTo(1 - 4 * R.traits.opportunist.evadePerRank);
    expect(warlordCombatMods("opportunist", 5, "defender", { chasse_fantome: 1 }, R, 0.5).homeFleetFactor).toBeUndefined();
    expect(warlordCombatMods("opportunist", 5, "attacker", {}, R, 0.5).retreatAt).toBeLessThan(0.5);
    expect(warlordCombatMods("opportunist", 5, "attacker", { chasse_fantome: 3 }, R, 0.5).retreatAt).toBe(1);
    const builder = warlordCombatMods("builder", 4, "defender", {}, R, 0.5);
    expect(builder.shieldBonus).toBeGreaterThan(0);
    expect(warlordCombatMods("builder", 4, "defender", { brise_rempart: 1 }, R, 0.5).shieldIgnored).toBe(true);
    expect(warlordCombatMods("aggressive", 5, "attacker", {}, R, 0.5).edgeBonus).toBeGreaterThan(0);
    expect(warlordCombatMods("aggressive", 5, "attacker", { lame_ecarlate: 1 }, R, 0.5).edgeCancelled).toBe(true);
  });

  it("combat : annuler l'avantage de classe du défenseur réduit les pertes de l'attaquant", () => {
    const base = {
      // 6.14.72 (AE-6, défense à domicile +25 %) : 300 → 500 chasseurs. À 300, l'attaquant décroche et ses pertes
      // dépendent du tour de la retraite, pas de l'avantage de classe ; à 500, il gagne et la comparaison est franche.
      attackerUnits: { chasseur: { level: 1, count: 500 } },
      attackerTechLevels: {},
      attackerRepairPct: 0,
      fleet: { chasseur: 500 },
      defenderUnits: { etoile_noire: { level: 1, count: 3 } },
      defenderTechLevels: {},
      defenderRepairPct: 0,
      defenderResources: {},
      homeFleetFactor: 1,
    };
    const normal = resolveCombat(base);
    const boosted = resolveCombat({ ...base, classEdge: { defender: { bonus: 0.3 } } });
    const cancelled = resolveCombat({ ...base, classEdge: { defender: { cancel: true } } });
    expect(boosted.attackerLossPercent).toBeGreaterThanOrEqual(normal.attackerLossPercent);
    expect(cancelled.attackerLossPercent).toBeLessThanOrEqual(normal.attackerLossPercent);
  });

  it("Seigneur Ascendant : vendetta d'alliance seulement, objectif relevé, titre propre", () => {
    const d = DEFAULT_WARLORDS[0];
    const npc = player({ uid: "npcx", units: { chasseur: { level: 1, count: 100 } } });
    const opener = { uid: "p1", pseudo: "Testeur", allianceId: "a1" };
    expect(() => openVendetta(warlordsState({}), d, opener, "player", npc, { seeded: true, lastTickMs: 0, nextAttackAtMs: 0, nextMarketAtMs: 0, absentUntilMs: 0, lastBuildingAtMs: 0, rank: 5 }, NOW)).toThrow(/alliance/);
    const v1 = openVendetta(warlordsState({}), d, opener, "alliance", npc, { seeded: true, lastTickMs: 0, nextAttackAtMs: 0, nextMarketAtMs: 0, absentUntilMs: 0, lastBuildingAtMs: 0, rank: 1 }, NOW);
    const v5 = openVendetta(warlordsState({}), d, opener, "alliance", npc, { seeded: true, lastTickMs: 0, nextAttackAtMs: 0, nextMarketAtMs: 0, absentUntilMs: 0, lastBuildingAtMs: 0, rank: 5 }, NOW);
    expect(v5.goal).toBeGreaterThan(v1.goal);
    expect(v5.rank).toBe(5);
    expect(vendettaTitle(d, 5)).toMatch(/Ascendant/);
  });
});

describe("5.22 unités d'élite", () => {
  it("débloquées par un Labo complet ET une vendetta gagnée contre la bonne personnalité", () => {
    const p = player();
    expect(refreshEliteUnlocks(p)).toEqual([]);
    p.techLevels = maxedLab();
    expect(refreshEliteUnlocks(p)).toEqual([]);
    recordVendettaWin(p, "builder");
    expect(refreshEliteUnlocks(p)).toEqual(["brise_rempart"]);
    expect(eliteStatus(p, "brise_rempart")?.buildable).toBe(true);
    expect(eliteStatus(p, "lame_ecarlate")?.unlocked).toBe(false);
  });

  it("titre de vendetta d'avant la 5.22 pris en compte", () => {
    const opportunist = DEFAULT_WARLORDS.find((d) => d.personality === "opportunist")!;
    const p = player({ techLevels: maxedLab(), titles: [{ label: vendettaTitle(opportunist), seasonId: "vendetta", rank: 1 }] });
    expect(refreshEliteUnlocks(p)).toEqual(["chasse_fantome"]);
  });

  it("nouvelle techno au Labo : l'unité reste débloquée mais ne se construit plus", () => {
    const p = player({ techLevels: maxedLab() });
    recordVendettaWin(p, "aggressive");
    refreshEliteUnlocks(p);
    const first = TECHNOLOGIES[0];
    p.techLevels[first.id] = first.maxLevel - 1;
    expect(eliteStatus(p, "lame_ecarlate")?.unlocked).toBe(true);
    expect(() => assertEliteBuildable(p, "lame_ecarlate")).toThrow(/Labo/);
  });

  it("refusées en JcJ et hors des combats contre un joueur", () => {
    expect(() => assertEliteMission({ lame_ecarlate: 2, chasseur: 5 }, false)).toThrow(/seigneurs/);
    expect(() => assertEliteMission({ lame_ecarlate: 2 }, true)).not.toThrow();
    expect(withoutElite({ lame_ecarlate: { level: 1, count: 2 }, chasseur: { level: 1, count: 3 } })).toEqual({ chasseur: { level: 1, count: 3 } });
  });

  it("jamais dans les armées des seigneurs, et sans décaler la classe des autres unités", () => {
    for (const d of DEFAULT_WARLORDS) for (const id of Object.keys(desiredArmy(d, 5_000_000))) expect(ELITE_UNIT_IDS).not.toContain(id);
    const withElite = unitClasses(UNITS);
    const without = unitClasses(UNITS.filter((u) => !u.elite));
    for (const [id, cls] of Object.entries(without)) expect(withElite[id]).toBe(cls);
    expect(withElite.brise_rempart).toBe("heavy");
  });
});
