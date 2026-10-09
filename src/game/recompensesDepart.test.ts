import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { claimGuideStep, GUIDE_AMBER, GUIDE_REWARDS, GUIDE_STEPS, guideStepReward } from "@/game/advancedGuide";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { ONBOARDING_STEPS, onboardingRankXp } from "@/game/onboarding";
import { DEFAULT_FACTIONS, defensivePower, isTutorialRaid, productionHours, resolvePirateRaid } from "@/game/pirates";
import { getProductionRatesPerSecond } from "@/game/production";
import { REGISTERED_RULES } from "@/game/ruleRegistry";
import {
  cappedGuideReward,
  claimStartReserve,
  isYoungAccount,
  splitProductionReward,
  START_REWARD_RULES,
  startReserveReady,
  startReserveTotal,
  tutorialRaidBounty,
} from "@/game/startRewards";
import { grantPassReward } from "@/game/seasonPass";
import { achievementReward, type AchievementDef } from "@/game/achievements";
import { claimStreak, streakReward } from "@/game/streak";
import { pendingClaims } from "@/game/claimAll";
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
    // Les raids ordinaires visent un compte de 72 h au moins (plus « compte jeune » : prime entière, 6.14.165).
    first.player.createdAtMs = NOW - 72 * 3_600_000;
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

/* 6.14.165 (S6, NJ-25) : toute récompense exprimée en heures de production reçue par un compte jeune vaut au plus
   `youngCapMinutes` de production au versement ; le reste va à la réserve du départ, versée par « Tout réclamer » ensuite. */
