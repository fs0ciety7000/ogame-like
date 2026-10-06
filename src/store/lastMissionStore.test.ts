import { describe, expect, it } from "vitest";
import { parseLastMission } from "@/store/lastMissionStore";

describe("Relancer : dernière mission gardée", () => {
  it("lit la forme 6.3 (corps de fleet/send)", () => {
    const m = parseLastMission({ body: { mission: "bounty", bountyId: "b1", fleet: { chasseur: 5 } }, mission: "bounty", targetLabel: "prime", at: 1 });
    expect(m).toEqual({ body: { mission: "bounty", bountyId: "b1", fleet: { chasseur: 5 } }, mission: "bounty", targetLabel: "prime", at: 1 });
  });

  it("convertit la forme 5.33 sans rien perdre", () => {
    const m = parseLastMission({ targetUid: "u2", targetPseudo: "Varan", fleet: { chasseur: 10 }, mission: "attack", options: { formation: "wedge" }, at: 5 });
    expect(m?.body).toEqual({ targetUid: "u2", fleet: { chasseur: 10 }, mission: "attack", formation: "wedge" });
    expect(m?.targetLabel).toBe("Varan");
  });

  it("refuse une valeur abîmée", () => {
    expect(parseLastMission(null)).toBeNull();
    expect(parseLastMission({ mission: "attack" })).toBeNull();
  });
});
