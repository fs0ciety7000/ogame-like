import { describe, expect, it } from "vitest";
import { inCategory, summarizeKinds } from "@/lib/notificationCategories";

describe("notification categories", () => {
  it("sorts kinds into bell tabs", () => {
    expect(inCategory("building", "build")).toBe(true);
    expect(inCategory("building", "war")).toBe(false);
    expect(inCategory("combat-defender", "war")).toBe(true);
    expect(inCategory("season", "rewards")).toBe(true);
    expect(inCategory("alliance", "all")).toBe(true);
  });

  it("summarizes a burst", () => {
    expect(summarizeKinds(["building", "building", "research", "mission"])).toBe("2 constructions, 1 recherche et 1 mission");
    expect(summarizeKinds(["unit"])).toBe("1 unité");
  });
});
