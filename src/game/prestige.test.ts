import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { performPlayerAction } from "@/game/actions";
import { ACHIEVEMENTS, DEFAULT_ACHIEVEMENTS, setAchievements } from "@/game/achievements";
import { ascend } from "@/game/ascension";
import { BUILDINGS } from "@/game/buildings";
import { codexEntries } from "@/game/codex";
import { applyGameContent, defaultGameContent } from "@/game/content";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { flushState } from "@/game/flush";
import { playerModifiers } from "@/game/modifiers";
import { navOpenPages, navSignals } from "@/game/navUnlock";
import { getProductionRatesPerSecond } from "@/game/production";
import { nextActions } from "@/game/nextActions";
import { upcomingEvents } from "@/game/timeline";
import {
  advancePrestige,
  nextPrestigeMonument,
  PRESTIGE_EXTRACTORS,
  PRESTIGE_RULES,
  prestigeBlocker,
  prestigeCost,
  prestigeMonument,
  prestigeState,
  prestigeUnlocked,
} from "@/game/prestige";
import type { PlayerState } from "@/types/game";

/* 6.14.85 (RL-2, proposals/rythme-long-terme.md §5.2) : projets de prestige, invariant I32. */

const NOW = 1_800_000_000_000;
const H = 3_600_000;
const RICH = { scrap: 1e12, energy: 1e12, nano: 1e12, data: 1e12, reinforcedSteel: 0, cyberModule: 0, syntheticNanites: 0, aiFragment: 0 };

function player(level = 10, patch: Partial<PlayerState> = {}): PlayerState {
  const p = { ...defaultPlayerState("u1", "U1"), createdAtMs: NOW - 30 * 864e5, resourcesUpdatedAtMs: NOW, xp: 5000 } as PlayerState;
  for (const id of PRESTIGE_EXTRACTORS) p.buildings[id] = { ...p.buildings[id], unlocked: true, level };
  p.resources = { ...p.resources, ...RICH };
  return { ...p, ...patch };
}
const start = (p: PlayerState, at = NOW) => performPlayerAction(p, defaultQueues(), { type: "prestigeStart" }, at);

beforeEach(() => setAchievements(structuredClone(DEFAULT_ACHIEVEMENTS)));
afterEach(() => applyGameContent({}));

