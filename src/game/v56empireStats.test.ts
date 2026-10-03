import { beforeEach, describe, expect, it } from "vitest";
import { applyGameContent } from "@/game/content";
import { defaultPlayerState } from "@/game/defaults";
import { foundColony } from "@/game/colonies";
import { empireStats } from "@/game/empireStats";
import type { Fleet } from "@/game/fleets";
import type { PlayerState } from "@/types/game";

const NOW = Date.UTC(2026, 9, 3, 12);

beforeEach(() => applyGameContent({}));

describe("v5.6 statistiques de l'empire", () => {
  it("additionne planète mère et colonies, flotte à quai et en vol", () => {
    const p = { ...defaultPlayerState("u1", "Empereur"), createdAt: NOW - 10 * 86_400_000, uid: "u1", victories: 3, defeats: 1 } as PlayerState;
    p.units = { fregate: { level: 2, count: 10 }, roquette: { level: 1, count: 5 } };
    const colony = foundColony("u1", { slot: 1, name: "Nova", startedAtMs: NOW, readyAtMs: NOW } as never, NOW);
    colony.defenses = { roquette: { level: 1, count: 4 } };
    p.colonies = [colony];
    const fleets = [{ id: "f", ownerUid: "u1", status: "outbound", mission: "attack", units: { fregate: 6 } } as unknown as Fleet, { id: "g", ownerUid: "autre", status: "outbound", mission: "spy", units: { fregate: 99 } } as unknown as Fleet];
    const st = empireStats(p, fleets, NOW);

    expect(st.planets).toHaveLength(2);
    expect(st.planets[1].name).toBe("Nova");
    const frigate = st.military.units.find((u) => u.id === "fregate")!;
    expect([frigate.home, frigate.away]).toEqual([10, 6]);
    expect(st.military.units.find((u) => u.id === "roquette")!.colonies).toBe(4);
    expect(st.military.attackAway).toBeGreaterThan(0);
    expect(st.military.attackTotal).toBe(st.military.attackHome + st.military.attackAway);
    expect(st.military.coloniesDefense).toBeGreaterThan(0);
    expect(st.fleets).toMatchObject({ inFlight: 1, byMission: { attack: 1 }, unitsAway: 6 });
    expect(st.overview).toMatchObject({ winPct: 75, accountDays: 10 });
    const scrap = st.resources.find((r) => r.id === "scrap")!;
    expect(scrap.perHourHome).toBeGreaterThan(0);
    expect(scrap.perHourColonies).toBeGreaterThan(0);
    expect(st.economy.totalPerHour).toBeGreaterThan(scrap.perHourHome);
    expect(st.threats.length).toBeGreaterThan(0);
  });
});
