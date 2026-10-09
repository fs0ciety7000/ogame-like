import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { CHANGELOG_INDEX } from "virtual:changelog-index";
import { claimModalSlot, releaseModalSlot, useModalSlot } from "@/store/modalSlotStore";
import { claimOnboarding, ONBOARDING_REWARDS, ONBOARDING_STEPS } from "@/game/onboarding";
import { findTech, getTechCost } from "@/game/technologies";
import { findUnit, unitResearchPath } from "@/game/units";
import { isNewcomer, NEWCOMER_NEWS_RULES } from "@/game/announcements";
import { changelogSince, isUnread } from "@/lib/changelog";
import { markdownBlocks } from "@/lib/markdownBlocks";
import { REGISTERED_RULES } from "@/game/ruleRegistry";
import { defaultPlayerState } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

/* 6.14.161 (S1) : bloquants du parcours d'un nouveau joueur (audit 2026-10-09, NJ-1, NJ-2, NJ-6, NJ-8, NJ-10, NJ-18). */

const ROOT = path.resolve(__dirname, "../..");
const src = (p: string) => readFileSync(path.join(ROOT, p), "utf8");
const HOUR = 3600_000;

describe("NJ-2 : une seule grande fenêtre à la fois (histoire, alerte de raid, annonce)", () => {
  afterEach(() => useModalSlot.setState({ owner: null }));

  it("la première fenêtre garde la place, l'autre attend qu'elle se ferme", () => {
    expect(claimModalSlot("story")).toBe(true);
    expect(claimModalSlot("raid-alert")).toBe(false);
    expect(claimModalSlot("story")).toBe(true);
    releaseModalSlot("raid-alert"); // sans effet : la place est à l'histoire
    expect(useModalSlot.getState().owner).toBe("story");
    releaseModalSlot("story");
    expect(claimModalSlot("raid-alert")).toBe(true);
    expect(useModalSlot.getState().owner).toBe("raid-alert");
  });

  it("l'histoire et l'alerte passent par la place ; l'alerte est une fenêtre modale Radix (touchers au premier plan)", () => {
    const story = src("src/components/game/StoryDialog.tsx");
    const alert = src("src/components/game/RaidAlert.tsx");
    expect(story).toContain('useExclusiveModal("story"');
    expect(alert).toContain('useExclusiveModal("raid-alert"');
    expect(src("src/components/game/Announcement.tsx")).toContain('useExclusiveModal("announcement"');
    expect(alert).toContain("<DialogPrimitive.Root");
    expect(alert).toContain("<DialogPrimitive.Title");
    // Plus de calque maison hors de Radix : il restait sous `pointer-events: none` quand une fenêtre Radix était ouverte.
    expect(alert).not.toMatch(/role="alertdialog"\s+aria-label=/);
  });
});

describe("NJ-1 et NJ-8 : premier vaisseau atteignable, lien vers la bonne techno", () => {
  it("la première recherche verse au moins l'Acier renforcé de la recherche du Drone (niveau 1)", () => {
    const drone = findUnit("drone_recuperateur")!;
    const tech = findTech(drone.unlockTech!)!;
    const need = getTechCost(tech, 1).reinforcedSteel ?? 0;
    expect(need).toBeGreaterThan(0);
    const research = ONBOARDING_STEPS.find((s) => s.id === "research")!;
    expect(research.reward.reinforcedSteel ?? 0).toBeGreaterThanOrEqual(need);
    // L'objectif « 5 drones » vient après « première recherche ».
    expect(ONBOARDING_STEPS.findIndex((s) => s.id === "research")).toBeLessThan(ONBOARDING_STEPS.findIndex((s) => s.id === "drones5"));
  });

  it("un compte neuf qui réclame sa première recherche a de quoi payer celle du Drone", () => {
    const p = { ...defaultPlayerState("u1", "Neuf"), techLevels: { tech1: 1 }, createdAtMs: Date.now() } as PlayerState;
    p.onboarding = { claimed: ["scrap3", "reactor3"] };
    expect(p.resources.reinforcedSteel).toBe(0);
    claimOnboarding(p, "research");
    expect(p.resources.reinforcedSteel).toBeGreaterThanOrEqual(getTechCost(findTech("tech9")!, 1).reinforcedSteel ?? 0);
  });

  it("les récompenses de la prise en main se règlent dans l'admin (registre) et la fiche les lit à l'usage", () => {
    expect(REGISTERED_RULES.onboardingRewards.target()).toBe(ONBOARDING_REWARDS);
    expect(Object.keys(ONBOARDING_REWARDS).sort()).toEqual(ONBOARDING_STEPS.map((s) => s.id).sort());
    const before = ONBOARDING_REWARDS.research;
    ONBOARDING_REWARDS.research = { reinforcedSteel: 35 };
    try {
      expect(ONBOARDING_STEPS.find((s) => s.id === "research")!.reward).toEqual({ reinforcedSteel: 35 });
    } finally {
      ONBOARDING_REWARDS.research = before;
    }
  });

  it("l'objectif « 5 drones » dit où trouver l'Acier renforcé, et le lien d'une unité verrouillée ouvre sa techno", () => {
    expect(ONBOARDING_STEPS.find((s) => s.id === "drones5")!.hint).toMatch(/comptoir/);
    expect(unitResearchPath("drone_recuperateur")).toBe("/game/labo?tech=tech9");
    expect(unitResearchPath("inconnue")).toBe("/game/labo");
    expect(src("src/pages/UnitsPage.tsx")).toContain("to={unitResearchPath(unit.id)}");
    expect(src("src/pages/LabPage.tsx")).toContain('params.get("tech")');
    // « Ta production n'y suffira pas » mène au comptoir, qui défile jusqu'à lui.
    expect(src("src/components/ui/afford.tsx")).toContain('"/game/ressources?onglet=comptoir"');
    expect(src("src/pages/ResourcesPage.tsx")).toContain('id="comptoir"');
  });
});

