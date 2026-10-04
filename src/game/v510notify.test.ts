import { describe, expect, it } from "vitest";
import { flushState } from "@/game/flush";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { activePass, passState } from "@/game/seasonPass";
import { currentSeasonId } from "@/game/seasons";
import type { PlayerState } from "@/types/game";

const NOW = Date.UTC(2026, 9, 10, 12);
const player = (patch: Partial<PlayerState> = {}) => ({ ...defaultPlayerState("u", "U"), createdAtMs: NOW - 1000, resourcesUpdatedAtMs: NOW, ...patch }) as PlayerState;

describe("v5.10 notification « palier du passe prêt »", () => {
  it("annonce une fois chaque nouveau palier non réclamé", () => {
    const seasonId = currentSeasonId(NOW);
    const per = activePass(seasonId).pointsPerTier;
    const p = player({ seasonPass: { seasonId, points: per * 2, claimed: [1], loginDay: "", completed: [] } });
    const first = flushState(p, defaultQueues(), NOW);
    const notif = first.notifications.find((n) => n.link === "/game/passe");
    expect(notif?.title).toMatch(/palier 2/);
    expect(passState(first.player, NOW).notifiedTier).toBe(2);
    const again = flushState(first.player, defaultQueues(), NOW + 1000);
    expect(again.notifications.some((n) => n.link === "/game/passe")).toBe(false);
  });

  it("se tait si tout est déjà réclamé", () => {
    const seasonId = currentSeasonId(NOW);
    const per = activePass(seasonId).pointsPerTier;
    const p = player({ seasonPass: { seasonId, points: per, claimed: [1], loginDay: "", completed: [] } });
    expect(flushState(p, defaultQueues(), NOW).notifications.some((n) => n.link === "/game/passe")).toBe(false);
  });
});

describe("v5.10 défi de la semaine à réclamer", async () => {
  const { claimChallengeReward, challengeClaimable, unclaimedRewardees } = await import("@/game/challenges");
  const ch = {
    id: "w1", type: "missions" as const, target: 100, startMs: 0, endMs: 1, total: 120, status: "done" as const, success: true,
    contributions: { a: { pseudo: "A", amount: 80 }, b: { pseudo: "B", amount: 40 }, c: { pseudo: "C", amount: 0.5 } },
  };
  it("crédite une fois les ressources (sans le titre) et note la réclamation", () => {
    const pa = player({ uid: "a", titles: [] });
    expect(challengeClaimable(ch, "a")).toBe(true);
    expect(challengeClaimable(ch, "c")).toBe(false);
    const before = pa.resources.scrap ?? 0;
    const out = claimChallengeReward(ch, pa);
    expect((pa.resources.scrap ?? 0) > before).toBe(true);
    expect(pa.titles ?? []).toEqual([]);
    expect(out.challenge.claimed).toEqual(["a"]);
    expect(() => claimChallengeReward(out.challenge, pa)).toThrow(/déjà/);
    expect(unclaimedRewardees(out.challenge)).toEqual(["b"]);
    expect(() => claimChallengeReward(out.challenge, player({ uid: "c" }))).toThrow(/Pas de récompense/);
  });
});
