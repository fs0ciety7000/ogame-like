import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { build } from "esbuild";

/**
 * 6.14.130 : ordre d'initialisation des modules du moteur (CLAUDE.md, « Initialisation des modules »). Le registre des succès
 * calcule ses succès dérivés au chargement (officiers, boss, unités, bâtiments) ; selon le premier module importé (palette,
 * Formules, officiers…), ces registres peuvent ne pas être prêts. Vitest charge les modules autrement que le navigateur et le
 * bundle des hooks : on empaquette ici avec esbuild (comme l'appli) en commençant par chaque module, puis on applique le contenu.
 */
const ENTRIES = ["@/game/formulasRegistry", "@/game/paletteContent", "@/game/commanders", "@/game/units", "@/game/contentChain", "@/game/achievements"];

describe("chargement du moteur quel que soit le premier module importé", () => {
  it.each(ENTRIES)("en commençant par %s", async (first) => {
    const root = path.resolve(__dirname, "../..");
    const dir = mkdtempSync(path.join(tmpdir(), "init-"));
    try {
      const result = await build({
        stdin: {
          contents: `import * as first from "${first}";\nexport { first };\nexport { applyGameContent } from "@/game/content";\nexport { ACHIEVEMENTS, contentAchievements } from "@/game/achievements";`,
          resolveDir: root,
          loader: "ts",
        },
        bundle: true,
        format: "esm",
        platform: "node",
        alias: { "@": path.join(root, "src") },
        write: false,
        logLevel: "silent",
      });
      const file = path.join(dir, "engine.mjs");
      writeFileSync(file, result.outputFiles[0].text);
      // Processus Node à part : vitest ne charge pas un module hors du projet par `import()`.
      const code = `const E = await import(${JSON.stringify(pathToFileURL(file).href)}); E.applyGameContent({}, ${Date.UTC(2026, 9, 8)}); console.log(JSON.stringify([E.ACHIEVEMENTS.length, E.contentAchievements().length]));`;
      const out = execFileSync(process.execPath, ["--input-type=module", "-e", code], { encoding: "utf8" });
      const [all, own] = JSON.parse(out.trim().split("\n").pop() ?? "[0,0]") as [number, number];
      expect(all).toBeGreaterThan(200);
      expect(own).toBeGreaterThan(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);
});
