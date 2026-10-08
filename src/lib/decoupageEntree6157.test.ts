import path from "node:path";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { build, type Metafile, type Plugin } from "esbuild";
import { changelogIndex } from "../../changelog-index-plugin";

/* 6.14.157 (R4b, É30-5c) : bloc d'entrée. Il porte la coque du jeu et le moteur entier (`src/game`, 1,1 Mo bruts) : la page
   attend le contenu appliqué (`applyGameContent` touche tous les modules du moteur) et le moteur forme un seul cycle de
   53 modules (`flush` ↔ `seasons` ↔ `economy`…). Le découpage de la coque (bloc à part, préchargé) a été essayé et mesuré dans
   ce lot : −320 Ko pour l'écran de connexion, mais aucun gain sur les pages du jeu (voir la fiche) ; il n'est pas gardé.
   Ce lot sort de l'entrée ce que la coque ne montre qu'à la demande (panneau des flottes, phalange, fenêtres de mission,
   carte d'ascension, alerte de raid, passage de palier).

   Garde de taille : l'entrée est empaquetée ici avec esbuild (comme `moduleInit.test.ts`, en quelques secondes au lieu d'un
   `vite build`) : bibliothèques des blocs `vendor`, `ui` et `pocketbase` hors du compte (comme dans `vite.config.ts`),
   `lucide-react` dedans. Le chiffre est proche de celui de Vite ; le plafond garde une marge. */

const ROOT = path.resolve(__dirname, "../..");
/** Plafond de l'entrée compressée (gzip), ≈ 6 % au-dessus de la mesure du lot (378 Ko avec esbuild, 360 Ko avec Vite). Le dépasser : un ajout
 *  lourd est entré dans le démarrage de toutes les pages ; le charger à la demande (`lazyPage`), ou relever le plafond en le
 *  disant dans la fiche du lot. */
const ENTRY_GZIP_MAX_KB = 400;
/** Composants montrés à la demande par la coque : jamais dans l'entrée (6.14.157). */
const NEVER_IN_ENTRY = [
  "src/components/game/FleetsPanel.tsx",
  "src/components/game/PhalanxPanel.tsx",
  "src/components/game/MissionDialogs.tsx",
  "src/components/game/AscensionCard.tsx",
  "src/components/game/RaidAlert.tsx",
  "src/components/fx/TierUpOverlay.tsx",
];

/** Résolution propre à Vite : alias `@`, module virtuel du journal, `import.meta.env`, styles. */
const vitePlugin: Plugin = {
  name: "vite-like",
  setup(b) {
    b.onResolve({ filter: /^virtual:changelog-index$/ }, () => ({ path: "changelog-index", namespace: "virtual" }));
    b.onLoad({ filter: /.*/, namespace: "virtual" }, () => {
      const plugin = changelogIndex(ROOT) as unknown as { load: (this: { addWatchFile: () => void }, id: string) => string };
      return { contents: plugin.load.call({ addWatchFile: () => undefined }, "\0virtual:changelog-index"), loader: "js" };
    });
    // Paquets : dehors (blocs `vendor`, `ui`, `pocketbase`), sauf les icônes, empaquetées avec le code qui les montre.
    // (filtre au format Go : pas d'anticipation ; l'alias `@/` est écarté dans la fonction.)
    b.onResolve({ filter: /^[^./]/ }, (args) => (args.path.startsWith("lucide-react") || args.path.startsWith("@/") ? undefined : { path: args.path, external: true }));
  },
};

async function entryBundle(): Promise<{ gzipKb: number; metaInputs: Metafile["outputs"][string]["inputs"] }> {
  const result = await build({
    entryPoints: [path.join(ROOT, "src/main.tsx")],
    bundle: true,
    splitting: true,
    format: "esm",
    minify: true,
    write: false,
    metafile: true,
    outdir: path.join(ROOT, ".esbuild-entree"),
    jsx: "automatic",
    alias: { "@": path.join(ROOT, "src") },
    define: { "import.meta.env": JSON.stringify({ VITE_POCKETBASE_URL: "http://127.0.0.1:8090", MODE: "production", PROD: true, DEV: false }) },
    loader: { ".css": "empty", ".png": "empty", ".webp": "empty", ".svg": "empty", ".md": "text" },
    plugins: [vitePlugin],
    logLevel: "silent",
  });
  // Avec `splitting`, esbuild sort le code partagé avec les pages dans des blocs communs importés par l'entrée : l'entrée
  // chargée au démarrage = son fichier et ses imports statiques (transitifs), comme le bloc d'entrée de Vite.
  const meta = result.metafile!;
  const norm = (p: string) => path.resolve(ROOT, p);
  const start = Object.keys(meta.outputs).find((f) => meta.outputs[f].entryPoint?.endsWith("src/main.tsx"))!;
  const seen = new Set<string>();
  const stack = [start];
  while (stack.length) {
    const f = stack.pop()!;
    if (seen.has(f) || !meta.outputs[f]) continue;
    seen.add(f);
    for (const imp of meta.outputs[f].imports) if (imp.kind === "import-statement" && !imp.external) stack.push(imp.path);
  }
  const files = [...seen];
  const text = Buffer.concat(files.map((f) => Buffer.from(result.outputFiles!.find((o) => o.path === norm(f))!.contents)));
  const inputs: Metafile["outputs"][string]["inputs"] = Object.assign({}, ...files.map((f) => meta.outputs[f].inputs));
  return { gzipKb: gzipSync(text, { level: 9 }).length / 1024, metaInputs: inputs };
}

describe("6.14.157 : bloc d'entrée (R4b)", () => {
  it(`entrée compressée sous ${ENTRY_GZIP_MAX_KB} Ko, sans les fenêtres montrées à la demande`, async () => {
    const { gzipKb, metaInputs } = await entryBundle();
    const inputs = Object.keys(metaInputs).map((p) => p.replace(/\\/g, "/"));
    for (const mod of NEVER_IN_ENTRY) expect(inputs, mod).not.toContain(mod);
    // La mesure voit bien l'entrée (coque et moteur), sinon la garde serait cassée sans le dire.
    expect(inputs).toContain("src/components/layout/AppShell.tsx");
    expect(inputs).toContain("src/game/content.ts");
    expect(gzipKb, "entrée compressée (Ko)").toBeLessThan(ENTRY_GZIP_MAX_KB);
  }, 60_000);
});
