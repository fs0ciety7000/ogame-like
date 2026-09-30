import { beforeEach, describe, expect, it } from "vitest";
import {
  buildTimeFactor,
  currentOrNextEvent,
  eventAt,
  eventBoundaries,
  EVENT_RULES,
  lootFactor,
  missionRewardFactor,
  parisOffsetMs,
  productionMultipliers,
} from "@/game/events";
import { advanceResources } from "@/game/economy";
import { defaultPlayerState } from "@/game/defaults";

const H = 3600_000;
// Vendredi 2 octobre 2026 : heure d'été, Paris = UTC+2 → début à 16 h UTC.
const FRI_OCT = Date.UTC(2026, 9, 2);

describe("weekend events", () => {
  beforeEach(() => {
    EVENT_RULES.rotationEnabled = true;
  });

  it("knows Paris time, summer and winter", () => {
    expect(parisOffsetMs(Date.UTC(2026, 6, 1))).toBe(2 * H);
    expect(parisOffsetMs(Date.UTC(2026, 11, 1))).toBe(1 * H);
    expect(parisOffsetMs(Date.UTC(2026, 2, 29, 0, 30))).toBe(1 * H); // avant la bascule du 29 mars 2026
    expect(parisOffsetMs(Date.UTC(2026, 2, 29, 1, 30))).toBe(2 * H);
  });

  it("runs from Friday 18:00 to Sunday 23:59, Paris time", () => {
    expect(eventAt(FRI_OCT + 15 * H + 59 * 60_000)).toBeNull();
    const e = eventAt(FRI_OCT + 16 * H)!;
    expect(e).not.toBeNull();
    expect(e.startMs).toBe(FRI_OCT + 16 * H);
    expect(e.endMs).toBe(Date.UTC(2026, 9, 4, 22)); // lundi 0 h à Paris
    expect(eventAt(e.endMs - 1)?.key).toBe(e.key);
    expect(eventAt(e.endMs)).toBeNull();
    // En hiver, 18 h à Paris = 17 h UTC.
    expect(eventAt(Date.UTC(2026, 11, 4, 16, 30))).toBeNull();
    expect(eventAt(Date.UTC(2026, 11, 4, 17, 0))).not.toBeNull();
  });

  it("rotates through the five events, week after week", () => {
    const seen = new Set<string>();
    for (let w = 0; w < 5; w++) seen.add(eventAt(FRI_OCT + 20 * H + w * 7 * 24 * H)!.type.id);
    expect(seen.size).toBe(5);
    expect(eventAt(FRI_OCT + 20 * H)!.type.id).toBe(eventAt(FRI_OCT + 20 * H + 5 * 7 * 24 * H)!.type.id);
  });

  it("gives the next event when none is running", () => {
    const wed = FRI_OCT - 2 * 24 * H;
    expect(currentOrNextEvent(wed)?.startMs).toBe(FRI_OCT + 16 * H);
    EVENT_RULES.rotationEnabled = false;
    expect(currentOrNextEvent(wed)).toBeNull();
  });

  it("lets a scheduled event override the rotation", () => {
    EVENT_RULES.scheduled = [{ id: "s1", type: "guerre_ouverte", startMs: FRI_OCT, endMs: FRI_OCT + 48 * H }];
    expect(eventAt(FRI_OCT + H)?.type.id).toBe("guerre_ouverte");
    expect(eventAt(FRI_OCT + 20 * H)?.scheduled).toBe(true);
    expect(lootFactor(FRI_OCT + H)).toBe(1.5);
    expect(eventBoundaries(FRI_OCT - H, FRI_OCT + 72 * H)).toContain(FRI_OCT);
  });

  it("applies each effect", () => {
    const at = (id: string) => {
      EVENT_RULES.scheduled = [{ id: "x", type: id, startMs: 0, endMs: 10 }];
      return 5;
    };
    EVENT_RULES.rotationEnabled = false;
    expect(productionMultipliers(at("tempete_ferraille")).scrap).toBe(1.5);
    expect(buildTimeFactor(at("chantiers_acceleres"))).toBe(0.75);
    expect(missionRewardFactor(at("chasse_tresor"))).toBe(1.5);
    expect(buildTimeFactor(20)).toBe(1);
  });

  it("boosts production only during the event", () => {
    EVENT_RULES.rotationEnabled = false;
    EVENT_RULES.scheduled = [{ id: "t", type: "tempete_ferraille", startMs: 3600_000, endMs: 7200_000 }];
    const p = { ...defaultPlayerState("u", "U"), resources: { ...defaultPlayerState("u", "U").resources, scrap: 0 } };
    const plain = advanceResources(p, 3600).scrap;
    // 1 h avant l'événement, puis 1 h pendant : 1 + 1,5 fois la production.
    const mixed = advanceResources(p, 7200, 0).scrap;
    expect(mixed).toBeCloseTo(plain * 2.5, 5);
  });
});
