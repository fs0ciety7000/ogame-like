import { describe, expect, it } from "vitest";
import { defaultPlayerState } from "@/game/defaults";
import { computeBalance516, findings516 } from "@/game/balance/v516";
import { casinoWeekId } from "@/game/casino";
import { LOOT_TOKEN_RULES } from "@/game/loot";
import type { PlayerState } from "@/types/game";

const NOW = Date.UTC(2026, 9, 5, 12);
function player(i: number, extra: Partial<PlayerState> = {}): PlayerState {
  return { ...defaultPlayerState(`p${i}`, `p${i}`), createdAt: null, ...extra } as unknown as PlayerState;
}

describe("équilibrage 5.16", () => {
  it("compte expéditions profondes, traités, rattrapage et plafond de jetons", () => {
    const week = casinoWeekId(NOW);
    const players = [
      player(1, { stats: { expeditions: 10, deepExpeditions: 4, deepAmbushLost: 1 } as PlayerState["stats"], pirates: { varan: { treaty: { kind: "pact", signedAtMs: NOW - 1000, untilMs: NOW + 1000 } } } as unknown as PlayerState["pirates"] }),
      player(2, { stats: { expeditions: 10 } as PlayerState["stats"], bonuses: { catchup: { factor: 1.2, untilMs: NOW + 3600_000, ratio: 0.1 } } as unknown as PlayerState["bonuses"] }),
      player(3, { casino: { lootWeek: { id: week, tokens: LOOT_TOKEN_RULES.weeklyCap } } as unknown as PlayerState["casino"] }),
    ];
    const b = computeBalance516(players, NOW);
    expect(b.expeditions).toEqual({ total: 20, deep: 4, deepPct: 20, deepAmbushLost: 1 });
    expect(b.treaties.pact).toBe(1);
    expect(b.treaties.players).toBe(1);
    expect(b.catchup.boosted).toBe(1);
    expect(b.catchup.maxBonusPct).toBe(20);
    expect(b.lootTokens.capped).toBe(1);
  });

  it("propose des réglages chiffrés quand les données le justifient", () => {
    const b = computeBalance516([player(1, { stats: { expeditions: 40, deepExpeditions: 2 } as PlayerState["stats"] })], NOW);
    const ids = findings516(b, 12).map((p) => p.id);
    expect(ids).toContain("deep-low");
    expect(ids).toContain("treaties-none");
    expect(findings516(b, 3).map((p) => p.id)).not.toContain("treaties-none");
  });
});
