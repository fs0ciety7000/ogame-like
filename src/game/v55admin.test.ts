import { beforeEach, describe, expect, it } from "vitest";
import { applyGameContent } from "@/game/content";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { flushState } from "@/game/flush";
import { assignCommanders } from "@/game/commanders";
import { clearOfficerCooldowns, finishAllTimers, grantResources } from "@/game/adminTools";
import { playerBuildTimeFactor, playerResearchTimeFactor } from "@/game/bonuses";
import type { PlayerState } from "@/types/game";

const NOW = Date.UTC(2026, 9, 3, 12);
const player = (): PlayerState => ({ ...defaultPlayerState("t", "Testeur"), createdAt: NOW }) as PlayerState;

beforeEach(() => applyGameContent({}));

describe("v5.5 compte test et outils admin", () => {
  it("tout terminer : le flush suivant achève bâtiments, recherches, unités et missions", () => {
    const p = player();
    const q = defaultQueues();
    const level = p.buildings.extracteur_ferraille?.level ?? 1;
    q.buildingUpgrades.extracteur_ferraille = { endTime: NOW + 3_600_000 };
    q.unitQueues.attack = [{ unitId: "drone_recuperateur", endTime: NOW + 60_000 }, { unitId: "drone_recuperateur", endTime: null }];
    q.activeMissions = [{ key: "m1", endTime: NOW + 90_000 }];
    expect(finishAllTimers(q, NOW)).toEqual({ buildings: 1, researches: 0, units: 2, missions: 1 });
    const out = flushState(p, q, NOW);
    expect(out.player.buildings.extracteur_ferraille.level).toBe(level + 1);
    expect(out.queues.unitQueues.attack).toHaveLength(0);
    expect(out.player.units.drone_recuperateur?.count ?? 0).toBeGreaterThanOrEqual(2);
  });

  it("un compte test construit et recherche instantanément, et le flush termine tout", () => {
    const p = { ...player(), testMode: true };
    expect(playerBuildTimeFactor(p, NOW)).toBe(0);
    expect(playerResearchTimeFactor(p, NOW)).toBe(0);
    const q = defaultQueues();
    q.buildingUpgrades.extracteur_ferraille = { endTime: NOW + 86_400_000 };
    expect(Object.keys(flushState(p, q, NOW).queues.buildingUpgrades)).toHaveLength(0);
    expect(playerBuildTimeFactor(player(), NOW)).toBeGreaterThan(0);
  });

  it("aucun délai d'officier sur un compte test ; levée des délais sinon", () => {
    const p = player();
    p.commanders = { roster: { steward: { xp: 0 }, admiral: { xp: 0 } }, active: ["steward"], movedAtMs: { steward: NOW - 3_600_000 }, dossiers: 0 };
    expect(() => assignCommanders(p, ["admiral"], NOW)).toThrow(/réessaie/);
    expect(clearOfficerCooldowns(p)).toBe(1);
    expect(() => assignCommanders(p, ["admiral"], NOW)).not.toThrow();
    const t = { ...player(), testMode: true };
    t.commanders = { roster: { steward: { xp: 0 }, admiral: { xp: 0 } }, active: ["steward"], movedAtMs: { steward: NOW - 1000 }, dossiers: 0 };
    expect(() => assignCommanders(t, ["admiral"], NOW)).not.toThrow();
  });

  it("rendre des ressources : montants positifs et ressources connues seulement", () => {
    const p = player();
    const before = p.resources.scrap ?? 0;
    expect(grantResources(p, { scrap: 500, energy: -20, inconnue: 9 })).toEqual({ scrap: 500 });
    expect(p.resources.scrap).toBe(before + 500);
  });
});
