import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

/* Module virtuel « virtual:changelog-index » : version, itération et
   identifiant de chaque entrée du journal, calculés au build. Le bundle
   commun n'embarque ainsi que ces métadonnées (version affichée, pastille
   « non lu ») ; les textes ne sont chargés qu'avec la page Nouveautés. */

const ID = "virtual:changelog-index";
const RESOLVED = "\0" + ID;

export function changelogIndex(root = __dirname): Plugin {
  const dir = path.resolve(root, "changelog");
  return {
    name: "changelog-index",
    resolveId: (id) => (id === ID ? RESOLVED : null),
    load(id) {
      if (id !== RESOLVED) return null;
      const entries = readdirSync(dir)
        .filter((f) => f.endsWith(".md"))
        .map((f) => {
          this.addWatchFile(path.join(dir, f));
          const head = readFileSync(path.join(dir, f), "utf8").match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? "";
          const meta = Object.fromEntries(head.split("\n").map((l) => [l.slice(0, l.indexOf(":")).trim(), l.slice(l.indexOf(":") + 1).trim()]));
          const iteration = Number.parseInt(meta.iteration ?? "", 10);
          return { id: f.replace(/\.md$/, ""), version: meta.version || null, iteration: Number.isFinite(iteration) ? iteration : null };
        })
        .sort((a, b) => (b.iteration ?? 0) - (a.iteration ?? 0) || b.id.localeCompare(a.id));
      return `export const CHANGELOG_INDEX = ${JSON.stringify(entries)};`;
    },
  };
}
