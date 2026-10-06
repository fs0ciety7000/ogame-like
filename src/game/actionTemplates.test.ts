import { describe, expect, it } from "vitest";
import { previewTemplate, sanitizeTemplate, templateFromQueues } from "@/game/actionTemplates";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

const NOW = 1_800_000_000_000;
const rich = (): PlayerState =>
  ({ ...defaultPlayerState("a", "A"), createdAtMs: NOW - 1000, resourcesUpdatedAtMs: NOW, resources: { ...defaultPlayerState("a", "A").resources, scrap: 1e9, energy: 1e9, nano: 1e9, data: 1e9 }, units: { chasseur: { level: 1, count: 0 } } }) as PlayerState;

describe("modèles d'actions", () => {
  it("lance un bâtiment libre, programme le niveau suivant, signale la file pleine", () => {
    const out = previewTemplate(rich(), defaultQueues(), [
      { kind: "building", id: "extracteur_ferraille" },
      { kind: "building", id: "extracteur_ferraille" },
      { kind: "building", id: "extracteur_ferraille" },
    ], NOW);
    expect(out.map((o) => o.outcome)).toEqual(["start", "plan", "error"]);
    expect(out[1].actions[0]).toMatchObject({ type: "planBuilding" });
    expect(out[2].message).toMatch(/File pleine/);
  });

  it("met des unités en file et refuse une unité verrouillée", () => {
    const out = previewTemplate(rich(), defaultQueues(), [
      { kind: "units", id: "chasseur", qty: 2 },
      { kind: "units", id: "croiseur_lourd_inexistant", qty: 1 },
    ], NOW);
    expect(out[0].outcome).toBe("queue");
    expect(out[1].outcome).toBe("error");
  });

  it("nettoie un modèle lu sur l'appareil et rebâtit la file actuelle", () => {
    expect(sanitizeTemplate({ id: "x", name: "Éco", steps: [{ kind: "units", id: "chasseur", qty: -3 }, { kind: "research", id: "t" }, { kind: "?", id: "z" }] })?.steps).toEqual([{ kind: "research", id: "t" }]);
    expect(sanitizeTemplate(null)).toBeNull();
    const q = defaultQueues();
    q.unitQueues.attack.push({ unitId: "chasseur", endTime: null }, { unitId: "chasseur", endTime: null });
    expect(templateFromQueues(q)).toEqual([{ kind: "units", id: "chasseur", qty: 2 }]);
  });
});
