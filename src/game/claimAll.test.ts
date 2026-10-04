import { describe, expect, it } from "vitest";
import { BUILDINGS } from "@/game/buildings";
import { describeClaims, pendingClaims } from "@/game/claimAll";
import { defaultPlayerState } from "@/game/defaults";
import { onboardingRankXp } from "@/game/onboarding";
import type { PlayerState } from "@/types/game";

const NOW = Date.UTC(2026, 9, 7, 12);

describe("tout réclamer", () => {
  it("liste les objectifs prêts sans modifier le joueur", () => {
    const p = { ...defaultPlayerState("u1", "Pressé"), createdAt: null } as unknown as PlayerState;
    p.xp = onboardingRankXp() * 10;
    for (const b of BUILDINGS) p.buildings[b.id] = { level: 15, unlocked: true };
    const before = JSON.stringify(p);
    const list = pendingClaims(p, NOW);
    expect(list).toContainEqual({ type: "claimGuide", stepId: "colonyReady" });
    expect(JSON.stringify(p)).toBe(before);
  });

  it("résume par type", () => {
    expect(describeClaims({ claimContract: 2, passClaim: 1, claimGuide: 0 })).toBe("2 contrats, 1 palier du passe");
  });
});
