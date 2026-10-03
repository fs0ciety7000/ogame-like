import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/* v4.9.1 : un effet écrit `useEffect(() => appel())` renvoie la valeur de l'appel,
   que React prend pour sa fonction de nettoyage. scrollIntoView renvoie une Promise
   dans les navigateurs récents : l'onglet Diplomatie plantait (« i is not a function »).
   Seuls les abonnements (subscribe…, track…, qui renvoient leur désabonnement),
   une fonction de nettoyage écrite en ligne et les setters de state
   sont admis sans accolades. */
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.tsx?$/.test(name) && !name.endsWith(".test.ts") ? [path] : [];
  });
}

describe("nettoyage des effets", () => {
  it("aucun effet sans accolades ne renvoie autre chose qu'un abonnement", () => {
    const offenders: string[] = [];
    for (const file of files("src")) {
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          const m = line.match(/use(?:Layout)?Effect\(\s*\(\)\s*=>\s*([^{\s][^,]*)/);
          if (!m) return;
          const body = m[1].trim();
          if (/^(subscribe\w*|track\w*|set[A-Z]\w*)\(/.test(body) || body.startsWith("() =>") || /^\(?\s*\w+\s*&&/.test(body) || /\?\s*subscribe\w*\(/.test(body)) return;
          offenders.push(`${file}:${i + 1}  ${body}`);
        });
    }
    expect(offenders).toEqual([]);
  });
});
