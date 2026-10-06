import { describe, expect, it } from "vitest";
import { addVitals, cronIntervalMs, cronStatus, cronSummary, recordCronRun, sanitizeVitals, vitalsReport, type VitalsStore } from "@/game/serverMetrics";

const T = Date.UTC(2026, 9, 6, 12);

describe("métriques des tâches planifiées", () => {
  it("déduit l'intervalle d'une expression cron", () => {
    expect(cronIntervalMs("* * * * *")).toBe(60_000);
    expect(cronIntervalMs("*/10 * * * *")).toBe(600_000);
    expect(cronIntervalMs("7 * * * *")).toBe(3_600_000);
    expect(cronIntervalMs("11 3 * * *")).toBe(86_400_000);
  });
  it("suit durée, échecs et retard", () => {
    let m = recordCronRun({}, "fleets", "* * * * *", T, 120, null);
    m = recordCronRun(m, "fleets", "* * * * *", T + 60_000, 220, "boom");
    expect(m.fleets).toMatchObject({ runs: 2, fails: 1, lastMs: 220, maxMs: 220, lastError: "boom" });
    expect(cronStatus(m.fleets, T + 61_000)).toBe("failing");
    m = recordCronRun(m, "fleets", "* * * * *", T + 120_000, 100, null);
    expect(cronStatus(m.fleets, T + 121_000)).toBe("ok");
    expect(cronStatus(m.fleets, T + 120_000 + 5 * 60_000)).toBe("late");
    expect(cronSummary(m, T + 121_000)).toEqual({ total: 1, late: 0, failing: 0, slow: 0 });
  });
});

describe("Web Vitals", () => {
  it("nettoie l'échantillon et masque les identifiants dans la page", () => {
    expect(sanitizeVitals({ route: "/game/joueurs/a1b2c3?x=1", device: "m", values: { lcp: 1800, cls: 0.05, inp: -4 } })).toEqual({ route: "/game/joueurs/:", device: "m", values: { lcp: 1800, cls: 0.05 } });
    expect(sanitizeVitals({ values: {} })).toBeNull();
  });
  it("donne le 75e centile et les pages lentes", () => {
    let store: VitalsStore = {};
    for (let i = 0; i < 8; i++) store = addVitals(store, { route: "/game", device: "d", values: { lcp: 1000, cls: 0.02 } }, T);
    for (let i = 0; i < 4; i++) store = addVitals(store, { route: "/game/galaxie", device: "m", values: { lcp: 4500 } }, T);
    const r = vitalsReport(store, T);
    const lcp = r.metrics.find((m) => m.id === "lcp")!;
    expect(r.samples).toBe(12);
    expect(lcp.p75Desktop).toBe(1000);
    expect(lcp.p75Mobile).toBe(5000);
    expect(r.metrics.find((m) => m.id === "cls")!.rating).toBe("good");
    expect(r.slowPages[0]).toEqual({ route: "/game/galaxie", n: 4, lcpAvg: 4500 });
  });
  it("oublie les jours trop anciens", () => {
    const old = addVitals({}, { route: "/", device: "d", values: { lcp: 1 } }, T - 30 * 86_400_000);
    expect(Object.keys(addVitals(old, { route: "/", device: "d", values: { lcp: 1 } }, T))).toHaveLength(1);
  });
});
