import { describe, expect, it } from "vitest";
import { applyXpDelta } from "@/game/seasons";
import { computeCombatXp, PVP_RULES } from "@/game/pvp";
import { applyXpTiers, tieredAmount, validateXpTierRules, XP_TIER_RULES, xpTierStatus } from "@/game/xpTiers";
import type { PlayerState } from "@/types/game";

const NOW = Date.UTC(2026, 9, 7, 10); // mercredi, hors week-end à bonus
const rules = { ...XP_TIER_RULES, eventScaling: false };

describe("paliers d'XP journaliers", () => {
  it("calcule l'XP créditée par morceaux (100 %, 50 %, 25 %)", () => {
    expect(tieredAmount(0, 1000, [3000, 6000])).toBe(1000);
    expect(tieredAmount(2500, 1000, [3000, 6000])).toBe(500 + 250);
    expect(tieredAmount(5500, 1000, [3000, 6000])).toBe(250 + 125);
    expect(tieredAmount(9000, 1000, [3000, 6000])).toBe(250);
  });

  it("applique les seuils de la source, jour par jour (heure de Paris)", () => {
    const p = { stats: {} } as Pick<PlayerState, "stats">;
    const [first] = rules.tiers.mission;
    expect(applyXpTiers(p, "mission", first, NOW, rules)).toBe(first);
    expect(applyXpTiers(p, "mission", 60, NOW, rules)).toBe(30);
    // Autre source : compteur séparé, plein tarif (bonus de défense compris).
    expect(applyXpTiers(p, "defense", 40, NOW, rules)).toBe(Math.round(40 * (rules.multipliers.defense ?? 1)));
    // Lendemain : remise à zéro.
    expect(applyXpTiers(p, "mission", 60, NOW + 24 * 3600_000, rules)).toBe(60);
  });

  it("applique le bonus au jeu actif avant les paliers", () => {
    const p = { stats: {} } as Pick<PlayerState, "stats">;
    expect(applyXpTiers(p, "expedition", 100, NOW, rules)).toBe(150);
    expect(applyXpTiers(p, "bounty", 100, NOW, rules)).toBe(150);
  });

  it("laisse passer les succès, les pertes et les règles désactivées", () => {
    const p = { stats: {} } as Pick<PlayerState, "stats">;
    expect(applyXpTiers(p, "achievement", 50_000, NOW, rules)).toBe(50_000);
    expect(applyXpTiers(p, "attack", -20, NOW, rules)).toBe(-20);
    expect(applyXpTiers(p, "mission", 9000, NOW, { ...rules, enabled: false })).toBe(9000);
  });

  it("suit le bonus de missions des week-ends à événement quand eventScaling est actif", () => {
    // Sans événement à cette date : seuils de base.
    const st = xpTierStatus({ stats: {} }, NOW, XP_TIER_RULES).find((s) => s.source === "mission")!;
    expect(st.thresholds).toEqual(XP_TIER_RULES.tiers.mission);
    expect(st.rate).toBe(1);
  });

  it("est appliqué par applyXpDelta et renvoie l'XP réellement créditée", () => {
    const p = { xp: 0, seasonXp: 0, stats: {} } as unknown as PlayerState;
    const t = XP_TIER_RULES.tiers.mission;
    applyXpDelta(p, t[0], NOW, "mission");
    expect(applyXpDelta(p, 100, NOW, "mission")).toBe(Math.round(100 * XP_TIER_RULES.midRate));
    expect(p.xp).toBe(t[0] + Math.round(100 * XP_TIER_RULES.midRate));
    const status = xpTierStatus(p, NOW).find((s) => s.source === "mission")!;
    expect(status.rate).toBe(XP_TIER_RULES.midRate);
  });

  it("valide les réglages", () => {
    expect(validateXpTierRules(XP_TIER_RULES)).toEqual([]);
    expect(validateXpTierRules({ midRate: 2 })).toHaveLength(1);
    expect(validateXpTierRules({ tiers: { ...XP_TIER_RULES.tiers, mission: [5000, 1000] } })).toHaveLength(1);
  });
});

describe("combats contre les PNJ (5.18)", () => {
  it("ne coûte pas d'XP en cas de défaite, et rapporte au moins le minimum en cas de victoire", () => {
    expect(computeCombatXp("defender_win", 100, 1000, true).attackerXp).toBe(0);
    expect(computeCombatXp("attacker_win", 100_000, 100, true).attackerXp).toBe(PVP_RULES.npcWinMinXp);
    expect(computeCombatXp("attacker_win", 1000, 1500, true).attackerXp).toBe(60);
    // Contre un joueur, rien ne change.
    expect(computeCombatXp("defender_win", 100, 1000, false).attackerXp).toBe(-20);
  });
});
