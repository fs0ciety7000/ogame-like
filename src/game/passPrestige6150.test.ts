import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent, currentGameContent } from "@/game/content";
import { defaultPlayerState } from "@/game/defaults";
import { bannerOptions } from "@/game/profile";
import { METRICS } from "@/game/achievements";
import { prestigeDay } from "@/game/passSeasons";
import { activePass, addPassPoints, PASS_BONUS_RULES, PASS_POINTS, PASS_PRESTIGE_RULES, passMax, passPrestigeProgress, passPrestigeSize, passState } from "@/game/seasonPass";
import type { PlayerState } from "@/types/game";

/* 6.14.150 (AP-11, lot R2, proposals/rythme-du-passe.md) : paliers de prestige cosmétiques après le dernier palier du passe. */

const NOW = Date.UTC(2026, 9, 20, 12);
const NEXT_MONTH = Date.UTC(2026, 10, 3, 12);

function finished(): PlayerState {
  const p = defaultPlayerState("u", "U") as PlayerState;
  const st = passState(p, NOW);
  p.seasonPass = { ...st, points: passMax(st.seasonId) };
  return p;
}

/** Verse au moins `points` points de passe par victoires. */
function earn(p: PlayerState, points: number): void {
  addPassPoints(p, "victory", NOW, Math.ceil(points / PASS_POINTS.victory));
}

afterEach(() => applyGameContent({}));

describe("6.14.150 prestige du passe", () => {
  it("un palier de prestige vaut tierFactor paliers du passe du mois", () => {
    const seasonId = passState(finished(), NOW).seasonId;
    expect(passPrestigeSize(seasonId)).toBe(Math.round(PASS_PRESTIGE_RULES.tierFactor * activePass(seasonId).pointsPerTier));
    expect(PASS_PRESTIGE_RULES).toMatchObject({ enabled: true, tiers: 10, tierFactor: 4 });
  });

  it("rien avant le dernier palier ; ensuite chaque point avance le prestige", () => {
    const p = defaultPlayerState("u", "U") as PlayerState;
    earn(p, 30);
    expect(passPrestigeProgress(passState(p, NOW))).toMatchObject({ level: 0, into: 0 });
    const q = finished();
    const size = passPrestigeSize(passState(q, NOW).seasonId);
    earn(q, size);
    const pr = passPrestigeProgress(passState(q, NOW))!;
    expect(pr.level).toBe(1);
    expect(pr.max).toBe(PASS_PRESTIGE_RULES.tiers);
  });

  it("cosmétique : aucune ressource, Ambre ni jeton de plus que sans prestige", () => {
    applyGameContent({ rules: { ...currentGameContent().rules, passBonus: { ...PASS_BONUS_RULES, enabled: false } } });
    const withPrestige = finished();
    earn(withPrestige, 50_000);
    applyGameContent({ rules: { ...currentGameContent().rules, passBonus: { ...PASS_BONUS_RULES, enabled: false }, passPrestige: { ...PASS_PRESTIGE_RULES, enabled: false } } });
    const without = finished();
    earn(without, 50_000);
    expect(withPrestige.resources).toEqual(without.resources);
    expect(withPrestige.bounties).toEqual(without.bounties);
    expect(withPrestige.casino).toEqual(without.casino);
    expect(withPrestige.titles ?? []).toEqual(without.titles ?? []);
  });

  it("tous les paliers : la saison rejoint `prestiged`, une bannière se débloque, le succès se mesure", () => {
    const p = finished();
    const seasonId = passState(p, NOW).seasonId;
    expect(bannerOptions(p).some((b) => b.id === `prestige:${seasonId}`)).toBe(false);
    earn(p, passPrestigeSize(seasonId) * PASS_PRESTIGE_RULES.tiers + 5_000);
    const st = passState(p, NOW);
    expect(passPrestigeProgress(st)).toMatchObject({ level: PASS_PRESTIGE_RULES.tiers, into: passPrestigeSize(seasonId) });
    // Points plafonnés à la valeur de tous les paliers de prestige.
    expect(st.prestigePoints).toBe(passPrestigeSize(seasonId) * PASS_PRESTIGE_RULES.tiers);
    expect(st.prestiged).toEqual([seasonId]);
    const banner = bannerOptions(p).find((b) => b.id === `prestige:${seasonId}`);
    expect(banner?.unlocked).toBe(true);
    expect(METRICS.passesPrestiged.value(p)).toBe(1);
    earn(p, 1_000);
    expect(passState(p, NOW).prestiged).toEqual([seasonId]);
  });

  it("le mois suivant : prestige remis à zéro, saisons au prestige complet gardées", () => {
    const p = finished();
    const seasonId = passState(p, NOW).seasonId;
    earn(p, passPrestigeSize(seasonId) * PASS_PRESTIGE_RULES.tiers);
    const next = passState(p, NEXT_MONTH);
    expect(next.seasonId).not.toBe(seasonId);
    expect(next.prestigePoints).toBeUndefined();
    expect(next.prestiged).toEqual([seasonId]);
    expect(passPrestigeProgress(next)?.level).toBe(0);
  });

  it("désactivé ou réglé dans l'admin (Passe : paliers de prestige)", () => {
    applyGameContent({ rules: { ...currentGameContent().rules, passPrestige: { ...PASS_PRESTIGE_RULES, enabled: false } } });
    const p = finished();
    earn(p, 10_000);
    expect(passPrestigeProgress(passState(p, NOW))).toBeNull();
    expect(passState(p, NOW).prestigePoints).toBeUndefined();
    applyGameContent({ rules: { ...currentGameContent().rules, passPrestige: { tiers: 3 } } });
    expect(PASS_PRESTIGE_RULES).toMatchObject({ enabled: true, tiers: 3, tierFactor: 4 });
    const q = finished();
    earn(q, passPrestigeSize(passState(q, NOW).seasonId) * 3);
    expect(passPrestigeProgress(passState(q, NOW))).toMatchObject({ level: 3, max: 3 });
  });

  it("jour du dernier palier de prestige du plus actif (simulateur)", () => {
    const season = { pointsPerTier: 60, tiers: Array(30).fill([]) };
    // 1 800 points du passe + 10 × 240 de prestige = 4 200 points à 171 par jour : jour 25.
    expect(prestigeDay(season, 10, 171)).toBe(25);
    expect(prestigeDay(season, 27, 400)).toBe(27);
    expect(prestigeDay(season, null, 171)).toBeNull();
    expect(prestigeDay(season, 10, 20)).toBeNull();
    applyGameContent({ rules: { ...currentGameContent().rules, passPrestige: { ...PASS_PRESTIGE_RULES, enabled: false } } });
    expect(prestigeDay(season, 10, 171)).toBeUndefined();
  });
});
