import { describe, expect, it } from "vitest";
import { flushState } from "@/game/flush";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { getUnitBuildTime, findUnit } from "@/game/units";
import type { PlayerState, QueuesState } from "@/types/game";

const NOW = 1_700_000_000_000;

function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return { ...defaultPlayerState("u1", "Testeur"), resourcesUpdatedAtMs: NOW, ...overrides };
}

function makeQueues(overrides: Partial<QueuesState> = {}): QueuesState {
  return { ...defaultQueues(), ...overrides };
}

describe("flushState — production", () => {
  it("credits accumulated production and advances the timestamp", () => {
    const player = makePlayer({ resourcesUpdatedAtMs: NOW - 10_000 }); // 10s d'écart
    const { player: after } = flushState(player, makeQueues(), NOW);

    expect(after.resources.scrap).toBe(player.resources.scrap + 2 * 10); // extracteur niv.1 = 2/s
    expect(after.resourcesUpdatedAtMs).toBe(NOW);
  });

  it("catches up production after a long offline period", () => {
    const player = makePlayer({ resourcesUpdatedAtMs: NOW - 6 * 3600_000 }); // 6h hors-ligne
    const { player: after } = flushState(player, makeQueues(), NOW);
    expect(after.resources.scrap).toBe(player.resources.scrap + 2 * 6 * 3600);
  });
});

describe("flushState — building upgrades", () => {
  it("leaves an upgrade untouched before its end time", () => {
    const player = makePlayer();
    const queues = makeQueues({ buildingUpgrades: { extracteur_ferraille: { endTime: NOW + 5000 } } });
    const { player: after, queues: afterQueues } = flushState(player, queues, NOW);

    expect(after.buildings.extracteur_ferraille.level).toBe(1);
    expect(afterQueues.buildingUpgrades.extracteur_ferraille).toBeDefined();
  });

  it("completes an upgrade once its end time has passed, and notifies", () => {
    const player = makePlayer();
    const queues = makeQueues({ buildingUpgrades: { extracteur_ferraille: { endTime: NOW - 1000 } } });
    const { player: after, queues: afterQueues, notifications } = flushState(player, queues, NOW);

    expect(after.buildings.extracteur_ferraille.level).toBe(2);
    expect(afterQueues.buildingUpgrades.extracteur_ferraille).toBeUndefined();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].kind).toBe("building");
  });
});

describe("flushState — unit production queue", () => {
  it("starts the timer for a freshly-queued unit without completing it", () => {
    const player = makePlayer({ units: { chasseur: { level: 1, count: 0 } } });
    const queues = makeQueues({ unitQueues: { attack: [{ unitId: "chasseur", endTime: null }], defense: [] } });
    const { player: after, queues: afterQueues } = flushState(player, queues, NOW);

    expect(after.units.chasseur.count).toBe(0);
    expect(afterQueues.unitQueues.attack[0].endTime).toBe(NOW + getUnitBuildTime(findUnit("chasseur")!) * 1000);
  });

  it("completes a unit once its end time has passed", () => {
    const player = makePlayer({ units: { chasseur: { level: 1, count: 2 } } });
    const queues = makeQueues({ unitQueues: { attack: [{ unitId: "chasseur", endTime: NOW - 1000 }], defense: [] } });
    const { player: after, queues: afterQueues } = flushState(player, queues, NOW);

    expect(after.units.chasseur.count).toBe(3);
    expect(afterQueues.unitQueues.attack).toHaveLength(0);
  });

  it("chains through several overdue units in one catch-up flush (offline production queue)", () => {
    const buildTimeMs = getUnitBuildTime(findUnit("chasseur")!) * 1000;
    const player = makePlayer({ units: { chasseur: { level: 1, count: 0 } } });
    // Le premier était programmé il y a largement plus que 3x son temps de
    // construction : les 3 unités en file doivent toutes sortir d'affilée.
    const queues = makeQueues({
      unitQueues: {
        attack: [
          { unitId: "chasseur", endTime: NOW - 3 * buildTimeMs },
          { unitId: "chasseur", endTime: null },
          { unitId: "chasseur", endTime: null },
        ],
        defense: [],
      },
    });

    const { player: after, queues: afterQueues } = flushState(player, queues, NOW);

    expect(after.units.chasseur.count).toBe(3);
    expect(afterQueues.unitQueues.attack).toHaveLength(0);
  });

  it("stops the catch-up chain once it reaches units not yet due", () => {
    const buildTimeMs = getUnitBuildTime(findUnit("chasseur")!) * 1000;
    const player = makePlayer({ units: { chasseur: { level: 1, count: 0 } } });
    // La première était en retard, mais pas assez pour que la seconde (qui
    // démarre juste après) soit elle aussi déjà due.
    const firstEndTime = NOW - buildTimeMs + 1000;
    const queues = makeQueues({
      unitQueues: {
        attack: [
          { unitId: "chasseur", endTime: firstEndTime },
          { unitId: "chasseur", endTime: null },
        ],
        defense: [],
      },
    });

    const { player: after, queues: afterQueues } = flushState(player, queues, NOW);

    expect(after.units.chasseur.count).toBe(1);
    expect(afterQueues.unitQueues.attack).toHaveLength(1);
    expect(afterQueues.unitQueues.attack[0].endTime).toBe(firstEndTime + buildTimeMs);
  });
});

