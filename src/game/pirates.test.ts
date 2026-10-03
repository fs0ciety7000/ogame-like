import { COMMANDER_XP } from "@/game/commanders";
import { describe, expect, it } from "vitest";
import {
  activeUltimatum,
  answerUltimatum,
  defensivePower,
  factionStates,
  findFaction,
  homeFleetPower,
  lairPower,
  lairUid,
  pirateState,
  pirateTick,
  raidPower,
  resolveLairAssault,
  resolvePirateRaid,
  storageFillPct,
  totalBuildingLevels,
  tributeFor,
  validateFactions,
  DEFAULT_FACTIONS,
  type FactionStates,
} from "@/game/pirates";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { performLaunch } from "@/game/fleets";
import { getStorageCapacity } from "@/game/buildings";
import type { PlayerState } from "@/types/game";

const H = 3600_000;
const NOW = Date.UTC(2026, 9, 10, 12);
const varan = findFaction("varan")!;
const gravhorn = findFaction("gravhorn")!;
const veteran = (patch: Partial<PlayerState> = {}): PlayerState =>
  ({
    ...defaultPlayerState("p", "Pilote"),
    createdAtMs: NOW - 30 * 24 * H,
    resourcesUpdatedAtMs: NOW,
    resources: { ...defaultPlayerState("p", "P").resources, scrap: 1_000_000, energy: 1_000_000, nano: 1_000_000, data: 1_000_000, reinforcedSteel: 50_000, aiFragment: 50_000 },
    ...patch,
  }) as PlayerState;
const ALL = ["varan", "gravhorn", "inquisition", "cartel", "meute", "choeur"];
/** Factions déjà passées (date d'inscription échue) ; les autres sont mises en sommeil. */
const listed = (ids: string[], extra: Partial<ReturnType<typeof pirateState>> = {}): FactionStates =>
  Object.fromEntries(
    ALL.map((id) => [
      id,
      ids.includes(id)
        ? { ...pirateState({}), nextListAtMs: NOW - 1, mark: { atMs: NOW - 1, value: 10_000 }, ...extra }
        : { ...pirateState({}), nextListAtMs: NOW + 1000 * H, mark: { atMs: NOW - 1, value: 10_000 } },
    ]),
  );
const AGGRESSIVE = { victories: 3, plunder: { scrap: 400_000, energy: 200_000 } };

