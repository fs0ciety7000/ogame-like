import { describe, expect, it } from "vitest";
import { bossHistoryEntry, bossHistoryState, bossRecords, normalizeBossHistory, pushBossHistory } from "@/game/bossHistory";
import { inferKilledBy, LEVIATHAN_RULES, resolveLeviathanAssault, type LeviathanState } from "@/game/leviathan";
import { defaultPlayerState } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

const base = (patch: Partial<LeviathanState> = {}): LeviathanState => ({
  id: "lev-1",
  startMs: 0,
  endMs: 48 * 3600_000,
  maxHp: 1000,
  hp: 0,
  status: "killed",
  contributions: {
    a: { pseudo: "Alpha", damage: 700, assaults: 3, lastLaunchMs: 0 },
    b: { pseudo: "Bravo", damage: 300, assaults: 2, lastLaunchMs: 0 },
  },
  endedAtMs: 10 * 3600_000,
  rewarded: true,
  titleHolder: null,
  timeline: [],
  killedBy: { uid: "b", pseudo: "Bravo" },
  ...patch,
});

describe("v5.10 Hall of fame des boss", () => {
  it("archive un combat et calcule les records", () => {
    const e1 = bossHistoryEntry("leviathan", base(), { name: "Le Léviathan" });
    expect(e1).toMatchObject({ id: "leviathan:lev-1", won: true, totalDamage: 1000, participants: 2, assaults: 5, killedBy: { uid: "b" } });
    const e2 = bossHistoryEntry("seasonboss", base({ id: "sb-1", endedAtMs: 4 * 3600_000, killedBy: { uid: "b", pseudo: "Bravo" } }), { name: "Varan" });
    const e3 = bossHistoryEntry("leviathan", base({ id: "lev-2", status: "failed", hp: 500, killedBy: undefined }), { name: "Le Léviathan" });
    let list = pushBossHistory([], e1);
    list = pushBossHistory(list, e2);
    list = pushBossHistory(list, e3);
    list = pushBossHistory(list, e1);
    expect(list).toHaveLength(3);
    const rec = bossRecords(list);
    expect(rec.kills).toBe(2);
    expect(rec.fastest?.name).toBe("Varan");
    expect(rec.finishers[0]).toMatchObject({ uid: "b", count: 2 });
    expect(rec.champions[0]).toMatchObject({ uid: "a", count: 2 });
    expect(normalizeBossHistory({ entries: [e1, { id: 3 }, { id: "x", kind: "zz" }] })).toHaveLength(1);
  });

  it("note l'auteur du coup de grâce", () => {
    const p = { ...defaultPlayerState("k", "Killer"), units: { fregate: { level: 1, count: 10_000 } } } as PlayerState;
    const st = base({ status: "active", hp: 1, endedAtMs: 0, killedBy: undefined, rewarded: false });
    const res = resolveLeviathanAssault(st, p, { fregate: 10_000 }, "balanced", 1000);
    expect(res.killed).toBe(true);
    expect(res.state.killedBy).toEqual({ uid: "k", pseudo: "Killer" });
  });
});

describe("inferKilledBy (v5.10.2)", () => {
  const FLIGHT = LEVIATHAN_RULES.flightMinutes * 60_000;
  const killedAt = 10 * 3600_000;
  const st = (extra: Partial<LeviathanState> = {}): LeviathanState =>
    base({
      killedBy: undefined,
      endedAtMs: killedAt,
      contributions: {
        a: { pseudo: "Alpha", damage: 600, assaults: 2, lastLaunchMs: killedAt - FLIGHT - 3600_000 },
        b: { pseudo: "Bravo", damage: 400, assaults: 3, lastLaunchMs: killedAt - FLIGHT },
        // Lancé trop tard : arrivé après la chute, sans dégâts sur ce dernier assaut.
        c: { pseudo: "Charlie", damage: 50, assaults: 1, lastLaunchMs: killedAt + 3600_000 },
      },
      ...extra,
    });

  it("retrouve le dernier assaut arrivé avant la chute", () => {
    expect(inferKilledBy(st())).toEqual({ uid: "b", pseudo: "Bravo" });
  });

  it("garde le coup de grâce déjà connu et ignore un boss retiré", () => {
    expect(inferKilledBy(st({ killedBy: { uid: "a", pseudo: "Alpha" } }))).toEqual({ uid: "a", pseudo: "Alpha" });
    expect(inferKilledBy(st({ status: "failed", hp: 10 }))).toBeNull();
  });

  it("Léviathan d'octobre 2026 (abattu avant la 5.10) : Nicotine porte le coup de grâce", () => {
    const c = (pseudo: string, damage: number, lastLaunchMs: number) => ({ pseudo, damage, assaults: 1, lastLaunchMs });
    const real = base({
      id: "lev-1790956800000",
      startMs: 1790956800000,
      endMs: 1791216000000,
      endedAtMs: 1791074988649,
      killedBy: undefined,
      contributions: {
        "20psztaknee31um": c("Vince", 11750363, 1791060848437),
        "5gfztcdlokpzshg": c("GPTIPU-1", 3879221, 1791074451743),
        dkn2paqrn1mou9u: c("Nicotine", 18074374, 1791073186263),
        oc4ubj4gnbpbls8: c("Tartiflex", 10894210, 1791054048471),
        pde70zka50fijsi: c("Vito", 7361343, 1791065913919),
        q7cfp2o82wclp8l: c("ChupaChups", 5076670, 1791059215598),
        son23jjxe0co5pj: c("Tomdindon", 24733205, 1791060643799),
      },
    });
    // GPTIPU-1 a lancé 9 min avant la chute : arrivé trop tard, ce n'est pas lui.
    expect(inferKilledBy(real)).toEqual({ uid: "dkn2paqrn1mou9u", pseudo: "Nicotine" });
  });
});

describe("bossHistoryState (v5.10.3)", () => {
  it("reconstitue le combat archivé pour rouvrir le bilan", () => {
    const st = base({ rewards: { a: { gain: { metal: 100 } } } });
    const entry = bossHistoryEntry("leviathan", st, { name: "Le Léviathan" });
    const { state, complete } = bossHistoryState(entry);
    expect(complete).toBe(true);
    expect(state).toMatchObject({ id: "lev-1", status: "killed", hp: 0, rewarded: true, killedBy: { uid: "b" } });
    expect(state.contributions.b).toMatchObject({ damage: 300, assaults: 2 });
    expect(state.rewards?.a).toEqual({ gain: { metal: 100 } });
  });

  it("archive d'avant la 5.10.3 : podium seul, chiffres du combat entier gardés", () => {
    const old = { ...bossHistoryEntry("seasonboss", base({ status: "failed", hp: 400 }), { name: "Varan" }), ranking: undefined, participants: 9, totalDamage: 2000 };
    const { state, complete, totals } = bossHistoryState(old);
    expect(complete).toBe(false);
    expect(state.status).toBe("failed");
    expect(totals).toMatchObject({ participants: 9, totalDamage: 2000 });
  });
});
