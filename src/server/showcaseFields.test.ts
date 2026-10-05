import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/* 5.16.1 : la fiche publique est calculée par le serveur (showcaseOf). S'il
   oublie un champ dont dépend une bannière ou un emblème, l'option est jugée
   verrouillée et la fiche retombe sur la bannière par défaut. */
describe("vitrine publique (showcaseOf)", () => {
  it("transmet tous les champs dont dépendent bannières, emblèmes et planète", () => {
    const src = readFileSync("pocketbase/pb_hooks/cosmic_db.js", "utf8");
    const start = src.indexOf("function showcaseOf(");
    const block = src.slice(start, src.indexOf("\n}\n", start));
    for (const field of ["pirates", "bounties", "stats", "profileStyle", "unlockedAchievements", "commanders", "relics", "ascensions", "referral", "seasonPass", "chronicle", "casino"]) {
      expect(block, field).toContain(`${field}:`);
    }
  });
});
