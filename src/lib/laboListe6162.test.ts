import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { TECHNOLOGIES } from "@/game/technologies";
import { techCells, techFamily } from "@/components/game/techTreeLayout";

/* 6.14.162 (S2, NJ-3) : vue liste du Labo, par défaut sur téléphone ; l'arbre ne sélectionne plus le texte pendant le glisser. */

const ROOT = path.resolve(__dirname, "../..");
const src = (p: string) => readFileSync(path.join(ROOT, p), "utf8");

describe("familles de la vue liste", () => {
  it("chaque techno par défaut a une famille de l'arbre (jamais « Autres »)", () => {
    const cells = techCells();
    for (const t of TECHNOLOGIES) expect(techFamily(t.id, cells).label, t.id).not.toBe("Autres");
  });

  it("les racines sont aux Fondations, le Drone à la Logistique, l'Étoile noire à l'Armement", () => {
    expect(techFamily("tech1").label).toBe("Fondations");
    expect(techFamily("tech3").label).toBe("Fondations");
    expect(techFamily("tech9").label).toBe("Logistique");
    expect(techFamily("tech19").label).toBe("Armement");
  });
});

describe("Labo : bascule Liste / Arbre", () => {
  const lab = src("src/pages/LabPage.tsx");

  it("liste par défaut sous 768 px, choix gardé par appareil (lecture et écriture protégées)", () => {
    expect(lab).toContain('"cosmic-empires:labo-vue"');
    expect(lab).toContain("(max-width: 767px)");
    expect(lab.match(/try \{[\s\S]*?localStorage\.(getItem|setItem)\(VIEW_KEY/g)?.length).toBe(2);
    expect(lab).toMatch(/aria-pressed=\{view === "list"\}/);
    expect(lab).toMatch(/aria-pressed=\{view === "tree"\}/);
  });

  it("la liste reçoit ?tech=<id> et lance la recherche par ligne", () => {
    expect(lab).toMatch(/<TechList[\s\S]*focusId=\{focusTech\}/);
    const list = src("src/components/game/TechList.tsx");
    expect(list).toContain("tech-row-${focusId}");
    expect(list).toContain("Rechercher");
    expect(list).toContain("Il manque : ");
  });

  it("l'arbre coupe la sélection de texte pendant le glisser", () => {
    const tree = src("src/components/game/TechTree.tsx");
    expect(tree).toContain('dragging && "select-none"');
    expect(tree).toContain('root.classList.add("select-none")');
    expect(tree).toContain('window.addEventListener("pointerup", stop)');
  });
});
