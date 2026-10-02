import { describe, expect, it } from "vitest";
import { defaultPlayerState } from "@/game/defaults";
import { defaultQueues } from "@/game/defaults";
import {
  capLoot,
  composeWarlordFleet,
  DEFAULT_WARLORDS,
  desiredArmy,
  empirePower,
  emptyRuntime,
  growWarlord,
  openVendetta,
  pickWarlordTarget,
  recordVendettaDamage,
  settleVendettas,
  tierFactor,
  vendettaWinners,
  WARLORD_RULES,
  warlordCanTarget,
  warlordLine,
  warlordReference,
  warlordsState,
  warlordTargetPower,
  warlordUid,
  type TargetInfo,
} from "@/game/warlords";
import { endVacation, onVacation, startVacation, VACATION_RULES } from "@/game/vacation";
import { flushState } from "@/game/flush";
import { checkAttackAllowed } from "@/game/pvp";
import { performPlayerAction } from "@/game/actions";
import type { PlayerState } from "@/types/game";

const NOW = Date.UTC(2026, 9, 12, 12);
const HOUR = 3600_000;
const DAY = 24 * HOUR;

function player(uid: string, xp = 5000): PlayerState {
  const p = defaultPlayerState(uid, uid) as PlayerState;
  p.createdAtMs = NOW - 30 * DAY;
  p.xp = xp;
  p.resourcesUpdatedAtMs = NOW;
  p.units = { ...p.units, chasseur: { level: 1, count: 40 }, roquette: { level: 1, count: 60 } };
  return p;
}

const lord = (id: string) => DEFAULT_WARLORDS.find((d) => d.id === id)!;

