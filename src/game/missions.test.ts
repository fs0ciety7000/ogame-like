import { describe, expect, it } from "vitest";
import { getRewardText, hasPrerequisites, MISSIONS } from "@/game/missions";

describe("hasPrerequisites", () => {
  const patrol = MISSIONS.patrouille_courte; // prereq: { drone_recuperateur: 2 }

  it("is false when the required units aren't owned", () => {
    expect(hasPrerequisites(patrol, {})).toBe(false);
  });

  it("is false when not enough units are owned", () => {
    expect(hasPrerequisites(patrol, { drone_recuperateur: { count: 1 } })).toBe(false);
  });

  it("is true once enough units are owned", () => {
    expect(hasPrerequisites(patrol, { drone_recuperateur: { count: 2 } })).toBe(true);
  });

  it("requires every unit for multi-prereq missions", () => {
    const elite = MISSIONS.mission_elite;
    const all = Object.fromEntries(Object.entries(elite.prereq).map(([id, n]) => [id, { count: n }]));
    const [missingId] = Object.keys(elite.prereq);
    const partial = { ...all, [missingId]: { count: 0 } };
    expect(hasPrerequisites(elite, partial)).toBe(false);
    expect(hasPrerequisites(elite, all)).toBe(true);
  });

  it("gives 60 XP per hour of mission, whatever its length", () => {
    for (const mission of Object.values(MISSIONS)) {
      expect(mission.reward.xp, mission.key).toBe(Math.max(1, Math.round((mission.duration / 3600) * 60)));
    }
  });
});

describe("getRewardText", () => {
  it("lists every non-zero reward with its label", () => {
    const text = getRewardText({ scrap: 150, xp: 10 });
    expect(text).toContain("🔩 Ferraille 150");
    expect(text).toContain("⭐ XP 10");
  });

  it("falls back to a placeholder when there is no reward", () => {
    expect(getRewardText({})).toEqual(["Aucune récompense directe"]);
  });
});
