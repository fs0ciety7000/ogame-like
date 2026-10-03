import { describe, expect, it } from "vitest";
import { advanceColonies, BIOMES, biomeFor, colonyBiome, colonyHourlyRates, colonyOf, colonyUpgradeCost, DEPOSIT_ID, depositLevel, upgradeColonyBuilding, type Colony } from "@/game/colonies";
import { defaultPlayerState } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

function founded(): PlayerState {
  const p = defaultPlayerState("u1", "Test") as PlayerState;
  p.colonizing = { slot: 1, name: "Nova", endTime: 1_000 };
  advanceColonies(p, 1_000);
  return p;
}

describe("v5.1 biomes de colonie", () => {
  it("tire un biome à la fondation, avec un gisement niveau 1", () => {
    const c = founded().colonies![0];
    expect(Object.keys(BIOMES)).toContain(c.biome);
    expect(c.buildings[DEPOSIT_ID]?.level).toBe(1);
    const seen = new Set(Array.from({ length: 40 }, (_, i) => biomeFor(`x${i}`)));
    expect(seen.size).toBe(4);
  });

  it("produit la ressource rare du biome sur la colonie", () => {
    const p = founded();
    const c = p.colonies![0];
    const rare = colonyBiome(c);
    advanceColonies(p, 1_000 + 3_600_000);
    expect(Math.round(colonyOf(p, c.id)!.resources[rare])).toBe(360);
    expect(colonyHourlyRates(c, p)[rare]).toBe(360);
  });

  it("le gisement s'améliore avec les ressources communes de la colonie", () => {
    const p = founded();
    const c = p.colonies![0];
    const cost = colonyUpgradeCost(p, DEPOSIT_ID, 2);
    expect(Object.keys(cost).sort()).toEqual(["data", "energy", "nano", "scrap"]);
    const job = upgradeColonyBuilding(p, c.id, DEPOSIT_ID, 2_000);
    expect(job.level).toBe(2);
    advanceColonies(p, job.endTime);
    expect(depositLevel(colonyOf(p, c.id)!)).toBe(2);
  });

  it("une ancienne colonie reçoit un biome stable", () => {
    const old = { id: "u1-c2", foundedAtMs: 5, buildings: {} } as unknown as Colony;
    expect(colonyBiome(old)).toBe(colonyBiome({ ...old }));
    expect(depositLevel(old)).toBe(1);
  });
});
