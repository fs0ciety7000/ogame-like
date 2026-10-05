import { describe, expect, it } from "vitest";
import { inlineCssVars } from "@/components/game/PlanetPhotoMode";

describe("inlineCssVars", () => {
  it("resolves theme variables, nested ones too, and falls back to transparent", () => {
    const vars: Record<string, string> = { "--color-cyan-glow": "var(--th-accent)", "--th-accent": "#4be8ff" };
    const out = inlineCssVars('<circle fill="var(--color-cyan-glow)" stroke="var(--nope)"/>', (n) => vars[n] ?? "");
    expect(out).toBe('<circle fill="#4be8ff" stroke="transparent"/>');
  });
});
