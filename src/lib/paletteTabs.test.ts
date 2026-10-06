import { describe, expect, it } from "vitest";
import { matchPaletteTabs } from "@/lib/paletteTabs";

describe("palette : onglets", () => {
  it("trouve un onglet par son nom, sa page ou un mot-clé, sans accents", () => {
    expect(matchPaletteTabs("encheres").map((t) => t.to)).toEqual(["/game/commerce?onglet=encheres"]);
    expect(matchPaletteTabs("etat-major").length).toBe(5);
    expect(matchPaletteTabs("fusion").map((t) => t.label)).toEqual(["Modules"]);
    expect(matchPaletteTabs("e")).toEqual([]);
    expect(matchPaletteTabs("commerce", new Set(["/game/commerce"]))).toEqual([]);
  });
});
