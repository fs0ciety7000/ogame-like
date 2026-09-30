import { describe, expect, it } from "vitest";
import {
  addMember,
  ALLIANCE_RULES,
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

  it("caps members at 6", () => {
    let a = make();
    for (let i = 1; i < ALLIANCE_RULES.maxMembers; i++) a = addMember(a, { uid: `m${i}`, pseudo: `M${i}` });
    expect(a.members).toHaveLength(6);
    expect(() => addMember(a, { uid: "x", pseudo: "X" })).toThrow(/complète/);
    expect(() => addMember(make(), { uid: "f", pseudo: "F" })).toThrow(/déjà/);
  });

  it("hands over leadership when the founder leaves, disbands when the last one leaves", () => {
    let a = addMember(addMember(make(), { uid: "a", pseudo: "A" }), { uid: "b", pseudo: "B" });
    a = setOfficer(a, "f", "b", true);
    const after = removeMember(a, "f")!;
    expect(after.createdBy).toBe("b");
    expect(allianceRole(after, "b")).toBe("founder");
    expect(removeMember(make(), "f")).toBeNull();
    expect(() => kickMember(after, "a", "b")).toThrow(/fondateur/);
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
    expect(() => distribute(a, "m", "f", { scrap: 10 }, NOW)).toThrow(/officiers/);
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
