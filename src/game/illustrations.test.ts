import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TECH_ART, TECH_CODEX_IMAGE, techImage } from "@/game/technologies";

/* 6.14.26 : illustrations intégrées (docs/illustrations.md). Une image marquée intégrée, ou une techno de TECH_ART, a son
   fichier dans public/assets : sinon la carte ou la fiche du Codex afficherait une image cassée. */

const slots = (JSON.parse(readFileSync("scripts/illustrations.json", "utf8")) as { slots: { id: string; target: string; done: string | null }[] }).slots;

describe("6.14.26 : illustrations intégrées", () => {
  it("chaque image intégrée a son fichier", () => {
    const missing = slots.filter((s) => s.done && !existsSync(s.target)).map((s) => s.id);
    expect(missing).toEqual([]);
  });

  it("chaque techno de TECH_ART a son illustration, les autres gardent l'image provisoire", () => {
    for (const id of TECH_ART) expect(existsSync(`public/assets/technologies/${id}.webp`), id).toBe(true);
    expect(techImage({ id: "tech11" })).toBe("/assets/technologies/tech11.webp");
    expect(techImage({ id: "tech1" })).toBe(TECH_CODEX_IMAGE);
    expect(techImage({ id: "tech11", image: "/assets/autre.webp" })).toBe("/assets/autre.webp");
  });

  it("identifiants uniques, une seule cible par image", () => {
    expect(new Set(slots.map((s) => s.id)).size).toBe(slots.length);
    expect(new Set(slots.map((s) => s.target)).size).toBe(slots.length);
  });
});
