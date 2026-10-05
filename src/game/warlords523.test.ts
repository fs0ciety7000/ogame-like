import { describe, expect, it } from "vitest";
import { adaptWarlord, DEFAULT_WARLORDS, desiredArmy, dominantClass, emptyRuntime, recordWarlordHistory, warlordPowerAlerts, WARLORD_RULES } from "@/game/warlords";
import { unitClasses } from "@/game/unitClasses";

const NOW = Date.UTC(2026, 9, 5, 12);
const H = 3600_000;

describe("5.23 seigneurs : historique, alerte, contre-composition", () => {
  it("historique : un relevé par 12 h, et à chaque changement de rang", () => {
    let rt = recordWarlordHistory(emptyRuntime(), 1, 1000, NOW);
    rt = recordWarlordHistory(rt, 1, 1100, NOW + H);
    expect(rt.history).toHaveLength(1);
    rt = recordWarlordHistory(rt, 2, 1200, NOW + 2 * H);
    rt = recordWarlordHistory(rt, 2, 1300, NOW + 15 * H);
    expect(rt.history?.map((p) => p.rank)).toEqual([1, 2, 2]);
    for (let i = 0; i < 100; i++) rt = recordWarlordHistory(rt, 2, i, NOW + (20 + i * 13) * H);
    expect(rt.history?.length).toBe(60);
  });

  it("alerte : seigneur au-delà de 1,5 fois le 2e joueur", () => {
    const lords = [
      { id: "a", name: "A", power: 30_000_000 },
      { id: "b", name: "B", power: 10_000_000 },
    ];
    const r = warlordPowerAlerts(lords, [50_000_000, 15_000_000, 3_000_000]);
    expect(r.second).toBe(15_000_000);
    expect(r.alerts.map((a) => a.id)).toEqual(["a"]);
    expect(r.alerts[0].ratio).toBe(2);
    expect(warlordPowerAlerts(lords, []).alerts).toEqual([]);
  });

  it("contre-composition : la classe qui bat celle du vainqueur pèse plus, à puissance égale", () => {
    const classes = unitClasses();
    const fleet = { chasseur: 500, sentinelle: 200 };
    expect(dominantClass(fleet)).toBe("medium");
    const rt = adaptWarlord(emptyRuntime(), fleet, NOW, "Testeur");
    expect(rt.counter?.cls).toBe("heavy");
    expect(rt.counter?.untilMs).toBe(NOW + WARLORD_RULES.counterDays * 86400_000);
    const d = DEFAULT_WARLORDS.find((x) => x.tier === "strong")!;
    const plain = desiredArmy(d, 5_000_000);
    const adapted = desiredArmy(d, 5_000_000, rt.counter, NOW);
    const heavyIds = Object.keys(adapted).filter((id) => classes[id] === "heavy");
    const otherIds = Object.keys(adapted).filter((id) => classes[id] !== "heavy");
    if (heavyIds.length > 0 && otherIds.length > 0) {
      expect(heavyIds.some((id) => adapted[id] > plain[id])).toBe(true);
      expect(otherIds.some((id) => adapted[id] < plain[id])).toBe(true);
    }
    // Échue : composition normale.
    expect(desiredArmy(d, 5_000_000, rt.counter, NOW + 30 * 86400_000)).toEqual(plain);
  });
});
