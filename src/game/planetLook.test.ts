import { describe, expect, it } from "vitest";
import { defaultPlayerState } from "@/game/defaults";
import { checkPlanetLook, DEFAULT_PLANET_LOOK, normalizePlanetLook, planetLookOptions, unlockedPlanetLook } from "@/game/planetLook";
import { profileStyle, publicShowcase, setProfileStyle } from "@/game/profile";
import type { PlayerState } from "@/types/game";

function player(): PlayerState {
  return { ...defaultPlayerState("p", "p"), createdAt: null } as unknown as PlayerState;
}

describe("planetLook", () => {
  it("free options are open, the rest unlock with feats", () => {
    const p = player();
    const palettes = planetLookOptions(p, "palette");
    expect(palettes.filter((o) => o.unlocked).map((o) => o.id)).toEqual(["ocean", "dunes", "glacier"]);
    p.stats = { ...(p.stats ?? {}), expeditions: 10 } as PlayerState["stats"];
    p.ascensions = 1;
    expect(planetLookOptions(p, "palette").find((o) => o.id === "canopee")?.unlocked).toBe(true);
    expect(planetLookOptions(p, "palette").find((o) => o.id === "cristal")?.unlocked).toBe(true);
    expect(planetLookOptions(p, "palette").find((o) => o.id === "magma")?.unlocked).toBe(false);
  });

  it("refuses locked or unknown choices, keeps the rest", () => {
    const p = player();
    expect(() => checkPlanetLook(p, { palette: "magma" })).toThrow(/verrouillé/);
    expect(() => checkPlanetLook(p, { ring: "banane" })).toThrow(/inconnue/);
    expect(checkPlanetLook(p, { ring: "none", moon: "grise" })).toEqual({ ...DEFAULT_PLANET_LOOK, ring: "none", moon: "grise" });
  });

  it("reads tolerantly and drops what is no longer unlocked", () => {
    expect(normalizePlanetLook({ palette: "zzz", ring: "double" })).toEqual({ ...DEFAULT_PLANET_LOOK, ring: "double" });
    expect(unlockedPlanetLook(player(), { ...DEFAULT_PLANET_LOOK, ring: "double" }).ring).toBe("thin");
  });

  it("is saved in the profile style and published in the showcase", () => {
    const p = player();
    setProfileStyle(p, { planet: { palette: "dunes", atmosphere: "none", moon: "grise" } });
    expect(profileStyle(p).planet).toEqual({ palette: "dunes", ring: "thin", atmosphere: "none", moon: "grise" });
    expect(publicShowcase(p).planet).toEqual({ palette: "dunes", ring: "thin", atmosphere: "none", moon: "grise" });
  });
});
