import { afterEach, describe, expect, it } from "vitest";
import { allowedDays, WORLD_BOSSES, findWorldBoss } from "@/game/worldBosses";
import { bossWindows, EVENT_RULES, parisOffsetMs, eventAt } from "@/game/events";
import { LEVIATHAN_RULES, leviathanSchedule, leviathanWindow, spawnLeviathan, worldBossForStart, worldBossName, grantLeviathanReward, resolveLeviathanAssault, bossWeakness } from "@/game/leviathan";
import { defaultPlayerState } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

const H = 3600_000;
const D = 24 * H;
const NOW = Date.UTC(2026, 9, 4, 12);
const saved = { dur: LEVIATHAN_RULES.durationHours };
afterEach(() => {
  LEVIATHAN_RULES.durationHours = saved.dur;
  EVENT_RULES.bossWeekly = true;
});

const localDay = (ms: number) => new Date(ms + parisOffsetMs(ms)).getUTCDay();

function windows(n: number) {
  return bossWindows(NOW, leviathanSchedule(), n);
}

describe("v5.14 boss mondiaux", () => {
  it("six boss complets (Léviathan compris), titres distincts", () => {
    expect(WORLD_BOSSES).toHaveLength(6);
    expect(WORLD_BOSSES[0].id).toBe("leviathan");
    expect(new Set(WORLD_BOSSES.map((b) => b.title)).size).toBe(6);
    for (const b of WORLD_BOSSES) {
      expect(b.story.length).toBeGreaterThan(80);
      expect(b.prompt).toMatch(/--ar 16:9/);
      expect(b.phases).toHaveLength(3);
      expect(b.hpMult).toBeGreaterThan(0);
      expect(b.weakness.length).toBeGreaterThan(0);
    }
    expect(findWorldBoss("inconnu").id).toBe("leviathan");
  });

  it("un par semaine, jamais le même jour que le précédent, au moins 4 jours d'écart, sans chevauchement", () => {
    const ws = windows(120);
    expect(ws.length).toBeGreaterThanOrEqual(110);
    for (let i = 1; i < ws.length; i++) {
      const [a, b] = [ws[i - 1], ws[i]];
      expect(localDay(b.startMs)).not.toBe(localDay(a.startMs));
      expect(b.startMs - a.startMs).toBeGreaterThanOrEqual(4 * D - H); // une heure de marge : changement d'heure
      expect(b.startMs).toBeGreaterThanOrEqual(a.endMs);
      expect(b.endMs - b.startMs).toBe(72 * H);
      expect(worldBossForStart(b.startMs).id).not.toBe(worldBossForStart(a.startMs).id);
    }
    // Les six passent en six semaines.
    expect(new Set(ws.slice(0, 6).map((w) => worldBossForStart(w.startMs).id)).size).toBe(6);
    // À 18 h, heure de Paris.
    for (const w of ws.slice(0, 10)) expect(new Date(w.startMs + parisOffsetMs(w.startMs)).getUTCHours()).toBe(18);
  });

  it("durée réglable : l'écart minimal suit pour ne jamais chevaucher", () => {
    LEVIATHAN_RULES.durationHours = 120;
    expect(leviathanSchedule().weekly?.minGapDays).toBe(5);
    const ws = windows(60);
    for (let i = 1; i < ws.length; i++) {
      expect(ws[i].startMs).toBeGreaterThanOrEqual(ws[i - 1].endMs);
      expect(localDay(ws[i].startMs)).not.toBe(localDay(ws[i - 1].startMs));
    }
    for (let p = 0; p < 7; p++) for (let g = 1; g <= 6; g++) expect(allowedDays(p, g).length).toBeGreaterThan(0);
  });

  it("l'apparition porte le boss de la semaine, sa résistance et son titre", () => {
    const [w] = windows(2).filter((x) => x.startMs > NOW);
    const win = leviathanWindow(w.startMs + H)!;
    expect(win.startMs).toBe(w.startMs);
    const a = { ...defaultPlayerState("a", "a"), units: { chasseur: { level: 1, count: 1000 } } } as unknown as PlayerState;
    const boss = worldBossForStart(w.startMs);
    const st = spawnLeviathan(win, [a], null);
    expect(st.bossId).toBe(boss.id);
    expect(worldBossName(st)).toBe(boss.name);
    expect(bossWeakness(st) === "" || boss.weakness.includes(bossWeakness(st))).toBe(true);
    const lev = spawnLeviathan(win, [a], null, "leviathan");
    expect(st.maxHp).toBe(Math.max(LEVIATHAN_RULES.minHp, Math.round(lev.maxHp * boss.hpMult)));
    const killed = resolveLeviathanAssault({ ...st, hp: 10, maxHp: 10 }, a, { chasseur: 1000 }, undefined, win.startMs + H).state;
    grantLeviathanReward(killed, a, () => 0.5);
    expect(a.activeTitle).toBe(boss.title);
  });

  it("les événements du week-end continuent en rotation hebdomadaire", () => {
    EVENT_RULES.rotationEnabled = true;
    EVENT_RULES.bossMonthly = true;
    // 2 octobre 2026 : premier week-end du mois, auparavant réservé au Léviathan.
    expect(eventAt(Date.UTC(2026, 9, 2, 20))).not.toBeNull();
  });
});
