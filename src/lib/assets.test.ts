import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { assetUrl } from "./assets";

/* 5.14.3 : une image /assets/… affichée sans ?v= reste servie par le cache de
   Cloudflare avec son ancienne version (bug de la page Bâtiments). Toute image
   passe par assetUrl (ou une aide qui l'appelle : iconUrl, getRankIcon…). */
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : name.endsWith(".tsx") ? [path] : [];
  });
}

/** Sources qui ne sont pas des images du jeu : fichiers envoyés, avatars,
 *  aperçus locaux, ou aides qui ajoutent déjà la version. */
const SAFE_SRC = /^(assetUrl|iconUrl|getRankIcon|avatar|url|preview|shot|value|e\.url|p\.src|rankIcon|coverPreview|fileUrl|authorAvatarUrl|src|props\.src|p\.cover)\b/;

describe("images versionnées", () => {
  it("assetUrl ajoute la version aux images locales seulement", () => {
    expect(assetUrl("/assets/buildings/a.webp")).toMatch(/^\/assets\/buildings\/a\.webp\?v=/);
    expect(assetUrl("/assets/a.webp?v=1")).toBe("/assets/a.webp?v=1");
    expect(assetUrl("https://cdn.example/a.webp")).toBe("https://cdn.example/a.webp");
  });

  it("aucune <img> ne charge une image du jeu sans assetUrl", () => {
    const offenders: string[] = [];
    for (const file of files("src")) {
      if (file.includes(".test.")) continue;
      const text = readFileSync(file, "utf8");
      const lineOf = (index: number) => text.slice(0, index).split("\n").length;
      // Chemin écrit en dur (hors favicon et musique, déjà versionnés à part).
      for (const m of text.matchAll(/\bsrc="\/assets\/(?!logo\/|audio\/)/g)) offenders.push(`${file}:${lineOf(m.index)}`);
      // <img src={…}> (même sur plusieurs lignes) : assetUrl ou une source sûre.
      for (const m of text.matchAll(/<img\b(?:(?!\/>)[\s\S]){0,300}?\bsrc=\{([^}\n]*)\}/g)) {
        const expr = m[1].trim();
        if (!SAFE_SRC.test(expr) && !expr.includes("assetUrl(")) offenders.push(`${file}:${lineOf(m.index)} → ${expr}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
