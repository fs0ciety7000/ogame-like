import { describe, expect, it } from "vitest";
import { ANOMALY_RULES, anomalyThreshold, describeAnomalies, detectResourceAnomalies, stockValue } from "@/game/anomalies";
import { defaultPlayerState } from "@/game/defaults";
import type { PlayerState, Resources } from "@/types/game";

const H = 3600_000;
const T0 = Date.parse("2026-10-01T10:00:00Z");

function player(history: { t: number; r: Partial<Resources> }[], current: Partial<Resources>, at: number): PlayerState {
  const p = { ...defaultPlayerState("u1", "Testeur"), createdAt: null } as unknown as PlayerState;
  const zero = Object.fromEntries(Object.keys(p.resources).map((k) => [k, 0])) as unknown as Resources;
  p.resourceHistory = history.map((h) => ({ t: h.t, r: { ...zero, ...h.r } }));
  p.resources = { ...zero, ...current };
  p.resourcesUpdatedAtMs = at;
  return p;
}

describe("resource anomalies", () => {
  it("values rares at the exchange price", () => {
    expect(stockValue({ scrap: 1000, reinforcedSteel: 10 })).toBe(2000);
  });

  it("ignores conversions at the exchange and flags impossible jumps", () => {
    const p = player(
      [
        { t: T0, r: { scrap: 2_000_000_000, reinforcedSteel: 0 } },
        { t: T0 + H, r: { scrap: 1_000_000_000, reinforcedSteel: 10_000_000 } }, // 1 Md converti en 10 M d'acier
        { t: T0 + 2 * H, r: { scrap: 1_000_000_000, reinforcedSteel: 900_000_000 } },
      ],
      { scrap: 1_000_000_000, reinforcedSteel: 900_000_000 },
      T0 + 2 * H,
    );
    const list = detectResourceAnomalies(p, 0);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ fromMs: T0 + H, toMs: T0 + 2 * H, deltas: { reinforcedSteel: 890_000_000 } });
    expect(describeAnomalies(list)).toContain("Acier renforcé +890");
  });

  it("only reports jumps that end after the last scan, including the live stock", () => {
    const p = player([{ t: T0, r: { scrap: 0 } }, { t: T0 + H, r: { scrap: 500_000_000 } }], { scrap: 1_200_000_000 }, T0 + H + 10 * 60_000);
    expect(detectResourceAnomalies(p, 0)).toHaveLength(2);
    const later = detectResourceAnomalies(p, T0 + H);
    expect(later).toHaveLength(1);
    expect(later[0].toMs).toBe(T0 + H + 10 * 60_000);
  });

  it("scales the threshold with the time between two readings", () => {
    const p = player([], {}, T0);
    expect(anomalyThreshold(p, 1)).toBeGreaterThanOrEqual(ANOMALY_RULES.minPerHour);
    expect(anomalyThreshold(p, 5)).toBe(anomalyThreshold(p, 1) * 5);
    expect(anomalyThreshold(p, 0.2)).toBe(anomalyThreshold(p, 1));
  });
});
