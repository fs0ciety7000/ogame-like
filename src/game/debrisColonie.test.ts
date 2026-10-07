import { describe, expect, it } from "vitest";
import { debrisKey, debrisLocation, mergeDebris } from "@/game/debris";
import { distanceBetween, performLaunch } from "@/game/fleets";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";

/* 6.11.4 (E1, Q13) : un champ de débris sur une colonie a une clé de 15 caractères au plus et garde son emplacement. */

const NOW = 1_800_000_000_000;

describe("débris sur une colonie", () => {
  it("garde l'identifiant d'une planète mère et dérive une clé stable pour une colonie", () => {
    expect(debrisKey("abcdefghijklmno")).toBe("abcdefghijklmno");
    const k = debrisKey("abcdefghijklmno-c2");
    expect(k).toMatch(/^[a-z0-9]{15}$/);
    expect(debrisKey("abcdefghijklmno-c2")).toBe(k);
    expect(debrisKey("abcdefghijklmno-c3")).not.toBe(k);
  });

  it("le champ d'une colonie se place et se recycle aux coordonnées de la colonie", () => {
    const colony = "abcdefghijklmno-c2";
    const field = mergeDebris(null, { scrap: 500, energy: 100 }, { uid: colony, pseudo: "Nova" }, NOW);
    expect(field.id).toBe(debrisKey(colony));
    expect(debrisLocation(field)).toBe(colony);
    // Ancien champ (sans locationId) : l'emplacement reste sa clé.
    expect(debrisLocation({ id: "abcdefghijklmno" })).toBe("abcdefghijklmno");

    const base = defaultPlayerState("zzzzzzzzzzzzzzz", "Att");
    const owner = { ...base, units: { ...base.units, drone_recuperateur: { level: 1, count: 5 } } };
    const out = performLaunch({ mission: "recycle", now: NOW, owner, ownerQueues: defaultQueues(), debris: field, fleet: { drone_recuperateur: 2 } });
    expect(out.fleet.targetUid).toBe(colony);
    expect(out.fleet.arriveAtMs - NOW).toBeGreaterThan(0);
    expect(distanceBetween(owner.uid, colony)).not.toBe(distanceBetween(owner.uid, "abcdefghijklmno"));
  });
});
