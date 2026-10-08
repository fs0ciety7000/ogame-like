import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { lazyPage, preloadPage } from "@/lib/lazyPage";
import { holoWindow } from "@/components/fx/HoloCylinder";

/* 6.14.116 (É30-5) : performance mobile. Code de la page ouverte téléchargé dès le démarrage, archives 3D du Codex chargées
   autour de la carte de face, page sans saut au premier rendu. */

describe("6.14.116 : performance (É30-5)", () => {
  it("preloadPage lance le chargement une fois, et le rendu reprend la même promesse", async () => {
    const load = vi.fn(async () => ({ PagePerf6116: () => null }));
    lazyPage(load, "PagePerf6116");
    expect(load).not.toHaveBeenCalled();
    preloadPage("PagePerf6116");
    preloadPage("PagePerf6116");
    await Promise.resolve();
    expect(load).toHaveBeenCalledTimes(1);
    preloadPage("PageInconnue");
    preloadPage(undefined);
  });

  it("archives 3D : la carte de face d'abord, puis de part et d'autre, sans doublon", () => {
    expect(holoWindow(0, 100, 2)).toEqual([0, 1, 99, 2, 98]);
    expect(holoWindow(5, 6, 7).sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(holoWindow(0, 0)).toEqual([]);
    // 140 fiches : 15 images au premier affichage (avant : les 140).
    expect(holoWindow(0, 140)).toHaveLength(15);
  });

  it("chaque page du jeu est préchargée par son adresse, et la page statique ne fait pas sauter le body", () => {
    const app = readFileSync("src/App.tsx", "utf8");
    const routes = [...app.matchAll(/<Route path="([a-z0-9-]+)" element=\{<([A-Za-z]+Page) \/>\}/g)].filter(([, , c]) => new RegExp(`const ${c} = lazyPage`).test(app));
    expect(routes.length).toBeGreaterThan(30);
    for (const [, path, comp] of routes) expect(app, path).toContain(`"${path}": "${comp}"`);
    const html = readFileSync("index.html", "utf8");
    expect(html).not.toMatch(/<main style="[^"]*margin: 64px/);
  });
});
