import { describe, expect, it } from "vitest";
import { defaultPlayerState } from "@/game/defaults";
import { learnTalent, resetTalents, TALENTS, talentPoints } from "@/game/talents";
import { playerModifiers } from "@/game/modifiers";
import type { PlayerState } from "@/types/game";

const NOW = Date.UTC(2026, 9, 10, 12);

function player(ascensions: number): PlayerState {
  const p = { ...defaultPlayerState("u", "u"), createdAt: null } as unknown as PlayerState;
  p.uid = "u";
  p.ascensions = ascensions;
  return p;
}

describe("v5.1 : talents d'Ascension", () => {
  it("3 branches de 5 talents, 3 points par ascension", () => {
    expect(TALENTS).toHaveLength(15);
    for (const b of ["economie", "guerre", "logistique"]) expect(TALENTS.filter((t) => t.branch === b)).toHaveLength(5);
    expect(talentPoints(player(0)).total).toBe(0);
    expect(talentPoints(player(2)).total).toBe(6);
  });

  it("rangs +2 % chacun, plafond de rang et de points, effets dans les modificateurs", () => {
    const p = player(1);
    expect(() => learnTalent(player(0), "assaut")).toThrow(/Aucun point/);
    learnTalent(p, "assaut");
    learnTalent(p, "assaut");
    learnTalent(p, "assaut");
    expect(() => learnTalent(p, "assaut")).toThrow(/maximum/);
    expect(playerModifiers(p).attack).toBeCloseTo(0.06);
    const q = player(1);
    learnTalent(q, "fonderies");
    learnTalent(q, "chantiers");
    learnTalent(q, "reseau");
    expect(() => learnTalent(q, "rendement")).toThrow(/Aucun point/);
    const m = playerModifiers(q);
    expect(m.production.scrap).toBeCloseTo(0.02);
    expect(m.buildTime).toBeCloseTo(0.02);
    expect(m.spyLevel).toBeCloseTo(0.2);
    expect(() => learnTalent(q, "inconnu")).toThrow(/inconnu/);
  });

  it("redistribution une fois par saison", () => {
    const p = player(1);
    expect(() => resetTalents(p, NOW)).toThrow(/Aucun talent/);
    learnTalent(p, "rempart");
    resetTalents(p, NOW);
    expect(talentPoints(p)).toMatchObject({ spent: 0, free: 3 });
    learnTalent(p, "rempart");
    expect(() => resetTalents(p, NOW)).toThrow(/déjà redistribué/);
    expect(() => resetTalents(p, NOW + 40 * 86_400_000)).not.toThrow();
  });
});
