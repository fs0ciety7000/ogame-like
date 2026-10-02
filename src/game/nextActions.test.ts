import { describe, expect, it } from "vitest";
import { nextActions } from "@/game/nextActions";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

const NOW = 1_800_000_000_000;

describe("nextActions", () => {
  it("lists idle queues and claimable contracts, most urgent first", () => {
    const p = { ...defaultPlayerState("u", "U"), resourcesUpdatedAtMs: NOW } as PlayerState;
    p.contracts = { day: "x", items: [{ id: "c1", type: "missions", target: 1, progress: 1, claimed: false }], streak: 0, lastCompletedDay: null, rerolled: false } as never;
    const kinds = nextActions(p, defaultQueues(), [], NOW).map((a) => a.kind);
    expect(kinds[0]).toBe("contracts");
    expect(kinds).toEqual(expect.arrayContaining(["build", "research", "mission", "units"]));
  });

  it("stays quiet when everything is busy", () => {
    const p = { ...defaultPlayerState("u", "U"), resourcesUpdatedAtMs: NOW } as PlayerState;
    const q = defaultQueues();
    q.buildingUpgrades = { extracteur_ferraille: { endTime: NOW + 1000 } } as never;
    q.activeResearches = [1, 2, 3, 4].map((i) => ({ id: `tech${i}`, endTime: NOW + 1000 }));
    q.activeMissions = [{ key: "patrouille_courte", endTime: NOW + 1000 }] as never;
    q.unitQueues = { attack: [{ unitId: "chasseur", endTime: NOW + 1000 }], defense: [] };
    expect(nextActions(p, q, [], NOW)).toEqual([]);
  });
});
