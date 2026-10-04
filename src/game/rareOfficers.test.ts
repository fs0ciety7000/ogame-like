import { describe, expect, it } from "vitest";
import { COMMANDER_ROLES, COMMANDERS, RARE_ROLES, RECRUITABLE_ROLES, recruitCommander, rollRareOfficer, ROLE_EFFECTS, missingRareOfficers, commandersState, xpForLevel, COMMANDER_SOURCES } from "@/game/commanders";
import { playerModifiers } from "@/game/modifiers";
import { allianceFlightFactor } from "@/game/alliances";
import { getUnitBuildTime, UNITS } from "@/game/units";
import { marketTax } from "@/game/market";
import { giftDeliveryRate, GIFT_RULES } from "@/game/actions";
import { defaultPlayerState } from "@/game/defaults";
import { EFFECT_STATS } from "@/game/effects";
import type { PlayerState } from "@/types/game";

const withOfficer = (id: string, level: number) => ({ commanders: { roster: { [id]: { xp: xpForLevel(level) } }, active: [id], movedAtMs: {}, dossiers: 0 } as never });

describe("v5.14 douze rôles d'officiers", () => {
  it("douze rôles, sept rares, chacun avec des effets et des sources d'XP distincts", () => {
    expect(COMMANDER_ROLES).toHaveLength(12);
    expect(RECRUITABLE_ROLES).toHaveLength(5);
    expect(RARE_ROLES).toHaveLength(7);
    const signatures = COMMANDER_ROLES.map((r) => JSON.stringify(ROLE_EFFECTS[r].map((e) => [e.stat, e.scope ?? "all"])));
    expect(new Set(signatures).size).toBe(12);
    for (const r of COMMANDER_ROLES) {
      expect(COMMANDER_SOURCES[r].length).toBeGreaterThan(0);
      for (const e of ROLE_EFFECTS[r]) expect(EFFECT_STATS[e.stat]).toBeDefined();
      expect(COMMANDERS.find((c) => c.id === r)?.rare ?? false).toBe(RARE_ROLES.includes(r));
    }
  });

  it("un officier rare ne se recrute pas", () => {
    const p = { ...defaultPlayerState("u", "u") } as PlayerState;
    expect(() => recruitCommander(p, "corsair", () => {}, "amber")).toThrow(/ne se recrute pas/);
  });

  it("butin de boss : tirage très rare, jamais un doublon", () => {
    const p = { ...defaultPlayerState("u", "u") } as PlayerState;
    expect(rollRareOfficer(p, 0.002, () => 0.5)).toBeNull();
    const got = rollRareOfficer(p, 0.002, () => 0.001);
    expect(got?.rare).toBe(true);
    expect(commandersState(p).roster[got!.id]).toBeDefined();
    expect(missingRareOfficers(p)).toHaveLength(6);
    for (let i = 0; i < 10; i++) rollRareOfficer(p, 1, () => 0);
    expect(missingRareOfficers(p)).toHaveLength(0);
    expect(rollRareOfficer(p, 1, () => 0)).toBeNull();
  });

  it("chaque rôle rare agit là où il le dit", () => {
    const unit = UNITS[0];
    expect(allianceFlightFactor({}, {}, withOfficer("logistician", 10))).toBeCloseTo(0.9);
    expect(getUnitBuildTime(unit, {}, withOfficer("mechanic", 20))).toBe(Math.max(1, Math.round(getUnitBuildTime(unit) * 0.8)));
    expect(playerModifiers(withOfficer("corsair", 10)).loot).toBeCloseTo(0.1);
    expect(playerModifiers(withOfficer("warden", 10)).protectedStorage).toBeCloseTo(0.1);
    expect(playerModifiers(withOfficer("warden", 10)).counterSpy).toBeCloseTo(2);
    expect(playerModifiers(withOfficer("hunter", 10)).bossDamage).toBeCloseTo(0.15);
    // Diplomate : −40 % de taxe au niveau 20, sur le marché comme sur les cadeaux.
    const tradeTax = playerModifiers(withOfficer("diplomat", 20)).tradeTax;
    expect(marketTax(1000, false, tradeTax)).toBe(Math.floor(marketTax(1000, false) * 0.6));
    expect(giftDeliveryRate({ allianceId: "", ...withOfficer("diplomat", 20) }, { allianceId: "x" })).toBeCloseTo(1 - GIFT_RULES.outsideAllianceTax * 0.6);
    // Gouverneure : seulement dans les colonies.
    const gov = withOfficer("governor", 10);
    expect(playerModifiers(gov).productionAll).toBe(0);
    expect(playerModifiers(gov, Date.now(), "colonies").productionAll).toBeCloseTo(0.2);
    expect(playerModifiers(gov, Date.now(), "colonies").storage).toBeCloseTo(0.2);
  });
});
