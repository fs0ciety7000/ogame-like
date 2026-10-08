import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent, CONTENT_SECTIONS, contentSectionErrors, currentGameContent, defaultGameContent, NO_REMOVAL_SECTIONS, validateGameContent } from "@/game/content";
import { DEFAULT_TALENTS, learnTalent, TALENTS, talentEffects, type TalentDef } from "@/game/talents";
import { DEFAULT_MODULE_FAMILIES, DEFAULT_MODULE_TEMPLATES, describeModule, MODULE_FAMILIES, MODULE_TEMPLATES, moduleEffects, mountModule, rollModulePlan, type ModuleFamilyDef, type ModuleTemplate } from "@/game/modules";
import { effectImpactReport } from "@/game/impact";
import { contentChainReport } from "@/game/contentChain";
import { empireEffects } from "@/game/modifiers";
import type { PlayerState } from "@/types/game";

/* =====================================================
   6.14.127 (AU27, lot AA9, constats AA-2 et AA-5, invariant I43) : talents,
   familles et modèles de modules en sections de contenu. Un élément ajouté
   dans l'admin agit ; un élément enregistré ne se supprime pas (il se
   retire) ; un élément livré absent revient ; les valeurs par défaut sont
   celles d'avant (capture avant / après dans la fiche du lot).
===================================================== */

afterEach(() => applyGameContent({}));

const STRATEGE: TalentDef = { id: "stratege", branch: "guerre", name: "Stratège", description: "Attaque des vaisseaux lourds (+{value} par rang).", effects: [{ stat: "unitAttack", target: "class:heavy", value: 0.05 }] };
const GRAPPIN: ModuleFamilyDef = { id: "grappin", label: "Grappin", stat: "unitCost", classes: ["support", "light"], values: { common: 0.01, rare: 0.02, epic: 0.03, legendary: 0.05 } };
const PINCE: ModuleTemplate = { id: "pince_magnetique", name: "Pince magnétique", family: "grappin", description: "Récupère les pièces en vol." };

const player = (extra: Partial<PlayerState> = {}) => ({ ascensions: 2, talents: { ranks: {} }, ...extra }) as unknown as PlayerState;

