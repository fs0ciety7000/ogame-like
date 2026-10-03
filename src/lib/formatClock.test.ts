import { describe, expect, it } from "vitest";
import { formatClock } from "@/lib/utils";

describe("formatClock", () => {
  it("garde m:ss sous l'heure, puis heures et jours", () => {
    expect(formatClock(278)).toBe("4:38");
    expect(formatClock(306 * 60 + 38)).toBe("5 h 06 min");
    expect(formatClock(2 * 86400 + 3 * 3600 + 59)).toBe("2 j 03 h");
    expect(formatClock(-5)).toBe("0:00");
  });
});
