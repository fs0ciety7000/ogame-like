import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/* 6.14.97 (TH-L1, constat TH-7 de l'audit AU28 des thèmes) : un état (verrouillé, réclamé, en attente, manque) se marque par l'icône,
   la bordure et la couleur du texte, jamais par l'opacité d'un bloc qui porte du texte : à 0,75 d'opacité, « Palier N » en
   `text-slate-400` tombait à 3,9:1 (Constellation, Ishimura). Les fichiers listés ici sont corrigés ; les autres usages relevés
   (agenda passé, seigneur vaincu, carte de prime possédée…) restent au balayage de la revue de fin de feuille de route. */
const FILES = [
  "src/pages/SeasonPassPage.tsx",
  "src/pages/BuildingsPage.tsx",
  "src/components/ui/hud.tsx",
  "src/components/ui/afford.tsx",
];

describe("verrous et manques sans opacité sur le texte (TH-L1)", () => {
  for (const f of FILES) {
    it(f, () => {
      const hits = readFileSync(f, "utf8")
        .split("\n")
        .filter((l) => /(&&|\?|:)\s*"opacity-[0-9]+"|<em[^>]*opacity-[0-9]+/.test(l));
      expect(hits).toEqual([]);
    });
  }
});
