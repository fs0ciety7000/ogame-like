import { afterEach, describe, expect, it } from "vitest";
import {
  ALLIANCE_RULES,
  allianceBastionBonus,
  allianceBuildTimeFactor,
  allianceCounterSpy,
  allianceDefEffects,
  allianceEffectGrants,
  allianceEffectLines,
  allianceFlightFactor,
  allianceMaxMembers,
  allianceProductionFactor,
  allianceResearchTimeFactor,
  allianceShieldBonus,
  allianceSiegeFactor,
  type AllianceResearchDef,
} from "@/game/alliances";
import { applyGameContent, defaultGameContent, validateRules } from "@/game/content";
import { allEffects, empireEffects, playerModifiers } from "@/game/modifiers";
import { effectImpactReport } from "@/game/impact";
import { defaultPlayerState } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

/* 6.14.124 (AU27, lot AA6, constat AA-15) : recherches et projets d'alliance par effets composés. Les 5 recherches et
   3 projets livrés gardent exactement leurs valeurs ; une recherche ajoutée dans l'admin a un effet ; plafonds respectés. */

const reset = () => applyGameContent(defaultGameContent());
afterEach(reset);

/** Niveaux d'une alliance de la copie de production simulée (recherches et projets à divers niveaux, hors bornes compris). */
const LEVEL_SETS: Record<string, number>[] = [
  {},
  { logistique: 5, industrie: 5, brouillage: 5, bouclier: 5, quartiers: 3, projet_forge: 5, projet_siege: 5, projet_bastion: 5 },
  { logistique: 2, industrie: 3, brouillage: 1, quartiers: 1, projet_forge: 2, projet_bastion: 1 },
  { logistique: 9, industrie: -1, projet_siege: 3, projet_forge: 9 },
];

/** Formules d'avant la 6.14.124 (effet lié à l'identifiant), pour la comparaison. */
const lvl = (levels: Record<string, number>, key: string, max: number) => Math.max(0, Math.min(max, Math.floor(Number(levels[key]) || 0)));
const OLD = {
  flight: (l: Record<string, number>) => Math.max(0.1, 1 - lvl(l, "logistique", 5) * 0.05),
  prod: (l: Record<string, number>) => 1 + lvl(l, "industrie", 5) * 0.03,
  counter: (l: Record<string, number>) => lvl(l, "brouillage", 5) * 1,
  shield: (l: Record<string, number>) => lvl(l, "bouclier", 5) * 0.01,
  forge: (l: Record<string, number>) => Math.max(0.5, 1 - lvl(l, "projet_forge", 5) * 0.02),
  siege: (l: Record<string, number>) => 1 + lvl(l, "projet_siege", 5) * 0.04,
  bastion: (l: Record<string, number>) => lvl(l, "projet_bastion", 5) * 0.02,
  members: (l: Record<string, number>) => 8 + lvl(l, "quartiers", 3) * 4,
};

const member = (levels: Record<string, number>): PlayerState => ({ ...(defaultPlayerState("m1", "Membre") as PlayerState), allianceResearch: levels });

describe("AA6 : effets des recherches et projets livrés (valeurs identiques)", () => {
  it("chaque recherche et chaque projet livré a son effet composé", () => {
    const of = (id: string) => allianceDefEffects(ALLIANCE_RULES.researches.find((r) => r.id === id)!, "research");
    const ofP = (id: string) => allianceDefEffects(ALLIANCE_RULES.projects.find((r) => r.id === id)!, "project");
    expect(ALLIANCE_RULES.researches).toHaveLength(5);
    expect(ALLIANCE_RULES.projects).toHaveLength(3);
    expect([of("logistique"), of("industrie"), of("brouillage"), of("bouclier"), of("quartiers")]).toEqual([[{ stat: "fleetSpeed" }], [{ stat: "productionAll" }], [{ stat: "counterSpy" }], [{ stat: "shield" }], [{ stat: "allianceMembers" }]]);
    expect([ofP("forge"), ofP("siege"), ofP("bastion")]).toEqual([[{ stat: "buildTime" }, { stat: "researchTime" }], [{ stat: "unitAttack", scope: "pve" }], [{ stat: "protectedStorage" }]]);
  });

  const check = () => {
    for (const l of LEVEL_SETS) {
      expect(allianceFlightFactor(l)).toBeCloseTo(OLD.flight(l), 12);
      expect(allianceProductionFactor(l)).toBeCloseTo(OLD.prod(l), 12);
      expect(allianceCounterSpy(l)).toBeCloseTo(OLD.counter(l), 12);
      expect(allianceShieldBonus(l)).toBeCloseTo(OLD.shield(l), 12);
      expect(allianceBuildTimeFactor(l)).toBeCloseTo(OLD.forge(l), 12);
      expect(allianceResearchTimeFactor(l)).toBeCloseTo(OLD.forge(l), 12);
      expect(allianceSiegeFactor(l)).toBeCloseTo(OLD.siege(l), 12);
      expect(allianceBastionBonus(l)).toBeCloseTo(OLD.bastion(l), 12);
      expect(allianceMaxMembers({ research: l } as never)).toBe(OLD.members(l));
      // Rien ne passe dans la couche empire : les officiers, reliques et talents gardent leurs plafonds.
      expect(empireEffects(member(l)).filter((g) => g.source.kind === "alliance")).toEqual([]);
      expect(playerModifiers(member(l))).toEqual(playerModifiers(member({})));
    }
  };

  it("contenu par défaut : mêmes valeurs qu'avant, pour chaque niveau", check);

  it("règles enregistrées avant la 6.14.124 (sans effets) : même repli, mêmes valeurs", () => {
    const content = defaultGameContent();
    content.rules.alliances.researches = content.rules.alliances.researches.map(({ effects: _e, ...r }) => {
      void _e;
      return r as AllianceResearchDef;
    });
    content.rules.alliances.projects = content.rules.alliances.projects.map(({ effects: _e, ...p }) => {
      void _e;
      return p;
    });
    applyGameContent(content);
    expect(ALLIANCE_RULES.researches.every((r) => r.effects === undefined)).toBe(true);
    check();
  });

  it("textes des effets lus dans la recherche", () => {
    const r = (id: string) => ALLIANCE_RULES.researches.find((x) => x.id === id)!;
    expect(allianceEffectLines(r("logistique"), "research")).toEqual(["−5\u00a0% · Temps de vol"]);
    expect(allianceEffectLines(r("quartiers"), "research")).toEqual(["+4 places de membre"]);
    expect(allianceEffectLines(ALLIANCE_RULES.projects.find((p) => p.id === "siege")!, "project", 2)).toEqual(["+8\u00a0% · Attaque contre les boss, les primes et les repaires"]);
  });
});

