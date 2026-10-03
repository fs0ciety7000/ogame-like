import { describe, expect, it } from "vitest";
import { defaultPlayerState } from "@/game/defaults";
import { addSeasonPower, chestShieldCost, depositWarChest, grantChestShield, payWarFromChest, readWarChest, SEASON_WAR_RULES, seasonPowerOf, seasonWarPoints, seasonWarStandings, WAR_CHEST_RULES } from "@/game/seasonWars";
import { declareWar, WAR_RULES } from "@/game/wars";
import { shieldUntil } from "@/game/bounties";
import { currentSeasonId } from "@/game/seasons";
import type { Alliance, PlayerState } from "@/types/game";

const NOW = Date.UTC(2026, 9, 10, 12);

function player(uid: string): PlayerState {
  const p = { ...defaultPlayerState(uid, uid), createdAt: null } as unknown as PlayerState;
  p.uid = uid;
  return p;
}

describe("v5.1 : guerres de saison", () => {
  it("compte la puissance détruite par saison, remise à zéro à la saison suivante", () => {
    const p = player("p");
    addSeasonPower(p, 25_000, NOW);
    addSeasonPower(p, 5_000, NOW);
    const season = currentSeasonId(NOW);
    expect(seasonPowerOf(p, season)).toBe(30_000);
    const next = NOW + 40 * 86_400_000;
    addSeasonPower(p, 1_000, next);
    expect(seasonPowerOf(p, currentSeasonId(next))).toBe(1_000);
    expect(seasonPowerOf(p, season)).toBe(0);
  });

  it("classe : points de guerre + puissance / 10 000 + 50 par secteur", () => {
    const wars = [
      { attackerId: "A", defenderId: "B", scoreAttacker: 12, scoreDefender: 4, seasonId: "2026-10" },
      { attackerId: "C", defenderId: "A", scoreAttacker: 2, scoreDefender: 6, seasonId: "2026-10" },
      { attackerId: "B", defenderId: "C", scoreAttacker: 99, scoreDefender: 0, seasonId: "2026-09" },
    ];
    const warPoints = seasonWarPoints(wars, "2026-10");
    expect(warPoints).toEqual({ A: 18, B: 4, C: 2 });
    const st = seasonWarStandings({ warPoints, power: { B: 255_000 }, sectors: { C: 1 } });
    expect(st.map((s) => [s.allianceId, s.score, s.rank])).toEqual([
      ["C", 2 + SEASON_WAR_RULES.sectorPoints, 1],
      ["B", 4 + 25, 2],
      ["A", 18, 3],
    ]);
  });
});

describe("v5.1 : coffre de guerre", () => {
  it("reçoit 10 % du bonus, plafonné à 30 dépôts", () => {
    const chest = readWarChest(null);
    expect(depositWarChest(chest, { scrap: 1_000 })).toEqual({ scrap: 100 });
    for (let i = 0; i < 40; i++) depositWarChest(chest, { scrap: 1_000 });
    expect(chest.resources.scrap).toBe(100 * WAR_CHEST_RULES.capDays);
  });

  it("paie une déclaration de guerre sans toucher au trésor", () => {
    const own = { id: "A", name: "A", tag: "AAA", members: ["a1", "a2", "a3"], roles: {}, createdBy: "a1", treasury: {} } as unknown as Alliance;
    const target = { id: "B", name: "B", tag: "BBB", members: ["b1", "b2", "b3"], roles: {}, createdBy: "b1" } as unknown as Alliance;
    const base = { actorUid: "a1", actorPseudo: "a1", own, target, wars: [], now: NOW };
    expect(() => declareWar(base)).toThrow(/trésor/);
    const chest = { resources: { scrap: WAR_RULES.costScrap, energy: WAR_RULES.costEnergy + 5 }, cap: {} };
    const res = declareWar({ ...base, chest });
    expect(res.chest?.resources).toEqual({ scrap: 0, energy: 5 });
    expect(res.own.treasury).toEqual({});
    expect(() => payWarFromChest(res.chest!, { scrap: 1 })).toThrow(/Coffre/);
  });

  it("offre un bouclier de 2 h à un membre, au prix de 4 h de sa production", () => {
    const m = player("m");
    const cost = chestShieldCost(m);
    expect(Object.keys(cost).length).toBeGreaterThan(0);
    const chest = { resources: Object.fromEntries(Object.entries(cost).map(([r, n]) => [r, (n ?? 0) * 2])), cap: {} };
    const out = grantChestShield(chest, m, NOW);
    expect(out.untilMs).toBe(NOW + WAR_CHEST_RULES.shieldHours * 3600_000);
    expect(shieldUntil(m)).toBe(out.untilMs);
    grantChestShield(chest, m, NOW);
    expect(shieldUntil(m)).toBe(NOW + 2 * WAR_CHEST_RULES.shieldHours * 3600_000);
    expect(() => grantChestShield(chest, m, NOW)).toThrow(/Coffre/);
  });
});
