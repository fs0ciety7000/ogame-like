import { afterEach, describe, expect, it } from "vitest";
import { claimGuideStep, GUIDE_AMBER, GUIDE_REWARDS, GUIDE_STEPS, guideStepReward } from "@/game/advancedGuide";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { ONBOARDING_STEPS, onboardingRankXp } from "@/game/onboarding";
import { DEFAULT_FACTIONS, defensivePower, isTutorialRaid, productionHours, resolvePirateRaid } from "@/game/pirates";
import { getProductionRatesPerSecond } from "@/game/production";
import { REGISTERED_RULES } from "@/game/ruleRegistry";
import { cappedGuideReward, START_REWARD_RULES, tutorialRaidBounty } from "@/game/startRewards";
import type { PlayerState, ResourceId } from "@/types/game";

/* 6.14.163 (S3, docs/proposals/recompenses-du-depart.md) : récompenses du départ (invariant I50). */

const DEFAULTS = structuredClone(START_REWARD_RULES);
const GUIDE_DEFAULTS = structuredClone(GUIDE_REWARDS);
afterEach(() => {
  Object.assign(START_REWARD_RULES, structuredClone(DEFAULTS));
  for (const k of Object.keys(GUIDE_REWARDS)) delete GUIDE_REWARDS[k];
  Object.assign(GUIDE_REWARDS, structuredClone(GUIDE_DEFAULTS));
});

const NOW = Date.parse("2026-10-09T12:00:00Z");
const COMMONS: ResourceId[] = ["scrap", "energy", "nano", "data"];
const EXTRACTORS = ["extracteur_ferraille", "reacteur_instable", "extracteur_nanocomposants", "archives_fracturees"];

/** Compte neuf aux 4 extracteurs au niveau `level` (le parcours joué : niveau 4 à la 18e minute). */
function newcomer(level: number): PlayerState {
  const p = { ...defaultPlayerState("n1", "Recrue"), createdAt: null, createdAtMs: NOW - 18 * 60_000 } as unknown as PlayerState;
  for (const id of EXTRACTORS) p.buildings[id] = { level, unlocked: true };
  return p;
}
const perMinute = (p: PlayerState, res: ResourceId) => (getProductionRatesPerSecond(p.buildings, p.techLevels)[res] ?? 0) * 60;
const varan = DEFAULT_FACTIONS.find((f) => f.id === "varan")!;