describe("flushState — research", () => {
  it("keeps an unfinished research active", () => {
    const player = makePlayer();
    const queues = makeQueues({ activeResearches: [{ id: "tech3", endTime: NOW + 5000 }] });
    const { player: after, queues: afterQueues } = flushState(player, queues, NOW);

    expect(after.techLevels.tech3).toBeUndefined();
    expect(afterQueues.activeResearches).toHaveLength(1);
  });

  it("completes research, bumps the level, and applies its effect", () => {
    const player = makePlayer();
    const queues = makeQueues({ activeResearches: [{ id: "tech3", endTime: NOW - 1000 }] });
    const { player: after, queues: afterQueues, notifications } = flushState(player, queues, NOW);

    expect(after.techLevels.tech3).toBe(1);
    expect(after.bonuses.energyEfficiency).toBeCloseTo(0.1); // effet de tech3
    expect(afterQueues.activeResearches).toHaveLength(0);
    expect(notifications.some((n) => n.kind === "research")).toBe(true);
  });

  it("unlocks the corresponding unit for a unit-tech (unlock_next_level)", () => {
    const player = makePlayer();
    const queues = makeQueues({ activeResearches: [{ id: "tech9", endTime: NOW - 1000 }] }); // tech9 -> drone_recuperateur
    const { player: after } = flushState(player, queues, NOW);

    expect(after.units.drone_recuperateur?.level).toBe(1);
    expect(after.units.drone_recuperateur?.count).toBe(0);
  });
});

describe("flushState — missions", () => {
  it("keeps an unfinished mission active", () => {
    const player = makePlayer();
    const queues = makeQueues({ activeMissions: [{ key: "patrouille_courte", endTime: NOW + 5000 }] });
    const { player: after, queues: afterQueues } = flushState(player, queues, NOW);

    expect(after.resources.scrap).toBe(player.resources.scrap);
    expect(afterQueues.activeMissions).toHaveLength(1);
  });

  it("completes a mission and grants its resource + XP reward", () => {
    const player = makePlayer();
    const queues = makeQueues({ activeMissions: [{ key: "patrouille_courte", endTime: NOW - 1000 }] });
    const { player: after, queues: afterQueues, notifications } = flushState(player, queues, NOW);

    expect(after.resources.scrap).toBe(player.resources.scrap + 150);
    expect(after.xp).toBe(10);
    expect(afterQueues.activeMissions).toHaveLength(0);
    expect(notifications.some((n) => n.kind === "mission")).toBe(true);
  });
});
