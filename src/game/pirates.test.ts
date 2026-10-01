import { describe, expect, it } from "vitest";
import {
  answerUltimatum,
  defensivePower,
  lairPower,
  pirateState,
  pirateTick,
  PIRATE_RULES,
  raidPower,
  resolveLairAssault,
  resolvePirateRaid,
} from "@/game/pirates";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { performLaunch } from "@/game/fleets";
import type { PlayerState } from "@/types/game";

const H = 3600_000;
const NOW = Date.UTC(2026, 9, 10, 12);
const veteran = (patch: Partial<PlayerState> = {}): PlayerState =>
  ({
    ...defaultPlayerState("p", "Pilote"),
    createdAtMs: NOW - 30 * 24 * H,
    resourcesUpdatedAtMs: NOW,
    resources: { ...defaultPlayerState("p", "P").resources, scrap: 1_000_000, energy: 1_000_000, nano: 1_000_000, data: 1_000_000 },
    ...patch,
  }) as PlayerState;

describe("La Liste de Varan", () => {
  it("schedules the first listing, then issues an ultimatum to active players", () => {
    const p = veteran();
    const first = pirateTick(p, NOW, () => 0);
    expect(first.changed).toBe(true);
    expect(pirateState(p).nextListAtMs).toBe(NOW + PIRATE_RULES.minIntervalHours * H);
    expect(pirateTick(p, NOW + H, () => 0).changed).toBe(false);
    const later = NOW + 80 * H;
    p.resourcesUpdatedAtMs = later;
    const out = pirateTick(p, later, () => 0);
    expect(out.notifications[0].title).toMatch(/Liste/);
    const u = pirateState(p).ultimatum!;
    expect(u.expiresAtMs).toBe(later + PIRATE_RULES.answerHours * H);
    expect(u.tribute.scrap).toBeGreaterThan(0);
  });

  it("skips newcomers and inactive players", () => {
    const fresh = veteran({ createdAtMs: NOW - H, pirates: { ...pirateState({}), nextListAtMs: NOW - 1 } });
    expect(pirateTick(fresh, NOW).changed).toBe(false);
    const away = veteran({ resourcesUpdatedAtMs: NOW - 10 * 24 * H, pirates: { ...pirateState({}), nextListAtMs: NOW - 1 } });
    expect(pirateTick(away, NOW).changed).toBe(false);
  });

  it("pays the tribute, or refuses and gets raided; an expired ultimatum launches the raid", () => {
    const issue = () => {
      const p = veteran({ pirates: { ...pirateState({}), nextListAtMs: NOW - 1 } });
      pirateTick(p, NOW);
      return p;
    };
    const payer = issue();
    const before = payer.resources.scrap;
    expect(answerUltimatum(payer, "pay", NOW + H).raid).toBeNull();
    expect(payer.resources.scrap).toBeLessThan(before);
    expect(pirateState(payer).tributesPaid).toBe(1);

    const rebel = issue();
    const raid = answerUltimatum(rebel, "refuse", NOW + H).raid!;
    expect(raid.arriveAtMs).toBe(NOW + H + PIRATE_RULES.raidTravelHours * H);
    expect(() => answerUltimatum(rebel, "pay", NOW + H)).toThrow(/Aucun/);

    const silent = issue();
    const tick = pirateTick(silent, NOW + 13 * H);
    expect(tick.raid).not.toBeNull();
    expect(pirateState(silent).ultimatum).toBeNull();
  });

  it("scales the raid with the defence and the Notoriety, with a floor", () => {
    const naked = veteran();
    expect(raidPower(naked, 0)).toBeGreaterThanOrEqual(PIRATE_RULES.floorPower);
    const fort = veteran({ units: { canon_plasma: { level: 3, count: 200 } } });
    const def = defensivePower(fort);
    expect(raidPower(fort, 0)).toBe(Math.round(def * 0.7));
    expect(raidPower(fort, 3)).toBe(Math.round(def * 1.0));
  });

  it("rewards a repelled raid and opens the lair after enough victories", () => {
    let p = veteran({ units: { canon_plasma: { level: 3, count: 200 } }, pirates: { ...pirateState({}), repelled: 4, notoriety: 2 } });
    const out = resolvePirateRaid(p, defaultQueues(), Math.round(defensivePower(p) * 0.5), [], NOW);
    expect(out.combat.outcome).toBe("defender_win");
    expect(out.bounty.scrap).toBeGreaterThan(0);
    expect(out.player.xp).toBe(PIRATE_RULES.bountyXp);
    expect(pirateState(out.player)).toMatchObject({ notoriety: 3, repelled: 5, lairOpen: true, raidsWon: 1 });
    expect(out.debris.scrap).toBeGreaterThan(0);
    expect(out.report.attackerUid).toBe("pirates");

    p = veteran({ pirates: { ...pirateState({}), notoriety: 2 } });
    const lost = resolvePirateRaid(p, defaultQueues(), 50_000, [], NOW);
    expect(lost.combat.outcome).toBe("attacker_win");
    expect(lost.loot.scrap).toBeGreaterThan(0);
    expect(pirateState(lost.player)).toMatchObject({ notoriety: 1, raidsLost: 1 });
  });

  it("launches and wins the lair assault", () => {
    const p = veteran({
      units: { chasseur: { level: 5, count: 2000 }, canon_plasma: { level: 1, count: 10 } },
      pirates: { ...pirateState({}), lairOpen: true, repelled: 5, notoriety: 5 },
    });
    expect(() => performLaunch({ mission: "lair", now: NOW, owner: veteran(), ownerQueues: defaultQueues(), fleet: { chasseur: 1 } })).toThrow(/localisé/);
    const launched = performLaunch({ mission: "lair", now: NOW, owner: p, ownerQueues: defaultQueues(), fleet: { chasseur: 2000 } });
    expect(launched.fleet.power).toBe(lairPower(p));
    const out = resolveLairAssault({ ...launched.attacker, resourcesUpdatedAtMs: launched.fleet.arriveAtMs }, defaultQueues(), launched.fleet.units, launched.fleet.power!, launched.fleet.arriveAtMs);
    expect(out.combat.outcome).toBe("attacker_win");
    expect(out.player.titles?.map((t) => t.label)).toContain(PIRATE_RULES.lairTitle);
    expect(pirateState(out.player)).toMatchObject({ lairOpen: false, repelled: 0, notoriety: 0, lairsTaken: 1 });
  });
});
