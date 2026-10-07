import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/* AU13 (SEC-1) : chaque route /api/cosmic/admin/… vérifie les droits d'administration, dans la route ou dans
   la fonction de cosmic_db.js qu'elle appelle. Une nouvelle route admin sans contrôle fait échouer ce test. */

const pbjs = readFileSync("pocketbase/pb_hooks/cosmic.pb.js", "utf8");
const db = readFileSync("pocketbase/pb_hooks/cosmic_db.js", "utf8");
const CHECK = /isGameAdmin|requireSuperuser\(\)/;

describe("AU13 routes d'administration", () => {
  it("toutes vérifient les droits (isGameAdmin)", () => {
    const missing: string[] = [];
    let count = 0;
    for (const part of pbjs.split(/(?=routerAdd\()/).slice(1)) {
      const chunk = part.split(/\n(?=\S)/)[0];
      const m = /routerAdd\(\s*"(\w+)",\s*"([^"]+)"/.exec(chunk);
      if (!m || !m[2].includes("/admin/")) continue;
      count++;
      if (CHECK.test(chunk)) continue;
      const fn = /cosmic_db\.js`\)\.(\w+)\(/.exec(chunk)?.[1];
      const at = fn ? db.indexOf(`function ${fn}(`) : -1;
      if (at < 0 || !CHECK.test(db.slice(at, at + 1500))) missing.push(`${m[1]} ${m[2]}`);
    }
    expect(count).toBeGreaterThan(40);
    expect(missing).toEqual([]);
  });
});
