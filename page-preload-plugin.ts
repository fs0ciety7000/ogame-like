import type { Plugin } from "vite";
import { GAME_ROUTE_PAGES } from "./src/lib/gameRoutes";

/* 6.14.152 (R4, É30-5b) : préchargement de la page ouverte dès `index.html`.
   Avant : le code de la page (Galaxie, Commerce, Alliance…) n'était demandé qu'après le téléchargement et l'exécution du
   bloc d'entrée (≈ 3,5 s sur mobile en 4G lente), puis ses dépendances. Le build écrit ici, pour chaque adresse `/game/<segment>`,
   les fichiers de sa page qui ne sont pas déjà dans l'entrée ; un petit script placé juste après le bloc d'entrée les
   demande aussitôt (`<link rel="modulepreload">`), pendant son téléchargement. Rien ne change au rendu : `lazyPage` importe les mêmes fichiers. */

/** Morceau du bundle utile ici (sous-ensemble d'`OutputChunk` de Rollup). */
export interface PreloadChunk {
  type: "chunk" | "asset";
  fileName: string;
  isEntry?: boolean;
  facadeModuleId?: string | null;
  imports?: string[];
}

export interface PreloadMap {
  /** Fichiers (chemins publiés), chacun une fois. */
  files: string[];
  /** Segment de l'adresse → indices dans `files`, page d'abord. */
  routes: Record<string, number[]>;
}

/** Fichiers à précharger pour chaque page : la page et ses imports statiques (transitifs), hors entrée et ses imports. */
export function pagePreloadMap(bundle: Record<string, PreloadChunk>, routes: Record<string, string> = GAME_ROUTE_PAGES): PreloadMap {
  const chunks = Object.values(bundle).filter((c) => c.type === "chunk");
  const closure = (start: string[], into = new Set<string>()) => {
    const stack = [...start];
    while (stack.length) {
      const f = stack.pop()!;
      if (into.has(f)) continue;
      into.add(f);
      stack.push(...(bundle[f]?.imports ?? []));
    }
    return into;
  };
  const inEntry = closure(chunks.filter((c) => c.isEntry).map((c) => c.fileName));
  const files: string[] = [];
  const index = new Map<string, number>();
  const out: Record<string, number[]> = {};
  for (const [segment, page] of Object.entries(routes)) {
    const chunk = chunks.find((c) => (c.facadeModuleId ?? "").replace(/\\/g, "/").endsWith(`/src/pages/${page}.tsx`));
    if (!chunk) continue;
    const own = [chunk.fileName, ...[...closure(chunk.imports ?? [])].filter((f) => f !== chunk.fileName)].filter((f) => !inEntry.has(f));
    out[segment] = own.map((f) => {
      if (!index.has(f)) {
        index.set(f, files.length);
        files.push(f);
      }
      return index.get(f)!;
    });
  }
  return { files, routes: out };
}

/** Script de tête : précharge les fichiers de la page de l'adresse ouverte (rien hors du jeu). Chemins écrits sans
 *  `assets/` ni `.js` (table plus courte : ≈ 2 Ko compressés pour les 46 pages). */
export function pagePreloadScript(map: PreloadMap, base = "/"): string {
  const short = { files: map.files.map((f) => f.replace(/^assets\//, "").replace(/\.js$/, "")), routes: map.routes };
  return `(function(){try{var m=/^\\/game(?:\\/([^\\/?#]*))?/.exec(location.pathname);if(!m)return;var M=${JSON.stringify(short)};var r=M.routes[m[1]||""];if(!r)return;for(var i=0;i<r.length;i++){var l=document.createElement("link");l.rel="modulepreload";l.crossOrigin="";l.fetchPriority="low";l.href=${JSON.stringify(base + "assets/")}+M.files[r[i]]+".js";document.head.appendChild(l);}}catch(e){}})();`;
}

/** Place le script juste après le bloc d'entrée et ses préchargements (déjà demandés par le navigateur), avant la feuille de
 *  style du jeu : placé avant eux, ses ~20 fichiers passeraient devant le bloc d'entrée (6 connexions en HTTP/1.1) ; placé
 *  après la feuille de style, il attendrait son arrivée (≈ 1 s sur mobile). */
export function insertPreloadScript(html: string, script: string): string {
  const tag = `<script>${script}</script>\n    `;
  const css = html.search(/<link rel="stylesheet"[^>]*href="[^"]*\/assets\//);
  return css >= 0 ? html.slice(0, css) + tag + html.slice(css) : html.replace("</head>", `${tag}</head>`);
}

export function pagePreload(): Plugin {
  let base = "/";
  return {
    name: "page-preload",
    apply: "build",
    configResolved(config) {
      base = config.base || "/";
    },
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        if (!ctx.bundle) return html;
        const map = pagePreloadMap(ctx.bundle as unknown as Record<string, PreloadChunk>);
        return insertPreloadScript(html, pagePreloadScript(map, base));
      },
    },
  };
}
