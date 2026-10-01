import { describe, expect, it } from "vitest";
import { DEFAULT_RESET_OPTIONS, parseResetOptions, resetPlayerState } from "@/game/reset";
import { defaultPlayerState } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

const NOW = Date.UTC(2026, 9, 1, 12);

describe("hard reset", () => {
  const veteran = (): PlayerState =>
    ({
      ...defaultPlayerState("p", "Vétéran"),
      xp: 900,
      seasonXp: 120,
      seasonId: "2026-10",
      resources: { ...defaultPlayerState("p", "V").resources, scrap: 9e8 },
      units: { chasseur: { level: 5, count: 400 } },
      techLevels: { tech1: 12 },
      unlockedAchievements: ["a1"],
      titles: [{ label: "Champion de Septembre 2026", seasonId: "2026-09", rank: 1 }],
      activeTitle: "Champion de Septembre 2026",
      allianceId: "al1",
      victories: 12,
      lastDefeatAtMs: NOW - 1000,
    }) as PlayerState;

  it("wipes progression, gives the starter kit and a fresh protection", () => {
    const out = resetPlayerState(veteran(), DEFAULT_RESET_OPTIONS, NOW);
    expect(out.player.pseudo).toBe("Vétéran");
    expect(out.player.units).toEqual({});
    expect(out.player.techLevels).toEqual({});
    expect(out.player.xp).toBe(0);
    expect(out.player.resources.scrap).toBe(100 + 5000);
    expect(out.player.resources.reinforcedSteel).toBe(50);
    expect(out.player.unlockedAchievements).toEqual([]);
    expect(out.player.titles).toHaveLength(1); // titres conservés par défaut
    expect(out.player.createdAtMs).toBe(NOW);
    expect(out.player.lastDefeatAtMs).toBe(0);
    expect(out.queues.activeResearches).toEqual([]);
    expect(out.notifications[0].kind).toBe("system");
  });

  it("can keep XP and drop titles", () => {
    const out = resetPlayerState(veteran(), { ...DEFAULT_RESET_OPTIONS, xp: false, titles: true }, NOW);
    expect(out.player.xp).toBe(900);
    expect(out.player.seasonXp).toBe(120);
    expect(out.player.titles).toEqual([]);
    expect(out.player.activeTitle).toBe("");
  });

  it("sanitizes options from the browser", () => {
    const o = parseResetOptions({ xp: false, starterKit: { scrap: "200", energy: -5, bogus: 9 } });
    expect(o.xp).toBe(false);
    expect(o.reports).toBe(true);
    expect(o.starterKit).toEqual({ scrap: 200 });
    expect(parseResetOptions(undefined).starterKit.scrap).toBe(5000);
  });
});
