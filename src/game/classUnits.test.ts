import { describe, expect, it } from "vitest";
import { classUnitBlocker, expeditionDurationFactor, syncClassUnits, CLASS_UNIT_RULES } from "@/game/classUnits";
import { recyclerCapacity } from "@/game/debris";
import { defaultPlayerState } from "@/game/defaults";
import { launchExpedition } from "@/game/expeditions";
import { findUnit, UNIT_TO_TECH } from "@/game/units";
import { playerCargoCapacity } from "@/game/modifiers";
import type { PlayerState } from "@/types/game";

/* 6.5 (lot P, proposals/unites-classe.md) : vaisseaux de classe. */

const NOW = Date.UTC(2026, 9, 7, 12);

function player(classId?: string): PlayerState {
  const p = { ...defaultPlayerState("u1", "Classe"), createdAt: null } as unknown as PlayerState;
  if (classId) p.empireClass = { id: classId, chosenAtMs: 1, changes: 0 } as never;
  return p;
}

describe("vaisseaux de classe", () => {
  it("ne détournent pas le déblocage de l'unité d'origine de leur techno", () => {
    expect(UNIT_TO_TECH.drone_recuperateur).toBe("tech9");
    expect(UNIT_TO_TECH.recolteur).toBeUndefined();
    expect(findUnit("recolteur")?.classTech).toBe("tech9");
  });

  it("se débloquent dans leur classe, au niveau de la techno de référence", () => {
    const p = player("industriel");
    p.techLevels = { ...p.techLevels, tech9: 3, tech13: 4 };
    expect(syncClassUnits(p)).toEqual(["recolteur"]);
    expect(p.units.recolteur.level).toBe(3);
    expect(p.units.croiseur_raid?.level ?? 0).toBe(0);
    expect(syncClassUnits(p)).toEqual([]);
  });

  it("changer de classe garde les vaisseaux mais bloque la construction", () => {
    const p = player("industriel");
    p.techLevels = { ...p.techLevels, tech9: 2 };
    syncClassUnits(p);
    p.units.recolteur.count = 5;
    p.empireClass = { id: "seigneur", chosenAtMs: 2, changes: 1 } as never;
    syncClassUnits(p);
    expect(p.units.recolteur).toMatchObject({ level: 2, count: 5 });
    expect(classUnitBlocker(p, findUnit("recolteur")!)).toMatch(/Industriel/);
    expect(classUnitBlocker(p, findUnit("croiseur_raid")!)).toMatch(/Labo/);
    expect(classUnitBlocker(player(), findUnit("eclaireur_lointain")!)).toMatch(/Explorateur/);
  });

  it("Récolteur : recycle avec 25 % de capacité en plus de sa soute", () => {
    const p = player("industriel");
    p.techLevels = { ...p.techLevels, tech9: 1 };
    syncClassUnits(p);
    const cargo = playerCargoCapacity(p, { recolteur: 4 });
    expect(recyclerCapacity(p, { recolteur: 4 })).toBe(Math.floor(cargo * (1 + CLASS_UNIT_RULES.harvesterRecycleBonus)));
  });

  it("Éclaireur lointain : expédition 15 % plus courte", () => {
    expect(expeditionDurationFactor({ fregate: 3 })).toBe(1);
    expect(expeditionDurationFactor({ eclaireur_lointain: 1 })).toBeCloseTo(0.85);
    const p = player("explorateur");
    p.units.eclaireur_lointain = { level: 1, count: 5 };
    p.units.fregate = { level: 1, count: 20 };
    const { fleet } = launchExpedition(p, { eclaireur_lointain: 1, fregate: 12 }, 4, 0, 0, NOW);
    expect(fleet.durationMs).toBe(Math.round(4 * 3600_000 * 0.85));
  });
});
