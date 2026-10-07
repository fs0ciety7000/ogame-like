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
    expect(kinds).toEqual(expect.arrayContaining(["build", "research", "units"]));
    // 6.14.81 (DP-L6, I30) : pas de mission proposée tant que la page Missions n'est pas au menu ; la 1re unité l'ouvre.
    expect(kinds).not.toContain("mission");
    p.units = { ...p.units, drone_recuperateur: { level: 1, count: 1 } };
    expect(nextActions(p, defaultQueues(), [], NOW).map((a) => a.kind)).toContain("mission");
  });

  it("6.14.81 : ne propose jamais une page fermée du menu progressif", async () => {
    const { navPageOpen, navPath } = await import("@/game/navUnlock");
    const p = { ...defaultPlayerState("u", "U"), resourcesUpdatedAtMs: NOW, units: { chasseur: { level: 1, count: 50 } } } as PlayerState;
    for (const a of nextActions(p, defaultQueues(), [], NOW)) if (a.to.startsWith("/game/")) expect(navPageOpen(p, navPath(a.to), { now: NOW }), a.kind).toBe(true);
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
