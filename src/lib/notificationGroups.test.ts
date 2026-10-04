import { describe, expect, it } from "vitest";
import { groupNotifications } from "@/lib/notificationCategories";

const H = 3600_000;
const n = (id: string, kind: "building" | "mission", title: string, at: number) => ({ id, kind, title, createdAtMs: at });

describe("regroupement des notifications", () => {
  it("regroupe les suites de même type et titre, dans la fenêtre", () => {
    const g = groupNotifications([
      n("a", "building", "Construction terminée", 10 * H),
      n("b", "building", "Construction terminée", 9 * H),
      n("c", "building", "Construction terminée", 8 * H),
      n("d", "mission", "Mission terminée", 7 * H),
      n("e", "building", "Construction terminée", 6 * H),
      n("f", "building", "Construction terminée", -1 * H),
    ]);
    expect(g.map((x) => [x.head.id, x.rest.map((r) => r.id)])).toEqual([
      ["a", ["b", "c"]],
      ["d", []],
      ["e", []],
      ["f", []],
    ]);
  });
});
