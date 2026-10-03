import { describe, expect, it } from "vitest";
import { timelineHorizon, timelinePosition, upcomingEvents } from "@/game/timeline";
import { defaultQueues } from "@/game/defaults";
import { findUnit, getUnitBuildTime } from "@/game/units";

const NOW = 1_800_000_000_000;

describe("upcomingEvents", () => {
  it("lists every queue sorted by end time, unit queues as a whole", () => {
    const q = defaultQueues();
    q.buildingUpgrades.extracteur_ferraille = { endTime: NOW + 60_000 };
    q.activeResearches.push({ id: "tech1", endTime: NOW + 10_000 });
    q.activeMissions.push({ key: "patrouille_courte", endTime: NOW + 120_000 });
    q.unitQueues.attack.push({ unitId: "chasseur", endTime: NOW + 5_000 }, { unitId: "chasseur", endTime: null });

    const events = upcomingEvents(q, NOW);
    expect(events[0]).toMatchObject({ kind: "research", to: "/game/labo" });
    expect(events.map((e) => e.endTime)).toEqual([...events.map((e) => e.endTime)].sort((a, b) => a - b));
    const units = events.find((e) => e.kind === "units")!;
    expect(units.endTime).toBe(NOW + 5_000 + getUnitBuildTime(findUnit("chasseur")!) * 1000);
    expect(units.label).toMatch(/2 unités/);
    expect(events).toHaveLength(4);
  });

  it("is empty without queues", () => {
    expect(upcomingEvents(null, NOW)).toEqual([]);
    expect(upcomingEvents(defaultQueues(), NOW)).toEqual([]);
  });
});

describe("timeline scale", () => {
  it("picks a rounded horizon and spreads near events", () => {
    expect(timelineHorizon([], NOW)).toBe(3600_000);
    expect(timelineHorizon([{ id: "x", kind: "mission", label: "", endTime: NOW + 3 * 3600_000, to: "" }], NOW)).toBe(4 * 3600_000);
    expect(timelinePosition(NOW + 900_000, NOW, 3600_000)).toBeCloseTo(0.5);
    expect(timelinePosition(NOW - 5, NOW, 3600_000)).toBe(0);
    expect(timelinePosition(NOW + 10 * 3600_000, NOW, 3600_000)).toBe(1);
  });
});

describe("v4.9.3 : colonies sur la frise", () => {
  it("ajoute chantier, défenses et vaisseau colonial", () => {
    const colony = { id: "u-c1", slot: 1, name: "Nova", building: { id: "entrepot", level: 3, endTime: NOW + 5_000 }, defenseJob: { unitId: "roquette", qty: 10, endTime: NOW + 9_000 } };
    const events = upcomingEvents(null, NOW, [], "u", { colonies: [colony] as never, colonizing: { slot: 2, name: "Vega", endTime: NOW + 7_000 } });
    expect(events.map((e) => e.id)).toEqual(["cb:u-c1", "colonizing", "cd:u-c1"]);
    expect(events.every((e) => e.kind === "colony" && e.to === "/game/colonies")).toBe(true);
  });
});
