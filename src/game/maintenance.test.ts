import { describe, expect, it } from "vitest";
import { extendUltimatums, maintenanceProgress, maintenanceShouldAutoEnd, maintenanceRemainingMs, MAINTENANCE_OFF, nextMaintenance, normalizeMaintenance } from "@/game/maintenance";

const NOW = 1_800_000_000_000;

describe("mode maintenance (v2.5)", () => {
  it("lecture tolérante", () => {
    expect(normalizeMaintenance(null)).toEqual(MAINTENANCE_OFF);
    expect(normalizeMaintenance({ enabled: "oui", endsAtMs: -4 })).toMatchObject({ enabled: false, endsAtMs: null });
    expect(normalizeMaintenance({ enabled: true, message: "x".repeat(900), endsAtMs: NOW }).message).toHaveLength(600);
  });

  it("activation : début fixé, fin passée ignorée, début conservé lors d'une mise à jour", () => {
    const on = nextMaintenance(MAINTENANCE_OFF, { enabled: true, message: "  Hop  ", version: "2.5.0", endsAtMs: NOW + 60_000 }, NOW);
    expect(on).toEqual({ enabled: true, message: "Hop", version: "2.5.0", startedAtMs: NOW, endsAtMs: NOW + 60_000, autoEnd: true });
    const updated = nextMaintenance(on, { enabled: true, endsAtMs: NOW - 1 }, NOW + 30_000);
    expect(updated.startedAtMs).toBe(NOW);
    expect(updated.endsAtMs).toBeNull();
    expect(nextMaintenance(on, { enabled: false }, NOW + 1).enabled).toBe(false);
  });

  it("temps restant et avancement", () => {
    const m = { ...MAINTENANCE_OFF, enabled: true, startedAtMs: NOW, endsAtMs: NOW + 100_000 };
    expect(maintenanceRemainingMs(m, NOW + 25_000)).toBe(75_000);
    expect(maintenanceProgress(m, NOW + 25_000)).toBeCloseTo(0.25);
    expect(maintenanceRemainingMs(m, NOW + 200_000)).toBe(0);
    expect(maintenanceProgress({ ...m, endsAtMs: null }, NOW)).toBeNull();
  });

  it("les ultimatums ouverts pendant la coupure sont prolongés de sa durée", () => {
    const pirates = {
      varan: { notoriety: 1, ultimatum: { tribute: {}, issuedAtMs: NOW - 10, expiresAtMs: NOW + 1_000 } },
      cartel: { notoriety: 0, ultimatum: { tribute: {}, issuedAtMs: NOW - 900, expiresAtMs: NOW - 500 } },
      meute: { notoriety: 0, ultimatum: null },
    };
    const out = extendUltimatums(pirates, NOW, NOW + 3_600_000) as typeof pirates;
    expect(out.varan.ultimatum!.expiresAtMs).toBe(NOW + 1_000 + 3_600_000);
    expect(out.cartel.ultimatum!.expiresAtMs).toBe(NOW - 500);
    expect(pirates.varan.ultimatum.expiresAtMs).toBe(NOW + 1_000);
    expect(extendUltimatums({ meute: { ultimatum: null } }, NOW, NOW + 10)).toBeNull();
    // ancien format (v2.0, état de Varan à plat)
    const legacy = extendUltimatums({ notoriety: 2, ultimatum: { expiresAtMs: NOW + 5 } }, NOW, NOW + 60_000) as { ultimatum: { expiresAtMs: number } };
    expect(legacy.ultimatum.expiresAtMs).toBe(NOW + 60_005);
  });

  it("réouverture automatique à l'heure prévue, sauf si l'option est coupée", () => {
    const on = nextMaintenance(MAINTENANCE_OFF, { enabled: true, endsAtMs: NOW + 60_000 }, NOW);
    expect(maintenanceShouldAutoEnd(on, NOW + 59_999)).toBe(false);
    expect(maintenanceShouldAutoEnd(on, NOW + 60_000)).toBe(true);
    expect(maintenanceShouldAutoEnd({ ...on, autoEnd: false }, NOW + 90_000)).toBe(false);
    expect(maintenanceShouldAutoEnd({ ...on, endsAtMs: null }, NOW + 90_000)).toBe(false);
    expect(nextMaintenance(MAINTENANCE_OFF, { enabled: true, autoEnd: false }, NOW).autoEnd).toBe(false);
    expect(normalizeMaintenance({ enabled: true }).autoEnd).toBe(true);
  });
});
