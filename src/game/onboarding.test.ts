import { describe, expect, it } from "vitest";
import { defaultPlayerState } from "@/game/defaults";
import { claimOnboarding, ONBOARDING_STEPS, onboardingEligible, onboardingProgress, setOnboardingHidden } from "@/game/onboarding";
import type { PlayerState } from "@/types/game";

function newbie(): PlayerState {
  return { ...defaultPlayerState("u1", "Nova"), createdAt: null } as unknown as PlayerState;
}

describe("onboarding", () => {
  it("has ten steps and a newbie is eligible", () => {
    expect(ONBOARDING_STEPS).toHaveLength(10);
    expect(onboardingEligible(newbie())).toBe(true);
  });

  it("advanced players who never claimed don't see it", () => {
    const p = newbie();
    p.xp = 5000;
    expect(onboardingEligible(p)).toBe(false);
    p.onboarding = { claimed: ["scrap3"] };
    expect(onboardingEligible(p)).toBe(true);
  });

  it("pays a reached step once, refuses unreached or repeated claims", () => {
    const p = newbie();
    expect(() => claimOnboarding(p, "scrap3")).toThrow(/pas encore/);
    p.buildings.extracteur_ferraille = { level: 3, unlocked: true };
    const before = p.resources.scrap;
    claimOnboarding(p, "scrap3");
    expect(p.resources.scrap).toBe(before + 1000);
    expect(() => claimOnboarding(p, "scrap3")).toThrow(/déjà/);
    expect(() => claimOnboarding(p, "nope")).toThrow(/inconnu/);
    expect(onboardingProgress(p).find((s) => s.step.id === "scrap3")).toMatchObject({ done: true, claimed: true });
  });

  it("the last step grants the Recrue title and ends the onboarding", () => {
    const p = newbie();
    p.onboarding = { claimed: ONBOARDING_STEPS.slice(0, 9).map((s) => s.id) };
    p.xp = 300;
    claimOnboarding(p, "rank");
    expect(p.titles?.some((t) => t.label === "Recrue")).toBe(true);
    expect(onboardingEligible(p)).toBe(false);
  });

  it("can be hidden and shown again", () => {
    const p = newbie();
    setOnboardingHidden(p, true);
    expect(p.onboarding?.hidden).toBe(true);
    setOnboardingHidden(p, false);
    expect(p.onboarding).toEqual({ claimed: [], hidden: false });
  });
});
