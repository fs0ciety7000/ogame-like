import { describe, expect, it } from "vitest";
import { defaultPlayerState } from "@/game/defaults";
import { COMBAT_RULES } from "@/game/combat";
import { UNIT_BASE_STATS } from "@/game/units";
import { DEFAULT_WARLORDS } from "@/game/warlords";
import { runWhatIf, type WhatIfEmpire } from "@/game/whatIf";

const emp = (uid: string, units: Record<string, number>, npc = ""): WhatIfEmpire => ({
  ...defaultPlayerState(uid, uid),
  uid,
  pseudo: uid,
  npc,
  units: Object.fromEntries(Object.entries(units).map(([id, n]) => [id, { level: 1, count: n }])),
});

describe("5.23 simulateur « et si »", () => {
  it("affaiblir les seigneurs les rend battables, et les règles sont restaurées", () => {
    const lord = DEFAULT_WARLORDS[0];
    const empires = [emp("a", { chasseur: 200, fregate: 200 }), emp("b", { chasseur: 150 }), emp(`npc_${lord.id}`, { canon_plasma: 3000, chasseur: 2000 }, lord.id)];
    const edge = COMBAT_RULES.classEdge;
    const stats = { ...UNIT_BASE_STATS.chasseur };
    const r = runWhatIf(empires, { warlordPower: 0.01, classEdge: 0.4, unit: { id: "chasseur", attack: 2 } });
    expect(r.before.warlords[0].power).toBeGreaterThan(r.after.warlords[0].power);
    expect(r.after.warlords[0].beatenBy).toBeGreaterThanOrEqual(r.before.warlords[0].beatenBy);
    expect(r.before.pvpFights).toBe(2);
    expect(COMBAT_RULES.classEdge).toBe(edge);
    expect(UNIT_BASE_STATS.chasseur).toEqual(stats);
  });
});
