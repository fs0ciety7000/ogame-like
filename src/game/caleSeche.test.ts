import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { DOCK_TIERS, getRepairPercent, getUnitCapacity, unlockBlocker, findBuilding } from "@/game/buildings";
import { commissionDocked, hangarLoad, playerUnitCapacity } from "@/game/hangar";
import { advanceWorkshop, dockAllocation, dockReady, dockScrap, rushWorkshop, sendToWorkshop, setDockSettings, workshopHangarUnits, workshopRate, workshopUnits } from "@/game/workshop";
import { ascend } from "@/game/ascension";
import { performPlayerAction } from "@/game/actions";
import { colonyDefenseHangar } from "@/game/colonies";
import { COMBAT_RULES } from "@/game/combat";
import type { PlayerState, Units } from "@/types/game";

/* 5.27.2 et 5.28 : hangars (invariants I2 à I5) et Cale sèche (docs/proposals/cale-seche.md). */

const NOW = Date.UTC(2026, 9, 6, 12);
const HOUR = 3600_000;

function player(dock = 0, opts: { atelier?: number; hangar?: number; chasseurs?: number } = {}): PlayerState {
  const p = defaultPlayerState("u1", "Testeur") as PlayerState;
  p.units = { chasseur: { level: 1, count: opts.chasseurs ?? 1000 } } as Units;
  p.buildings = {
    ...p.buildings,
    atelier_reparation: { level: opts.atelier ?? 10, unlocked: true },
    hangar_attaque: { level: opts.hangar ?? 1, unlocked: true },
    cale_seche: { level: Math.max(1, dock), unlocked: dock > 0 },
  };
  p.resources = { ...p.resources, scrap: 0, energy: 0 };
  return p;
}

/** Total des unités d'un type, où qu'elles soient (base, en vol, Atelier, prêts). */
const total = (p: PlayerState, away: Record<string, number> = {}) => (p.units.chasseur?.count ?? 0) + (away.chasseur ?? 0) + (workshopUnits(p).chasseur ?? 0) + (dockReady(p).chasseur ?? 0);

describe("5.27.2 hangars : calcul unique et surcharge", () => {
  it("hangarLoad additionne base, vol, Atelier et file ; la surcharge est signalée, rien n'est détruit", () => {
    const p = player(0, { chasseurs: 1500 });
    const q = defaultQueues();
    q.unitQueues.attack.push({ unitId: "chasseur", endTime: null });
    const load = hangarLoad(p, q, { chasseur: 100 }, "attack", NOW);
    expect(load.capacity).toBe(2000);
    expect(load.home).toBe(3000);
    expect(load.away).toBe(200);
    expect(load.queue).toBe(2);
    expect(load.used).toBe(3202);
    expect(load.overflow).toBe(1202);
    expect(load.free).toBe(0);
    expect(p.units.chasseur.count).toBe(1500);
  });

  it("la construction est refusée en surcharge, avec les sorties dans le message", () => {
    const p = player(0, { chasseurs: 1500 });
    expect(() => performPlayerAction(p, defaultQueues(), { type: "buildUnits", unitId: "chasseur", qty: 1 }, NOW)).toThrow(/surcharge/);
  });

  it("C5 : la tech « Extension des hangars » s'applique aussi au hangar de défense des colonies", () => {
    const p = player(0);
    p.techLevels = { ...p.techLevels, tech26: 10 };
    const colony = { buildings: { hangar_defense: { level: 2, unlocked: true } }, defenses: {} } as unknown as Parameters<typeof colonyDefenseHangar>[0];
    expect(colonyDefenseHangar(colony).capacity).toBe(4000);
    expect(colonyDefenseHangar(colony, p).capacity).toBe(6000);
  });

  it("C4 : la capacité lit le circuit d'effets (la tech donne le même résultat qu'avant)", () => {
    const p = player(0, { hangar: 4 });
    p.techLevels = { ...p.techLevels, tech26: 3 };
    expect(playerUnitCapacity(p, "attack", NOW)).toBe(getUnitCapacity(p.buildings, "attack", p.techLevels));
  });

  it("I4 : l'Ascension garde les hangars et la Cale sèche", () => {
    const p = player(6, { hangar: 20 });
    for (const id of Object.keys(p.buildings)) p.buildings[id] = { level: findBuilding(id)?.maxLevel ?? 20, unlocked: true };
    p.buildings.cale_seche = { level: 6, unlocked: true };
    const before = playerUnitCapacity(p, "attack", NOW);
    ascend(p, defaultQueues(), NOW);
    expect(playerUnitCapacity(p, "attack", NOW)).toBe(before);
    expect(p.buildings.cale_seche.level).toBe(6);
  });

  it("I5 : la capacité des hangars ne se calcule nulle part ailleurs que dans hangar.ts", () => {
    const allowed = new Set(["src/game/buildings.ts", "src/game/hangar.ts", "src/game/colonies.ts"]);
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) walk(path);
        else if (/\.(ts|tsx)$/.test(name) && !/\.test\./.test(name) && !allowed.has(path) && /getUnitCapacity\(/.test(readFileSync(path, "utf8"))) offenders.push(path);
      }
    };
    walk("src");
    expect(offenders).toEqual([]);
  });
});