describe("AA6 : une recherche ajoutée dans l'admin a un effet", () => {
  const withResearch = (def: AllianceResearchDef) => {
    const content = defaultGameContent();
    content.rules.alliances.researches = [...content.rules.alliances.researches, def];
    applyGameContent(content);
  };

  it("soute (couche empire) : lue par empireEffects, avec les officiers et les reliques (I9)", () => {
    withResearch({ id: "soutes", name: "Soutes fédérées", emoji: "", description: "", perLevel: 0.05, maxLevel: 4, effects: [{ stat: "cargo" }] });
    const p = member({ soutes: 3 });
    expect(empireEffects(p).filter((g) => g.source.kind === "alliance")).toEqual([{ stat: "cargo", value: 0.15000000000000002, layer: "empire", source: { kind: "alliance", id: "soutes", label: "Soutes fédérées" } }]);
    expect(playerModifiers(p).cargo).toBeCloseTo(0.15);
    // Niveau au-delà du maximum : borné.
    expect(playerModifiers(member({ soutes: 99 })).cargo).toBeCloseTo(0.2);
  });

  it("temps de vol (couche alliance) : s'ajoute à la Logistique fédérée", () => {
    withResearch({ id: "sauts", name: "Sauts coordonnés", emoji: "", description: "", perLevel: 0.02, maxLevel: 5, effects: [{ stat: "fleetSpeed" }] });
    expect(allianceFlightFactor({ logistique: 5, sauts: 5 })).toBeCloseTo(1 - 0.25 - 0.1);
    // Plafond de la couche alliance (0,5) : jamais plus de −50 % par les alliances.
    withResearch({ id: "sauts", name: "Sauts coordonnés", emoji: "", description: "", perLevel: 0.2, maxLevel: 5, effects: [{ stat: "fleetSpeed" }] });
    expect(allianceFlightFactor({ logistique: 5, sauts: 5 })).toBeCloseTo(0.5);
    expect(allEffects(member({ sauts: 1 })).some((g) => g.layer === "alliance" && g.stat === "fleetSpeed")).toBe(true);
  });

  it("projet d'attaque d'une classe (couche empire, ciblé)", () => {
    const content = defaultGameContent();
    content.rules.alliances.projects = [...content.rules.alliances.projects, { id: "marteau", name: "Marteau fédéral", emoji: "", description: "", perLevel: 0.03, maxLevel: 5, effects: [{ stat: "unitAttack", target: "class:heavy" }] }];
    applyGameContent(content);
    const grants = allianceEffectGrants({ projet_marteau: 2 });
    expect(grants).toEqual([{ stat: "unitAttack", target: "class:heavy", value: 0.06, layer: "empire", source: { kind: "alliance", id: "projet_marteau", label: "Marteau fédéral" } }]);
  });

  it("validation : grandeur, cible ou portée inconnue refusée", () => {
    const base = defaultGameContent().rules.alliances;
    const bad = (effects: unknown) => validateRules({ alliances: { ...base, researches: [...base.researches, { id: "x", name: "X", emoji: "", description: "", perLevel: 0.01, maxLevel: 1, effects }] } } as never).join(" ");
    expect(bad([{ stat: "vitesse" }])).toContain("grandeur « vitesse » inconnue");
    expect(bad([{ stat: "unitAttack", target: "unit:inconnue" }])).toContain("cible « unit:inconnue » inconnue");
    expect(bad([{ stat: "cargo" }])).toBe("");
    expect(bad([{ stat: "allianceMembers" }])).toBe("");
    // Une recherche sans effets est refusée (forme du défaut : chaque recherche livrée en a).
    expect(validateRules({ alliances: { ...base, researches: [...base.researches, { id: "y", name: "Y", emoji: "", description: "", perLevel: 0.01, maxLevel: 1 }] } } as never).join(" ")).toContain("effects");
  });
});

describe("AA6 : plafonds des bonus", () => {
  it("rapport d'impact : chaque recherche et projet au maximum, sans plafond atteint à contenu par défaut", () => {
    const rows = effectImpactReport().filter((r) => r.sources.some((s) => s.kind === "alliance"));
    expect(rows.map((r) => `${r.layer}:${r.stat}`).sort()).toEqual(["alliance:buildTime", "alliance:counterSpy", "alliance:fleetSpeed", "alliance:productionAll", "alliance:protectedStorage", "alliance:researchTime", "alliance:shield", "alliance:unitAttack"]);
    expect(rows.every((r) => !r.capped)).toBe(true);
  });
});
