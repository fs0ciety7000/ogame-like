import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TECH_ART, TECH_CODEX_IMAGE, techImage } from "@/game/technologies";
import { DEFAULT_RELICS, relicImage } from "@/game/relics";
import { empireClasses } from "@/game/empireClass";

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
    expect(techImage({ id: "tech-sans-image" })).toBe(TECH_CODEX_IMAGE);
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

/* 6.14.118 (É30-7, AJ-15) : chaque relique et chaque classe d'empire a sa ligne dans illustrations.json (prompt, format, détourage),
   et chaque relique a sa propre image : `illustrations.py --missing` et la page /img voient alors toute image à refaire. */
describe("6.14.118 : reliques et classes dans l'atelier d'illustrations", () => {
  const full = (JSON.parse(readFileSync("scripts/illustrations.json", "utf8")) as { slots: { id: string; group: string; target: string; cutout: boolean; prompt: string }[] }).slots;

  it("chaque relique par défaut a une ligne qui vise son image, détourée, avec un prompt", () => {
    for (const t of DEFAULT_RELICS) {
      const target = `public${relicImage(t.id)}`;
      const slot = full.find((s) => s.target === target);
      expect(slot, t.id).toBeTruthy();
      expect(slot!.group, t.id).toBe("Reliques");
      expect(slot!.cutout, t.id).toBe(true);
      expect(slot!.prompt, t.id).toMatch(/--ar 1:1/);
      expect(existsSync(target), `${t.id} : image provisoire ou définitive en place`).toBe(true);
    }
  });

  it("deux reliques n'ont jamais la même image", () => {
    const paths = DEFAULT_RELICS.map((t) => relicImage(t.id));
    expect(new Set(paths).size).toBe(paths.length);
    const hashes = paths.map((p) => createHash("md5").update(readFileSync(`public${p}`)).digest("hex"));
    expect(new Set(hashes).size).toBe(hashes.length);
  });

  it("chaque classe d'empire a sa ligne", () => {
    for (const c of empireClasses()) expect(full.some((s) => s.id === `classe-${c.id}`), c.id).toBe(true);
  });
});
