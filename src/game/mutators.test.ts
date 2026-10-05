import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { activeMutator, MUTATOR_RULES, MUTATORS, mutatorEffects, mutatorFor, validateMutatorRules } from "@/game/mutators";
import { empireEffects, playerModifiers } from "@/game/modifiers";

describe("mutateur de saison (5.16)", () => {
  beforeEach(() => {
    MUTATOR_RULES.enabled = true;
    MUTATOR_RULES.overrides = {};
  });
  afterEach(() => {
    MUTATOR_RULES.enabled = false;
    MUTATOR_RULES.overrides = {};
  });

  it("tirage déterministe, jamais deux mois de suite le même", () => {
    const months = Array.from({ length: 24 }, (_, i) => `${2026 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`);
    const ids = months.map((m) => mutatorFor(m)!.id);
    expect(ids.map((_, i) => mutatorFor(months[i])!.id)).toEqual(ids);
    for (let i = 1; i < ids.length; i++) expect(ids[i]).not.toBe(ids[i - 1]);
    expect(new Set(ids).size).toBeGreaterThan(4);
  });

  it("l'administration impose un mutateur ou aucun", () => {
    MUTATOR_RULES.overrides = { "2026-10": "vents", "2026-11": "none" };
    expect(mutatorFor("2026-10")?.id).toBe("vents");
    expect(mutatorFor("2026-11")).toBeNull();
    expect(validateMutatorRules({ overrides: { "2026-12": "inconnu", bad: "ruee" } })).toHaveLength(2);
  });

  it("passe par le circuit d'effets (source « season »)", () => {
    const now = Date.UTC(2026, 9, 15);
    MUTATOR_RULES.overrides = { "2026-10": "ruee" };
    expect(activeMutator(now)?.id).toBe("ruee");
    expect(mutatorEffects(now)).toEqual([{ stat: "productionAll", value: 0.1, target: undefined, layer: "empire", source: { kind: "season", id: "ruee", label: "Ruée industrielle" } }]);
    const p = { commanders: undefined, relics: undefined, talents: undefined, territory: undefined } as Parameters<typeof empireEffects>[0];
    expect(empireEffects(p, now).some((g) => g.source.kind === "season")).toBe(true);
    expect(playerModifiers(p, now).productionAll).toBeCloseTo(0.1);
    MUTATOR_RULES.enabled = false;
    expect(playerModifiers(p, now).productionAll).toBe(0);
    expect(MUTATORS.length).toBeGreaterThanOrEqual(8);
  });
});
