import { beforeEach, describe, expect, it } from "vitest";
import { applyPreset, deleteFleetPreset, MAX_PRESETS, saveFleetPreset } from "@/lib/fleetPresets";

// Environnement Node : petit localStorage en mémoire.
const store = new Map<string, string>();
globalThis.localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: () => null,
  length: 0,
} as Storage;

describe("fleet presets", () => {
  beforeEach(() => localStorage.clear());

  it("saves, replaces by name, caps the list and deletes", () => {
    saveFleetPreset("u", "Raid", { chasseur: 10, cargo: 0 });
    const list = saveFleetPreset("u", "raid", { chasseur: 20 });
    expect(list).toHaveLength(1);
    expect(list[0].units).toEqual({ chasseur: 20 });
    for (let i = 0; i < MAX_PRESETS + 2; i++) saveFleetPreset("u", `P${i}`, { fregate: i + 1 });
    const capped = saveFleetPreset("u", "Siège", { fregate: 5 });
    expect(capped).toHaveLength(MAX_PRESETS);
    deleteFleetPreset("u", capped[0].id);
    expect(JSON.parse(localStorage.getItem("cosmic-empires:fleet-presets:u")!)).toHaveLength(MAX_PRESETS - 1);
  });

  it("applies a preset within what is owned and allowed", () => {
    const preset = { id: "x", name: "x", units: { chasseur: 50, fregate: 10, canon_plasma: 5 } };
    expect(applyPreset(preset, { chasseur: 30, fregate: 0, canon_plasma: 9 }, ["chasseur", "fregate"])).toEqual({ chasseur: 30 });
  });
});
