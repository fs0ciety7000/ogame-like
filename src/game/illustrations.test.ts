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

/* 6.14.36 : une annonce illustrée n'est publiée qu'une fois son image produite (page /img) et poussée. */
describe("6.14.36 : annonces et illustrations", () => {
  const src = readFileSync("src/components/game/Announcement.tsx", "utf8");
  const block = src.slice(src.indexOf("export const ANNOUNCEMENTS_ALL"), src.indexOf("export const ANNOUNCEMENTS: Announcement[]"));
  const entries = block.split(/\n {2}\{\n/).slice(1);

  it("une annonce attend son image tant qu'elle n'est pas intégrée, puis pointe sur le fichier", () => {
    const checked: string[] = [];
    for (const e of entries) {
      const slotId = /artSlot: "([^"]+)"/.exec(e)?.[1];
      if (!slotId) continue;
      const slot = slots.find((s) => s.id === slotId);
      expect(slot, slotId).toBeTruthy();
      const pending = /pendingArt: true/.test(e);
      expect(pending, `${slotId} : drapeau pendingArt`).toBe(!slot!.done);
      expect(e, slotId).toContain(`art: "${slot!.target.replace(/^public/, "")}"`);
      checked.push(slotId);
    }
    expect(checked).toContain("annonce-6.14");
  });
});
