import { describe, expect, it } from "vitest";
import { computeTerritories, SECTOR_COUNT, sectorLabel, sectorOf, sectorsHeldBy, TERRITORY_RULES, territoryBonus, type TerritoryPlayer } from "@/game/territories";
import { playerModifiers } from "@/game/modifiers";
import type { Buildings } from "@/types/game";

const NOW = 1_800_000_000_000;

/** Identifiants qui tombent dans un secteur donné. */
function uidsIn(sector: number, count: number, prefix: string): string[] {
  const out: string[] = [];
  for (let i = 0; out.length < count && i < 200_000; i++) if (sectorOf(`${prefix}${i}`) === sector) out.push(`${prefix}${i}`);
  return out;
}
const levels = (n: number): Buildings => ({ entrepot: { level: n, unlocked: true } }) as Buildings;

describe("v5.1 : territoires d'alliance", () => {
  it("découpe la carte en 24 secteurs nommés A1 à F4", () => {
    expect(SECTOR_COUNT).toBe(24);
    expect(sectorLabel(0)).toBe("A1");
    expect(sectorLabel(23)).toBe("F4");
    const seen = new Set(Array.from({ length: 3000 }, (_, i) => sectorOf(`u${i}`)));
    expect(seen.size).toBe(24);
  });

  it("l'alliance majoritaire au-dessus du seuil tient le secteur ; bonus par secteur, plafonné", () => {
    const [a1, a2, b1] = uidsIn(5, 3, "p");
    const players: TerritoryPlayer[] = [
      { uid: a1, allianceId: "A", buildings: levels(100) },
      { uid: a2, allianceId: "A", buildings: levels(60) },
      { uid: b1, allianceId: "B", buildings: levels(140) },
    ];
    const out = computeTerritories(players, NOW);
    expect(out.sectors[5]).toMatchObject({ allianceId: "A", levels: 160 });
    expect(out.byUid[a1]).toMatchObject({ pct: TERRITORY_RULES.bonusPerSector, sectors: [5] });
    expect(out.byUid[b1].pct).toBe(0);
    expect(sectorsHeldBy(out.sectors, "A")).toBe(1);
  });

  it("sous 150 niveaux ou à égalité, personne ne tient le secteur", () => {
    const [x, y] = uidsIn(7, 2, "q");
    expect(computeTerritories([{ uid: x, allianceId: "A", buildings: levels(149) }], NOW).sectors[7].allianceId).toBe("");
    const tie = computeTerritories([
      { uid: x, allianceId: "A", buildings: levels(200) },
      { uid: y, allianceId: "B", buildings: levels(200) },
    ], NOW);
    expect(tie.sectors[7].allianceId).toBe("");
  });

  it("les colonies comptent dans leur secteur, le bonus plafonne à +6 % et expire", () => {
    const home = uidsIn(0, 1, "h")[0];
    const cols = [1, 2, 3].map((s) => uidsIn(s, 1, `${home}-c`)[0]);
    const out = computeTerritories([{ uid: home, allianceId: "A", buildings: levels(200), colonies: cols.map((id) => ({ id, buildings: levels(200) })) }], NOW);
    expect(out.byUid[home].sectors).toHaveLength(4);
    expect(out.byUid[home].pct).toBe(TERRITORY_RULES.maxBonus);
    expect(territoryBonus(out.byUid[home], NOW)).toBe(0.06);
    expect(territoryBonus(out.byUid[home], NOW + TERRITORY_RULES.validHours * 3600_000 + 1)).toBe(0);
    expect(playerModifiers({ territory: { pct: 0.04, sectors: [1, 2], untilMs: Date.now() + 60_000 } }).productionAll).toBeCloseTo(0.04);
  });
});
