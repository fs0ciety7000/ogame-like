import { describe, expect, it } from "vitest";
import { TECHNOLOGIES } from "@/game/technologies";
import { NODE_HEIGHT, NODE_WIDTH, TECH_GRID, techAncestors, techDependents, techPosition } from "@/components/game/techTreeLayout";

describe("techTreeLayout", () => {
  it("places every technology exactly once", () => {
    for (const tech of TECHNOLOGIES) expect(TECH_GRID[tech.id], tech.id).toBeDefined();
    expect(Object.keys(TECH_GRID).sort()).toEqual(TECHNOLOGIES.map((t) => t.id).sort());
  });

  it("puts every prerequisite in an earlier column", () => {
    for (const tech of TECHNOLOGIES) {
      for (const reqId of Object.keys(tech.prereq)) {
        expect(TECH_GRID[reqId].col, `${reqId} -> ${tech.id}`).toBeLessThan(TECH_GRID[tech.id].col);
      }
    }
  });

  it("never overlaps two cards", () => {
    const boxes = TECHNOLOGIES.map((t) => ({ id: t.id, ...techPosition(t.id) }));
    for (const a of boxes) {
      for (const b of boxes) {
        if (a.id >= b.id) continue;
        const overlap = Math.abs(a.x - b.x) < NODE_WIDTH && Math.abs(a.y - b.y) < NODE_HEIGHT;
        expect(overlap, `${a.id} / ${b.id}`).toBe(false);
      }
    }
  });

  it("walks the full prerequisite chain", () => {
    expect([...techAncestors("tech16")].sort()).toEqual(["tech1", "tech15", "tech3", "tech5", "tech7"].sort());
    expect(techDependents("tech16")).toEqual(new Set(["tech18", "tech19"]));
  });
});
