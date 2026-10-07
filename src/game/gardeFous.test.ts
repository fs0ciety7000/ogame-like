import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent, contentSectionErrors, currentGameContent, defaultGameContent, resolveGameContent, ruleDriftWarnings, validateGameContent, validateRules } from "@/game/content";
import { listShapeErrors, shapeErrors } from "@/game/contentShape";

/* 6.14.59 (AU27, lot AA1 : garde-fous, constats AA-25 et AA-26 ; Q75 validée : refuser types et formes, avertir les écarts). */

afterEach(() => {
  applyGameContent({});
});

describe("forme des valeurs (contentShape)", () => {
  it("accepte le défaut tel quel, refuse null à la place d'un nombre, à toute profondeur", () => {
    const d = { a: 1, nested: { b: 2, list: [{ x: 1, y: "t" }] } };
    expect(shapeErrors("G", d, d)).toEqual([]);
    expect(shapeErrors("G", { a: null }, d).join(" ")).toMatch(/« a » doit être un nombre, reçu : vide \(null\)/);
    expect(shapeErrors("G", { nested: { b: null } }, d).join(" ")).toMatch(/« nested\.b »/);
    expect(shapeErrors("G", { nested: { b: Number.NaN } }, d).join(" ")).toMatch(/nombre fini/);
    expect(shapeErrors("G", { nested: { b: -3 } }, d).join(" ")).toMatch(/ne peut pas être négatif/);
    expect(shapeErrors("G", { nested: "abc" }, d).join(" ")).toMatch(/doit être un objet, reçu : le texte « abc »/);
  });

  it("une liste d'objets mal formée est refusée (champ chiffré manquant, mauvais type)", () => {
    const d = { list: [{ id: "a", n: 1 }, { id: "b", n: 2, opt: 3 }] };
    expect(shapeErrors("G", { list: [{ id: "c", n: 5 }] }, d)).toEqual([]);
    expect(shapeErrors("G", { list: [{ id: "c" }] }, d).join(" ")).toMatch(/« list\[0\]\.n » manquant/);
    expect(shapeErrors("G", { list: [{ id: "c", n: "5" }] }, d).join(" ")).toMatch(/« list\[0\]\.n » doit être un nombre/);
    // Champ optionnel (absent d'un défaut) : pas obligatoire.
    expect(shapeErrors("G", { list: [{ id: "c", n: 1 }] }, d)).toEqual([]);
    expect(shapeErrors("G", { list: ["x"] }, d).join(" ")).toMatch(/doit être un objet/);
  });

  it("null reste permis là où le défaut est null (« ancien comportement »)", () => {
    expect(shapeErrors("G", { a: null }, { a: null })).toEqual([]);
    expect(shapeErrors("G", { a: 3 }, { a: null })).toEqual([]);
  });

  it("une section de liste désigne l'élément fautif par son nom", () => {
    const units = defaultGameContent().units;
    const broken = units.map((u) => (u.id === "fregate" ? { ...u, stats: { ...u.stats, attaque: null } } : u));
    expect(listShapeErrors("Unités", "Unité", broken, units).join(" ")).toMatch(/Unité Frégate : « stats\.attaque » doit être un nombre/);
    expect(listShapeErrors("Unités", "Unité", { a: 1 }, units).join(" ")).toMatch(/doit être une liste/);
  });
});

describe("règles : validation récursive (AA-25)", () => {
  it("le contenu par défaut reste valide", () => {
    expect(validateGameContent(defaultGameContent())).toEqual([]);
    expect(validateRules(defaultGameContent().rules)).toEqual([]);
  });

  it("une recherche d'alliance sans perLevel est refusée (elle donnait NaN)", () => {
    const researches = defaultGameContent().rules.alliances.researches.map((r, i) => (i === 0 ? { ...r, perLevel: undefined } : r));
    const errs = validateRules({ alliances: { ...defaultGameContent().rules.alliances, researches } } as never).join(" ");
    expect(errs).toMatch(/Alliances : « researches\[0\]\.perLevel » manquant/);
  });

  it("un objet imbriqué au mauvais type est refusé, avec le champ et le type attendu", () => {
    const errs = validateRules({ expeditions: { weights: { ...defaultGameContent().rules.expeditions.weights, deposit: "beaucoup" } } } as never).join(" ");
    expect(errs).toMatch(/« weights\.deposit » doit être un nombre, reçu : le texte « beaucoup »/);
  });

  it("un groupe du registre garde un null : refusé à la place d'un nombre", () => {
    const errs = validateRules({ combat: { maxRounds: null } } as never).join(" ");
    expect(errs).toMatch(/maxRounds/);
  });

  it("écart de plus de ×2 au défaut : averti, pas refusé (Q75)", () => {
    const d = defaultGameContent().rules;
    const rules = { ...d, combat: { ...d.combat, maxRounds: d.combat.maxRounds * 2 + 1 } };
    expect(validateRules(rules)).toEqual([]);
    expect(ruleDriftWarnings(rules).join(" ")).toMatch(/Combat : « maxRounds » vaut 17 \(défaut 8\)/);
    expect(ruleDriftWarnings(d)).toEqual([]);
  });
});

