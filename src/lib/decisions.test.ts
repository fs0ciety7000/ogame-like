import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseAdvice, parseQuestions, plainText } from "@/lib/decisions";

/* 6.14.32 : la page /decisions lit QUESTIONS.md et decisions-a-valider.md au build. */

describe("6.14.32 : décisions à valider", () => {
  it("lit chaque question de QUESTIONS.md avec ses sept colonnes", () => {
    const qs = parseQuestions(readFileSync("docs/QUESTIONS.md", "utf8"));
    expect(qs.length).toBeGreaterThan(20);
    expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
    for (const q of qs) {
      expect(q.question.length, q.id).toBeGreaterThan(5);
      expect(q.choice.length, q.id).toBeGreaterThan(2);
      expect(q.status.length, q.id).toBeGreaterThan(2);
    }
    expect(qs.find((q) => q.id === "Q3")?.open).toBe(false);
    expect(qs.some((q) => q.open)).toBe(true);
  });

  it("chaque question ouverte a son conseil dans decisions-a-valider.md", () => {
    const open = parseQuestions(readFileSync("docs/QUESTIONS.md", "utf8")).filter((q) => q.open);
    const advice = parseAdvice(readFileSync("docs/decisions-a-valider.md", "utf8"));
    expect(open.filter((q) => !advice[q.id]).map((q) => q.id)).toEqual([]);
  });

  it("groupes et conseils, markdown retiré", () => {
    const advice = parseAdvice("## 1. Bloquante\n\n| Q | D | E | R |\n|:--|:--|:--|:--|\n| Q12 | d | e | **Donner** le feu vert |\n\n## 4. Outillage (peu d'enjeu)\n\n| Q8 | d | valider |");
    expect(advice.Q12).toEqual({ group: "Bloquante", effect: "e", reco: "**Donner** le feu vert" });
    expect(advice.Q8).toEqual({ group: "Outillage", effect: "", reco: "valider" });
    expect(plainText("**Donner** le `feu`")).toBe("Donner le feu");
  });
});
