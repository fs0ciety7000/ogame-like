import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent, defaultGameContent, validateGameContent } from "@/game/content";
import { DEFAULT_TECHNOLOGIES, techBonus, type TechDef } from "@/game/technologies";
import { TECH_COMBAT_CAP } from "@/game/effects";
import { DEFAULT_FACTIONS, findFaction, LAIR_LOCATE_RULES, locateLair, pirateState, productionHours } from "@/game/pirates";

import { defaultPlayerState } from "@/game/defaults";
import { findUnit, KESH_HUNTER_UNIT, KESH_PVE_BONUS } from "@/game/units";
import type { PlayerState } from "@/types/game";

/* 6.6.0 (revue AU1, proposition menaces-pnj.md) : plafond des technos de
   combat, Traqueur Kesh sur 20 niveaux, repaires après 3 raids, « Localiser ». */

const NOW = Date.UTC(2026, 9, 6, 12);

function withTech(tech: Partial<TechDef> & { id: string }) {
  const t: TechDef = { nom: tech.id, desc: "", maxLevel: 10, baseCost: { scrap: 1 }, baseTime: 1, prereq: {}, ...tech };
  applyGameContent({ technologies: [...DEFAULT_TECHNOLOGIES, t] });
}

afterEach(() => applyGameContent({}));

describe("A : plafond des technos d'attaque et de défense", () => {
  it("Puissance d'attaque au maximum reste à +100 % (sous le plafond)", () => {
    expect(techBonus({ tech5: 10 }, "unit_attack")).toBeCloseTo(1);
  });

  it("le total des technos d'attaque est plafonné à +150 %", () => {
    withTech({ id: "techX", effects: [{ type: "unit_attack", value: 0.1 }] });
    expect(techBonus({ tech5: 10, techX: 10 }, "unit_attack")).toBeCloseTo(TECH_COMBAT_CAP);
    expect(TECH_COMBAT_CAP).toBe(1.5);
  });

  it("refuse une techno qui dépasse +100 % à son niveau maximal", () => {
    const content = defaultGameContent();
    content.technologies = [...content.technologies!, { id: "techY", nom: "Y", desc: "", maxLevel: 20, baseCost: { scrap: 1 }, baseTime: 1, prereq: {}, effects: [{ type: "unit_attack", value: 0.07 }] }];
    expect(validateGameContent(content).join(" ")).toMatch(/\+140 % au niveau 20/);
  });

  it("refuse une techno qui monte une unité au-delà de son niveau maximal", () => {
    const content = defaultGameContent();
    content.units = content.units!.map((u) => (u.id === KESH_HUNTER_UNIT.id ? { ...u, maxLevel: 1 } : u));
    content.technologies = [...content.technologies!, { id: "techZ", nom: "Z", desc: "", maxLevel: 20, baseCost: { scrap: 1 }, baseTime: 1, prereq: {}, effects: [{ type: "unlock_next_level", target: KESH_HUNTER_UNIT.id }] }];
    expect(validateGameContent(content).join(" ")).toMatch(/s'arrête au niveau 1/);
  });

  it("le contenu par défaut reste valide", () => {
    expect(validateGameContent(defaultGameContent())).toEqual([]);
  });
});

describe("B : Traqueur Kesh", () => {
  it("monte jusqu'au niveau 20, +10 attaque et défense par niveau", () => {
    const u = findUnit(KESH_HUNTER_UNIT.id)!;
    expect(u.maxLevel).toBe(20);
    expect(u.levelBonus).toBe(10);
  });

  it("frappe les PNJ 50 % plus fort par l'unité elle-même (la techno n'ajoute rien en JcJ)", () => {
    expect(KESH_PVE_BONUS).toBe(0.5);
  });
});

describe("C : repaires", () => {
  it("toutes les factions ouvrent leur repaire après 3 raids repoussés", () => {
    for (const f of DEFAULT_FACTIONS) expect(f.lair.raidsNeeded).toBe(3);
  });

  const player = (repelled: number): PlayerState => {
    const p = defaultPlayerState("p", "Pilote");
    p.resources = { ...p.resources, scrap: 1e9, energy: 1e9, nano: 1e9, data: 1e9 };
    p.pirates = { varan: { ...pirateState(p, "varan"), repelled } } as PlayerState["pirates"];
    return p;
  };

  it("« Localiser » demande une piste (1 raid repoussé)", () => {
    expect(() => locateLair(player(0), "varan", NOW)).toThrow(/Repousse d'abord/);
  });

  it("« Localiser » coûte 12 h de production et ouvre le repaire", () => {
    const p = player(LAIR_LOCATE_RULES.minRepelled);
    const before = { ...p.resources };
    const cost = productionHours(p, LAIR_LOCATE_RULES.costHours);
    const { paid } = locateLair(p, "varan", NOW);
    expect(paid).toEqual(cost);
    for (const [res, n] of Object.entries(cost)) expect(p.resources[res as keyof typeof p.resources]).toBe((before[res as keyof typeof before] ?? 0) - (n ?? 0));
    expect(pirateState(p, "varan").lairOpen).toBe(true);
    expect(() => locateLair(p, "varan", NOW)).toThrow(/déjà localisé/);
  });

  it("refuse si les ressources manquent", () => {
    const p = player(1);
    p.resources = { ...p.resources, scrap: 0, energy: 0, nano: 0, data: 0 };
    expect(() => locateLair(p, "varan", NOW)).toThrow(/Il faut/);
    expect(findFaction("varan")).toBeTruthy();
  });
});