describe("NJ-6 : le conseil sur l'XP dit vrai", () => {
  it("bâtiments et recherches ne sont pas cités comme sources d'XP ; le lien mène aux missions", () => {
    const rank = ONBOARDING_STEPS.find((s) => s.id === "rank")!;
    expect(rank.hint).not.toMatch(/des bâtiments, des recherches/);
    expect(rank.hint).toMatch(/missions/);
    expect(rank.to).toBe("/game/missions");
    // Sources réelles (registre de l'XP) : aucune pour les bâtiments ni les recherches.
    expect(src("src/game/xpAudit.ts")).toMatch(/export type XpSource = "mission" \| "attack" \| "defense" \| "expedition" \| "bounty" \| "pirate" \| "achievement" \| "contract" \| "other";/);
  });
});

describe("NJ-10 et NJ-18 : un compte neuf ne voit ni annonce de mise à jour ni pastille des Nouveautés", () => {
  const quiet = NEWCOMER_NEWS_RULES.quietHours;
  afterEach(() => {
    NEWCOMER_NEWS_RULES.quietHours = quiet;
  });

  it("compte neuf pendant `quietHours` heures, réglable (0 : jamais)", () => {
    const now = Date.UTC(2026, 9, 9, 12);
    expect(isNewcomer(now - 2 * HOUR, now)).toBe(true);
    expect(isNewcomer(now - 25 * HOUR, now)).toBe(false);
    expect(isNewcomer(undefined, now)).toBe(false);
    NEWCOMER_NEWS_RULES.quietHours = 0;
    expect(isNewcomer(now - 2 * HOUR, now)).toBe(false);
    expect(REGISTERED_RULES.newcomerNews.target()).toBe(NEWCOMER_NEWS_RULES);
  });

  it("l'annonce est marquée vue sans s'ouvrir pour un compte neuf ; son image est bornée en hauteur sur mobile", () => {
    const a = src("src/components/game/Announcement.tsx");
    expect(a).toContain("isNewcomer(usePlayerStore.getState().player?.createdAtMs, now)");
    expect(a).toContain("h-[40vh] md:h-[62%]");
  });

  it("les notes techniques et celles d'avant l'inscription ne sont jamais « non lues »", () => {
    const team = CHANGELOG_INDEX.find((e) => e.team);
    expect(team, "au moins une note technique marquée `audience: equipe`").toBeDefined();
    expect(isUnread(team!.id, "")).toBe(false);
    const player = CHANGELOG_INDEX.find((e) => !e.team)!;
    expect(isUnread(player.id, "")).toBe(true);
    expect(isUnread(player.id, "", player.date)).toBe(false);
    expect(changelogSince(undefined)).toBe("");
    expect(changelogSince(Date.UTC(2026, 9, 9, 12))).toBe("2026-10-09");
    expect(src("src/components/layout/NavBar.tsx")).toContain("useUnreadChangelogCount(usePlayerStore((s) => s.player?.createdAtMs))");
    expect(src("src/pages/ChangelogPage.tsx")).toContain("CHANGELOG.filter((e) => !e.team)");
  });

  it("une ligne indentée continue l'élément de liste (plus de « une mission se / termine »)", () => {
    expect(markdownBlocks("Intro\nsuite.\n\n- **Journal** : une mission se\n  termine bien.\n- Deux\n\nFin")).toEqual([
      { kind: "p", text: "Intro suite." },
      { kind: "ul", items: ["**Journal** : une mission se termine bien.", "Deux"] },
      { kind: "p", text: "Fin" },
    ]);
  });
});
