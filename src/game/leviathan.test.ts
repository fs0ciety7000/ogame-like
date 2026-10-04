import { addRelic, RELIC_RULES, rollRelic } from "@/game/relics";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { defaultPlayerState } from "@/game/defaults";
import { EVENT_RULES } from "@/game/events";
import {
  BOSS_PHASE_RULES,
  bossAssaultEstimate,
  bossFightPhase,
  bossWeakness,
  checkLeviathanLaunch,
  closeLeviathan,
  grantLeviathanReward,
  leviathanPace,
  leviathanWindow,
  recordLeviathanTimeline,
  resizeLeviathan,
  LEVIATHAN_RULES,
  removeLeviathanTitle,
  resolveLeviathanAssault,
  rewardHours,
  spawnLeviathan,
  type LeviathanState,
} from "@/game/leviathan";
import type { PlayerState } from "@/types/game";

const H = 3600_000;
// Vendredi 2 octobre 2026 (premier du mois), 18 h à Paris = 16 h UTC.
const START = Date.UTC(2026, 9, 2, 16);

function player(uid: string, chasseurs = 100): PlayerState {
  const p = { ...defaultPlayerState(uid, uid), createdAt: null } as unknown as PlayerState;
  p.uid = uid;
  p.units = { chasseur: { level: 1, count: chasseurs } };
  p.buildings = { ...p.buildings, extracteur_ferraille: { level: 10, unlocked: true } };
  return p;
}

describe("leviathan", () => {
  // Rendez-vous mensuel et Léviathan seul (la rotation hebdomadaire a ses propres tests).
  beforeEach(() => {
    EVENT_RULES.bossWeekly = false;
  });
  afterEach(() => {
    EVENT_RULES.bossWeekly = true;
  });

  it("appears on the first weekend of the month for 72 h", () => {
    EVENT_RULES.bossMonthly = true;
    expect(leviathanWindow(START - 1)).toBeNull();
    expect(leviathanWindow(START + H)?.startMs).toBe(START);
    expect(leviathanWindow(START + 71 * H)).not.toBeNull();
    expect(leviathanWindow(START + 72 * H)).toBeNull();
    expect(leviathanWindow(START + 7 * 24 * H + H)).toBeNull();
  });

  it("has HP proportional to the active fleets, assaults are rate-limited", () => {
    const a = player("a"), b = player("b");
    const st = spawnLeviathan({ id: "x", startMs: START, endMs: START + 72 * H }, [a, b], null);
    expect(st.maxHp).toBeGreaterThanOrEqual(LEVIATHAN_RULES.minHp);
    const launched = checkLeviathanLaunch(st, "a", "a", START + H);
    expect(() => checkLeviathanLaunch(launched, "a", "a", START + 2 * H)).toThrow(/min/);
    expect(checkLeviathanLaunch(launched, "a", "a", START + 5 * H).contributions.a.lastLaunchMs).toBe(START + 5 * H);
    expect(() => checkLeviathanLaunch(st, "a", "a", START + 80 * H)).toThrow(/pas là/);
  });

  it("damage, 8 % losses, kill and proportional rewards with a title for the top", () => {
    const a = player("a", 1000), b = player("b", 1000);
    let st = { ...spawnLeviathan({ id: "x", startMs: START, endMs: START + 72 * H }, [a], null), maxHp: 200_000, hp: 200_000 };
    const r1 = resolveLeviathanAssault(st, a, { chasseur: 1000 }, undefined, START + H);
    expect(r1.damage).toBe(200_000); // 1 000 chasseurs × 245 = 245 000, plafonné aux 200 000 restants
    expect(r1.lost.chasseur).toBe(80);
    expect(r1.killed).toBe(true);
    st = r1.state;
    expect(rewardHours(st, "a")).toBe(LEVIATHAN_RULES.baseRewardHours + LEVIATHAN_RULES.bonusRewardHours + LEVIATHAN_RULES.podiumHours[0]);
    expect(rewardHours(st, "b")).toBe(0);
    const out = grantLeviathanReward(st, a);
    expect(out.title).toBe(true);
    expect(a.activeTitle).toBe(LEVIATHAN_RULES.title);
    expect(a.stats?.leviathanKills).toBe(1);
    removeLeviathanTitle(a);
    expect(a.titles?.some((t) => t.label === LEVIATHAN_RULES.title)).toBe(false);
    void b;
  });

  it("halves the rewards when it survives", () => {
    const a = player("a", 10), b = player("b", 20);
    let st = spawnLeviathan({ id: "x", startMs: START, endMs: START + 72 * H }, [a, b], null);
    st = resolveLeviathanAssault(st, a, { chasseur: 10 }, undefined, START + H).state;
    st = resolveLeviathanAssault(st, b, { chasseur: 20 }, undefined, START + H).state;
    st = closeLeviathan(st, START + 73 * H);
    expect(st.status).toBe("failed");
    expect(rewardHours(st, "b")).toBe((LEVIATHAN_RULES.baseRewardHours + LEVIATHAN_RULES.bonusRewardHours) * LEVIATHAN_RULES.failedRewardFactor);
    expect(rewardHours(st, "a")).toBeCloseTo((LEVIATHAN_RULES.baseRewardHours + LEVIATHAN_RULES.bonusRewardHours * Math.SQRT1_2) * LEVIATHAN_RULES.failedRewardFactor);
    expect(grantLeviathanReward(st, b).title).toBe(false);
  });

  it("v5.13 : les gros participants suivent le premier (racine, podium, reliques épiques du top 3)", () => {
    const ps = ["a", "b", "c", "d"].map((u) => player(u, 1000));
    let st = { ...spawnLeviathan({ id: "y", startMs: START, endMs: START + 72 * H }, ps, null), maxHp: 10_000_000, hp: 10_000_000 };
    [1000, 400, 300, 100].forEach((n, i) => (st = resolveLeviathanAssault(st, ps[i], { chasseur: n }, undefined, START + H).state));
    st = { ...st, status: "killed" };
    const h = ["a", "b", "c", "d"].map((u) => rewardHours(st, u));
    // 2e avec 40 % des dégâts du premier : plus de 60 % de ses heures (avant : 6 h contre 12 h).
    expect(h[1] / h[0]).toBeGreaterThan(0.6);
    expect(h[1] - h[2]).toBeGreaterThan(LEVIATHAN_RULES.podiumHours[1] - LEVIATHAN_RULES.podiumHours[2] - 0.01);
    expect(h[3]).toBeGreaterThan(LEVIATHAN_RULES.baseRewardHours);
    const epic = ps.map((p) => grantLeviathanReward(st, p, () => 0.5).relic);
    expect(epic.every(Boolean)).toBe(true);
    // Collection pleine : de l'Ambre à la place.
    const full = player("b", 1000);
    for (let i = 0; i < RELIC_RULES.maxItems; i++) addRelic(full, rollRelic("test", START + i, () => 0.5, "common"));
    const out = grantLeviathanReward(st, full, () => 0.5);
    expect(out.relic).toBeUndefined();
    expect(out.amber).toBe(LEVIATHAN_RULES.relicAmber.epic);
  });
});

