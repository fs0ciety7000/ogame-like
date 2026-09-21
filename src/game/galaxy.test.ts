import { describe, expect, it } from "vitest";
import { galaxyCoords, formatCoords } from "./galaxy";

describe("galaxyCoords", () => {
  it("is deterministic for a given uid", () => {
    expect(galaxyCoords("player-1")).toEqual(galaxyCoords("player-1"));
  });

  it("gives different coordinates for different uids", () => {
    const a = galaxyCoords("player-1");
    const b = galaxyCoords("player-2");
    expect(a).not.toEqual(b);
  });

  it("keeps x/y normalized within [0, 1)", () => {
    for (const uid of ["a", "b", "c", "player-42", "🚀"]) {
      const { x, y } = galaxyCoords(uid);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThan(1);
    }
  });

  it("keeps galaxy/system/position within their expected ranges", () => {
    for (const uid of ["a", "b", "c", "player-42"]) {
      const c = galaxyCoords(uid);
      expect(c.galaxy).toBeGreaterThanOrEqual(1);
      expect(c.galaxy).toBeLessThanOrEqual(9);
      expect(c.system).toBeGreaterThanOrEqual(1);
      expect(c.system).toBeLessThanOrEqual(499);
      expect(c.position).toBeGreaterThanOrEqual(1);
      expect(c.position).toBeLessThanOrEqual(15);
    }
  });
});

describe("formatCoords", () => {
  it("formats as galaxy:system:position", () => {
    expect(formatCoords({ galaxy: 3, system: 210, position: 7 })).toBe("3:210:7");
  });
});
