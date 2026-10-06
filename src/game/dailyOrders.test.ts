import { describe, expect, it } from "vitest";
import { defaultPlayerState } from "@/game/defaults";
import { dailyOrders, ordersReadyCount } from "@/game/dailyOrders";
import { pendingClaims } from "@/game/claimAll";
import { performPlayerAction } from "@/game/actions";
import { defaultQueues } from "@/game/defaults";
import { parisDay } from "@/game/retention";
import type { PlayerState } from "@/types/game";

/* 5.30 : Ordres du jour (docs/proposals/journal-de-bord.md). */

const NOW = Date.UTC(2026, 9, 7, 12);

function player(): PlayerState {
  return { ...defaultPlayerState("u1", "Matinal"), uid: "u1", createdAt: null } as unknown as PlayerState;
}

describe("Ordres du jour", () => {
  it("la série du jour est prête, puis faite une fois réclamée", () => {
    const p = player();
    const before = JSON.stringify(p);
    const orders = dailyOrders(p, NOW);
    expect(JSON.stringify(p)).toBe(before);
    expect(orders.find((o) => o.id === "streak")?.state).toBe("ready");
    expect(pendingClaims(p, NOW)).toContainEqual({ type: "streakClaim" });
    p.streak = { count: 1, lastDay: parisDay(NOW), best: 1, total: 1 };
    expect(dailyOrders(p, NOW).find((o) => o.id === "streak")?.state).toBe("done");
  });

  it("la pastille unique compte exactement ce que « Tout réclamer » prend", () => {
    const p = player();
    expect(ordersReadyCount(p, NOW)).toBe(pendingClaims(p, NOW).length);
    const out = performPlayerAction(p, defaultQueues(), { type: "claimAll" }, NOW);
    expect((out.result as Record<string, number>).streakClaim).toBe(1);
    expect(ordersReadyCount(out.player, NOW)).toBe(0);
  });

  it("missions du jour : progression affichée, rien à réclamer", () => {
    const p = player();
    p.streak = { count: 1, lastDay: parisDay(NOW), best: 1, total: 1 };
    const view = dailyOrders(p, NOW).find((o) => o.id === "daily")!;
    expect(view.state).toBe("todo");
    expect(view.value).toBe("0 / 3");
  });

  it("l'objectif d'alliance n'apparaît que dans une alliance", () => {
    const p = player();
    expect(dailyOrders(p, NOW).some((o) => o.id === "alliance")).toBe(false);
    p.allianceId = "a1";
    expect(dailyOrders(p, NOW).some((o) => o.id === "alliance")).toBe(true);
  });
});