describe("Factions hostiles", () => {
  it("migrates the legacy v2.0 Varan state", () => {
    const p = veteran({ pirates: { ...pirateState({}), notoriety: 3, repelled: 2, nextListAtMs: NOW + H } });
    expect(factionStates(p).varan).toMatchObject({ notoriety: 3, repelled: 2 });
    pirateTick(p, NOW);
    expect(p.pirates).toHaveProperty("varan.notoriety", 3);
    expect(pirateState(p, "gravhorn").notoriety).toBe(0);
  });

  it("schedules the first listing, then Varan issues an ultimatum to active players", () => {
    const p = veteran();
    const first = pirateTick(p, NOW, { random: () => 0 });
    expect(first.changed).toBe(true);
    expect(pirateState(p, "varan").nextListAtMs).toBe(NOW + varan.trigger.minIntervalHours * H);
    expect(pirateState(p, "gravhorn").nextListAtMs).toBe(NOW + 12 * H);
    expect(pirateTick(p, NOW + H).changed).toBe(false);
    const later = NOW + 80 * H;
    p.resourcesUpdatedAtMs = later;
    const out = pirateTick(p, later, { random: () => 0 });
    expect(out.notifications[0].title).toMatch(/Liste/);
    const u = pirateState(p, "varan").ultimatum!;
    expect(u.expiresAtMs).toBe(later + varan.answerHours * H);
    expect(u.tribute.scrap).toBeGreaterThan(0);
    expect(activeUltimatum(p, later)?.faction.id).toBe("varan");
  });

  it("skips newcomers and inactive players", () => {
    const fresh = veteran({ createdAtMs: NOW - H, pirates: listed(ALL) });
    expect(pirateTick(fresh, NOW, { aggression: AGGRESSIVE }).changed).toBe(false);
    const away = veteran({ resourcesUpdatedAtMs: NOW - 10 * 24 * H, pirates: listed(ALL) });
    expect(pirateTick(away, NOW).changed).toBe(false);
  });

  it("Gravhorn only hunts aggressors, and only one threat at a time", () => {
    const calm = veteran({ resourcesUpdatedAtMs: NOW - 10 * 24 * H, pirates: listed(["varan", "gravhorn"]) });
    expect(pirateTick(calm, NOW, { aggression: { victories: 2, plunder: {} } }).changed).toBe(false);
    const out = pirateTick(calm, NOW, { aggression: AGGRESSIVE });
    expect(out.notifications[0].title).toMatch(/contrat/);
    expect(activeUltimatum(calm, NOW)?.faction.id).toBe("gravhorn");

    const both = veteran({ pirates: listed(["varan", "gravhorn"]) });
    pirateTick(both, NOW, { aggression: AGGRESSIVE });
    const issued = Object.values(factionStates(both)).filter((s) => s.ultimatum);
    expect(issued).toHaveLength(1);
    expect(pirateTick(both, NOW + H, { aggression: AGGRESSIVE }).changed).toBe(false);
  });

  it("prices the contract on recent plunder, with a production floor", () => {
    const p = veteran();
    expect(tributeFor(gravhorn, p, AGGRESSIVE)).toEqual({ scrap: 200_000, energy: 100_000 });
    const floor = tributeFor(gravhorn, p, { victories: 3, plunder: { scrap: 2 } });
    expect(floor.scrap).toBeGreaterThan(1);
  });

  it("pays the tribute, or refuses and gets raided; an expired ultimatum launches the raid", () => {
    const issue = () => {
      const p = veteran({ pirates: listed(["varan"]) });
      pirateTick(p, NOW);
      return p;
    };
    const payer = issue();
    const before = payer.resources.scrap;
    expect(answerUltimatum(payer, "pay", NOW + H).raid).toBeNull();
    expect(payer.resources.scrap).toBeLessThan(before);
    expect(pirateState(payer, "varan").tributesPaid).toBe(1);

    const rebel = issue();
    const raid = answerUltimatum(rebel, "refuse", NOW + H).raid!;
    expect(raid).toMatchObject({ factionId: "varan", arriveAtMs: NOW + H + varan.raidTravelHours * H });
    expect(() => answerUltimatum(rebel, "pay", NOW + H)).toThrow(/Aucun/);

    const silent = issue();
    const tick = pirateTick(silent, NOW + 13 * H);
    expect(tick.raid?.factionId).toBe("varan");
    expect(pirateState(silent, "varan").ultimatum).toBeNull();
  });

  it("scales the raid with its target and the Notoriety, with a floor", () => {
    const naked = veteran();
    expect(raidPower(varan, naked, 0)).toBeGreaterThanOrEqual(varan.raid.floorPower);
    const fort = veteran({ units: { canon_plasma: { level: 3, count: 200 } } });
    const def = defensivePower(fort);
    expect(raidPower(varan, fort, 0)).toBe(Math.round(def * 0.7));
    expect(raidPower(varan, fort, 3)).toBe(Math.round(def * 1.0));
    const fleet = veteran({ units: { canon_plasma: { level: 3, count: 200 }, chasseur: { level: 3, count: 3000 } } });
    expect(raidPower(gravhorn, fleet, 2)).toBe(Math.round(homeFleetPower(fleet) * 1.0));
  });

  it("rewards a repelled Varan raid and opens the lair after enough victories", () => {
    let p = veteran({ units: { canon_plasma: { level: 3, count: 200 } }, pirates: listed(["varan"], { repelled: 4, notoriety: 2 }) });
    const out = resolvePirateRaid(varan, p, defaultQueues(), Math.round(defensivePower(p) * 0.5), [], NOW);
    expect(out.combat.outcome).toBe("defender_win");
    expect(out.bounty.scrap).toBeGreaterThan(0);
    expect(out.player.xp).toBe(varan.bounty.xp);
    expect(pirateState(out.player, "varan")).toMatchObject({ notoriety: 3, repelled: 5, lairOpen: true, raidsWon: 1 });
    expect(out.debris.scrap).toBeGreaterThan(0);
    expect(out.report.attackerUid).toBe("pirates");

    p = veteran({ pirates: listed(["varan"], { notoriety: 2 }), commanders: { roster: { strategist: { xp: 0 } }, active: ["strategist"], movedAtMs: {}, dossiers: 0 } });
    const lost = resolvePirateRaid(varan, p, defaultQueues(), 50_000, [], NOW);
    expect(lost.combat.outcome).toBe("attacker_win");
    // v5.6 : la Stratège en poste progresse aussi sur un raid perdu.
    expect(lost.player.commanders?.roster.strategist?.xp).toBe(COMMANDER_XP.defenseLost);
    expect(lost.loot.scrap).toBeGreaterThan(0);
    expect(pirateState(lost.player, "varan")).toMatchObject({ notoriety: 1, raidsLost: 1 });
  });

  it("Gravhorn hits the home fleet only: defenses don't fight, rares are taken", () => {
    const turtle = veteran({ units: { canon_plasma: { level: 5, count: 2000 } } });
    const lost = resolvePirateRaid(gravhorn, turtle, defaultQueues(), 1000, [], NOW);
    expect(lost.combat.outcome).toBe("attacker_win");
    expect(lost.loot.aiFragment).toBe(5000);
    expect(lost.loot.scrap).toBeUndefined();
    expect(lost.player.units.canon_plasma.count).toBe(2000);

    const hunter = veteran({ units: { chasseur: { level: 5, count: 3000 } } });
    const won = resolvePirateRaid(gravhorn, hunter, defaultQueues(), Math.round(homeFleetPower(hunter) * 0.5), [], NOW);
    expect(won.combat.outcome).toBe("defender_win");
    expect(won.bounty).toMatchObject({ reinforcedSteel: 200, aiFragment: 200 });
    expect(won.player.xp).toBe(gravhorn.bounty.xp);
    expect(won.report.attackerPseudo).toMatch(/Ambre/);
  });

  it("launches and wins a lair assault, per faction", () => {
    const p = veteran({
      units: { chasseur: { level: 5, count: 2000 }, canon_plasma: { level: 1, count: 10 } },
      pirates: listed(["varan"], { lairOpen: true, repelled: 5, notoriety: 5 }),
    });
    const launch = (owner: PlayerState, lairTarget: string, n: number) =>
      performLaunch({ mission: "lair", now: NOW, owner, ownerQueues: defaultQueues(), fleet: { chasseur: n }, lairTarget });
    expect(() => launch(veteran(), lairUid("varan"), 1)).toThrow(/localisé/);
    expect(() => launch(p, lairUid("gravhorn"), 1)).toThrow(/localisé/);
    const launched = launch(p, "pirates_lair", 2000);
    expect(launched.fleet).toMatchObject({ factionId: "varan", targetUid: "lair_varan", power: lairPower(varan, p) });
    // v5.4 : le repaire vaut 1,05 × l'attaque de la flotte à quai — toute la flotte sans bonus ne passe pas…
    const arrived = { ...launched.attacker, resourcesUpdatedAtMs: launched.fleet.arriveAtMs };
    expect(resolveLairAssault(varan, structuredClone(arrived), defaultQueues(), launched.fleet.units, launched.fleet.power!, launched.fleet.arriveAtMs).combat.outcome).toBe("defender_win");
    // …la formation d'assaut (+10 %) suffit.
    const out = resolveLairAssault(varan, arrived, defaultQueues(), launched.fleet.units, launched.fleet.power!, launched.fleet.arriveAtMs, "assault");
    expect(out.combat.outcome).toBe("attacker_win");
    expect(out.player.titles?.map((t) => t.label)).toContain(varan.lair.title);
    expect(pirateState(out.player, "varan")).toMatchObject({ lairOpen: false, repelled: 0, notoriety: 0, lairsTaken: 1 });
  });

  it("the Inquisition hunts recent researchers with a lot of knowledge", () => {
    const inquisition = findFaction("inquisition")!;
    const scholar = veteran({ resourcesUpdatedAtMs: NOW - 10 * 24 * H, pirates: listed(["inquisition"]), techLevels: { a: 20, b: 15 } });
    expect(pirateTick(scholar, NOW).changed).toBe(false); // aucune recherche récente
    scholar.stats = { lastResearchAtMs: NOW - 2 * 24 * H };
    pirateTick(scholar, NOW);
    expect(activeUltimatum(scholar, NOW)?.faction.id).toBe("inquisition");
    expect(scholar.stats?.ultimatums).toBe(1);
    expect(scholar.stats?.threatenedBy).toEqual(["inquisition"]);
    expect(inquisition.raid.lootKind).toBe("rare");
  });

  it("the Cartel targets full warehouses and asks a share of the stock", () => {
    const cartel = findFaction("cartel")!;
    const poor = veteran({ pirates: listed(["cartel"]), resources: { ...veteran().resources, scrap: 10, energy: 10, nano: 10, data: 10 } });
    expect(pirateTick(poor, NOW).changed).toBe(false);
    const rich = veteran({ pirates: listed(["cartel"]) });
    rich.resources.scrap = getStorageCapacity(rich.buildings); // entrepôt plein
    expect(storageFillPct(rich)).toBeGreaterThanOrEqual(80);
    pirateTick(rich, NOW);
    const tribute = pirateState(rich, "cartel").ultimatum!.tribute;
    expect(tribute.scrap).toBeGreaterThan(0);
    expect(tribute.scrap).toBeLessThanOrEqual(Math.ceil(rich.resources.scrap * cartel.tribute.stockPct!));
  });

  it("the Pack tracks building levels gained over its window", () => {
    const p = veteran({ pirates: listed(["meute"]) });
    p.pirates = { ...(p.pirates as FactionStates), meute: { ...pirateState({}), nextListAtMs: NOW - 1, mark: { atMs: NOW - H, value: totalBuildingLevels(p) - 10 } } };
    expect(pirateTick(p, NOW).changed).toBe(false); // +10 niveaux seulement
    p.pirates = { ...(p.pirates as FactionStates), meute: { ...pirateState({}), nextListAtMs: NOW - 1, mark: { atMs: NOW - H, value: totalBuildingLevels(p) - 30 } } };
    pirateTick(p, NOW);
    expect(activeUltimatum(p, NOW)?.faction.id).toBe("meute");
    expect(pirateState(p, "meute").mark?.value).toBe(totalBuildingLevels(p));
    // Repère périmé : il est remis à zéro.
    const q = veteran({ pirates: listed([]) });
    q.pirates = { ...(q.pirates as FactionStates), meute: { ...pirateState({}), nextListAtMs: NOW - 1, mark: { atMs: NOW - 30 * 24 * H, value: 0 } } };
    expect(pirateTick(q, NOW).changed).toBe(true);
    expect(pirateState(q, "meute")).toMatchObject({ ultimatum: null, mark: { atMs: NOW } });
  });

  it("counts a raid suffered while the fleet was on patrol", () => {
    const p = veteran({ pirates: listed(["varan"]) });
    expect(resolvePirateRaid(varan, p, defaultQueues(), 1000, [], NOW, { evading: true }).player.stats?.evasions).toBe(1);
  });

  it("the Silent Choir only answers to endgame research (v3.6)", () => {
    const p = veteran({ pirates: listed(["choeur"]) });
    p.techLevels = { ...p.techLevels, tech21: 3, tech22: 4 };
    expect(pirateTick(p, NOW).changed).toBe(false); // 7 niveaux seulement
    p.techLevels = { ...p.techLevels, tech23: 1 };
    const out = pirateTick(p, NOW);
    expect(activeUltimatum(p, NOW)?.faction.id).toBe("choeur");
    expect(out.notifications[0].message).toMatch(/Archonte Vesper/);
  });

  it("validates faction definitions", () => {
    expect(validateFactions(DEFAULT_FACTIONS)).toEqual([]);
    expect(DEFAULT_FACTIONS.map((f) => f.id)).toEqual(ALL);
    const bad = [{ ...DEFAULT_FACTIONS[0], id: "Bad Id" }, DEFAULT_FACTIONS[1], DEFAULT_FACTIONS[1]];
    expect(validateFactions(bad)).toHaveLength(2);
  });
});
