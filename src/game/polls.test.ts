import { describe, expect, it } from "vitest";
import { normalizePoll, resultsVisible, tally, validateVote } from "@/game/polls";

const T = 1_800_000_000_000;

describe("sondages", () => {
  const poll = normalizePoll({ question: " Prochain boss ? ", options: ["Léviathan", " ", "Hydre", "Colosse"], closesAtMs: T + 1000 })!;
  it("nettoie la question et les choix", () => {
    expect(poll.question).toBe("Prochain boss ?");
    expect(poll.options).toEqual(["Léviathan", "Hydre", "Colosse"]);
    expect(normalizePoll({ question: "Seul ?", options: ["oui"] })).toBeNull();
  });
  it("valide un vote et refuse après la clôture", () => {
    expect(validateVote(poll, 2, T)).toBe(2);
    expect(() => validateVote(poll, 3, T)).toThrow(/invalide/);
    expect(() => validateVote(poll, "1.5", T)).toThrow(/invalide/);
    expect(() => validateVote(poll, 0, T + 1000)).toThrow(/clos/);
  });
  it("compte et montre les résultats au bon moment", () => {
    const r = tally(poll, [0, 2, 2, 9], 2, T);
    expect(r).toEqual({ counts: [1, 0, 2], total: 3, mine: 2, open: true });
    expect(resultsVisible(poll, { mine: null, open: true })).toBe(false);
    expect(resultsVisible(poll, { mine: null, open: false })).toBe(true);
  });
});
