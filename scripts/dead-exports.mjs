#!/usr/bin/env node
/* Exports morts du moteur (lot R5, AJ27-11, 6.14.153).
 *
 * Liste les exports d'un dossier (par défaut `src/game`) qu'aucun autre fichier ne nomme :
 * ni le reste de `src/` (pages, services, tests, `src/server/hooksEntry.ts` qui alimente le bundle
 * de `cosmic_db.js`), ni `scripts/`, ni `e2e/`, ni les hooks écrits à la main (`pocketbase/pb_hooks`,
 * hors bundle généré `cosmic_game.js`), ni les fichiers de configuration à la racine.
 *
 * Méthode volontairement prudente, sans dépendance : un nom est « lu ailleurs » dès qu'un autre fichier
 * le contient comme identifiant (commentaires retirés). Deux catégories :
 *   - `dead` : nommé nulle part, pas même dans son module (à retirer) ;
 *   - `local` : valeur (fonction, constante, classe) nommée seulement dans son module (à rendre non exportée) ;
 *     un type lu seulement dans son module n'est pas compté (il décrit souvent une signature publique).
 *
 * Usage : node scripts/dead-exports.mjs [--dir src/game] [--json]
 * La garde `src/game/deadExports.test.ts` appelle `findDeadExports` et échoue sur tout nouveau candidat.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Dossiers et fichiers lus pour chercher les usages. */
const SCAN_DIRS = ["src", "scripts", "e2e", "pocketbase/pb_hooks"];
const SCAN_ROOT_FILES = ["vite.config.ts", "vitest.config.ts", "changelog-index-plugin.ts", "page-preload-plugin.ts", "eslint.config.js"];
/** Bundle généré (il contient tous les noms du moteur) et garde (sa liste d'exceptions nomme les candidats) : ils ne prouvent rien. */
const SKIP_FILES = new Set(["pocketbase/pb_hooks/cosmic_game.js", "src/game/deadExports.test.ts"]);
const EXTENSIONS = /\.(ts|tsx|js|mjs|cjs)$/;

function walk(dir, out) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (name === "node_modules" || name === "__snapshots__" || name.startsWith(".")) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (EXTENSIONS.test(name)) out.push(full);
  }
  return out;
}

/** Retire commentaires `//` et `/* *\/` en respectant les chaînes et gabarits (approximation suffisante). */
export function stripComments(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  let quote = null;
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (quote) {
      out += c;
      if (c === "\\") {
        out += d ?? "";
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
      i++;
      continue;
    }
    if (c === "/" && d === "/") {
      while (i < n && src[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && d === "*") {
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") quote = c;
    out += c;
    i++;
  }
  return out;
}

const IDENT = /[A-Za-z_$][A-Za-z0-9_$]*/g;

function tokenCounts(text) {
  const counts = new Map();
  IDENT.lastIndex = 0;
  let m;
  while ((m = IDENT.exec(text)) !== null) counts.set(m[0], (counts.get(m[0]) ?? 0) + 1);
  return counts;
}

/** Exports d'un module (déclarations et listes `export { … }`), avec leur genre : `type` (type, interface) ou `value`. */
export function exportedNames(src) {
  const found = new Map();
  const decl = /^export\s+(?:declare\s+)?(?:default\s+)?(?:async\s+)?(function\*?|const|let|var|class|enum|type|interface|abstract\s+class)\s+([A-Za-z_$][A-Za-z0-9_$]*)/gm;
  let m;
  while ((m = decl.exec(src)) !== null) found.set(m[2], m[1] === "type" || m[1] === "interface" ? "type" : "value");
  const list = /^export\s+(type\s+)?\{([^}]*)\}/gm;
  while ((m = list.exec(src)) !== null) {
    for (const part of m[2].split(",")) {
      const isType = Boolean(m[1]) || /^\s*type\s+/.test(part);
      const p = part.trim().replace(/^type\s+/, "");
      if (!p) continue;
      const as = p.split(/\s+as\s+/);
      found.set((as[1] ?? as[0]).trim(), isType ? "type" : "value");
    }
  }
  return [...found].map(([name, kind]) => ({ name, kind }));
}

/**
 * @param {{ root?: string, dir?: string }} [opts]
 * @returns {{ dead: string[], local: string[], total: number }} entrées `fichier:nom`, triées
 */
export function findDeadExports(opts = {}) {
  const root = opts.root ?? ROOT;
  const dir = opts.dir ?? "src/game";
  const files = [];
  for (const d of SCAN_DIRS) walk(join(root, d), files);
  for (const f of SCAN_ROOT_FILES) files.push(join(root, f));
  const tokens = new Map();
  for (const f of files) {
    const rel = relative(root, f).split("\\").join("/");
    if (SKIP_FILES.has(rel)) continue;
    let text;
    try {
      text = readFileSync(f, "utf8");
    } catch {
      continue;
    }
    tokens.set(rel, tokenCounts(stripComments(text)));
  }
  /** nom → fichiers qui le contiennent */
  const where = new Map();
  for (const [rel, counts] of tokens) {
    for (const name of counts.keys()) {
      let set = where.get(name);
      if (!set) where.set(name, (set = new Set()));
      set.add(rel);
    }
  }
  const dead = [];
  const local = [];
  let total = 0;
  const prefix = dir.replace(/\/$/, "") + "/";
  for (const [rel] of tokens) {
    if (!rel.startsWith(prefix) || /\.test\.tsx?$/.test(rel) || !/\.tsx?$/.test(rel)) continue;
    const src = stripComments(readFileSync(join(root, rel), "utf8"));
    for (const { name, kind } of exportedNames(src)) {
      total++;
      const elsewhere = [...(where.get(name) ?? [])].some((f) => f !== rel);
      if (elsewhere) continue;
      const own = tokens.get(rel).get(name) ?? 0;
      if (own <= 1) dead.push(`${rel}:${name}`);
      // Un type lu seulement dans son module décrit souvent une signature publique : il peut rester exporté.
      else if (kind === "value") local.push(`${rel}:${name}`);
    }
  }
  return { dead: dead.sort(), local: local.sort(), total };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const dirIdx = args.indexOf("--dir");
  const dir = dirIdx >= 0 ? args[dirIdx + 1] : "src/game";
  const res = findDeadExports({ dir });
  if (args.includes("--json")) {
    console.log(JSON.stringify(res, null, 2));
  } else {
    console.log(`${res.total} exports lus dans ${dir}.`);
    console.log(`\nMorts (nommés nulle part ailleurs ni dans leur module) : ${res.dead.length}`);
    for (const e of res.dead) console.log(`  ${e}`);
    console.log(`\nLocaux (lus seulement dans leur module, à rendre non exportés) : ${res.local.length}`);
    for (const e of res.local) console.log(`  ${e}`);
  }
}