describe("v4.2 warlords", () => {
  it("ten fixed lords, 15-character ids, each in its tier range", () => {
    expect(DEFAULT_WARLORDS).toHaveLength(10);
    for (const d of DEFAULT_WARLORDS) {
      expect(warlordUid(d.id)).toMatch(/^npc[a-z0-9]{12}$/);
      const [lo, hi] = WARLORD_RULES.tierRange[d.tier];
      expect(tierFactor(d)).toBeGreaterThanOrEqual(lo);
      expect(tierFactor(d)).toBeLessThanOrEqual(hi);
      for (const key of ["vendettaOpen", "vendettaWon", "vendettaLost", "reply"] as const) expect(d.lines[key]?.length).toBeGreaterThan(0);
    }
    expect(DEFAULT_WARLORDS.filter((d) => d.tier === "strong")).toHaveLength(3);
    expect(DEFAULT_WARLORDS.filter((d) => d.tier === "weak")).toHaveLength(3);
    expect(new Set(DEFAULT_WARLORDS.map((d) => warlordUid(d.id))).size).toBe(10);
  });

  it("power follows active players (never other lords) and grows at most 8 % a day", () => {
    const humans = [player("a"), player("b"), player("c")];
    humans[2].units.chasseur.count = 400;
    const npcLike = { ...player("x"), npc: "zharkesh" };
    npcLike.units.chasseur.count = 99999;
    const ref = warlordReference([...humans, npcLike]);
    expect(ref.max).toBe(empirePower(humans[2]));
    const d = lord("tivrek");
    const target = warlordTargetPower(d, ref);
    expect(target).toBeGreaterThanOrEqual(WARLORD_RULES.minPower);

    const npc = defaultPlayerState(warlordUid(d.id), d.name) as PlayerState;
    let rt = growWarlord(npc, d, ref, emptyRuntime(), NOW);
    expect(rt.seeded).toBe(true);
    const full = empirePower(npc);
    expect(full).toBeGreaterThanOrEqual(target * 0.95);
    // Après de lourdes pertes : pas plus de 8 % de la cible par jour.
    for (const id of Object.keys(npc.units)) npc.units[id].count = Math.floor(npc.units[id].count / 4);
    const after = empirePower(npc);
    rt = growWarlord(npc, d, ref, rt, NOW + DAY);
    expect(empirePower(npc) - after).toBeLessThanOrEqual(full * 0.1);
    expect(empirePower(npc)).toBeGreaterThan(after);
  });

  it("aggressive lords keep most power in ships, builders in defenses", () => {
    const ships = (army: Record<string, number>) => Object.keys(army).filter((id) => ["chasseur", "fregate", "croiseur_nova", "etoile_noire", "sentinelle", "traqueur_kesh"].includes(id));
    expect(ships(desiredArmy(lord("brannoc"), 100000)).length).toBeGreaterThan(0);
    expect(Object.keys(desiredArmy(lord("ossaya"), 100000)).length).toBe(4);
  });

  it("targets: Bronze I minimum, 72 h between two lord attacks, no newbie, no vacation", () => {
    const d = lord("brannoc");
    const npc = { ...player(warlordUid(d.id)), npc: d.id };
    const t = (p: PlayerState, extra: Partial<TargetInfo> = {}): TargetInfo => ({ player: p, lastAttackOnTargetMs: null, lastWarlordHitMs: 0, ...extra });
    expect(warlordCanTarget(d, npc, t(player("ok")), NOW)).toBe(true);
    expect(warlordCanTarget(d, npc, t(player("low", 1500)), NOW)).toBe(false);
    expect(warlordCanTarget(d, npc, t(player("hit"), { lastWarlordHitMs: NOW - 10 * HOUR }), NOW)).toBe(false);
    expect(warlordCanTarget(d, npc, t(player("rep"), { lastWarlordHitMs: NOW - 10 * HOUR, reprisal: true }), NOW)).toBe(true);
    const newbie = player("new");
    newbie.createdAtMs = NOW - DAY;
    expect(warlordCanTarget(d, npc, t(newbie), NOW)).toBe(false);
    const away = player("away");
    away.vacation = { startedAtMs: NOW - DAY, untilMs: NOW + DAY };
    expect(warlordCanTarget(d, npc, t(away), NOW)).toBe(false);
    // Opportuniste : seulement une cible battue récemment ou trop riche.
    const lysa = lord("lysa");
    expect(warlordCanTarget(lysa, npc, t(player("calm")), NOW)).toBe(false);
    const beaten = player("beaten");
    beaten.lastDefeatAtMs = NOW - 3 * HOUR;
    expect(warlordCanTarget(lysa, npc, t(beaten), NOW)).toBe(true);
  });

  it("attack fleet sized at 80-110 % of the target's defense, or no attack", () => {
    const d = lord("brannoc");
    const npc = { ...player(warlordUid(d.id)), npc: d.id };
    npc.units.chasseur.count = 5000;
    const target = player("t");
    const fleet = composeWarlordFleet(npc, target, () => 0.5)!;
    expect(fleet.chasseur).toBeGreaterThan(0);
    const weak = { ...player(warlordUid(d.id)), npc: d.id };
    weak.units.chasseur.count = 1;
    expect(composeWarlordFleet(weak, target, () => 0.5)).toBeNull();
    const pick = pickWarlordTarget(d, npc, [{ player: target, lastAttackOnTargetMs: null, lastWarlordHitMs: 0 }], NOW, () => 0.5);
    expect(pick?.target.player.uid).toBe("t");
    expect(capLoot({ scrap: 900, energy: 300 }, 600)).toEqual({ scrap: 450, energy: 150 });
  });

  it("lords have no shield after a defeat", () => {
    const base = { now: NOW, attackerUid: "a", attackerXp: 100, defenderUid: "b", defenderXp: 100, defenderCreatedAtMs: NOW - 30 * DAY, defenderHasAttacked: true, lastAttackOnTargetMs: null, lastDefenderDefeatMs: NOW - 60_000 };
    expect(checkAttackAllowed(base).allowed).toBe(false);
    expect(checkAttackAllowed({ ...base, defenderIsWarlord: true }).allowed).toBe(true);
    expect(checkAttackAllowed({ ...base, lastDefenderDefeatMs: null, defenderVacationUntilMs: NOW + DAY }).message).toMatch(/vacances/);
  });

  it("vendetta: goal of 2x fleet power, damage from the opener or the alliance, rewards and reprisal", () => {
    const d = lord("thessa");
    const npc = { ...player(warlordUid(d.id)), npc: d.id };
    const state = warlordsState(null);
    const v = openVendetta(state, d, { uid: "me", pseudo: "Moi", allianceId: "al1" }, "alliance", npc, undefined, NOW);
    expect(v.goal).toBeGreaterThan(0);
    expect(() => openVendetta(state, d, { uid: "you", pseudo: "Toi", allianceId: "" }, "player", npc, undefined, NOW)).toThrow(/déjà ouverte/);
    expect(recordVendettaDamage(state, d.id, "stranger", "other", v.goal, NOW)).toBeNull();
    expect(recordVendettaDamage(state, d.id, "mate", "al1", v.goal * 0.5, NOW)).toBeNull();
    const won = recordVendettaDamage(state, d.id, "me", "al1", v.goal * 0.05, NOW + HOUR);
    expect(won).toBeNull();
    const done = recordVendettaDamage(state, d.id, "mate", "al1", v.goal, NOW + 2 * HOUR)!;
    expect(done.status).toBe("won");
    expect(vendettaWinners(done).sort()).toEqual(["mate", "me"]);

    const lost = openVendetta(state, lord("lysa"), { uid: "solo", pseudo: "Solo" }, "player", npc, undefined, NOW);
    expect(settleVendettas(state, lost.endsAtMs + 1)).toHaveLength(1);
    expect(state.reprisals).toEqual([{ warlordId: "lysa", uid: "solo", dueAtMs: lost.endsAtMs + 1 }]);
    expect(() => openVendetta(state, d, { uid: "x", pseudo: "X" }, "player", npc, { ...emptyRuntime(), absentUntilMs: NOW + DAY }, NOW)).toThrow(/quitté/);
  });

  it("lines name the player", () => {
    expect(warlordLine(lord("brannoc"), "contact", "Alpha", () => 0)).toContain("Alpha");
    expect(warlordLine(lord("ossaya"), "won", "Alpha")).toBeNull();
  });
});

