import { describe, expect, it } from "vitest";
import {
  allianceMaxMembers,
  addMember,
  ALLIANCE_RULES,
  allianceBastionBonus,
  allianceForgeFactor,
  allianceNextDueMs,
  allianceProjectCost,
  allianceProjectProgress,
  allianceSiegeFactor,
  finishAllianceResearch,
  fundAllianceProject,
  allianceCounterSpy,
  allianceFlightFactor,
  allianceProductionFactor,
  allianceResearchCost,
  allianceRole,
  allianceShieldBonus,
  allianceStandings,
  completeAllianceResearch,
  deposit,
  distribute,
  kickMember,
  newAlliance,
  parseAmounts,
  removeMember,
  setOfficer,
  startAllianceResearch,
} from "@/game/alliances";
import { defaultPlayerState } from "@/game/defaults";
import { playerBuildTimeFactor } from "@/game/bonuses";
import { advanceResources } from "@/game/economy";
import { resolveCombat } from "@/game/combat";
import type { Alliance, PlayerState } from "@/types/game";

const NOW = Date.UTC(2026, 9, 7, 12);
const make = (): Alliance => ({ id: "al", ...newAlliance({ uid: "f", pseudo: "Fondateur" }, "Les Éclaireurs", "ecl", NOW) });
const player = (uid: string, patch: Partial<PlayerState> = {}): PlayerState => ({ ...defaultPlayerState(uid, uid.toUpperCase()), ...patch }) as PlayerState;

describe("alliance membership", () => {
  it("validates name and tag", () => {
    expect(make().tag).toBe("ECL");
    expect(() => newAlliance({ uid: "f", pseudo: "F" }, "ab", "XX", NOW)).toThrow(/nom/);
    expect(() => newAlliance({ uid: "f", pseudo: "F" }, "Correct", "X!", NOW)).toThrow(/tag/);
  });

  it("caps members at 8, +4 per level of Quartiers fédérés (20 at most)", () => {
    let a = make();
    for (let i = 1; i < ALLIANCE_RULES.maxMembers; i++) a = addMember(a, { uid: `m${i}`, pseudo: `M${i}` });
    expect(a.members).toHaveLength(8);
    expect(() => addMember(a, { uid: "x", pseudo: "X" })).toThrow(/complète \(8 membres\)/);
    expect(() => addMember(make(), { uid: "f", pseudo: "F" })).toThrow(/déjà/);
    // 5.33 : Quartiers fédérés ouvre 4 places par niveau.
    expect(allianceMaxMembers({ research: { quartiers: 1 } })).toBe(12);
    expect(allianceMaxMembers({ research: { quartiers: 3 } })).toBe(20);
    expect(allianceMaxMembers({ research: { quartiers: 9 } })).toBe(20);
    expect(allianceMaxMembers(null)).toBe(8);
    const grown = addMember({ ...a, research: { quartiers: 1 } }, { uid: "x", pseudo: "X" });
    expect(grown.members).toHaveLength(9);
  });

  it("hands over leadership when the founder leaves, disbands when the last one leaves", () => {
    let a = addMember(addMember(make(), { uid: "a", pseudo: "A" }), { uid: "b", pseudo: "B" });
    a = setOfficer(a, "f", "b", true);
    const after = removeMember(a, "f")!;
    expect(after.createdBy).toBe("b");
    expect(allianceRole(after, "b")).toBe("founder");
    expect(removeMember(make(), "f")).toBeNull();
    expect(() => kickMember(after, "a", "b")).toThrow(/Exclusion/);
    expect(kickMember(after, "b", "a").members).toEqual(["b"]);
  });
});

describe("treasury", () => {
  it("deposits from the player's stock", () => {
    const p = player("f", { resources: { ...player("x").resources, scrap: 1000 } });
    const a = deposit(make(), p, parseAmounts({ scrap: 600, bogus: 5 }));
    expect(a.treasury?.scrap).toBe(600);
    expect(p.resources.scrap).toBe(400);
    expect(() => deposit(a, p, { scrap: 500 })).toThrow(/insuffisantes/);
    expect(() => parseAmounts({ scrap: -3 })).toThrow();
  });

  it("limits distributions to 20 % of the stock and 10 a day, officers only", () => {
    let a = addMember(make(), { uid: "m", pseudo: "M" });
    a = { ...a, treasury: { scrap: 1000 } };
    expect(() => distribute(a, "m", "f", { scrap: 10 }, NOW)).toThrow(/Trésor/);
    expect(() => distribute(a, "f", "m", { scrap: 201 }, NOW)).toThrow(/20 %/);
    for (let i = 0; i < ALLIANCE_RULES.distributionsPerDay; i++) a = distribute(a, "f", "m", { scrap: 10 }, NOW);
    expect(a.treasury?.scrap).toBe(900);
    expect(() => distribute(a, "f", "m", { scrap: 10 }, NOW)).toThrow(/Limite/);
    expect(distribute(a, "f", "m", { scrap: 10 }, NOW + 24 * 3600_000).distributions?.count).toBe(1);
  });
});

