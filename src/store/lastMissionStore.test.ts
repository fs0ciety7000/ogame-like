import { describe, expect, it } from "vitest";
import { parseLastMission, resolveRelaunch } from "@/store/lastMissionStore";

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

describe("Relancer une prime (6.6)", () => {
  const last = { body: { mission: "bounty", bountyId: "b1", fleet: { chasseur: 5 } }, mission: "bounty" as const, targetLabel: "prime", at: 1, meta: { bountyTier: 2 } };

  it("garde la prime si elle est encore ouverte", () => {
    expect(resolveRelaunch(last, [{ id: "b1", status: "open", tier: 2 }])).toBe(last);
  });

  it("passe à la prime ouverte suivante du même palier", () => {
    const r = resolveRelaunch(last, [
      { id: "b1", status: "done", tier: 2 },
      { id: "b2", status: "open", tier: 1 },
      { id: "b3", status: "open", tier: 2 },
    ]);
    expect(r?.body.bountyId).toBe("b3");
    expect(r?.body.fleet).toEqual({ chasseur: 5 });
  });

  it("sans prime ouverte du palier, pas de relance", () => {
    expect(resolveRelaunch(last, [{ id: "b2", status: "open", tier: 1 }])).toBeNull();
  });

  it("ne touche pas aux autres missions", () => {
    const atk = { ...last, mission: "attack" as const, meta: undefined };
    expect(resolveRelaunch(atk, [])).toBe(atk);
  });
});
