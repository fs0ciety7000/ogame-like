import { describe, expect, it } from "vitest";
import { addOccurrence, errorKey, errorQuotaKey, isIgnoredError, normalizeStack, sanitizeClientError } from "@/game/errorReports";

const stackA = "TypeError: x is undefined\n    at Foo (https://empire.fs0ciety.org/assets/index-DTkodOtE.js:12:345)\n    at Bar (https://empire.fs0ciety.org/assets/vendor-DQG31Jfh.js:1:99)";
const stackB = "TypeError: x is undefined\n    at Foo (https://empire.fs0ciety.org/assets/index-Ab12Cd34.js:13:1)\n    at Bar (https://empire.fs0ciety.org/assets/vendor-Zz99Yy88.js:2:7)";

describe("errorKey", () => {
  it("groups the same error across builds and line numbers", () => {
    expect(normalizeStack(stackA)).toBe(normalizeStack(stackB));
    expect(errorKey("TypeError: x is undefined", stackA)).toBe(errorKey("TypeError: x is undefined", stackB));
  });
  it("ignores numbers inside the message", () => {
    expect(errorKey("Unit 12 missing", "")).toBe(errorKey("Unit 7 missing", ""));
    expect(errorKey("Unit missing", "")).not.toBe(errorKey("Building missing", ""));
  });
});

describe("filtering", () => {
  it("drops noise and empty errors", () => {
    expect(isIgnoredError("ResizeObserver loop completed with undelivered notifications.")).toBe(true);
    expect(isIgnoredError("TypeError: Failed to fetch dynamically imported module: /assets/x.js")).toBe(true);
    expect(isIgnoredError("Error: boom", "at chrome-extension://abc/content.js")).toBe(true);
    expect(isIgnoredError("TypeError: x is undefined", stackA)).toBe(false);
    expect(sanitizeClientError({ message: "  " })).toBeNull();
    expect(sanitizeClientError({ message: "Error: boom", stack: 42, page: "/game" })).toEqual({ message: "Error: boom", stack: "", page: "/game", version: "" });
  });
});

describe("addOccurrence", () => {
  it("counts, records new players and reopens closed reports", () => {
    const open = addOccurrence({ status: "in_progress", history: [], occurrences: 2, affected: ["Nova"] }, "Nova", 10);
    expect(open).toMatchObject({ status: "in_progress", occurrences: 3, affected: ["Nova"], reopened: false });
    const closed = addOccurrence({ status: "resolved", history: [], occurrences: 3, affected: ["Nova"] }, "Orion", 20);
    expect(closed).toMatchObject({ status: "new", occurrences: 4, affected: ["Nova", "Orion"], reopened: true });
    expect(closed.history).toHaveLength(1);
  });
  it("uses one quota bucket per player and UTC day", () => {
    expect(errorQuotaKey("u1", Date.UTC(2026, 9, 1, 23))).toBe("cosmic-err:u1:2026-10-01");
  });
});