describe("alliance research", () => {
  it("doubles the cost each level", () => {
    expect(allianceResearchCost(1).scrap).toBe(50_000_000);
    expect(allianceResearchCost(1).reinforcedSteel).toBe(1_000_000);
    expect(allianceResearchCost(5).scrap).toBe(800_000_000);
  });

  it("pays from the treasury, runs one at a time and completes", () => {
    const rich = Object.fromEntries(Object.keys(allianceResearchCost(1)).map((k) => [k, 200_000_000]));
    const a = { ...make(), treasury: rich };
    const started = startAllianceResearch(a, "f", "industrie", NOW);
    expect(started.treasury?.scrap).toBe(150_000_000);
    expect(() => startAllianceResearch(started, "f", "logistique", NOW)).toThrow(/déjà/);
    expect(completeAllianceResearch(started, NOW + 11 * 3600_000).completed).toBeNull();
    const done = completeAllianceResearch(started, NOW + 12 * 3600_000);
    expect(done.completed).toEqual({ id: "industrie", level: 1 });
    expect(done.alliance.research?.industrie).toBe(1);
    expect(() => startAllianceResearch({ ...make(), treasury: {} }, "f", "industrie", NOW)).toThrow(/trésor/);
  });

  it("gives the bonuses to members", () => {
    const lv = { logistique: 5, industrie: 5, brouillage: 3, bouclier: 5 };
    expect(allianceFlightFactor(lv)).toBeCloseTo(0.75);
    expect(allianceProductionFactor(lv)).toBeCloseTo(1.15);
    expect(allianceCounterSpy(lv)).toBe(3);
    expect(allianceShieldBonus(lv)).toBeCloseTo(0.05);
    const base = player("p");
    const plain = advanceResources(base, 3600).scrap - base.resources.scrap;
    const boosted = advanceResources({ ...base, allianceResearch: { industrie: 5 } }, 3600).scrap - base.resources.scrap;
    expect(boosted).toBeCloseTo(plain * 1.15, 3);
  });
});

describe("garrisons and alliance season", () => {
  it("adds half of the garrison's power to the defence and takes losses", () => {
    const common = {
      attackerUnits: { chasseur: { level: 1, count: 100 } },
      attackerTechLevels: {},
      attackerRepairPct: 0,
      fleet: { chasseur: 100 },
      defenderUnits: {},
      defenderTechLevels: {},
      defenderRepairPct: 0,
      defenderResources: {},
    };
    const alone = resolveCombat(common);
    expect(alone.outcome).toBe("attacker_win");
    const helped = resolveCombat({
      ...common,
      garrisons: [{ units: { chasseur: { level: 1, count: 300 } }, techLevels: {}, fleet: { chasseur: 300 } }],
      garrisonFactor: 0.5,
    });
    expect(helped.garrisonPower).toBeGreaterThan(0);
    expect(helped.outcome).toBe("defender_win");
    expect(helped.garrisonLosses?.[0].chasseur ?? 0).toBeGreaterThan(0);
  });

  it("ranks alliances by their best five season scores", () => {
    const s = allianceStandings([
      ...[10, 20, 30, 40, 50, 60].map((xp) => ({ allianceId: "a", seasonXp: xp })),
      { allianceId: "b", seasonXp: 250 },
      { allianceId: null, seasonXp: 999 },
    ]);
    expect(s).toEqual([
      { allianceId: "b", score: 250, rank: 1 },
      { allianceId: "a", score: 200, rank: 2 },
    ]);
  });
});

