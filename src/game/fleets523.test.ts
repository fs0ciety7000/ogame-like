import { describe, expect, it } from "vitest";
import { awaitingDeparture, FLEET_DELAY_MAX_MINUTES, fleetDelayMs, recallFleet, type Fleet } from "@/game/fleets";

const NOW = Date.UTC(2026, 9, 5, 12);

describe("5.23 décollage programmé", () => {
  it("délai borné, seulement pour certaines missions", () => {
    expect(fleetDelayMs("attack", 30)).toBe(30 * 60_000);
    expect(fleetDelayMs("attack", 99999)).toBe(FLEET_DELAY_MAX_MINUTES * 60_000);
    expect(fleetDelayMs("expedition", 30)).toBe(0);
    expect(fleetDelayMs("spy", -5)).toBe(0);
    expect(fleetDelayMs("spy", "abc")).toBe(0);
  });

  it("rappelée avant le décollage : de retour aussitôt", () => {
    const f = { id: "f", ownerUid: "u", mission: "attack", status: "outbound", departAtMs: NOW + 3600_000, arriveAtMs: NOW + 7200_000, returnAtMs: null, recalled: false } as unknown as Fleet;
    expect(awaitingDeparture(f, NOW)).toBe(true);
    expect(recallFleet(f, "u", NOW).returnAtMs).toBe(NOW);
  });
});
