import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { build } from "esbuild";
// @ts-expect-error — module JS sans types (script de build)
import { hooksBuildOptions } from "../../pocketbase/build-hooks.mjs";

describe("pocketbase/pb_hooks/cosmic_game.js", () => {
  it("is up to date with src/game (run `npm run build:hooks` otherwise)", async () => {
    const result = await build({ ...hooksBuildOptions, write: false });
    const expected = result.outputFiles?.[0]?.text;
    const actual = readFileSync(hooksBuildOptions.outfile, "utf8");
    expect(actual === expected, "Le bundle serveur est périmé : lance `npm run build:hooks` et commite le fichier.").toBe(true);
  });
});
