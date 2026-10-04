import { describe, expect, it } from "vitest";
import { broadcastTargets, validateBroadcast } from "@/game/broadcast";
import { computeRetention } from "@/game/retention";
import type { PlayerState } from "@/types/game";

const DAY = 24 * 3600_000;
const NOW = Date.UTC(2026, 9, 10, 12);
const p = (uid: string, idleDays: number, ageDays: number, allianceId = ""): PlayerState => ({ uid, pseudo: uid, lastActiveMs: NOW - idleDays * DAY, createdAtMs: NOW - ageDays * DAY, allianceId, stats: {} }) as unknown as PlayerState;

describe("messages ciblés et rétention (v5.10.5)", () => {
  const players = [p("a", 0, 2, "x"), p("b", 10, 40), p("c", 45, 60, "x"), p("d", 1, 20)];

  it("groupes de destinataires", () => {
    const ids = (seg: Parameters<typeof broadcastTargets>[1], all?: string) => broadcastTargets(players, seg, NOW, all).map((x) => x.uid);
    expect(ids("all")).toHaveLength(4);
    expect(ids("active7")).toEqual(["a", "d"]);
    expect(ids("inactive7")).toEqual(["b"]);
    expect(ids("inactive30")).toEqual(["c"]);
    expect(ids("new7")).toEqual(["a"]);
    expect(ids("alliance", "x")).toEqual(["a", "c"]);
    expect(ids("noAlliance")).toEqual(["b", "d"]);
  });

  it("validation", () => {
    expect(validateBroadcast({ segment: "all", title: "Salut", message: "Coucou", link: "/game/boss" })).toEqual([]);
    expect(validateBroadcast({ segment: "alliance", title: "", message: "", link: "https://x" })).toHaveLength(4);
  });

  it("survie et décrochage", () => {
    const r = computeRetention(players, NOW);
    expect(r.survival.find((s) => s.day === 7)).toMatchObject({ eligible: 3 });
    expect(r.churn.reduce((a, c) => a + c.count, 0)).toBe(2);
  });
});
