import { describe, expect, it } from "vitest";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { performPlayerAction } from "@/game/actions";
import { flushState } from "@/game/flush";
import { BUILD_PLAN_RULES, buildPlan, planSlots } from "@/game/buildPlan";
import type { PlayerState, QueuesState } from "@/types/game";

const NOW = Date.UTC(2026, 9, 20, 12);
const rich = (): PlayerState => {
  const p = defaultPlayerState("u1", "Plan") as PlayerState;
  p.resources = { ...p.resources, scrap: 1e9, energy: 1e9, nano: 1e9, data: 1e9 };
  p.resourcesUpdatedAtMs = NOW;
  for (const id of ["reacteur_instable", "entrepot"]) p.buildings[id] = { level: 1, unlocked: true };
  return p;
};
const run = (p: PlayerState, q: QueuesState, action: Parameters<typeof performPlayerAction>[2], at = NOW) => performPlayerAction(p, q, action, at);

describe("v4.9 : file planifiée", () => {
  it("1 emplacement offert, puis Fonderie 5 et 10", () => {
    const p = rich();
    expect(planSlots(p)).toBe(1);
    p.buildings.fonderie_quantique = { level: 5, unlocked: true };
    expect(planSlots(p)).toBe(2);
    p.buildings.fonderie_quantique = { level: 10, unlocked: true };
    expect(planSlots(p)).toBe(3);
  });

  it("la suite démarre à la fin du chantier, même hors ligne, et se paie au lancement", () => {
    let { player, queues } = run(rich(), defaultQueues(), { type: "upgradeBuilding", buildingId: "extracteur_ferraille" });
    const end = queues.buildingUpgrades.extracteur_ferraille!.endTime;
    ({ player, queues } = run(player, queues, { type: "planBuilding", buildingId: "extracteur_ferraille" }));
    expect(buildPlan(queues)).toEqual([expect.objectContaining({ buildingId: "extracteur_ferraille", level: 3 })]);
    const scrapBefore = player.resources.scrap;
    const later = flushState(player, queues, end + 60_000);
    expect(later.player.buildings.extracteur_ferraille.level).toBe(2);
    expect(later.queues.buildingUpgrades.extracteur_ferraille?.startedAtMs).toBe(end);
    expect(buildPlan(later.queues)).toHaveLength(0);
    expect(later.player.resources.scrap).toBeLessThan(scrapBefore + 1e6);
    // Bâtiment occupé : la file garde l'entrée ; un seul emplacement offert.
    const again = run(later.player, later.queues, { type: "planBuilding", buildingId: "extracteur_ferraille" }, end + 61_000);
    expect(buildPlan(again.queues)).toEqual([expect.objectContaining({ level: 4 })]);
    expect(() => run(again.player, again.queues, { type: "planBuilding", buildingId: "extracteur_ferraille" }, end + 62_000)).toThrow(/File pleine/);
  });

  it("sans ressources : attente puis retrait après 24 h ; retrait gratuit", () => {
    const p = rich();
    p.resources = { ...p.resources, scrap: 0, energy: 0, nano: 0, data: 0 };
    p.buildings.entrepot = { level: 18, unlocked: true };
    let { player, queues } = run(p, defaultQueues(), { type: "planBuilding", buildingId: "entrepot" });
    let f = flushState(player, queues, NOW + 1000);
    expect(buildPlan(f.queues)[0].waitingSinceMs).toBeDefined();
    f = flushState(f.player, f.queues, NOW + (BUILD_PLAN_RULES.maxWaitHours + 1) * 3600_000);
    expect(buildPlan(f.queues)).toHaveLength(0);
    expect(f.notifications.some((n) => n.message.includes("retiré"))).toBe(true);
    ({ player, queues } = run(rich(), defaultQueues(), { type: "upgradeBuilding", buildingId: "extracteur_ferraille" }));
    ({ player, queues } = run(player, queues, { type: "planBuilding", buildingId: "extracteur_ferraille" }));
    const scrap = player.resources.scrap;
    ({ player, queues } = run(player, queues, { type: "unplanBuilding", index: 0 }));
    expect(player.resources.scrap).toBeGreaterThanOrEqual(scrap);
    expect(buildPlan(queues)).toHaveLength(0);
  });
});
