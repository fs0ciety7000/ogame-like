import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { defaultGameContent, RULE_GROUP_LABELS } from "@/game/content";

/* 6.7.2 (consigne de l'utilisateur, CLAUDE.md) : tout ce qui est dans GameRules, pour les fonctionnalités existantes
   et futures, se règle dans l'administration. L'éditeur « Tous les réglages » (AllRulesEditor) affiche chaque champ
   selon son type ; ce test échoue si une règle ne peut pas y être éditée. */

describe("GameRules entièrement réglable dans l'admin", () => {
  const rules = defaultGameContent().rules as unknown as Record<string, unknown>;

  it("chaque groupe de règles a un libellé d'admin", () => {
    const missing = Object.keys(rules).filter((g) => !RULE_GROUP_LABELS[g]);
    expect(missing).toEqual([]);
  });

  it("chaque valeur passe sans perte par l'éditeur (JSON : pas de fonction, de Date ni de undefined)", () => {
    for (const [group, value] of Object.entries(rules)) {
      expect(JSON.parse(JSON.stringify(value)), group).toEqual(value);
    }
  });

  it("l'éditeur générique est monté dans l'onglet Règles", () => {
    const panels = readFileSync("src/pages/admin/panels.tsx", "utf8");
    expect(panels).toMatch(/<AllRulesEditor rules=\{rules\} setRules=\{setRules\} \/>/);
  });
});