describe("AA9 : sections « talents », « moduleFamilies », « moduleTemplates »", () => {
  it("les trois sections existent, sans retrait d'un élément enregistré ; contenu par défaut = listes livrées", () => {
    for (const s of ["talents", "moduleFamilies", "moduleTemplates"] as const) {
      expect(CONTENT_SECTIONS).toContain(s);
      expect(NO_REMOVAL_SECTIONS).toContain(s);
    }
    const d = defaultGameContent();
    expect(d.talents).toEqual(DEFAULT_TALENTS);
    expect(d.moduleFamilies).toEqual(DEFAULT_MODULE_FAMILIES);
    expect(d.moduleTemplates).toEqual(DEFAULT_MODULE_TEMPLATES);
    expect(validateGameContent(d)).toEqual([]);
    expect(TALENTS.map((t) => t.id)).toEqual(DEFAULT_TALENTS.map((t) => t.id));
    expect(Object.keys(MODULE_FAMILIES)).toEqual(["armement", "blindage", "soute", "propulsion", "voile"]);
  });

  it("un talent ajouté dans l'admin s'apprend et agit (effet composé ciblé, rapport d'impact, chaîne de contenu)", () => {
    applyGameContent({ talents: [...DEFAULT_TALENTS, STRATEGE] });
    const p = player();
    learnTalent(p, "stratege");
    learnTalent(p, "stratege");
    expect(talentEffects(p)).toEqual([{ stat: "unitAttack", target: "class:heavy", value: 0.1, layer: "empire", source: { kind: "talent", id: "stratege", label: "Stratège" } }]);
    // Circuit d'effets (couche empire), lu par le combat comme les reliques et les classes.
    expect(empireEffects(p).filter((g) => g.source.kind === "talent")).toEqual(talentEffects(p));
    const row = effectImpactReport().find((r) => r.stat === "unitAttack" && r.target === "class:heavy" && r.layer === "empire");
    expect(row?.sources.some((s) => s.kind === "talent" && s.label === "Stratège" && Math.abs(s.max - 0.15) < 1e-9)).toBe(true);
    expect(contentChainReport().some((r) => r.kind === "talent" && r.id === "stratege")).toBe(true);
  });

  it("un talent retiré ne s'apprend plus ; les rangs déjà pris gardent leur effet", () => {
    const p = player({ talents: { ranks: { assaut: 2 } } } as Partial<PlayerState>);
    applyGameContent({ talents: DEFAULT_TALENTS.map((t) => (t.id === "assaut" ? { ...t, retired: true } : t)) });
    expect(() => learnTalent(p, "assaut")).toThrow(/n'est plus proposé/);
    expect(talentEffects(p)[0]).toMatchObject({ stat: "attack", value: 0.04 });
  });

  it("un talent livré absent d'une liste enregistrée revient (mêmes valeurs)", () => {
    applyGameContent({ talents: DEFAULT_TALENTS.filter((t) => t.id !== "rempart") });
    expect(TALENTS.find((t) => t.id === "rempart")?.effects).toEqual([{ stat: "defense", value: 0.02 }]);
  });

  it("une famille et un modèle ajoutés : le plan sort au tirage, le module se monte sur ses classes et agit", () => {
    applyGameContent({ moduleFamilies: [...DEFAULT_MODULE_FAMILIES, GRAPPIN], moduleTemplates: [...DEFAULT_MODULE_TEMPLATES, PINCE] });
    expect(MODULE_TEMPLATES).toHaveLength(8);
    // Dernier modèle de la liste : tirage juste sous 1.
    const plan = rollModulePlan("test", 1, () => 0.999, "common");
    expect(plan.template).toBe("pince_magnetique");
    const p = player({ modules: { items: [{ id: "a", template: "pince_magnetique", rarity: "legendary", built: true, foundAtMs: 1, source: "x" }] } } as unknown as Partial<PlayerState>);
    expect(() => mountModule(p, "a", "heavy", 0)).toThrow("Grappin : se monte sur les classes Soutien ou Faible.");
    mountModule(p, "a", "light", 0);
    expect(moduleEffects(p)).toEqual([{ stat: "unitCost", target: "class:light", value: 0.05, layer: "empire", source: { kind: "module", id: "a", label: "Pince magnétique (légendaire)" } }]);
    expect(describeModule({ template: "pince_magnetique", rarity: "legendary" })).toBe("−5 % Coût des unités ciblées");
    expect(contentChainReport().some((r) => r.kind === "module" && r.id === "pince_magnetique")).toBe(true);
  });

  it("un modèle retiré ne sort plus au tirage ; un module déjà monté garde son effet", () => {
    const p = player({ modules: { items: [{ id: "a", template: "voile_furtif", rarity: "rare", built: true, foundAtMs: 1, source: "x" }], slots: { light: [null, null], medium: [null, null], heavy: [null, null], support: ["a", null] } } } as unknown as Partial<PlayerState>);
    applyGameContent({ moduleTemplates: DEFAULT_MODULE_TEMPLATES.map((t) => (t.id === "voile_furtif" ? { ...t, retired: true } : t)) });
    const seen = new Set(Array.from({ length: 200 }, (_, i) => rollModulePlan("t", i, () => (i + 0.5) / 200).template));
    expect(seen.has("voile_furtif")).toBe(false);
    expect(seen.size).toBe(6);
    expect(moduleEffects(p)).toEqual([expect.objectContaining({ stat: "counterSpy", value: 2 })]);
  });

  it("validation : talent, famille et modèle invalides refusés", () => {
    const c = currentGameContent();
    const errs = (patch: Record<string, unknown>) => validateGameContent({ ...c, ...patch }).join(" · ");
    expect(errs({ talents: [...DEFAULT_TALENTS, { ...STRATEGE, branch: "magie" }] })).toMatch(/branche « magie » inconnue/);
    expect(errs({ talents: [...DEFAULT_TALENTS, { ...STRATEGE, effects: [{ stat: "unitAttack", target: "class:heavy", value: 0.4 }] }] })).toMatch(/valeur par rang entre 0 et 0,25/);
    expect(errs({ talents: [...DEFAULT_TALENTS, { ...STRATEGE, effects: [] }] })).toMatch(/Stratège : au moins un effet/);
    expect(errs({ talents: [...DEFAULT_TALENTS, { ...STRATEGE, effects: [{ stat: "unitAttack", target: "unit:inconnue", value: 0.05 }] }] })).toMatch(/cible « unit:inconnue » inconnue/);
    expect(errs({ talents: [...DEFAULT_TALENTS, { ...STRATEGE, id: "assaut" }] })).toMatch(/« assaut » en double/);
    expect(errs({ moduleFamilies: [...DEFAULT_MODULE_FAMILIES, { ...GRAPPIN, classes: [] }] })).toMatch(/Grappin : au moins une classe/);
    expect(errs({ moduleFamilies: [...DEFAULT_MODULE_FAMILIES, { ...GRAPPIN, values: { ...GRAPPIN.values, epic: 3 } }] })).toMatch(/valeur « epic » entre 0 et 1/);
    expect(errs({ moduleFamilies: [...DEFAULT_MODULE_FAMILIES, { ...GRAPPIN, stat: "production" }] })).toMatch(/demande une cible/);
    expect(errs({ moduleTemplates: [...DEFAULT_MODULE_TEMPLATES, PINCE] })).toMatch(/famille « grappin » inconnue/);
    expect(errs({ moduleTemplates: DEFAULT_MODULE_TEMPLATES.map((t) => ({ ...t, retired: true })) })).toMatch(/au moins un modèle non retiré/);
  });

  it("garde du serveur : un élément enregistré ne se supprime pas ; un ajout valide passe ; un ajout invalide est refusé", () => {
    const stored = { talents: [...DEFAULT_TALENTS, STRATEGE] };
    expect(contentSectionErrors("talents", DEFAULT_TALENTS, stored).join(" ")).toMatch(/« stratege » est enregistré .* retire-le du jeu/);
    expect(contentSectionErrors("talents", [...DEFAULT_TALENTS, { ...STRATEGE, retired: true }], stored)).toEqual([]);
    expect(contentSectionErrors("talents", [...DEFAULT_TALENTS, STRATEGE], {})).toEqual([]);
    expect(contentSectionErrors("talents", [...DEFAULT_TALENTS, { ...STRATEGE, branch: "magie" }], {}).join(" ")).toMatch(/branche « magie »/);
    expect(contentSectionErrors("moduleTemplates", [...DEFAULT_MODULE_TEMPLATES, PINCE], {}).join(" ")).toMatch(/famille « grappin » inconnue/);
    expect(contentSectionErrors("moduleTemplates", [...DEFAULT_MODULE_TEMPLATES, PINCE], { moduleFamilies: [...DEFAULT_MODULE_FAMILIES, GRAPPIN] })).toEqual([]);
    expect(contentSectionErrors("moduleTemplates", DEFAULT_MODULE_TEMPLATES.slice(1), { moduleTemplates: DEFAULT_MODULE_TEMPLATES }).join(" ")).toMatch(/« canons_surcharges » est enregistré/);
  });
});