describe("6.14.85 projets de prestige (I32)", () => {
  it("ouverts quand les 4 extracteurs atteignent le niveau réglé", () => {
    expect(prestigeUnlocked(player(9))).toBe(false);
    expect(prestigeBlocker(player(9))).toMatch(/niveau 10/);
    expect(prestigeUnlocked(player(10))).toBe(true);
    const p = player(10);
    p.buildings.archives_fracturees = { ...p.buildings.archives_fracturees, level: 9 };
    expect(prestigeUnlocked(p)).toBe(false);
    applyGameContent({ rules: { prestige: { unlockExtractorLevel: 5 } } as never });
    expect(prestigeUnlocked(player(5))).toBe(true);
    // Réglage partiel : le reste du groupe garde ses valeurs.
    expect(PRESTIGE_RULES.hoursPerProject).toBe(8);
    expect(() => start(player(4))).toThrow(/niveau 5/);
  });

  it("coût = exactement hoursPerProject heures de la production commune du moment, ressource par ressource", () => {
    const p = player(12);
    const rates = getProductionRatesPerSecond(p.buildings, p.techLevels);
    const cost = prestigeCost(p);
    for (const res of ["scrap", "energy", "nano", "data"] as const) expect(cost[res]).toBe(Math.floor((rates[res] ?? 0) * 8 * 3600));
    expect(cost.reinforcedSteel).toBeUndefined();
    const out = start(p);
    for (const res of ["scrap", "energy", "nano", "data"] as const) expect(out.player.resources[res]).toBe(RICH[res] - (cost[res] ?? 0));
    // Payé comme une dépense (objectif « Dépenser », statistique).
    expect(out.player.stats?.spent ?? 0).toBeGreaterThan(0);
    // Croissance réglable : 2 projets achevés, ×1,5 → 8 × 2,25 = 18 h.
    applyGameContent({ rules: { prestige: { growth: 1.5 } } as never });
    const q = player(12, { prestige: { projects: 2, points: 16, active: null, lastDoneAtMs: 0 } });
    expect(prestigeCost(q).scrap).toBe(Math.floor((rates.scrap ?? 0) * 18 * 3600));
  });

  it("un seul projet à la fois ; durée réglée ; refusé si les ressources manquent ou si les projets sont fermés", () => {
    const out = start(player());
    const st = prestigeState(out.player);
    expect(st.active).toMatchObject({ startedAtMs: NOW, endsAtMs: NOW + 8 * H });
    expect(() => performPlayerAction(out.player, out.queues, { type: "prestigeStart" }, NOW + H)).toThrow(/un seul à la fois/);
    const poor = player(10);
    poor.resources = { ...poor.resources, scrap: 0, energy: 0, nano: 0, data: 0 };
    poor.resourcesUpdatedAtMs = NOW;
    expect(() => start(poor)).toThrow(/insuffisantes/);
    applyGameContent({ rules: { prestige: { enabled: false } } as never });
    expect(() => start(player())).toThrow(/fermés/);
  });

  it("fin du projet au rattrapage : compteur, points, notification au Journal ; puis un nouveau projet", () => {
    const out = start(player());
    const early = flushState(out.player, out.queues, NOW + 8 * H - 1000);
    expect(prestigeState(early.player).projects).toBe(0);
    const done = flushState(out.player, out.queues, NOW + 8 * H);
    const st = prestigeState(done.player);
    expect(st).toMatchObject({ projects: 1, points: 8, active: null, lastDoneAtMs: NOW + 8 * H });
    const note = done.notifications.find((n) => n.title === "Projet de prestige achevé");
    expect(note?.link).toBe("/game/prestige");
    expect(note?.message).toMatch(/Stèle/);
    // Succès d'entrée débloqué par la même rattrapage.
    expect(done.player.unlockedAchievements).toContain("prestige_1");
    expect(() => performPlayerAction(done.player, done.queues, { type: "prestigeStart" }, NOW + 8 * H + 1000)).not.toThrow();
  });

  it("récompense visible seulement : aucun bonus de combat ni de production (couche empire inchangée)", () => {
    const plain = player(15);
    const famous = player(15, { prestige: { projects: 5000, points: 40000, active: null, lastDoneAtMs: NOW - H } });
    expect(playerModifiers(famous, NOW)).toEqual(playerModifiers(plain, NOW));
    expect(getProductionRatesPerSecond(famous.buildings, famous.techLevels)).toEqual(getProductionRatesPerSecond(plain.buildings, plain.techLevels));
    // Le moteur ne lit pas `prestige` ailleurs que dans les modules de la chaîne (affichage, succès, Codex, menu, frise).
    const readers = ["modifiers.ts", "effects.ts", "effectTargets.ts", "combat.ts", "economy.ts", "production.ts", "bonuses.ts"];
    for (const f of readers) expect(readFileSync(`src/game/${f}`, "utf8"), f).not.toMatch(/prestige/i);
  });

  it("l'Ascension garde le compteur, les points et le projet en cours", () => {
    const p = player(20, { prestige: { projects: 3, points: 24, active: { startedAtMs: NOW, endsAtMs: NOW + 8 * H, paid: {} }, lastDoneAtMs: 0 } });
    for (const b of BUILDINGS) p.buildings[b.id] = { ...(p.buildings[b.id] ?? {}), unlocked: true, level: b.maxLevel };
    ascend(p, defaultQueues(), NOW);
    expect(p.ascensions).toBe(1);
    expect(prestigeState(p)).toMatchObject({ projects: 3, points: 24 });
    expect(prestigeState(p).active?.endsAtMs).toBe(NOW + 8 * H);
  });

  it("monuments : le plus haut atteint, puis le suivant ; réglables", () => {
    expect(prestigeMonument(0)).toBeNull();
    expect(prestigeMonument(1)?.name).toBe("Stèle");
    expect(prestigeMonument(99)?.name).toBe("Arche");
    expect(nextPrestigeMonument(99)?.projects).toBe(100);
    expect(nextPrestigeMonument(5000)).toBeNull();
    applyGameContent({ rules: { prestige: { monuments: [{ projects: 3, name: "Cairn" }] } } as never });
    expect(prestigeMonument(2)).toBeNull();
    expect(prestigeMonument(3)?.name).toBe("Cairn");
  });

  it("chaîne : page ouverte par la condition, succès, Codex, frise, sortie « Entrepôt plein »", () => {
    const ctx = { now: NOW };
    const fresh = { ...player(9), createdAtMs: NOW, xp: 0 } as PlayerState;
    expect(navSignals(fresh, ctx).has("prestigeReady")).toBe(false);
    expect(navOpenPages(fresh, ctx).has("/game/prestige")).toBe(false);
    const ready = { ...player(10), createdAtMs: NOW, xp: 0 } as PlayerState;
    expect(navOpenPages(ready, ctx).has("/game/prestige")).toBe(true);

    const ids = ACHIEVEMENTS.filter((a) => a.metric === "prestigeProjects").map((a) => a.threshold);
    expect(ids).toEqual([1, 10, 100, 1000]);
    const entry = codexEntries({ ...player(), prestige: { projects: 12, points: 96, active: null, lastDoneAtMs: 0 } }, new Set(), NOW).find((e) => e.id === "legend:prestige");
    expect(entry?.unlocked).toBe(true);
    expect(entry?.facts?.find((f) => f.label === "Ton monument")?.value).toBe("Obélisque");

    const running = start(player()).player;
    expect(upcomingEvents(null, NOW, [], "u1", running).find((e) => e.kind === "prestige")?.endTime).toBe(NOW + 8 * H);

    // Entrepôt plein : la carte propose un projet quand il est possible.
    const full = player(10);
    const storage = nextActions(full, defaultQueues(), [], NOW).find((a) => a.kind === "storage");
    if (storage) expect(storage.to).toBe("/game/prestige");
    const pAdvance = player(10, { prestige: { projects: 0, points: 0, active: { startedAtMs: NOW - 9 * H, endsAtMs: NOW - H, paid: {} }, lastDoneAtMs: 0 } });
    expect(advancePrestige(pAdvance, NOW)).toHaveLength(1);
  });

  it("réglages : groupe `prestige` dans GameRules (JSON pur) et éditeur dédié de chaque champ", () => {
    expect(defaultGameContent().rules.prestige).toEqual(PRESTIGE_RULES);
    const fields = readFileSync("src/pages/admin/RhythmRulesFields.tsx", "utf8");
    for (const key of Object.keys(PRESTIGE_RULES)) expect(fields, key).toMatch(new RegExp(`setPrestige\\(\\{ ${key}:`));
  });

  it("serveur : l'action passe par performPlayerAction (transaction de /api/cosmic/action, I24) ; fiche publique synchronisée", () => {
    const route = readFileSync("pocketbase/pb_hooks/cosmic.pb.js", "utf8");
    expect(route).toMatch(/game\.performPlayerAction\(/);
    const db = readFileSync("pocketbase/pb_hooks/cosmic_db.js", "utf8");
    expect(db).toMatch(/profile\.set\("prestigePoints", prestigePoints\)/);
    const schema = readFileSync("pocketbase/pb_schema.json", "utf8");
    expect(schema).toMatch(/"name": "prestigePoints"/);
    expect(schema).toMatch(/"name": "prestige",/);
  });
});
