import { afterEach, describe, expect, it } from "vitest";
import { ACHIEVEMENTS, achievementValue, DEFAULT_ACHIEVEMENTS, setAchievements } from "@/game/achievements";
import { GUIDE_STEPS } from "@/game/advancedGuide";
import { ALLIANCE_CHALLENGES } from "@/game/allianceChallenge";
import { moonHealth } from "@/game/balance/health";
import { codexEntries } from "@/game/codex";
import { applyGameContent } from "@/game/content";
import { defaultPlayerState } from "@/game/defaults";
import { findEffectPreset } from "@/game/effectCatalog";
import { effectImpactReport } from "@/game/impact";
import { gateCooldownMs } from "@/game/jumpGate";
import { playerModifiers } from "@/game/modifiers";
import { rollMoon, type MoonState } from "@/game/moon";
import { phalanxRange } from "@/game/phalanx";
import { DEFAULT_RELICS, type RelicRarity } from "@/game/relics";
import { upcomingEvents } from "@/game/timeline";
import { findTitle } from "@/game/titles";
import type { PlayerState } from "@/types/game";

/* 6.14.69 (É30-1d, proposals/phalange-porte-de-saut.md §7) : chaîne de contenu de la phalange, de la porte de saut et de la pitié. */

const NOW = Date.UTC(2026, 9, 7, 12);
const H = 3600_000;
const moon = (level: number, patch: Partial<MoonState> = {}): MoonState => ({ name: "Nyx", bornAtMs: NOW - 1, fromDebris: 1, level, ...patch });
const player = (uid: string, patch: Partial<PlayerState> = {}): PlayerState => ({ ...defaultPlayerState(uid, uid.toUpperCase()), resourcesUpdatedAtMs: NOW, ...patch }) as PlayerState;
const withRelic = (template: string, rarity: RelicRarity, patch: Partial<PlayerState> = {}) =>
  player("r", { relics: { items: [{ id: "x", template, rarity, foundAtMs: 0, source: "test" }], slots: ["x"] } as never, ...patch });

afterEach(() => {
  applyGameContent({});
  setAchievements(structuredClone(DEFAULT_ACHIEVEMENTS));
});

describe("reliques de la lune (maillons 3 à 5)", () => {
  it("Lentille de Séléné : +20 % de portée en épique, +30 % en légendaire, sous le plafond de 50 %", () => {
    expect(DEFAULT_RELICS.find((t) => t.id === "lentille_selene")?.custom).toMatchObject({ stat: "phalanxRange", scale: 2 });
    expect(playerModifiers(withRelic("lentille_selene", "epic")).phalanxRange).toBeCloseTo(0.2);
    expect(playerModifiers(withRelic("lentille_selene", "legendary")).phalanxRange).toBeCloseTo(0.3);
    // Lune niveau 2 : 30 de portée, 36 avec une lentille épique.
    expect(phalanxRange(withRelic("lentille_selene", "epic", { moon: moon(2) }))).toBeCloseTo(36);
  });

  it("Clé du seuil : −15 % de recharge en épique, −22,5 % en légendaire, plancher de 6 h respecté", () => {
    expect(playerModifiers(withRelic("cle_seuil", "epic")).jumpGateCooldown).toBeCloseTo(0.15);
    expect(playerModifiers(withRelic("cle_seuil", "legendary")).jumpGateCooldown).toBeCloseTo(0.225);
    expect(gateCooldownMs(3, withRelic("cle_seuil", "epic"))! / H).toBeCloseTo(20.4);
    applyGameContent({ rules: { jumpGate: { cooldownHours: 7 } } } as never);
    expect(gateCooldownMs(3, withRelic("cle_seuil", "legendary"))! / H).toBe(6);
  });

  it("préréglages et rapport d'impact : les deux grandeurs ont leur source, sans dépasser le plafond", () => {
    expect(findEffectPreset("phalange_portee")?.effect.stat).toBe("phalanxRange");
    expect(findEffectPreset("porte_recharge")?.effect.stat).toBe("jumpGateCooldown");
    const rows = effectImpactReport();
    for (const stat of ["phalanxRange", "jumpGateCooldown"]) {
      const row = rows.find((r) => r.layer === "empire" && r.stat === stat);
      expect(row?.sources.some((s) => s.kind === "relic"), stat).toBe(true);
      expect(row?.capped, stat).toBe(false);
    }
  });
});