describe("I50 : récompenses du départ", () => {
  it("prime du raid d'initiation : minutes de production réparties comme les coûts, jamais plus de 60 min", () => {
    const p = newcomer(4);
    const bounty = tutorialRaidBounty(p);
    for (const res of COMMONS) {
      const minutes = START_REWARD_RULES.tutorialRaidMinutes[res];
      expect(bounty[res]).toBe(Math.max(START_REWARD_RULES.tutorialRaidFloor, Math.floor(perMinute(p, res) * minutes)));
      expect(minutes).toBeLessThanOrEqual(60);
    }
    expect(bounty.scrap!).toBeGreaterThan(bounty.energy!);
    expect(bounty.energy!).toBeGreaterThan(bounty.nano!);
    // Avant : 4 h de chaque (216 000 de chaque à 15/s). Désormais moins d'un dixième du total.
    const old = productionHours(p, varan.bounty.hours);
    const sum = (r: Partial<Record<ResourceId, number>>) => Object.values(r).reduce((a, b) => a + (b ?? 0), 0);
    expect(sum(bounty)).toBeLessThan(sum(old) / 10);
  });

  it("le raid repoussé verse la prime d'initiation une seule fois, puis la prime ordinaire de la faction", () => {
    const p = newcomer(4);
    p.units = { roquette: { level: 1, count: 10 } };
    p.onboarding = { claimed: [], tutorialRaid: "sent" };
    const first = resolvePirateRaid(varan, p, defaultQueues(), 5, [], NOW);
    expect(first.combat.outcome).toBe("defender_win");
    expect(first.bounty).toEqual(tutorialRaidBounty(p));
    const second = resolvePirateRaid(varan, first.player, defaultQueues(), Math.max(1, Math.round(defensivePower(first.player) * 0.25)), [], NOW + 60_000);
    expect(second.combat.outcome).toBe("defender_win");
    expect(second.bounty).toEqual(productionHours(first.player, varan.bounty.hours));
  });

  it("raid d'initiation : seulement la faction du tutoriel, raid lancé, aucun raid résolu ; règles décochées : ancienne prime", () => {
    const sent = { onboarding: { claimed: [], tutorialRaid: "sent" as const } };
    expect(isTutorialRaid(sent, "varan", { raidsWon: 0, raidsLost: 0 })).toBe(true);
    expect(isTutorialRaid(sent, "gravhorn", { raidsWon: 0, raidsLost: 0 })).toBe(false);
    expect(isTutorialRaid(sent, "varan", { raidsWon: 1, raidsLost: 0 })).toBe(false);
    expect(isTutorialRaid({ onboarding: { claimed: [], tutorialRaid: "due" } }, "varan", { raidsWon: 0, raidsLost: 0 })).toBe(false);
    START_REWARD_RULES.enabled = false;
    expect(isTutorialRaid(sent, "varan", { raidsWon: 0, raidsLost: 0 })).toBe(false);
  });

  it("Carnet : chaque ressource commune vaut au plus 60 min de production (au moins le plancher) ; rares et Ambre inchangés", () => {
    const p = newcomer(5);
    const daily = GUIDE_STEPS.find((s) => s.id === "dailyGoal")!;
    const reward = guideStepReward(daily, p);
    for (const res of ["scrap", "energy"] as ResourceId[]) {
      expect(reward[res]).toBe(Math.max(START_REWARD_RULES.guideCapFloor, Math.floor(perMinute(p, res) * START_REWARD_RULES.guideCapMinutes)));
      expect(reward[res]!).toBeLessThan(300_000);
    }
    // Un joueur avancé reçoit le montant réglé.
    const veteran = newcomer(15);
    expect(guideStepReward(daily, veteran)).toEqual(GUIDE_REWARDS.dailyGoal);
    // Les rares ne sont pas plafonnées.
    expect(cappedGuideReward({ reinforcedSteel: 200_000 }, p)).toEqual({ reinforcedSteel: 200_000 });
    // Règles décochées : montants fixes.
    START_REWARD_RULES.enabled = false;
    expect(guideStepReward(daily, p)).toEqual(GUIDE_REWARDS.dailyGoal);
  });

  it("Carnet : la réclamation verse la récompense plafonnée affichée", () => {
    const p = newcomer(5);
    p.xp = onboardingRankXp() * 10;
    p.contracts = { day: "2026-10-09", items: [{ id: "x", type: "spy", target: 2, progress: 2, claimed: true }], streak: 0, lastCompletedDay: null, rerolled: false } as never;
    const expected = guideStepReward(GUIDE_STEPS.find((s) => s.id === "dailyGoal")!, p);
    const before = p.resources.scrap;
    const out = claimGuideStep(p, "dailyGoal");
    expect(out.resources).toEqual(expected);
    expect(p.resources.scrap).toBe(before + expected.scrap!);
  });

  it("prise en main : chaque récompense commune vaut au plus 60 min de production d'un compte aux extracteurs niveau 3", () => {
    const p = newcomer(3);
    for (const step of ONBOARDING_STEPS)
      for (const res of COMMONS) expect(step.reward[res] ?? 0, `${step.id} ${res}`).toBeLessThanOrEqual(perMinute(p, res) * 60);
  });

  it("réglages : groupes dans le registre, récompenses du Carnet lues à l'usage", () => {
    expect(REGISTERED_RULES.startRewards.target()).toBe(START_REWARD_RULES);
    expect(REGISTERED_RULES.guideRewards.target()).toBe(GUIDE_REWARDS);
    expect(REGISTERED_RULES.guideAmber.target()).toBe(GUIDE_AMBER);
    GUIDE_REWARDS.dailyGoal = { scrap: 1_234 };
    expect(GUIDE_STEPS.find((s) => s.id === "dailyGoal")!.reward).toEqual({ scrap: 1_234 });
    expect(GUIDE_STEPS.find((s) => s.id === "ascend")!.amber).toBe(GUIDE_AMBER.ascend);
  });
});
