import { describe, expect, it } from "vitest";
import { formatDecimal, formatInt } from "@/game/format";

describe("format", () => {
  it("groups thousands without Intl", () => {
    expect(formatInt(1234567)).toBe("1 234 567");
    expect(formatInt(999)).toBe("999");
    expect(formatInt(-12000.4)).toBe("-12 000");
    expect(formatDecimal(64.577, 1)).toBe("64,6");
    expect(formatDecimal(2.5, 2)).toBe("2,5");
    expect(formatDecimal(3, 2)).toBe("3");
  });
});