describe("I50 : compte jeune, toutes les récompenses en heures", () => {
  const HOUR = 3_600_000;
  /** Compte inscrit il y a `minutes` minutes, extracteurs au niveau 5 (parcours joué : palier 1 du passe à la 24e minute). */
  const young = (minutes = 24): PlayerState => {
    const p = newcomer(5);
    p.createdAtMs = NOW - minutes * 60_000;
    return p;
  };
  const hourOf = (p: PlayerState) => productionHours(p, 1);
  const sum = (r: Partial<Record<ResourceId, number>>) => Object.values(r).reduce((a, b) => a + (b ?? 0), 0);

  it("palier 1 du passe (2 h) à la 24e minute : 60 min versées, 60 min en réserve, rien de perdu", () => {
    const p = young();
    const before = { ...p.resources };
    const label = grantPassReward(p, { kind: "production", hours: 2 }, "2026-10", NOW);
    for (const res of COMMONS) {
      expect(p.resources[res]! - (before[res] ?? 0), res).toBe(hourOf(p)[res] ?? 0);
      expect((p.resources[res]! - (before[res] ?? 0)) / (perMinute(p, res) || 1)).toBeLessThanOrEqual(60);
    }
    expect(label).toContain("réserve du départ");
    expect(sum(p.startReserve ?? {})).toBe(sum(productionHours(p, 2)) - sum(hourOf(p)));
    // La réserve attend la fin de la première journée, puis « Tout réclamer » la verse.
    expect(startReserveReady(p, NOW)).toBe(false);
    expect(pendingClaims(p, NOW).some((c) => c.type === "startReserveClaim")).toBe(false);
    expect(() => claimStartReserve(p, NOW)).toThrow();
    const later = p.createdAtMs! + START_REWARD_RULES.youngAccountHours * HOUR;
    expect(pendingClaims(p, later).some((c) => c.type === "startReserveClaim")).toBe(true);
    const reserve = { ...p.startReserve };
    const scrap = p.resources.scrap;
    expect(claimStartReserve(p, later)).toEqual(reserve);
    expect(p.resources.scrap).toBe(scrap + (reserve.scrap ?? 0));
    expect(startReserveTotal(p)).toBe(0);
    // Total versé = ancien montant (2 h de la production du moment).
    expect(p.resources.scrap - (before.scrap ?? 0)).toBe(productionHours(p, 2).scrap);
  });

  it("succès or (2 h) et série du jour 2 (1,5 h) : plafonnés pour un compte jeune, entiers ensuite", () => {
    const gold = { id: "x", tier: "or", rewardHours: 2 } as unknown as AchievementDef;
    const p = young(30);
    expect(achievementReward(gold, p, NOW)).toEqual(hourOf(p));
    expect(sum(p.startReserve ?? {})).toBeGreaterThan(0);
    const old = young(25 * 60);
    expect(isYoungAccount(old, NOW)).toBe(false);
    expect(achievementReward(gold, old, NOW)).toEqual(productionHours(old, 2));
    expect(old.startReserve ?? null).toBeNull();
    // Série : jour 2 (1,5 h) réclamé à minuit, 30 minutes après l'inscription.
    const s = young(30);
    const r = streakReward(s, 2, NOW);
    for (const res of COMMONS) expect(r.resources[res]).toBe(Math.max(2_000, hourOf(s)[res] ?? 0));
    expect(sum(r.deferred)).toBe(sum(productionHours(s, 1.5)) - sum(hourOf(s)));
    // Jour 1 (1 h) : rien en réserve.
    expect(sum(streakReward(s, 1, NOW).deferred)).toBe(0);
    s.streak = { count: 1, lastDay: "2026-10-08", best: 1, total: 1 };
    claimStreak(s, NOW);
    expect(sum(s.startReserve ?? {})).toBe(sum(r.deferred));
  });

  it("sans date d'inscription, règles décochées ou plafond à 0 : récompense entière", () => {
    const p = young();
    p.createdAtMs = undefined;
    expect(splitProductionReward(p, 2, NOW).deferred).toEqual({});
    const q = young();
    START_REWARD_RULES.youngCapMinutes = 0;
    expect(splitProductionReward(q, 2, NOW).deferred).toEqual({});
    START_REWARD_RULES.youngCapMinutes = 60;
    START_REWARD_RULES.enabled = false;
    expect(splitProductionReward(q, 2, NOW).paid).toEqual(productionHours(q, 2));
  });

  it("garde : chaque calcul en heures de production du moteur est classé (récompense plafonnée, ou coût et mesure)", () => {
    // Récompenses : `productionReward` / `splitProductionReward` / `youngRewardHours` (startRewards.ts). Un nouvel appel à
    // `productionHours(` doit être une récompense plafonnée ou figurer ici avec sa raison.
    const allowed: Record<string, number> = {
      "src/game/pirates.ts": 6, // définition, traités (coût), localisation d'un repaire (coût), tribut (3, coût)
      "src/game/warlords.ts": 3, // stock et butin des seigneurs PNJ (pillage, pas une récompense)
      "src/game/actions.ts": 1, // recrutement d'un officier (coût)
      "src/game/streak.ts": 2, // coffre du 7e jour (hors d'atteinte : 6 jours au moins > youngAccountHours ≤ 72 h) ; aperçu sans `now`
      "src/game/allianceBoss.ts": 1, // coût d'invocation du boss d'alliance
      "src/game/seasonWars.ts": 1, // bouclier de guerre (coût)
      "src/game/allianceChallenge.ts": 1, // objectif d'alliance (mesure)
      "src/game/allianceDaily.ts": 1, // trésor d'alliance (mesure, pas versé au joueur)
      "src/game/expeditions.ts": 2, // péage (coût) ; trésor rare (heures déjà plafonnées par `youngRewardHours`)
      "src/game/challenges.ts": 1, // défi sans `now` (titre seul ou ancien appel) : le serveur passe `now`
      "src/game/leviathan.ts": 1, // Léviathan sans `now` (le serveur passe `now`)
    };
    const found: Record<string, number> = {};
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) {
          if (name !== "balance") walk(path);
        } else if (/\.ts$/.test(name) && !/\.test\./.test(name)) {
          const n = (readFileSync(path, "utf8").match(/productionHours\(/g) ?? []).length;
          if (n > 0) found[path] = n;
        }
      }
    };
    walk("src/game");
    expect(found).toEqual(allowed);
  });
});