describe("succès, titre, Codex et défi d'alliance (maillons 6 à 9)", () => {
  it("cinq succès lus sur les compteurs du serveur ; « Maître du seuil » décerne « Gardien du seuil »", () => {
    const ids = ["phalange_1", "phalange_50", "porte_1", "porte_25", "porte_sauvetage"];
    expect(ACHIEVEMENTS.filter((a) => ids.includes(a.id)).map((a) => [a.id, a.metric, a.threshold])).toEqual([
      ["phalange_1", "phalanxScans", 1],
      ["phalange_50", "phalanxScans", 50],
      ["porte_1", "gateJumps", 1],
      ["porte_25", "gateJumps", 25],
      ["porte_sauvetage", "gateSaves", 1],
    ]);
    expect(ACHIEVEMENTS.find((a) => a.id === "porte_sauvetage")?.secret).toBe(true);
    expect(findTitle(ACHIEVEMENTS.find((a) => a.id === "porte_25")!.titleId!)?.label).toBe("Gardien du seuil");
    const p = player("s", { stats: { phalanxScans: 3, gateJumps: 2, gateSaves: 1, garrisons: 4 } as never });
    expect(["phalanxScans", "gateJumps", "gateSaves", "vigil"].map((metric) => achievementValue({ metric } as never, p))).toEqual([3, 2, 1, 7]);
  });

  it("Codex : la phalange et la porte se débloquent au premier usage", () => {
    const entry = (p: PlayerState, id: string) => codexEntries(p, new Set(), NOW).find((e) => e.id === id);
    const fresh = player("c");
    expect(entry(fresh, "legend:phalange")?.unlocked).toBe(false);
    expect(entry(fresh, "legend:porte_saut")?.unlocked).toBe(false);
    const used = player("c", { stats: { phalanxScans: 1, gateJumps: 1 } as never });
    expect(entry(used, "legend:phalange")?.unlocked).toBe(true);
    expect(entry(used, "legend:porte_saut")?.facts?.some((f) => f.label === "Tes sauts")).toBe(true);
  });

  it("défi d'alliance « Les vigies » : garnisons et balayages (Q40 : jouable sans lune)", () => {
    expect(ALLIANCE_CHALLENGES.find((c) => c.id === "vigies")?.metric).toBe("vigil");
  });
});

describe("pitié, santé de l'équilibre, guide et frise (maillons 11 et 12)", () => {
  it("une lune née grâce à la réserve est marquée byPity ; une lune due aux débris ne l'est pas", () => {
    // 2 M de débris : 20 % ; réserve 30 % : chance 50 %.
    const roll = (r: number) => rollMoon({ moonPity: 0.3 }, 2_000_000, { now: NOW, onColony: false, rand: () => r });
    expect(roll(0.1)?.byPity).toBeUndefined();
    expect(roll(0.4)?.byPity).toBe(true);
    expect(roll(0.6)).toBeNull();
  });

  it("santé : part des actifs avec lune, nées par pitié, réserves, balayages, sauts et sauvetages", () => {
    const h = moonHealth([
      player("a", { moon: moon(3, { byPity: true }), stats: { phalanxScans: 4, gateJumps: 2, gateSaves: 1 } as never }),
      player("b", { moon: moon(1), stats: { phalanxScans: 1 } as never }),
      player("c", { moonPity: 0.25 }),
      player("d"),
    ]);
    expect(h).toEqual({ players: 2, sharePct: 50, medianLevel: 2, byPity: 1, pityPending: 1, scans: 5, scanners: 2, jumps: 2, jumpers: 1, saves: 1 });
  });

  it("guide avancé : « Ta lune veille » en dernier, faisable sans lune (garnison ou réserve de pitié)", () => {
    const step = GUIDE_STEPS[GUIDE_STEPS.length - 1];
    expect(step.id).toBe("moonWatch");
    expect(step.done(player("g"))).toBe(false);
    expect(step.done(player("g", { stats: { garrisons: 1 } as never }))).toBe(true);
    expect(step.done(player("g", { moonPity: 0.05 }))).toBe(true);
    expect(step.done(player("g", { moon: moon(1) }))).toBe(true);
  });

  it("frise « Prochaines fins » : recharges du balayage et de la porte tant qu'elles courent", () => {
    const p = player("t", { moon: moon(3, { scanReadyAtMs: NOW + 20 * 60_000, gateReadyAtMs: NOW + 5 * H }) });
    const events = upcomingEvents(null, NOW, [], "t", p).filter((e) => e.kind === "moon");
    expect(events.map((e) => [e.id, e.endTime - NOW])).toEqual([
      ["moon:scan", 20 * 60_000],
      ["moon:gate", 5 * H],
    ]);
    const ready = player("t", { moon: moon(3, { scanReadyAtMs: NOW - 1 }) });
    expect(upcomingEvents(null, NOW, [], "t", ready).filter((e) => e.kind === "moon")).toEqual([]);
  });
});
