import { describe, it } from "vitest";
import { commonPerHour, empireProfile, extractorCurve, missionTable, techProfile, unitTable } from "@/game/balance/analysis";

/* Rapport d'équilibrage : BALANCE_REPORT=1 npx vitest run src/game/balance/report.test.ts */
const r = (n: number, d = 0) => (Number.isFinite(n) ? n.toFixed(d) : "∞");

describe.skipIf(!process.env.BALANCE_REPORT)("rapport d'équilibrage", () => {
  it("affiche les tableaux", () => {
    for (const [label, frac] of [["début (tech 30 %, niv 3)", 0.3], ["fin (tech max, niv max)", 1]] as const) {
      const tech = techProfile(frac);
      console.log(`\n=== UNITÉS — ${label}`);
      console.log("id | cat | niv | places | coût | ATK | DEF | ATK/place | (A+D)/place | ATK/1k | (A+D)/1k | entretien/h | vitesse");
      for (const u of unitTable(frac === 1 ? "max" : 3, tech)) {
        console.log([u.id, u.category, u.level, u.places, u.cost, r(u.attack), r(u.defense), r(u.attackPerPlace), r(u.powerPerPlace), r(u.attackPer1k, 1), r(u.powerPer1k, 1), r(u.upkeepPerHour, 1), u.speed].join(" | "));
      }
    }
    console.log("\n=== EXTRACTEUR (ferraille, tech max) : niveau | coût | durée h | gain/h | amortissement h");
    for (const s of extractorCurve("extracteur_ferraille", techProfile(1))) console.log([s.level, s.cost, r(s.seconds / 3600, 1), r(s.gainPerHour), r(s.paybackHours, 1)].join(" | "));
    for (const [label, lvl, frac] of [["début", 5, 0.3], ["milieu", 10, 0.6], ["fin", 18, 1]] as const) {
      const p = empireProfile(lvl, frac);
      console.log(`\n=== MISSIONS — ${label} (production commune ${r(commonPerHour(p))}/h) : clé | min | valeur | h de prod par h`);
      for (const m of missionTable(p)) console.log([m.key, m.minutes, r(m.value), r(m.productionHoursPerHour, 2)].join(" | "));
    }
  });
});
