import { describe, expect, it, vi } from "vitest";

/* 6.14.103 : un module qui charge `@/game/content` en premier ne doit pas planter. `advancedGuide.ts` lisait `COLONY_RULES` au
   chargement (`label` en gabarit) : « Cannot access 'COLONY_RULES' before initialization » (import circulaire ; l'appli passait
   seulement grâce à l'ordre de ses imports). Règle de CLAUDE.md : valeur littérale ou accesseur lu à l'usage. */
describe("ordre de chargement du moteur", () => {
  it("@/game/content se charge en premier sans erreur", async () => {
    vi.resetModules();
    const content = await import("@/game/content");
    expect(typeof content.validateRules).toBe("function");
    expect(content.validateRules(content.defaultGameContent().rules)).toEqual([]);
  });
});
