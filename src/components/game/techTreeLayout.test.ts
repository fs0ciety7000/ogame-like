import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent, defaultGameContent } from "@/game/content";
import { TECHNOLOGIES } from "@/game/technologies";
import { NODE_HEIGHT, NODE_WIDTH, TECH_GRID, techAncestors, techDependents, techPosition } from "@/components/game/techTreeLayout";
import { techCells, techLanes } from "@/components/game/techTreeLayout";

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

describe("techCells (technologies added from the admin)", () => {
  afterEach(() => applyGameContent({}));

  it("places a new tech right of its prerequisites, in the extra lane", () => {
    const content = defaultGameContent();
    content.technologies.push({ ...content.technologies[0], id: "tech_new", nom: "Nouvelle", prereq: { tech19: 1 }, treePos: undefined });
    applyGameContent({ technologies: content.technologies });
    const cells = techCells();
    expect(cells.get("tech_new")!.col).toBe(cells.get("tech19")!.col + 1);
    expect(techLanes(cells).some((l) => l.id === "lane-new")).toBe(true);
  });

  it("honours a position chosen in the admin", () => {
    const content = defaultGameContent();
    content.technologies.find((t) => t.id === "tech1")!.treePos = { col: 3, row: 7 };
    applyGameContent({ technologies: content.technologies });
    expect(techCells().get("tech1")).toEqual({ col: 3, row: 7 });
  });
});
