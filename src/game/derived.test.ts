import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS, achievementValue, derivedAchievements, setAchievements, DEFAULT_ACHIEVEMENTS } from "@/game/achievements";
import { derivedTitles, findTitle, setTitles, DEFAULT_TITLES } from "@/game/titles";
import { bannerOptions } from "@/game/profile";
import { effectImpactReport } from "@/game/impact";
import { WORLD_BOSSES } from "@/game/worldBosses";
import { RARE_ROLES, xpForLevel } from "@/game/commanders";
import { DEFAULT_TECHNOLOGIES, setTechnologies } from "@/game/technologies";
import { grantLeviathanReward, spawnLeviathan, resolveLeviathanAssault } from "@/game/leviathan";
import { defaultPlayerState } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

const player = () => ({ ...defaultPlayerState("u", "u") }) as PlayerState;

describe("v5.14 éléments dérivés des catalogues", () => {
  it("succès dérivés : ajoutés même à un catalogue personnalisé, paliers à la taille des catalogues", () => {
    setAchievements([DEFAULT_ACHIEVEMENTS[0]]);
    expect(ACHIEVEMENTS.map((a) => a.id)).toEqual([DEFAULT_ACHIEVEMENTS[0].id, ...derivedAchievements().map((a) => a.id)]);
    expect(derivedAchievements().find((a) => a.id === "officier_rare_all")?.threshold).toBe(RARE_ROLES.length);
    expect(derivedAchievements().find((a) => a.id === "boss_mondiaux_all")?.threshold).toBe(WORLD_BOSSES.length);
    const p = player();
    p.commanders = { roster: { corsair: { xp: xpForLevel(2) }, admiral: { xp: 0 } }, active: [], movedAtMs: {}, dossiers: 0 } as never;
    expect(achievementValue({ metric: "rareOfficers" }, p)).toBe(1);
    setAchievements(structuredClone(DEFAULT_ACHIEVEMENTS));
  });

  it("titres et bannières des boss mondiaux ; un boss abattu est retenu", () => {
    setTitles([]);
    expect(derivedTitles()).toHaveLength(WORLD_BOSSES.length - 1);
    expect(findTitle("wb_titan")?.label).toBe(WORLD_BOSSES.find((b) => b.id === "titan")!.title);
    setTitles(structuredClone(DEFAULT_TITLES));
    const p = player();
    p.units = { chasseur: { level: 1, count: 500 } } as never;
    const st = spawnLeviathan({ id: "x", startMs: 0, endMs: 72 * 3600_000 }, [p], null, "titan");
    const killed = resolveLeviathanAssault({ ...st, hp: 5, maxHp: 5 }, p, { chasseur: 500 }, undefined, 3600_000).state;
    grantLeviathanReward(killed, p, () => 0.5);
    expect(p.stats?.worldBossKilled).toEqual(["titan"]);
    expect(bannerOptions(p).find((b) => b.id === "wb:titan")?.unlocked).toBe(true);
    expect(bannerOptions(p).find((b) => b.id === "wb:spectre")?.unlocked).toBe(false);
    expect(achievementValue({ metric: "worldBossTypes" }, p)).toBe(1);
  });

  it("rapport d'impact : chaque source du contenu, plafonds signalés, cascade automatique", () => {
    const rows = effectImpactReport();
    const attack = rows.find((r) => r.layer === "empire" && r.stat === "attack")!;
    expect(attack.sources.some((s) => s.kind === "officer")).toBe(true);
    expect(attack.sources.some((s) => s.kind === "relic")).toBe(true);
    expect(rows.every((r) => !r.capped)).toBe(true);
    setTechnologies([...DEFAULT_TECHNOLOGIES, { id: "techZ", nom: "Moteurs à distorsion", desc: "", maxLevel: 4, baseCost: { scrap: 1 }, baseTime: 1, prereq: {}, effects: [{ type: "fleet_speed", value: 0.2 }] }]);
    const speed = effectImpactReport().find((r) => r.layer === "tech" && r.stat === "fleetSpeed")!;
    expect(speed.sources.some((s) => s.label === "Moteurs à distorsion")).toBe(true);
    expect(speed.capped).toBe(true);
    expect(speed.total).toBe(0.75);
    setTechnologies(DEFAULT_TECHNOLOGIES);
  });
});
