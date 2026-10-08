import { existsSync, readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { defaultPlayerState } from "@/game/defaults";
import { achievementValue, ACHIEVEMENTS, DEFAULT_ACHIEVEMENTS, setAchievements } from "@/game/achievements";
import { BUILDING_TIER_RULES, familyTiers, setBuildingChoice, signatureTiersReached, specChoicesMade, tierFormulaRows, tierIconKey, TIER_ART } from "@/game/buildingTiers";
import { BUILD_PLAN_RULES } from "@/game/buildPlan";
import { BUILDINGS, findBuilding } from "@/game/buildings";
import { codexEntries } from "@/game/codex";
import { findTitle } from "@/game/titles";
import { matchPaletteContent } from "@/game/paletteContent";
import { grantNewAchievements } from "@/game/flush";
import type { PlayerState } from "@/types/game";

/* 6.14.146 (PB-L5, docs/proposals/paliers-batiments.md §7) : chaîne de contenu des paliers des bâtiments — succès « Architecte »
   et « Bâtisseur avisé » (et leurs entrées), titre, Codex, Formules, Ctrl+K, icônes de palier dans l'atelier d'illustrations. */

const NOW = Date.UTC(2026, 10, 10, 12);
const SAVED = structuredClone(BUILDING_TIER_RULES);

beforeEach(() => {
  setAchievements(structuredClone(DEFAULT_ACHIEVEMENTS));
});
afterEach(() => {
  Object.assign(BUILDING_TIER_RULES, structuredClone(SAVED));
});

function player(levels: Record<string, number>): PlayerState {
  const p = defaultPlayerState("u1", "Architecte") as PlayerState;
  for (const [id, level] of Object.entries(levels)) p.buildings[id] = { level, unlocked: true };
  p.resourcesUpdatedAtMs = NOW;
  return p;
}

const SYSTEM_20 = { entrepot: 20, atelier_reparation: 20, hangar_attaque: 20, hangar_defense: 20 };
const SYSTEM_15 = { entrepot: 15, atelier_reparation: 15, hangar_attaque: 15, hangar_defense: 15 };

describe("PB-L5 (6.14.146) : succès des paliers", () => {
  it("« Architecte » : les 4 paliers signature en même temps ; entrée « Première signature » dès le premier ; titre « Grand architecte »", () => {
    const ids = BUILDINGS.map((b) => b.id);
    expect(ids).toEqual(expect.arrayContaining(Object.keys(SYSTEM_20)));
    const three = player({ ...SYSTEM_20, hangar_defense: 19 });
    expect(signatureTiersReached(three)).toBe(3);
    const architecte = ACHIEVEMENTS.find((a) => a.id === "architecte")!;
    const entry = ACHIEVEMENTS.find((a) => a.id === "palier_1")!;
    expect(achievementValue(architecte, three)).toBe(0);
    expect(achievementValue(entry, three)).toBe(3);
    const all = player(SYSTEM_20);
    expect(achievementValue(architecte, all)).toBe(1);
    expect(architecte.titleId).toBe("grand_architecte");
    expect(findTitle("grand_architecte")?.label).toBe("Grand architecte");
    // Niveaux réglables : la mesure lit la règle.
    BUILDING_TIER_RULES.hangarDefenseLevels = [5, 10, 15, 19];
    expect(achievementValue(architecte, three)).toBe(1);
  });

  it("« Bâtisseur avisé » : un choix à chacun des 4 paliers de spécialisation ; gardé après une Ascension (choix enregistrés)", () => {
    const p = player(SYSTEM_15);
    setBuildingChoice(p, "storage.spec", "trade", NOW);
    setBuildingChoice(p, "workshop.class", "heavy", NOW);
    setBuildingChoice(p, "hangarAttack.spec", "deck", NOW);
    const avise = ACHIEVEMENTS.find((a) => a.id === "batisseur_avise")!;
    expect(achievementValue(avise, p)).toBe(0);
    expect(achievementValue(ACHIEVEMENTS.find((a) => a.id === "specialiste_1")!, p)).toBe(3);
    setBuildingChoice(p, "hangarDefense.spec", "upkeep", NOW);
    expect(specChoicesMade(p)).toBe(4);
    expect(achievementValue(avise, p)).toBe(1);
    p.buildings.entrepot.level = 1;
    expect(achievementValue(avise, p)).toBe(1);
  });

  it("débloqués par le rattrapage habituel (sans retrait : un succès gagné reste)", () => {
    const p = player(SYSTEM_20);
    const notes: Parameters<typeof grantNewAchievements>[2] = [];
    grantNewAchievements(p, NOW, notes);
    expect(p.unlockedAchievements).toEqual(expect.arrayContaining(["architecte", "palier_1"]));
    p.buildings.entrepot.level = 1;
    grantNewAchievements(p, NOW + 1, []);
    expect(p.unlockedAchievements).toContain("architecte");
  });
});

describe("PB-L5 : Codex, Formules, Ctrl+K", () => {
  it("Codex : la fiche d'un bâtiment de système liste ses paliers (niveau et nom, lus dans les règles)", () => {
    const entries = codexEntries(player({}), new Set(), NOW);
    const hangar = entries.find((e) => e.id === "building:hangar_defense")!;
    expect(hangar.facts).toEqual(expect.arrayContaining([{ label: "Palier 20", value: "Casemates" }]));
    const mine = entries.find((e) => e.id === "building:mine_ferraille" || (e.category === "buildings" && !findBuilding(e.id.slice(9))?.effect));
    if (mine) expect(mine.facts?.some((f) => f.label.startsWith("Palier"))).toBe(false);
    BUILDING_TIER_RULES.hangarDefenseLevels = [4, 8, 12, 16];
    const again = codexEntries(player({}), new Set(), NOW).find((e) => e.id === "building:hangar_defense")!;
    expect(again.facts).toEqual(expect.arrayContaining([{ label: "Palier 16", value: "Casemates" }]));
  });

  it("Formules : une ligne par bâtiment de système, paliers atteints du joueur, textes lus dans les règles", () => {
    const rows = tierFormulaRows(BUILD_PLAN_RULES.slotBuilding, player({ hangar_attaque: 12 }).buildings);
    expect(rows.map((r) => r.family)).toEqual(expect.arrayContaining(["storage", "repair", "hangarAttack", "hangarDefense", "dock"]));
    expect(rows.find((r) => r.family === "hangarAttack")?.reached).toBe(2);
    BUILDING_TIER_RULES.hangarWaitingQueueMax = 9;
    expect(tierFormulaRows(BUILD_PLAN_RULES.slotBuilding).find((r) => r.family === "hangarDefense")?.lines.join(" ")).toContain("9 commandes");
  });

  it("Ctrl+K : les paliers se trouvent par leur nom et par « palier »", () => {
    expect(matchPaletteContent("Casemates", NOW).some((e) => e.kind === "tier" && e.to === "/game/batiments")).toBe(true);
    expect(matchPaletteContent("palier", NOW).filter((e) => e.kind === "tier").length).toBeGreaterThan(0);
    expect(matchPaletteContent("file d'attente", NOW).some((e) => e.kind === "tier")).toBe(true);
  });
});

describe("PB-L5 : icônes des paliers (atelier d'illustrations)", () => {
  const slots = (JSON.parse(readFileSync("scripts/illustrations.json", "utf8")) as { slots: { id: string; group: string; target: string; cutout: boolean; prompt: string; done: string | null }[] }).slots;

  it("chaque palier d'un bâtiment de système a sa ligne (prompt anglais 1:1, détourée), image provisoire en place", () => {
    for (const family of ["storage", "repair", "hangarAttack", "hangarDefense", "dock", "foundry"] as const) {
      const tiers = familyTiers(family, BUILD_PLAN_RULES.slotBuilding);
      expect(tiers.length, family).toBeGreaterThan(0);
      for (const t of tiers) {
        const key = tierIconKey(family, t.index);
        const slot = slots.find((s) => s.id === `palier-${key}`);
        expect(slot, key).toBeTruthy();
        expect(slot!.target).toBe(`public/assets/tiers/${key}.webp`);
        expect(slot!.cutout).toBe(true);
        expect(slot!.prompt).toMatch(/--ar 1:1/);
        expect(t.image, key).toBeTruthy();
        expect(existsSync(`public${t.image}`), `${key} : ${t.image}`).toBe(true);
        if (TIER_ART.includes(key)) expect(t.image).toBe(`/assets/tiers/${key}.webp`);
      }
    }
  });
});
