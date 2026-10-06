import { describe, expect, it } from "vitest";
import { activeBan, allowedWhileBanned, banPlayer, normalizeBans, pruneBans, unbanPlayer } from "@/game/moderation";

const T = 1_800_000_000_000;

describe("modération", () => {
  it("bannit temporairement puis lève à l'échéance", () => {
    const bans = banPlayer({}, { uid: "u1", pseudo: "Zed", hours: 24, reason: "Triche avérée", byName: "Admin" }, T);
    expect(activeBan(bans, "u1", T + 1000)?.reason).toBe("Triche avérée");
    expect(activeBan(bans, "u1", T + 25 * 3_600_000)).toBeNull();
  });
  it("bannissement permanent, levée manuelle, relecture", () => {
    let bans = banPlayer({}, { uid: "u2", pseudo: "Kay", hours: null, reason: "Insultes répétées", byName: "Admin" }, T);
    expect(activeBan(normalizeBans(JSON.parse(JSON.stringify(bans))), "u2", T + 1e12)?.untilMs).toBeNull();
    bans = unbanPlayer(bans, "u2");
    expect(activeBan(bans, "u2", T)).toBeNull();
  });
  it("exige un motif et une durée valide", () => {
    expect(() => banPlayer({}, { uid: "u", pseudo: "", hours: 24, reason: "x", byName: "" }, T)).toThrow(/motif/);
    expect(() => banPlayer({}, { uid: "u", pseudo: "", hours: -1, reason: "motif ok", byName: "" }, T)).toThrow(/Durée/);
  });
  it("oublie les bannissements échus depuis longtemps", () => {
    const bans = banPlayer({}, { uid: "u", pseudo: "", hours: 1, reason: "motif ok", byName: "" }, T);
    expect(Object.keys(pruneBans(bans, T + 40 * 86_400_000))).toHaveLength(0);
    expect(Object.keys(pruneBans(bans, T + 2 * 3_600_000))).toHaveLength(1);
  });
  it("laisse passer de quoi afficher l'écran de bannissement, rien d'autre", () => {
    expect(allowedWhileBanned("GET", "/api/cosmic/ban/me")).toBe(true);
    expect(allowedWhileBanned("POST", "/api/cosmic/action")).toBe(false);
    expect(allowedWhileBanned("GET", "/api/collections/players/records/u")).toBe(false);
  });
});
