import { describe, expect, it } from "vitest";
import { collectDebris, debrisFromLosses, DEBRIS_RULES, mergeDebris, recyclerCapacity } from "@/game/debris";

const NOW = 1_800_000_000_000;

describe("debris", () => {
  it("keeps 30 % of destroyed ships, nothing from defenses", () => {
    // Frégate : 1000 ferraille / 500 énergie ; roquette = défense.
    expect(debrisFromLosses([{ fregate: 10 }, { roquette: 50 }])).toEqual({ scrap: 3000, energy: 1500 });
  });

  it("merges into one field per base and restarts its lifetime", () => {
    const first = mergeDebris(null, { scrap: 100, energy: 50 }, { uid: "def", pseudo: "Def" }, NOW);
    expect(first.expiresAtMs).toBe(NOW + DEBRIS_RULES.lifetimeHours * 3600_000);
    const second = mergeDebris(first, { scrap: 10, energy: 0 }, { uid: "def", pseudo: "Def" }, NOW + 1000);
    expect(second).toMatchObject({ scrap: 110, energy: 50, id: "def" });
    const expired = mergeDebris(first, { scrap: 10, energy: 0 }, { uid: "def", pseudo: "Def" }, first.expiresAtMs + 1);
    expect(expired.scrap).toBe(10);
  });

  it("collects proportionally within the recyclers' capacity", () => {
    // 5.16 : capacité = cargaison du drone (CAP 10 × niveau 3) × 4 drones ; les autres vaisseaux ne ramassent rien.
    const owner = { units: { drone_recuperateur: { level: 3, count: 10 } }, techLevels: {} } as unknown as Parameters<typeof recyclerCapacity>[0];
    expect(recyclerCapacity(owner, { drone_recuperateur: 4, fregate: 2 })).toBe(120);
    expect(recyclerCapacity(owner, { fregate: 2 })).toBe(0);
    const out = collectDebris({ scrap: 1000, energy: 500 }, 900);
    expect(out.taken).toEqual({ scrap: 600, energy: 300 });
    expect(out.remaining).toEqual({ scrap: 400, energy: 200 });
    expect(collectDebris({ scrap: 100, energy: 50 }, 10_000).remaining).toEqual({ scrap: 0, energy: 0 });
  });
});
