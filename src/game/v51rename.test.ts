import { describe, expect, it } from "vitest";
import { cleanNewPseudo, pseudoLogin, renamePlayer } from "@/game/rename";
import type { PlayerState } from "@/types/game";

function player(amber: number): PlayerState {
  return { uid: "p1", pseudo: "Ancien", bounties: { amber } } as unknown as PlayerState;
}

describe("v5.1 changement de pseudo", () => {
  it("nettoie le pseudo et dérive l'identifiant de connexion", () => {
    expect(cleanNewPseudo("  Le   Grand_Amiral ")).toBe("Le Grand_Amiral");
    expect(pseudoLogin("Le Grand_Amiral")).toBe("legrand_amiral");
    expect(() => cleanNewPseudo("é!")).toThrow(/3 caractères/);
    expect(() => cleanNewPseudo("x".repeat(21))).toThrow(/20 caractères/);
  });

  it("coûte 10 Ambre et ne sert qu'une fois", () => {
    const p = player(12);
    expect(renamePlayer(p, "Nouveau", 1000)).toEqual({ pseudo: "Nouveau", login: "nouveau" });
    expect(p.pseudo).toBe("Nouveau");
    expect(p.bounties?.amber).toBe(2);
    expect(p.renamed).toEqual({ fromPseudo: "Ancien", atMs: 1000 });
    expect(() => renamePlayer(p, "Autre", 2000)).toThrow(/déjà changé/);
  });

  it("refuse sans assez d'Ambre ou avec le même pseudo", () => {
    expect(() => renamePlayer(player(9), "Nouveau", 0)).toThrow(/Ambre/);
    expect(() => renamePlayer(player(50), "Ancien", 0)).toThrow(/déjà ton pseudo/);
  });
});
