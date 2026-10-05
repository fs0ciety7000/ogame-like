// Compile la logique de jeu partagée (src/game) en un seul fichier
// CommonJS exécutable par le moteur JavaScript de PocketBase (goja).
//   npm run build:hooks
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// goja n'implémente pas toutes les API récentes du navigateur/Node.
const polyfills = `
if (typeof structuredClone === "undefined") {
  var structuredClone = function (v) { return v === undefined ? v : JSON.parse(JSON.stringify(v)); };
}
if (!Object.entries) Object.entries = function (o) { return Object.keys(o).map(function (k) { return [k, o[k]]; }); };
if (!Object.values) Object.values = function (o) { return Object.keys(o).map(function (k) { return o[k]; }); };
if (!Object.fromEntries) Object.fromEntries = function (it) { var o = {}; Array.from(it).forEach(function (e) { o[e[0]] = e[1]; }); return o; };
if (!String.prototype.padStart) String.prototype.padStart = function (n, c) { var s = String(this); c = c === undefined ? " " : String(c); while (s.length < n) s = c + s; return s.slice(-Math.max(n, String(this).length)); };
`;

/** 5.15.13 : version de la logique serveur = plus haute version du changelog
 *  (le site compare avec la sienne pour signaler des hooks en retard). */
function logicVersion() {
  const dir = path.join(root, "changelog");
  const cmp = (a, b) => {
    const x = a.split(".").map(Number), y = b.split(".").map(Number);
    for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) - (y[i] ?? 0);
    return 0;
  };
  let best = "0.0.0";
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".md")) continue;
    const m = /^version:\s*([0-9][0-9.]*)\s*$/m.exec(fs.readFileSync(path.join(dir, f), "utf8"));
    if (m && cmp(m[1], best) > 0) best = m[1];
  }
  return best;
}

export const hooksBuildOptions = {
  entryPoints: [path.join(root, "src/server/hooksEntry.ts")],
  outfile: path.join(root, "pocketbase/pb_hooks/cosmic_game.js"),
  bundle: true,
  format: "cjs",
  platform: "neutral",
  target: "es2017",
  // Paquets npm (ex. @noble/curves pour les passkeys) : version ESM.
  mainFields: ["module", "main"],
  alias: { "@": path.join(root, "src") },
  define: { __COSMIC_LOGIC_VERSION__: JSON.stringify(logicVersion()) },
  banner: {
    js: `// FICHIER GÉNÉRÉ par \`npm run build:hooks\` depuis src/game — ne pas modifier à la main.\n${polyfills}`,
  },
  logLevel: "warning",
};

// Exécuté directement (npm run build:hooks) : écrit le fichier. Importé
// (test de fraîcheur) : ne fait rien.
if (import.meta.url === `file://${process.argv[1]}`) {
  await build(hooksBuildOptions);
  console.log("pocketbase/pb_hooks/cosmic_game.js généré.");
}
