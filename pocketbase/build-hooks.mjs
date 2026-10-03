// Compile la logique de jeu partagée (src/game) en un seul fichier
// CommonJS exécutable par le moteur JavaScript de PocketBase (goja).
//   npm run build:hooks
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";

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
