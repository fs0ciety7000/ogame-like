import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent, currentGameContent } from "@/game/content";
import { defaultPlayerState } from "@/game/defaults";
import { addPassPoints, PASS_BONUS_RULES, PASS_POINTS, passBonusProgress, passMax, passState } from "@/game/seasonPass";
import type { PlayerState } from "@/types/game";

/* 6.11.0 (PRG-2, Z3) : paliers bonus répétables après le dernier palier du passe. */

const NOW = Date.UTC(2026, 9, 20, 12);

function finished(): PlayerState {
  const p = defaultPlayerState("u", "U") as PlayerState;
  const st = passState(p, NOW);
  p.seasonPass = { ...st, points: passMax(st.seasonId) };
  return p;
}
const tokens = (p: PlayerState) => p.casino?.tokens ?? 0;

afterEach(() => applyGameContent({}));

describe("6.11.0 paliers bonus du passe", () => {
  it("chaque tranche de points au-delà du maximum verse des jetons, plafonnés par mois", () => {
    const p = finished();
    const before = tokens(p);
    const per = PASS_POINTS.victory;
    const needed = Math.ceil(PASS_BONUS_RULES.points / per);
    addPassPoints(p, "victory", NOW, needed - 1);
    expect(tokens(p)).toBe(before);
    addPassPoints(p, "victory", NOW, 1);
    expect(tokens(p)).toBe(before + PASS_BONUS_RULES.tokens);
    expect(passBonusProgress(passState(p, NOW))?.tiers).toBe(1);
    // Beaucoup de points : jamais plus que le plafond du mois.
    addPassPoints(p, "victory", NOW, 10_000);
    expect(tokens(p)).toBe(before + PASS_BONUS_RULES.maxPerMonth * PASS_BONUS_RULES.tokens);
    expect(passBonusProgress(passState(p, NOW))).toMatchObject({ tiers: PASS_BONUS_RULES.maxPerMonth, into: PASS_BONUS_RULES.points });
  });

  it("rien avant le dernier palier ; nouveau mois remis à zéro ; désactivable dans l'admin", () => {
    const p = defaultPlayerState("v", "V") as PlayerState;
    addPassPoints(p, "victory", NOW, 3);
    expect(passState(p, NOW).bonusPoints).toBeUndefined();
    const f = finished();
    addPassPoints(f, "victory", NOW, 200);
    expect(passState(f, Date.UTC(2026, 10, 2)).bonusTiers).toBeUndefined();
    applyGameContent({ rules: { ...currentGameContent().rules, passBonus: { ...PASS_BONUS_RULES, enabled: false } } });
    const g = finished();
    const t0 = tokens(g);
    addPassPoints(g, "victory", NOW, 200);
    expect(tokens(g)).toBe(t0);
    expect(passBonusProgress(passState(g, NOW))).toBeNull();
  });
});
