import { describe, expect, it } from "vitest";
import { applyOrder, moveCard } from "@/lib/cardOrder";

describe("5.24 : ordre personnalisé des cartes", () => {
  it("sans ordre enregistré, l'ordre par défaut reste", () => {
    expect(applyOrder(["a", "b", "c"], undefined)).toEqual(["a", "b", "c"]);
  });
  it("l'ordre enregistré passe devant, les nouvelles cartes vont à la fin, les disparues sont ignorées", () => {
    expect(applyOrder(["a", "b", "c", "d"], ["c", "x", "a"])).toEqual(["c", "a", "b", "d"]);
  });
  it("déplacer une carte visible garde le rang des cartes filtrées", () => {
    // Ordre complet a b c d e ; seules a, c, e sont visibles (filtre de classe).
    const full = ["a", "b", "c", "d", "e"];
    expect(moveCard(full, ["a", "c", "e"], "e", "a")).toEqual(["e", "b", "a", "d", "c"]);
  });
  it("déplacement sur soi-même ou carte inconnue : rien ne change", () => {
    const full = ["a", "b"];
    expect(moveCard(full, full, "a", "a")).toBe(full);
    expect(moveCard(full, full, "a", "z")).toBe(full);
  });
});
