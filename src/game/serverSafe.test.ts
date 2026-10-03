import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/* v5.5 : le moteur (src/game) tourne aussi dans les hooks PocketBase (goja),
   qui ne gèrent ni Intl ni toLocaleString / localeCompare : une seule
   occurrence fait planter la route qui l'appelle. Utiliser @/game/format. */

const FORBIDDEN = /from "@\/lib\/utils"|\btoLocale(?:String|DateString|TimeString|UpperCase|LowerCase)\s*\(|\bIntl\.|\blocaleCompare\s*\(/;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.ts$/.test(name) && !/\.test\.ts$/.test(name) ? [path] : [];
  });
}

describe("moteur compatible avec le serveur", () => {
  it("n'utilise ni Intl, ni toLocaleString, ni localeCompare", () => {
    const offenders = files(join(__dirname))
      .flatMap((f) =>
        readFileSync(f, "utf8")
          .split("\n")
          .map((line, i) => ({ f, i, line }))
          .filter(({ line }) => FORBIDDEN.test(line) && !line.trim().startsWith("*") && !line.trim().startsWith("//")),
      )
      .map(({ f, i, line }) => `${f.replace(/.*src\//, "src/")}:${i + 1} ${line.trim()}`);
    expect(offenders).toEqual([]);
  });
});
