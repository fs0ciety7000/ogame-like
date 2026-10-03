import { describe, expect, it } from "vitest";
import { parseNumberDraft } from "@/components/ui/number-input";

describe("parseNumberDraft", () => {
  it("lit les entiers, espaces de milliers compris", () => {
    expect(parseNumberDraft("12 500")).toBe(12500);
    expect(parseNumberDraft("12 500")).toBe(12500);
    expect(parseNumberDraft("0")).toBe(0);
  });
  it("accepte les raccourcis k et M", () => {
    expect(parseNumberDraft("10k")).toBe(10000);
    expect(parseNumberDraft("2,5k")).toBe(2500);
    expect(parseNumberDraft("3M")).toBe(3_000_000);
  });
  it("arrondit selon les décimales", () => {
    expect(parseNumberDraft("1,26", 1)).toBe(1.3);
    expect(parseNumberDraft("7.9")).toBe(8);
    expect(parseNumberDraft("0,125", 3)).toBe(0.125);
  });
  it("renvoie null pour une saisie vide ou illisible", () => {
    expect(parseNumberDraft("")).toBeNull();
    expect(parseNumberDraft("-")).toBeNull();
    expect(parseNumberDraft("abc")).toBeNull();
    expect(parseNumberDraft("1k2")).toBeNull();
  });
  it("garde le signe", () => {
    expect(parseNumberDraft("-4")).toBe(-4);
  });
});
