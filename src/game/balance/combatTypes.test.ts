import { describe, expect, it } from "vitest";
import { COMBAT_519_SINCE_MS, combatKind, combatTypeCounts, combatTypeStats } from "@/game/balance/combatTypes";
import { computeLiveBalance, liveFindings } from "@/game/balance/diagnostics";

const T = COMBAT_519_SINCE_MS + 1000;
const r = (attackerUid: string, defenderUid: string, outcome: string, timestamp = T) => ({ attackerUid, defenderUid, outcome, timestamp }) as never;

describe("5.21 : combats par type", () => {
  it("classe chaque rapport selon ses camps", () => {
    expect(combatKind({ attackerUid: "a", defenderUid: "b" })).toBe("pvp");
    expect(combatKind({ attackerUid: "a", defenderUid: "bounty_x" })).toBe("bounty");
    expect(combatKind({ attackerUid: "a", defenderUid: "lair_varan" })).toBe("lair");
    expect(combatKind({ attackerUid: "pirates", defenderUid: "a" })).toBe("raid");
    expect(combatKind({ attackerUid: "npcvorn00000000", defenderUid: "a" })).toBe("reprisal");
    expect(combatKind({ attackerUid: "a", defenderUid: "npcvorn00000000" })).toBe("warlord");
  });

  it("compte la victoire du joueur, attaquant ou défenseur, depuis la 5.19", () => {
    const reports = [
      ...Array.from({ length: 9 }, () => r("a", "bounty_1", "attacker_win")),
      r("a", "bounty_2", "defender_win"),
      r("a", "bounty_3", "attacker_win", COMBAT_519_SINCE_MS - 1),
      ...Array.from({ length: 4 }, () => r("pirates", "a", "defender_win")),
      r("pirates", "a", "draw"),
      r("pirates", "a", "attacker_win"),
    ];
    const stats = combatTypeStats(reports);
    const bounty = stats.find((s) => s.kind === "bounty")!;
    expect(bounty).toMatchObject({ battles: 10, playerWins: 9, playerWinPct: 90, status: "ok" });
    const raid = stats.find((s) => s.kind === "raid")!;
    expect(raid).toMatchObject({ battles: 6, playerWins: 5, playerWinPct: 83, status: "high" });
    expect(stats.find((s) => s.kind === "pvp")!.status).toBe("none");
    expect(combatTypeCounts(reports, COMBAT_519_SINCE_MS, T + 1)).toEqual({ bounty: [10, 9], raid: [6, 5] });
  });

  it("les primes ne comptent plus en JcJ et un écart produit une proposition", () => {
    const reports = [...Array.from({ length: 12 }, () => r("a", "bounty_1", "defender_win")), r("a", "b", "attacker_win")];
    const live = computeLiveBalance([], [], reports, T + 1000);
    expect(live.pvp.battles).toBe(1);
    expect(live.combatTypes!.kinds.find((k) => k.kind === "bounty")!.status).toBe("low");
    expect(liveFindings(live).some((p) => p.id === "kind-bounty-low")).toBe(true);
  });
});
