import { describe, expect, it } from "vitest";
import { completeFleetReturn, type Fleet } from "@/game/fleets";
import { describeGain } from "@/game/format";
import { defaultPlayerState } from "@/game/defaults";

describe("v5.1 notifications de butin", () => {
  it("détaille les montants par ressource", () => {
    expect(describeGain({ scrap: 1200, energy: 0, aiFragment: 3 })).toBe("1\u202f200 ferraille, 3 fragments d'IA");
    expect(describeGain({})).toBe("rien");
  });

  it("le retour d'une attaque liste le butin ressource par ressource", () => {
    const owner = defaultPlayerState("a", "Alpha");
    const fleet = { id: "f", ownerUid: "a", targetUid: "b", targetPseudo: "Bravo", mission: "attack", status: "returning", units: {}, loot: { scrap: 5000, nano: 250 } } as unknown as Fleet;
    const { notifications } = completeFleetReturn(owner, fleet, 1);
    expect(notifications[0].message).toBe("Retour de Bravo. Butin : 5\u202f000 ferraille, 250 nanocomposants (5\u202f250 au total).");
  });
});
