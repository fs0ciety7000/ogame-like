import { describe, expect, it } from "vitest";
import { rollSpyDetection, SPY_DETECTION_CHANCE } from "@/game/espionage";

describe("rollSpyDetection", () => {
  it("detects when the roll lands below the threshold", () => {
    expect(rollSpyDetection(() => 0)).toBe(true);
    expect(rollSpyDetection(() => SPY_DETECTION_CHANCE - 0.001)).toBe(true);
  });

  it("does not detect when the roll lands at or above the threshold", () => {
    expect(rollSpyDetection(() => SPY_DETECTION_CHANCE)).toBe(false);
    expect(rollSpyDetection(() => 0.999)).toBe(false);
  });
});
