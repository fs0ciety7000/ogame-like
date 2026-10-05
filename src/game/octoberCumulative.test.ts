import { describe, expect, it } from "vitest";
import { generatePassSeason, regenerateChallenges, setPassSeasons } from "@/game/passSeasons";
import { worldDigest } from "@/game/procedural";
import { activeChallengeTier, isCumulativePass, passState, tierRequirements, trackActivity } from "@/game/seasonPass";
import { defaultPlayerState } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

/* 5.15.12 : migration du passe d'octobre en mode cumulé (même opération que la migration serveur). */

const OCT_20 = Date.UTC(2026, 9, 20, 12);

describe("passe d'octobre en totaux du mois", () => {
  it("les défis deviennent cumulés et les actions du mois comptent aussitôt", () => {
    const digest = worldDigest([], OCT_20);
    const base = generatePassSeason({ monthId: "2026-10", digest, existing: [], now: OCT_20 });
    const legacy = { ...base, status: "published" as const, challengeMode: undefined };
    const migrated = regenerateChallenges({ ...legacy, challengeMode: "cumulative" }, digest);
    expect(migrated.challengeMode).toBe("cumulative");
    expect(migrated.tiers).toEqual(legacy.tiers);
    setPassSeasons({ seasons: [migrated] });
    expect(isCumulativePass("2026-10")).toBe(true);

    const p = defaultPlayerState("u1", "u1") as PlayerState;
    p.createdAtMs = OCT_20 - 30 * 86400_000;
    const req = tierRequirements(p, 1, OCT_20)!;
    for (const r of req.reqs) trackActivity(p, r.key, OCT_20, r.count);
    expect(tierRequirements(p, 1, OCT_20)?.met).toBe(true);
    expect(activeChallengeTier(passState(p, OCT_20))).toBeGreaterThan(1);
    setPassSeasons({ seasons: [] });
  });
});
