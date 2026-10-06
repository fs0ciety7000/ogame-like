import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { EFFECT_STAT_IDS, effectTotal, type EffectGrant, type EffectStat } from "@/game/effects";
import { emptyModifiers, modifiersFrom, type Modifiers } from "@/game/modifiers";
import { getFleetUpkeep } from "@/game/economy";
import type { Units } from "@/types/game";

/* 5.28.1 (constat C5 de l'audit 2026-10-06) : une stat posée sur une relique, un officier ou un module
   (couche « empire ») doit changer quelque chose. Avant ce lot, `fleetUpkeep` et `buildingDiscount`
   n'étaient lus que pour les technologies. */

const grant = (stat: EffectStat, value = 0.1): EffectGrant => ({ stat, value, layer: "empire", source: { kind: "relic", id: "t", label: "Test" } });

/** Stats lues hors de `Modifiers`, par une fonction qui somme explicitement la couche empire. */
const DIRECT_READERS: Partial<Record<EffectStat, { file: string; pattern: RegExp }>> = {
  unitAttack: { file: "src/game/effectTargets.ts", pattern: /\["tech", "empire"\]/ },
  unitHp: { file: "src/game/effectTargets.ts", pattern: /\["tech", "empire"\]/ },
  unitCost: { file: "src/game/effectTargets.ts", pattern: /unitEffect\(grants, "unitCost"/ },
  unitBuildTime: { file: "src/game/units.ts", pattern: /empireEffects\(player\)[^\n]*"unitBuildTime"/ },
  classEdge: { file: "src/game/effectTargets.ts", pattern: /effectTotal\(grants, "empire", stat/ },
  shield: { file: "src/game/effectTargets.ts", pattern: /effectTotal\(grants, "empire", stat/ },
  hangarCapacity: { file: "src/game/hangar.ts", pattern: /effectTotal\(grants, "empire", "hangarCapacity"/ },
  dockCapacity: { file: "src/game/workshop.ts", pattern: /effectTotal\(grants, "empire", "dockCapacity"\)/ },
  // Aussi dans Modifiers (affichage), mais l'Atelier lit les deux couches lui-même.
  repairSpeed: { file: "src/game/workshop.ts", pattern: /effectTotal\(grants, "empire", "repairSpeed"\)/ },
};

function sources(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) sources(path, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\./.test(name)) out.push(path);
  }
  return out;
}

describe("5.28.1 : chaque stat d'effet est lue dans la couche empire (C5)", () => {
  it("chaque stat change un champ de Modifiers ou a un lecteur direct", () => {
    const silent: string[] = [];
    for (const stat of EFFECT_STAT_IDS) {
      const g = { ...grant(stat), ...(stat === "production" ? { target: "scrap" } : {}) };
      const m = modifiersFrom([g]);
      const changed = JSON.stringify(m) !== JSON.stringify(emptyModifiers());
      const direct = DIRECT_READERS[stat];
      const read = direct ? direct.pattern.test(readFileSync(direct.file, "utf8")) && effectTotal([g], "empire", stat) > 0 : false;
      if (!changed && !read) silent.push(stat);
    }
    expect(silent).toEqual([]);
  });

  it("chaque champ de Modifiers est consommé hors de modifiers.ts", () => {
    const files = sources("src").filter((f) => !f.endsWith("game/modifiers.ts"));
    const text = files.map((f) => readFileSync(f, "utf8")).join("\n");
    const unread = (Object.keys(emptyModifiers()) as (keyof Modifiers)[]).filter((field) => !DIRECT_READERS[field as EffectStat]).filter((field) => !new RegExp(`(mods|modifiers|mod|m|bonus|playerModifiers\\([^)]*\\))\\.${field}\\b`).test(text));
    expect(unread).toEqual([]);
  });

  it("entretien : la couche empire s'applique après les technologies, plafonnée à 50 %", () => {
    const units = { chasseur: { level: 1, count: 1000 } } as Units;
    const base = getFleetUpkeep(units);
    expect(getFleetUpkeep(units, undefined, modifiersFrom([grant("fleetUpkeep", 0.2)]).fleetUpkeep)).toBeCloseTo(base * 0.8);
    expect(modifiersFrom([grant("fleetUpkeep", 0.9)]).fleetUpkeep).toBe(0.5);
    expect(modifiersFrom([grant("buildingDiscount", 0.9)]).buildingDiscount).toBe(0.5);
  });
});