describe("leviathan live tracking", () => {
  const base = () => spawnLeviathan({ id: "lev-t", startMs: START, endMs: START + 72 * H }, [], null);

  it("samples the structure at most once per hour", () => {
    let s = base();
    expect(s.timeline).toEqual([{ t: START, hp: s.maxHp }]);
    s = recordLeviathanTimeline({ ...s, hp: s.maxHp - 10 }, START + 30 * 60_000);
    expect(s.timeline).toHaveLength(1);
    s = recordLeviathanTimeline(s, START + H);
    expect(s.timeline).toHaveLength(2);
    expect(s.timeline[1].hp).toBe(s.maxHp - 10);
  });

  it("projects the outcome from the average pace", () => {
    const s = { ...base(), maxHp: 1_200_000, hp: 1_000_000, timeline: [{ t: START, hp: 1_200_000 }, { t: START + 9 * H, hp: 1_020_000 }] };
    const pace = leviathanPace(s, START + 10 * H);
    expect(pace.ratePerHour).toBe(20_000);
    expect(pace.lastHour).toBe(20_000);
    expect(pace.remainingHours).toBe(62);
    expect(pace.projectedHp).toBe(0); // abattu avant l'échéance
    expect(pace.killInHours).toBe(50);
    expect(pace.suggestedMaxHp).toBe(200_000 + 20_000 * 62);
  });

  it("resizes while keeping the damage already dealt", () => {
    const s = { ...base(), maxHp: 1_200_000, hp: 1_000_000 };
    const r = resizeLeviathan(s, 800_000, START + 2 * H);
    expect(r.maxHp).toBe(800_000);
    expect(r.hp).toBe(600_000);
    expect(() => resizeLeviathan(s, 150_000, START + 2 * H)).toThrow();
    expect(() => resizeLeviathan(s, 900_000, START + 80 * H)).toThrow();
  });
});

describe("phases de combat et fil (v5.10.5)", () => {
  const live = (hp: number): LeviathanState => ({ id: "lev-phases", startMs: START, endMs: START + 72 * H, maxHp: 1_000_000, hp, status: "active", contributions: {}, endedAtMs: 0, rewarded: false, titleHolder: null, timeline: [] });

  it("phases à 50 % et 25 % de structure", () => {
    expect(bossFightPhase(live(1_000_000))).toBe(1);
    expect(bossFightPhase(live(500_000))).toBe(2);
    expect(bossFightPhase(live(250_000))).toBe(3);
  });

  it("riposte : pertes accrues ; bouclier : dégâts réduits sauf la faiblesse", () => {
    const a = player("a", 1000);
    const p1 = bossAssaultEstimate(live(900_000), a, { chasseur: 1000 }, undefined);
    const p2 = bossAssaultEstimate(live(400_000), a, { chasseur: 1000 }, undefined);
    expect(p2.lossPct).toBeCloseTo(p1.lossPct * BOSS_PHASE_RULES.riposteLossFactor);
    expect(p2.power).toBe(p1.power);
    const st3 = live(200_000);
    const weak = bossWeakness(st3);
    const p3 = bossAssaultEstimate(st3, a, { chasseur: 1000 }, undefined);
    expect(p3.power).toBe(Math.round(p1.power * (weak === "chasseur" ? BOSS_PHASE_RULES.weaknessFactor : BOSS_PHASE_RULES.shieldDamageFactor)));
  });

  it("le fil garde l'assaut et annonce le passage de phase", () => {
    const a = player("a", 100_000);
    const st = live(510_000);
    const res = resolveLeviathanAssault(st, a, { chasseur: 100_000 }, undefined, START + H);
    expect(res.state.feed?.[0]).toMatchObject({ uid: "a", damage: res.damage });
    if (res.state.hp > 0 && bossFightPhase(res.state) > 1) expect(res.state.feed?.[1]).toMatchObject({ phase: bossFightPhase(res.state) });
  });
});