describe("alliance projects (v3.3)", () => {
  const rich = () => {
    const p = player("m1");
    for (const k of Object.keys(p.resources)) (p.resources as Record<string, number>)[k] = 10_000_000_000;
    return p;
  };
  const withMember = () => {
    const a = addMember(make(), { uid: "m1", pseudo: "M1" });
    return { ...a, treasury: { scrap: 2_000_000_000, energy: 2_000_000_000, nano: 2_000_000_000, data: 2_000_000_000, reinforcedSteel: 1e8, cyberModule: 1e8, syntheticNanites: 1e8, aiFragment: 1e8 } };
  };

  it("doubles the cost of each tier", () => {
    expect(allianceProjectCost(1)).toMatchObject({ scrap: 500_000_000, aiFragment: 5_000_000 });
    expect(allianceProjectCost(5)).toMatchObject({ scrap: 8_000_000_000, aiFragment: 80_000_000 });
  });

  it("caps funding at what is missing, counts personal contributions and starts the build once funded", () => {
    const a = withMember();
    const m = rich();
    const part = fundAllianceProject(a, m, "forge", "self", { scrap: 900_000_000 }, NOW);
    expect(part.used).toEqual({ scrap: 500_000_000 });
    expect(m.resources.scrap).toBe(9_500_000_000);
    expect(part.alliance.projectContributors).toEqual({ m1: 500_000_000 });
    expect(part.started).toBeNull();
    expect(() => fundAllianceProject(part.alliance, m, "forge", "self", { scrap: 1 }, NOW)).toThrow(/déjà réunies/);
    expect(() => fundAllianceProject(part.alliance, m, "forge", "treasury", { energy: 1 }, NOW)).toThrow(/trésor/);
    const f = player("f");
    const rest = allianceProjectCost(1);
    delete rest.scrap;
    const done = fundAllianceProject(part.alliance, f, "forge", "treasury", rest, NOW);
    expect(done.started).toBe(NOW + 24 * 3600_000);
    expect(done.alliance.treasury!.energy).toBe(1_500_000_000);
    expect(() => fundAllianceProject(done.alliance, m, "forge", "self", { scrap: 1 }, NOW)).toThrow(/construction/);
    expect(allianceNextDueMs(done.alliance)).toBe(NOW + 24 * 3600_000);
  });

  it("completes the tier and gives the bonuses to every member", () => {
    const a = { ...withMember(), projects: { forge: { level: 1, funded: {}, buildEndMs: NOW + 1000 }, siege: { level: 2, funded: {}, buildEndMs: 0 }, bastion: { level: 5, funded: {}, buildEndMs: 0 } } };
    expect(finishAllianceResearch(a, NOW)).toBeNull();
    const out = finishAllianceResearch(a, NOW + 2000)!;
    expect(out.alliance!.projects!.forge).toEqual({ level: 2, funded: {}, buildEndMs: 0 });
    const levels = out.memberships.m1.allianceResearch;
    expect(levels).toMatchObject({ projet_forge: 2, projet_siege: 2, projet_bastion: 5 });
    expect(allianceForgeFactor(levels)).toBeCloseTo(0.96);
    expect(allianceSiegeFactor(levels)).toBeCloseTo(1.08);
    expect(allianceBastionBonus(levels)).toBeCloseTo(0.1);
    expect(out.logs[0].kind).toBe("project-done");
  });

  it("shortens build times with the Anneau-forge", () => {
    const p = player("m1", { allianceResearch: { projet_forge: 5 } });
    expect(playerBuildTimeFactor(p, NOW) / playerBuildTimeFactor(player("x"), NOW)).toBeCloseTo(0.9);
  });
});

describe("allianceProjectProgress", () => {
  it("weighs rare resources like the builders ranking (1 rare = 100 common)", () => {
    const cost = allianceProjectCost(1);
    expect(allianceProjectProgress(cost, {})).toBe(0);
    // Toutes les rares réunies : la moitié de la valeur du palier.
    const rares = { reinforcedSteel: cost.reinforcedSteel, cyberModule: cost.cyberModule, syntheticNanites: cost.syntheticNanites, aiFragment: cost.aiFragment };
    expect(allianceProjectProgress(cost, rares)).toBeCloseTo(0.5);
    // Le surplus d'une ressource ne compte pas pour les autres.
    expect(allianceProjectProgress(cost, { scrap: (cost.scrap ?? 0) * 10 })).toBeCloseTo(0.125);
    expect(allianceProjectProgress(cost, { ...cost })).toBe(1);
  });
});
