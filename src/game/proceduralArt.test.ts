import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ARCHETYPES, AUTO_ART, AUTO_SEALS } from "@/game/procedural";

describe("illustrations des chapitres générés", () => {
  it("chaque archétype déclaré a son fichier (boss ou sceau)", () => {
    const ids = ARCHETYPES.map((a) => a.id);
    for (const id of AUTO_ART) {
      expect(ids, id).toContain(id);
      expect(existsSync(`public/assets/chronicles/auto/${id}-boss.webp`), `${id}-boss`).toBe(true);
    }
    for (const id of AUTO_SEALS) {
      expect(ids, id).toContain(id);
      expect(existsSync(`public/assets/chronicles/auto/${id}-sceau.webp`), `${id}-sceau`).toBe(true);
    }
  });

  it("les illustrations du passe existent", () => {
    expect(existsSync("public/assets/pass/pass-header.webp")).toBe(true);
    expect(existsSync("public/assets/pass/chapter-complete.webp")).toBe(true);
  });
});