describe("toutes les sections vérifiées par le serveur (AA-26, contentSectionErrors)", () => {
  it("une valeur correcte passe, dans chaque section de liste", () => {
    const d = defaultGameContent();
    const units = d.units.map((u) => (u.id === "fregate" ? { ...u, hangarSpace: 2, stats: { ...u.stats, attaque: 120 } } : u));
    expect(contentSectionErrors("units", units, {})).toEqual([]);
    expect(contentSectionErrors("buildings", d.buildings, {})).toEqual([]);
    expect(contentSectionErrors("technologies", d.technologies, {})).toEqual([]);
    expect(contentSectionErrors("relics", d.relics, {})).toEqual([]);
    expect(contentSectionErrors("rules", { combat: { maxRounds: 10 } }, {})).toEqual([]);
  });

  it("une valeur cassée est refusée : unités, bâtiments, technos, reliques, règles", () => {
    const d = defaultGameContent();
    expect(contentSectionErrors("units", d.units.map((u) => (u.id === "fregate" ? { ...u, cost: { scrap: null, energy: 500 } } : u)), {}).join(" ")).toMatch(/Unité Frégate : « cost\.scrap »/);
    expect(contentSectionErrors("units", { fregate: {} }, {}).join(" ")).toMatch(/Unités : la section doit être une liste/);
    expect(contentSectionErrors("buildings", d.buildings.map((b, i) => (i === 0 ? { ...b, maxLevel: "dix" } : b)), {}).join(" ")).toMatch(/« maxLevel » doit être un nombre/);
    expect(contentSectionErrors("technologies", d.technologies.map((t) => (t.id === "tech1" ? { ...t, baseTime: -30 } : t)), {}).join(" ")).toMatch(/« baseTime » ne peut pas être négatif/);
    expect(contentSectionErrors("relics", d.relics.map((r, i) => (i === 0 ? { ...r, name: 12 } : r)), {}).join(" ")).toMatch(/Relique/);
    expect(contentSectionErrors("rules", { combat: { maxRounds: null } }, {}).join(" ")).toMatch(/maxRounds/);
    expect(contentSectionErrors("rules", "illisible", {}).join(" ")).toMatch(/Règles : contenu illisible/);
  });

  it("une erreur déjà enregistrée ailleurs ne bloque pas une autre section", () => {
    const d = defaultGameContent();
    const brokenUnits = d.units.map((u) => (u.id === "fregate" ? { ...u, cost: { scrap: null, energy: 500 } } : u));
    expect(contentSectionErrors("rules", { combat: { maxRounds: 10 } }, { units: brokenUnits as never })).toEqual([]);
    // La section elle-même ne peut pas rester cassée d'une autre façon.
    expect(contentSectionErrors("units", brokenUnits, { units: brokenUnits as never })).toEqual([]);
  });

  it("section inconnue (réglage serveur hors contenu) : pas concernée", () => {
    expect(contentSectionErrors("casino", { anything: true }, {})).toEqual([]);
  });

  it("resolveGameContent n'applique rien (le jeu garde son contenu)", () => {
    const before = currentGameContent().units.find((u) => u.id === "fregate")!.hangarSpace;
    resolveGameContent({ units: defaultGameContent().units.map((u) => ({ ...u, hangarSpace: 99 })) });
    contentSectionErrors("units", defaultGameContent().units.map((u) => ({ ...u, hangarSpace: 99 })), {});
    expect(currentGameContent().units.find((u) => u.id === "fregate")!.hangarSpace).toBe(before);
  });
});
