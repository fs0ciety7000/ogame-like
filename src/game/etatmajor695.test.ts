import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent } from "@/game/content";
import { clampEffect, EFFECT_CAP_RULES, effectCap } from "@/game/effects";
import { describeTechEffect, techEffectCap } from "@/game/technologies";
import { OFFICER_TUNING_RULES } from "@/game/commanders";
import { ECONOMY_RULES } from "@/game/economy";
import { BOUNTY_SHOP_RULES, SHOP_ITEMS } from "@/game/bounties";

/* 6.9.5 (AU8) : plafonds des bonus, officiers et Gelée réglables, sans doublon entre le Comptoir et les règles. */

afterEach(() => applyGameContent({}));

describe("6.9.5 plafonds des bonus réglables", () => {
  it("valeurs d'avant par défaut ; attaque et défense restent pilotées par combat.techCombatCap", () => {
    expect(effectCap("buildTime", "empire")).toBe(0.5);
    expect(effectCap("buildTime", "tech")).toBe(0.75);
    expect(EFFECT_CAP_RULES.attack).toBeUndefined();
    expect(techEffectCap("building_time")).toBe(0.75);
  });

  it("un plafond réglé s'applique au calcul et aux descriptions des technos", () => {
    applyGameContent({ rules: { effectCaps: { buildTime: { empire: 0.3, tech: 0.6 } } } } as never);
    expect(clampEffect("buildTime", "empire", 0.45)).toBe(0.3);
    expect(clampEffect("buildTime", "tech", 0.9)).toBe(0.6);
    // Fusion partielle : les autres grandeurs gardent leur plafond.
    expect(effectCap("researchTime", "empire")).toBe(0.5);
    expect(describeTechEffect({ type: "building_time", value: 0.1 }, 10)).toContain("60 %");
  });
});

describe("6.9.5 officiers, Gelée et Comptoir", () => {
  it("réglages appliqués ; plus de doublon dans les règles du Comptoir", () => {
    expect(BOUNTY_SHOP_RULES).not.toHaveProperty("boostPct");
    expect(BOUNTY_SHOP_RULES).not.toHaveProperty("pheromonePct");
    expect(BOUNTY_SHOP_RULES).not.toHaveProperty("priorityHours");
    applyGameContent({ rules: { officerTuning: { pheromonePct: 0.4 }, economy: { keshBoostPct: 0.3 } } } as never);
    expect(OFFICER_TUNING_RULES.pheromonePct).toBe(0.4);
    expect(OFFICER_TUNING_RULES.seasonSecondaryShare).toBe(0.5);
    expect(ECONOMY_RULES.keshBoostPct).toBe(0.3);
    expect(SHOP_ITEMS.find((i) => i.id === "pheromone")?.description).toContain("40 %");
  });
});