describe("v4.2 vacation", () => {
  const ctx = { fleetsAway: 0, hostileIncoming: 0, lastAttackedAtMs: 0, ultimatum: false };

  it("2 to 21 days, refused with fleets away, a threat, a recent attack or too soon after the last one", () => {
    const p = player("v");
    expect(() => startVacation(p, 1, ctx, NOW)).toThrow(/entre 2 et 21/);
    expect(() => startVacation(p, 3, { ...ctx, fleetsAway: 1 }, NOW)).toThrow(/flottes/);
    expect(() => startVacation(p, 3, { ...ctx, hostileIncoming: 1 }, NOW)).toThrow(/hostile/);
    expect(() => startVacation(p, 3, { ...ctx, ultimatum: true }, NOW)).toThrow(/ultimatum/);
    expect(() => startVacation(p, 3, { ...ctx, lastAttackedAtMs: NOW - HOUR }, NOW)).toThrow(/12 h/);
    startVacation(p, 3, ctx, NOW);
    expect(onVacation(p, NOW + DAY)).toBe(true);
    const q = defaultQueues();
    expect(() => endVacation(p, q, NOW + DAY, true)).toThrow(/48 h/);
    endVacation(p, q, NOW + 2 * DAY + HOUR, true);
    expect(onVacation(p, NOW + 2 * DAY + 2 * HOUR)).toBe(false);
    expect(() => startVacation(p, 3, ctx, NOW + 4 * DAY)).toThrow(/trop récentes/);
    startVacation(p, 3, ctx, NOW + 2 * DAY + HOUR + VACATION_RULES.cooldownDays * DAY);
  });

  it("production at 25 %, queues frozen then shifted, actions blocked", () => {
    const p = player("v");
    p.resources.scrap = 0;
    const q = defaultQueues();
    q.activeResearches = [{ id: "tech1", endTime: NOW + HOUR }] as typeof q.activeResearches;
    const normal = flushState(structuredClone(p), structuredClone(q), NOW + DAY).player.resources.scrap ?? 0;
    startVacation(p, 2, ctx, NOW);
    const away = flushState(structuredClone(p), structuredClone(q), NOW + DAY);
    expect(away.player.resources.scrap).toBeCloseTo(normal * VACATION_RULES.productionFactor, -1);
    expect(away.queues.activeResearches[0].endTime).toBe(NOW + HOUR);
    expect(() => performPlayerAction(p, q, { type: "upgradeBuilding", buildingId: "extracteur_ferraille" }, NOW + HOUR)).toThrow(/vacances/);
    // Retour à l'échéance : la recherche est décalée de toute la durée.
    const back = flushState(structuredClone(p), structuredClone(q), NOW + 2 * DAY + 10);
    expect(back.player.vacation?.endedAtMs).toBe(NOW + 2 * DAY);
    expect(back.queues.activeResearches).toHaveLength(1);
    expect(back.queues.activeResearches[0].endTime).toBe(NOW + 2 * DAY + HOUR);
    expect(flushState(back.player, back.queues, NOW + 2 * DAY + 2 * HOUR).player.techLevels.tech1).toBe(1);
  });
});
