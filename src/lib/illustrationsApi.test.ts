import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  STYLE_PREFIX,
  API_SIZES,
  PRICES,
  backoffMs,
  estimateCost,
  isRetryable,
  midjourneyParams,
  pickSize,
  requestBody,
  selectSlots,
  targetRatio,
  toApiPrompt,
  // @ts-expect-error — module JS sans types (script de génération d'illustrations)
} from "../../scripts/illustrations-api.mjs";

/* 6.14.91 : génération des illustrations par l'API d'images (scripts/generate-illustrations.mjs, docs/illustrations.md). */

type Slot = { id: string; group: string; width: number; height: number; cutout: boolean; prompt: string; done: string | null };
const slots = (JSON.parse(readFileSync("scripts/illustrations.json", "utf8")) as { slots: Slot[] }).slots;

const slot = (over: Partial<Slot>): Slot => ({ id: "x", group: "Reliques", width: 256, height: 256, cutout: false, prompt: "a relic --ar 1:1 --v 7", done: null, ...over });

describe("6.14.91 : prompt d'API", () => {
  it("lit les paramètres Midjourney", () => {
    expect(midjourneyParams("a ship --ar 16:9 --v 7 --style raw --s 250")).toEqual({ ar: "16:9", v: "7", style: "raw", s: "250" });
  });

  it("retire les paramètres et les « no text » du prompt, ajoute le style et la consigne sans texte", () => {
    const p = toApiPrompt(slot({ prompt: "/imagine prompt: a pirate lair, dark starfield, no text, no letters --ar 1:1 --v 7 --style raw --s 250" }));
    expect(p).not.toMatch(/--|\/imagine|style raw/);
    expect(p.startsWith(STYLE_PREFIX)).toBe(true);
    // 6.14.119 : style science-fiction et spatial demandé par l'utilisateur.
    expect(STYLE_PREFIX).toMatch(/science-fiction space/);
    expect(p).toContain("Subject: a pirate lair, dark starfield.");
    expect(p).toMatch(/No text, no letters, no numbers/);
    expect(p.match(/no text/gi)).toHaveLength(1);
    expect(toApiPrompt(slot({ prompt: "a relic --ar 1:1" }), { style: "" })).toMatch(/^Subject: a relic\./);
  });

  it("demande un fond transparent seulement pour un détourage", () => {
    const cut = toApiPrompt(slot({ cutout: true, prompt: "a relic, centered on a dark neutral background --ar 1:1" }));
    expect(cut).toContain("centered on a transparent background");
    expect(cut).toMatch(/isolated object on a transparent background/);
    expect(toApiPrompt(slot({ prompt: "a planet --ar 1:1" }))).not.toMatch(/transparent/);
    expect(requestBody(slot({ cutout: true })).background).toBe("transparent");
    expect(requestBody(slot({})).background).toBe("opaque");
  });

  it("aucun prompt converti de la liste ne garde de paramètre Midjourney", () => {
    for (const s of slots) expect(toApiPrompt(s), s.id).not.toMatch(/(^|\s)--[a-z]/);
  });
});

describe("6.14.91 : taille d'API", () => {
  it("prend la taille la plus proche du rapport", () => {
    expect(pickSize(1)).toBe("1024x1024");
    expect(pickSize(16 / 9)).toBe("1536x1024");
    expect(pickSize(21 / 9)).toBe("1536x1024");
    expect(pickSize(16 / 10)).toBe("1536x1024");
    expect(pickSize(4 / 5)).toBe("1024x1536");
    expect(pickSize(9 / 16)).toBe("1024x1536");
  });

  it("lit le rapport dans --ar, sinon dans la taille finale", () => {
    expect(targetRatio(slot({ prompt: "x --ar 21:9", width: 1680, height: 0 }))).toBeCloseTo(21 / 9);
    expect(targetRatio(slot({ prompt: "x", width: 1600, height: 900 }))).toBeCloseTo(16 / 9);
    expect(targetRatio(slot({ prompt: "x", width: 1680, height: 0 }))).toBe(1);
  });

  it("chaque emplacement a une taille d'API et un prix", () => {
    for (const s of slots) {
      const size = pickSize(targetRatio(s));
      expect(API_SIZES).toContain(size);
      for (const q of Object.keys(PRICES)) expect(estimateCost(size, q)).toBeGreaterThan(0);
    }
  });
});

describe("6.14.91 : sélection et reprise", () => {
  it("ne garde que les images à faire, filtrées", () => {
    const list = [slot({ id: "a", group: "Reliques" }), slot({ id: "b", group: "Passe de saison" }), slot({ id: "c", done: "2026-10-07" })];
    expect(selectSlots(list).map((s: Slot) => s.id)).toEqual(["a", "b"]);
    expect(selectSlots(list, { group: "passe" }).map((s: Slot) => s.id)).toEqual(["b"]);
    expect(selectSlots(list, { ids: ["c"] })).toEqual([]);
    expect(selectSlots(list, { ids: ["c"], all: true }).map((s: Slot) => s.id)).toEqual(["c"]);
    expect(selectSlots(list, { limit: 1 })).toHaveLength(1);
  });

  it("reprend sur 429, 5xx et erreur réseau, pas sur 400", () => {
    expect([429, 500, 503, undefined].every(isRetryable)).toBe(true);
    expect([400, 401, 404].some(isRetryable)).toBe(false);
    expect(backoffMs(0)).toBe(2000);
    expect(backoffMs(2)).toBe(8000);
    expect(backoffMs(10)).toBe(60000);
    expect(backoffMs(3, "5")).toBe(5000);
  });
});