describe("5.28 Cale sèche", () => {
  it("se débloque après l'Atelier niveau 5", () => {
    const def = findBuilding("cale_seche")!;
    expect(unlockBlocker(def, player(0, { atelier: 4 }).buildings)).toMatch(/Atelier de réparation niveau 5/);
    expect(unlockBlocker(def, player(0, { atelier: 5 }).buildings)).toBeNull();
    expect(() => performPlayerAction(player(0, { atelier: 4 }), defaultQueues(), { type: "unlockBuilding", buildingId: "cale_seche" }, NOW)).toThrow(/Atelier/);
  });

  it("sans Cale sèche, rien ne change : les sauvés gardent leur place au hangar", () => {
    const p = player(0);
    const before = hangarLoad(p, null, {}, "attack", NOW).occupied;
    sendToWorkshop(p, { chasseur: 300 }, NOW, "defense", true);
    expect(hangarLoad(p, null, {}, "attack", NOW).occupied).toBe(before);
  });

  it("avec Cale sèche, les sauvés occupent des postes et libèrent le hangar (le surplus reste au hangar)", () => {
    const p = player(1); // 1 000 postes = 500 chasseurs
    sendToWorkshop(p, { chasseur: 800 }, NOW, "defense", true);
    const load = hangarLoad(p, null, {}, "attack", NOW);
    expect(load.home).toBe(400);
    expect(load.workshop).toBe(600); // 300 chasseurs hors cale
    expect(load.dockUsed).toBe(1000);
    expect(dockAllocation(p, NOW).used).toBe(1000);
  });

  it("un lot réparé en cale attend « prêt » ; la remise en service suit les places libres (flottes en vol comprises)", () => {
    const p = player(1);
    sendToWorkshop(p, { chasseur: 800 }, NOW, "defense", true);
    // Le hangar se remplit pendant la réparation.
    p.units.chasseur.count = 1000;
    const all = total(p);
    advanceWorkshop(p, NOW + 48 * HOUR);
    expect(workshopUnits(p)).toEqual({});
    expect(dockReady(p)).toEqual({ chasseur: 500 });
    expect(p.units.chasseur.count).toBe(1300); // les 300 hors cale avaient leur place
    expect(total(p)).toBe(all);
    // Hangar 2 000 places : 1 300 chasseurs = 2 600, plein.
    expect(commissionDocked(p, null, {}, NOW)).toEqual({});
    p.buildings.hangar_attaque.level = 2; // 4 000 places
    // 4 000 places − 2 600 à quai − 400 en vol = 1 000 places : les 500 prêts rentrent.
    expect(commissionDocked(p, null, { chasseur: 200 }, NOW)).toEqual({ chasseur: 500 });
    expect(total(p, { chasseur: 200 })).toBe(all + 200);
    expect(hangarLoad(p, null, { chasseur: 200 }, "attack", NOW).overflow).toBe(0);
  });

  it("terminer à l'Ambre suit la même règle (la part en cale devient prête)", () => {
    const p = player(1);
    p.bounties = { ...(p.bounties ?? {}), amber: 1000 } as PlayerState["bounties"];
    sendToWorkshop(p, { chasseur: 800 }, NOW, "defense", true);
    const out = rushWorkshop(p, undefined, NOW, (pl) => pl.bounties as { amber: number }, (pl, w) => (pl.bounties = w as PlayerState["bounties"]));
    expect(out.units).toEqual({ chasseur: 300 });
    expect(out.ready).toEqual({ chasseur: 500 });
  });

  it("remise en service automatique au palier 10, seulement quand le serveur a lu les flottes en vol", () => {
    const base = player(DOCK_TIERS.auto, { hangar: 3 });
    base.workshop = { updatedAtMs: NOW, jobs: [], hull: {}, ready: { chasseur: 100 } };
    const blind = performPlayerAction(structuredClone(base), defaultQueues(), { type: "sync" }, NOW);
    expect(dockReady(blind.player)).toEqual({ chasseur: 100 });
    const known = performPlayerAction(structuredClone(base), defaultQueues(), { type: "sync" }, NOW, {}, true);
    expect(dockReady(known.player)).toEqual({});
    expect(known.player.units.chasseur.count).toBe(1100);
    expect(known.notifications.some((n) => n.title === "Cale sèche : remise en service")).toBe(true);
  });

  it("palier 10 : l'Atelier répare plus vite", () => {
    expect(workshopRate(player(DOCK_TIERS.auto)) / workshopRate(player(DOCK_TIERS.auto - 1))).toBeCloseTo(1 + COMBAT_RULES.dockAutoSpeedBonus);
  });

  it("Triage (palier 5) : démanteler rend 60 % du prix et libère la place", () => {
    const low = player(DOCK_TIERS.triage - 1);
    sendToWorkshop(low, { chasseur: 10 }, NOW, "defense", true);
    expect(() => dockScrap(low, "chasseur", 5, NOW)).toThrow(/niveau 5/);
    const p = player(DOCK_TIERS.triage);
    sendToWorkshop(p, { chasseur: 10 }, NOW, "defense", true);
    const out = dockScrap(p, "chasseur", 4, NOW);
    expect(out.count).toBe(4);
    expect(out.refund).toEqual({ scrap: 900 * 4, energy: 480 * 4 });
    expect(p.resources.scrap).toBe(3600);
    expect(workshopUnits(p)).toEqual({ chasseur: 6 });
    expect(p.stats?.unitsDismantled).toBe(4);
  });

  it("Triage : « démanteler ce qui ne tient pas » et « tout démanteler »", () => {
    const p = player(DOCK_TIERS.triage); // 5 000 postes = 2 500 chasseurs
    p.units.chasseur.count = 4000;
    setDockSettings(p, { policy: "scrapOverflow" });
    sendToWorkshop(p, { chasseur: 3000 }, NOW, "defense", true);
    expect(workshopUnits(p)).toEqual({ chasseur: 2500 });
    expect(workshopHangarUnits(p, NOW)).toEqual({});
    expect(p.workshop?.lastScrap?.units).toEqual({ chasseur: 500 });
    expect(p.stats?.dockFull).toBe(1);
    setDockSettings(p, { policy: "scrapAll" });
    sendToWorkshop(p, { chasseur: 100 }, NOW, "defense", true);
    expect(workshopUnits(p)).toEqual({ chasseur: 2500 });
    expect(p.units.chasseur.count).toBe(900);
    expect(() => setDockSettings(player(DOCK_TIERS.triage - 1), { policy: "scrapAll" })).toThrow();
  });

  it("Priorités (palier 15) : la classe choisie passe d'abord", () => {
    const p = player(DOCK_TIERS.priority);
    p.units = { ...p.units, etoile_noire: { level: 1, count: 2 } } as Units;
    sendToWorkshop(p, { chasseur: 5 }, NOW, "defense", true);
    sendToWorkshop(p, { etoile_noire: 1 }, NOW + 1, "defense", true);
    setDockSettings(p, { priority: "heavy" });
    advanceWorkshop(p, NOW + 2);
    expect(p.workshop?.jobs[0].unitId).toBe("etoile_noire");
    expect(() => setDockSettings(player(DOCK_TIERS.priority - 1), { priority: "heavy" })).toThrow();
  });

  it("Cale orbitale (palier 20) : +5 points de vaisseaux sauvés", () => {
    expect(getRepairPercent(player(DOCK_TIERS.orbital).buildings) - getRepairPercent(player(DOCK_TIERS.orbital - 1).buildings)).toBeCloseTo(0.05);
  });

  it("I3 : aucune unité créée ni perdue en route (envoi, réparation, prêt, remise en service)", () => {
    const p = player(2, { hangar: 2 });
    const start = total(p);
    sendToWorkshop(p, { chasseur: 600 }, NOW, "defense", true);
    expect(total(p)).toBe(start);
    advanceWorkshop(p, NOW + HOUR);
    expect(total(p)).toBe(start);
    advanceWorkshop(p, NOW + 100 * HOUR);
    expect(total(p)).toBe(start);
    commissionDocked(p, null, {}, NOW);
    expect(total(p)).toBe(start);
    expect(hangarLoad(p, null, {}, "attack", NOW).overflow).toBe(0);
  });
});
