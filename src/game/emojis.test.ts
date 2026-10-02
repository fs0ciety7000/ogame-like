import { describe, expect, it } from "vitest";
import { normalizeCustomEmojis, splitCustomEmojis } from "@/game/emojis";

describe("custom emojis", () => {
  const list = normalizeCustomEmojis([{ code: "leviathan", url: "/a.webp" }, { code: "Bad Code", url: "/b" }, { code: "leviathan", url: "/dup" }, { code: "gg", url: "/gg.webp" }]);

  it("keeps valid, unique codes", () => {
    expect(list.map((e) => e.code)).toEqual(["leviathan", "gg"]);
  });

  it("replaces known codes only", () => {
    expect(splitCustomEmojis("bravo :gg: et :inconnu: :leviathan:", list)).toEqual([
      { type: "text", text: "bravo " },
      { type: "emoji", emoji: list[1] },
      { type: "text", text: " et :inconnu: " },
      { type: "emoji", emoji: list[0] },
    ]);
    expect(splitCustomEmojis("rien ici", list)).toEqual([{ type: "text", text: "rien ici" }]);
  });
});

describe("game emojis", () => {
  it("have valid unique codes and an image each", async () => {
    const { GAME_EMOJIS, EMOJI_CODE_RE } = await import("@/game/emojis");
    const { KESH_EMOJIS } = await import("@/game/bounties");
    const { existsSync } = await import("node:fs");
    const all = [...GAME_EMOJIS, ...KESH_EMOJIS];
    expect(new Set(all.map((e) => e.code)).size).toBe(all.length);
    for (const e of all) {
      expect(e.code).toMatch(EMOJI_CODE_RE);
      expect(existsSync(`public${e.url}`)).toBe(true);
    }
  });
});
