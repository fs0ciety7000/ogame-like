import { afterEach, describe, expect, it } from "vitest";
import { effectSheet, effectTotal, formatEffectValue, type EffectGrant } from "@/game/effects";
import { allEffects, playerEffectSheet, playerModifiers } from "@/game/modifiers";
import { DEFAULT_TECHNOLOGIES, setTechnologies, techBonus, TECHNOLOGIES } from "@/game/technologies";
import { xpForLevel } from "@/game/commanders";

const src = (id: string) => ({ kind: "relic" as const, id, label: id });

afterEach(() => setTechnologies(DEFAULT_TECHNOLOGIES));

describe("v5.14 circuit d'effets", () => {
  it("plafonne par couche et signale le plafond dans la fiche", () => {
    const grants: EffectGrant[] = [
      { stat: "buildTime", value: 0.4, layer: "empire", source: src("a") },
      { stat: "buildTime", value: 0.3, layer: "empire", source: src("b") },
      { stat: "buildTime", value: 0.6, layer: "tech", source: src("c") },
    ];
    expect(effectTotal(grants, "empire", "buildTime")).toBe(0.5);
    expect(effectTotal(grants, "tech", "buildTime")).toBe(0.6);
    const [tech, empire] = effectSheet(grants).sort((x, y) => (x.layer < y.layer ? 1 : -1));
    expect(empire).toMatchObject({ layer: "empire", raw: 0.7, total: 0.5 });
    expect(tech).toMatchObject({ layer: "tech", total: 0.6 });
    expect(empire.sources).toHaveLength(2);
  });

  it("une portée « pvp » n'entre pas dans les bonus permanents", () => {
    const grants: EffectGrant[] = [{ stat: "defense", value: 0.2, layer: "empire", scope: "pvp", source: src("x") }];
    expect(effectTotal(grants, "empire", "defense")).toBe(0);
    expect(effectTotal(grants, "empire", "defense", { scope: "pvp" })).toBe(0.2);
  });

  it("une technologie ajoutée au catalogue se propage sans autre code", () => {
    setTechnologies([...DEFAULT_TECHNOLOGIES, { id: "techX", nom: "Silos quantiques", desc: "", maxLevel: 5, baseCost: { scrap: 1 }, baseTime: 1, prereq: {}, effects: [{ type: "storage_capacity", value: 0.2 }, { type: "resource_production", target: "nano", value: 0.05 }] }]);
    expect(TECHNOLOGIES.some((t) => t.id === "techX")).toBe(true);
    const p = { techLevels: { techX: 3 } };
    expect(techBonus(p.techLevels, "storage_capacity")).toBeCloseTo(0.6);
    expect(techBonus(p.techLevels, "resource_production", "nano")).toBeCloseTo(0.15);
    const sheet = playerEffectSheet(p);
    expect(sheet.find((l) => l.stat === "storage")?.sources[0].source.label).toBe("Silos quantiques");
    expect(sheet.find((l) => l.stat === "production" && l.target === "nano")?.total).toBeCloseTo(0.15);
  });

  it("chaque officier en poste apparaît comme source, avec son nom", () => {
    const p = { commanders: { roster: { admiral: { xp: xpForLevel(7) }, steward: { xp: xpForLevel(3) } }, active: ["admiral", "steward"], movedAtMs: {}, dossiers: 0 } as never };
    expect(playerModifiers(p).attack).toBeCloseTo(0.07);
    const labels = allEffects(p).map((g) => `${g.source.label}:${g.stat}`);
    expect(labels).toEqual(["Rhys Calder:attack", "Oswin Tarr:productionAll", "Oswin Tarr:storage"]);
  });

  it("formate sans Intl", () => {
    expect(formatEffectValue("attack", 0.125)).toBe("+12,5 %");
    expect(formatEffectValue("buildTime", 0.1)).toBe("−10 %");
    expect(formatEffectValue("spyLevel", 1.4)).toBe("+1,4 niveau");
    expect(formatEffectValue("counterSpy", 3)).toBe("+3 points");
  });
});
