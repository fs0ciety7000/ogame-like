/* 5.15.13 : version de la logique de jeu embarquée dans les hooks serveur
   (injectée par pocketbase/build-hooks.mjs). Hors bundle serveur : « dev ». */

declare const __COSMIC_LOGIC_VERSION__: string | undefined;

export const LOGIC_VERSION: string = typeof __COSMIC_LOGIC_VERSION__ === "string" ? __COSMIC_LOGIC_VERSION__ : "dev";

/** -1, 0 ou 1 selon l'ordre de deux versions « 5.15.12 ». */
export function compareVersions(a: string, b: string): number {
  const x = a.split(".").map(Number);
  const y = b.split(".").map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] || 0) - (y[i] || 0);
    if (d !== 0) return d > 0 ? 1 : -1;
  }
  return 0;
}
