import { describe, expect, it } from "vitest";
import { BUILDINGS } from "@/game/buildings";
import { claimGuideStep, guideClaimed, guideVisible, GUIDE_STEPS, GUIDE_TITLE, setGuideHidden } from "@/game/advancedGuide";
import { claimOnboarding, ONBOARDING_STEPS, onboardingRankXp, setOnboardingHidden } from "@/game/onboarding";
import { bountyState } from "@/game/bounties";
import { defaultPlayerState } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

function veteran(): PlayerState {
  const p = { ...defaultPlayerState("u1", "Vétéran"), createdAt: null } as unknown as PlayerState;
  p.xp = onboardingRankXp() * 10;
  return p;
}

describe("Carnet du commandant", () => {
  it("s'affiche après la prise en main et se masque", () => {
    const p = veteran();
    expect(guideVisible(p)).toBe(true);
    setGuideHidden(p, true);
    expect(guideVisible(p)).toBe(false);
    setGuideHidden(p, false);
    expect(guideVisible(p)).toBe(true);
    const novice = { ...defaultPlayerState("u2", "Novice"), createdAt: null } as unknown as PlayerState;
    expect(guideVisible(novice)).toBe(false);
  });

  it("vérifie l'objectif, verse la récompense une fois et survit aux réglages de la prise en main", () => {
    const p = veteran();
    expect(() => claimGuideStep(p, "colonyReady")).toThrow(/pas encore/);
    for (const b of BUILDINGS) p.buildings[b.id] = { level: 15, unlocked: true };
    const before = p.resources.scrap;
    claimGuideStep(p, "colonyReady");
    expect(p.resources.scrap).toBe(before + 2_000_000);
    expect(() => claimGuideStep(p, "colonyReady")).toThrow(/déjà/);
    setOnboardingHidden(p, true);
    expect(guideClaimed(p)).toEqual(["colonyReady"]);
  });

  it("verse l'Ambre et le titre final", () => {
    const p = veteran();
    p.onboarding = { claimed: [], advanced: GUIDE_STEPS.filter((s) => s.id !== "ascend").map((s) => s.id) };
    p.ascensions = 1;
    claimGuideStep(p, "ascend");
    expect(bountyState(p).amber).toBe(25);
    expect(p.titles?.some((t) => t.label === GUIDE_TITLE)).toBe(true);
    expect(guideVisible(p)).toBe(false);
  });

  it("la prise en main conserve le carnet", () => {
    const p = { ...defaultPlayerState("u3", "Nouveau"), createdAt: null } as unknown as PlayerState;
    p.onboarding = { claimed: [], advanced: ["colonyReady"] };
    p.buildings.extracteur_ferraille = { level: 3, unlocked: true };
    claimOnboarding(p, ONBOARDING_STEPS[0].id);
    expect(guideClaimed(p)).toEqual(["colonyReady"]);
  });

  it("6.4.1 : chapitre Empire (objectif du jour, classe) et route logistique", () => {
    const p = veteran();
    expect(() => claimGuideStep(p, "dailyGoal")).toThrow(/pas encore/);
    p.contracts = { day: "2026-10-06", items: [{ id: "x", type: "spy", target: 2, progress: 2, claimed: true }], streak: 0, lastCompletedDay: null, rerolled: false } as never;
    claimGuideStep(p, "dailyGoal");
    expect(() => claimGuideStep(p, "empireClass")).toThrow(/pas encore/);
    p.empireClass = { id: "industriel", chosenAtMs: 1 } as never;
    claimGuideStep(p, "empireClass");
    expect(bountyState(p).amber).toBe(10);
    expect(() => claimGuideStep(p, "colonyRoute")).toThrow(/pas encore/);
  });

  it("un carnet déjà terminé rouvre seulement les nouvelles étapes, titre conservé", () => {
    const p = veteran();
    const old = GUIDE_STEPS.filter((s) => !["dailyGoal", "empireClass", "colonyRoute"].includes(s.id)).map((s) => s.id);
    p.onboarding = { claimed: [], advanced: old };
    p.titles = [{ label: GUIDE_TITLE, seasonId: "onboarding", rank: 1 }];
    expect(guideVisible(p)).toBe(true);
    expect(guideClaimed(p)).toHaveLength(old.length);
  });
});

