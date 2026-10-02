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
