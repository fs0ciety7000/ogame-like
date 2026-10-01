import { describe, expect, it } from "vitest";
import { defaultPlayerState } from "@/game/defaults";
import { EVENT_RULES } from "@/game/events";
import {
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
    expect(rewardHours(st, "a")).toBe(LEVIATHAN_RULES.baseRewardHours + LEVIATHAN_RULES.bonusRewardHours);
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
    expect(rewardHours(st, "a")).toBeCloseTo((LEVIATHAN_RULES.baseRewardHours + LEVIATHAN_RULES.bonusRewardHours / 2) * LEVIATHAN_RULES.failedRewardFactor);
    expect(grantLeviathanReward(st, b).title).toBe(false);
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
