import { describe, expect, it } from "vitest";
import { defaultPlayerState } from "@/game/defaults";
import { addPassPoints, claimPassTier, PASS_RULES, PASS_TIERS, passDailyLogin, passState, passTier, passTitle } from "@/game/seasonPass";
import { grantReferral, linkReferrer, referralDue, REFERRAL_RULES } from "@/game/referral";
import { bannerOptions } from "@/game/profile";
import { claimOnboarding, ONBOARDING_STEPS } from "@/game/onboarding";
import { chapterOf, STORY_CHAPTERS, TUTORIAL_TITLE } from "@/game/story";
import { bountyState } from "@/game/bounties";
import type { PlayerState } from "@/types/game";

const NOW = Date.UTC(2026, 9, 12, 12);
const DAY = 86_400_000;

function player(uid = "u1", pseudo = "Alpha"): PlayerState {
  const p = defaultPlayerState(uid, pseudo);
  p.createdAtMs = NOW - DAY;
  return p;
}

describe("v4.1 season pass", () => {
  it("rewards: 30 tiers, 370 amber, 3 dossiers and two relics", () => {
    expect(PASS_TIERS).toHaveLength(PASS_RULES.tiers);
    const all = PASS_TIERS.flat();
    expect(all.filter((r) => r.kind === "amber").reduce((a, r) => a + (r.kind === "amber" ? r.amount : 0), 0)).toBe(370);
    expect(all.filter((r) => r.kind === "dossier")).toHaveLength(3);
    expect(all.filter((r) => r.kind === "relic").map((r) => (r.kind === "relic" ? r.rarity : ""))).toEqual(["rare", "epic"]);
  });

  it("points from activity, one daily login per day, capped at 1200, reset each month", () => {
    const p = player();
    expect(passDailyLogin(p, NOW)).toBe(true);
    expect(passDailyLogin(p, NOW + 3600_000)).toBe(false);
    addPassPoints(p, "contract", NOW, 3);
    expect(passState(p, NOW).points).toBe(35);
    expect(passTier(35)).toBe(0);
    addPassPoints(p, "victory", NOW, 1000);
    expect(passState(p, NOW).points).toBe(1200);
    expect(passState(p, Date.UTC(2026, 10, 1)).points).toBe(0);
  });

  it("claims a reached tier once; the last tier gives a lasting banner and title", () => {
    const p = player();
    addPassPoints(p, "contract", NOW, 4);
    expect(() => claimPassTier(p, 2, NOW)).toThrow(/pas encore/);
    addPassPoints(p, "contract", NOW, 4);
    const amber = bountyState(p).amber;
    claimPassTier(p, 2, NOW);
    expect(bountyState(p).amber).toBe(amber + 20);
    expect(() => claimPassTier(p, 2, NOW)).toThrow(/déjà/);
    addPassPoints(p, "victory", NOW, 1000);
    const gained = claimPassTier(p, 30, NOW, () => 0.4);
    expect(gained.join(" ")).toMatch(/épique/);
    expect(p.titles?.map((t) => t.label)).toContain(passTitle("2026-10"));
    expect(passTitle("2026-10")).toBe("Vétéran d'octobre 2026");
    expect(passTitle("2026-11")).toBe("Vétéran de novembre 2026");
    expect(p.relics?.items[0].rarity).toBe("epic");
    // Le mois suivant : passe vierge, bannière gardée.
    const next = Date.UTC(2026, 10, 3);
    expect(passState(p, next).completed).toEqual(["2026-10"]);
    expect(bannerOptions({ ...p, seasonPass: passState(p, next) }).some((b) => b.id === "pass:2026-10" && b.unlocked)).toBe(true);
  });
});

describe("v4.1 referral", () => {
  it("links within 48 h, never to oneself, rewards at Bronze I after 3 days, 5 per month", () => {
    const sponsor = player("s", "Parrain");
    const recruit = player("r", "Filleul");
    expect(() => linkReferrer(recruit, recruit, NOW)).toThrow(/propre parrain/);
    linkReferrer(recruit, sponsor, NOW);
    expect(() => linkReferrer(recruit, sponsor, NOW)).toThrow(/déjà/);
    const late = player("x", "Tard");
    late.createdAtMs = NOW - 3 * DAY;
    expect(() => linkReferrer(late, sponsor, NOW)).toThrow(/48 h/);

    recruit.xp = REFERRAL_RULES.rewardXp;
    expect(referralDue(recruit, true, NOW)).toBe(false);
    expect(referralDue(recruit, true, NOW + 3 * DAY)).toBe(true);
    expect(referralDue(recruit, false, NOW + 3 * DAY)).toBe(false);
    expect(grantReferral(sponsor, recruit, NOW + 3 * DAY).capped).toBe(false);
    expect(bountyState(sponsor).amber).toBe(REFERRAL_RULES.amberSponsor);
    expect(bountyState(recruit).amber).toBe(REFERRAL_RULES.amberRecruit);
    expect(bannerOptions(sponsor).find((b) => b.id === "recruteur")?.unlocked).toBe(true);
    sponsor.referral = { ...sponsor.referral, monthly: { "2026-10": 5 } };
    expect(grantReferral(sponsor, player("r2"), NOW + 3 * DAY).capped).toBe(true);
  });
});

describe("v4.1 story tutorial", () => {
  it("three chapters over the ten steps, the Varan raid after the rockets, a title at the end", () => {
    expect(STORY_CHAPTERS.flatMap((c) => c.steps)).toEqual(ONBOARDING_STEPS.map((s) => s.id));
    expect(chapterOf([])?.id).toBe(1);
    expect(chapterOf(["scrap3", "reactor3", "research", "drones5"])?.id).toBe(2);
    const p = player();
    p.onboarding = { claimed: ONBOARDING_STEPS.filter((s) => s.id !== "rockets10" && s.id !== "rank").map((s) => s.id) };
    p.units = { ...p.units, roquette: { level: 1, count: 10 } };
    claimOnboarding(p, "rockets10");
    expect(p.onboarding?.tutorialRaid).toBe("due");
    p.xp = 1000;
    claimOnboarding(p, "rank");
    expect(p.titles?.map((t) => t.label)).toContain(TUTORIAL_TITLE);
  });
});
