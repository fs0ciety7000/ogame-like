import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EMOJI_ICONS, emojiIcon, GAME_ICONS, splitEmojiText } from "@/lib/icons";
import { RESOURCE_LIST } from "@/game/resources";

describe("icônes illustrées", () => {
  it("chaque icône a son image, et chaque ressource son icône", () => {
    for (const name of GAME_ICONS) expect(existsSync(`public/assets/icons/${name}.webp`), name).toBe(true);
    for (const r of RESOURCE_LIST) expect(GAME_ICONS).toContain(r.id);
    for (const name of Object.values(EMOJI_ICONS)) expect(GAME_ICONS).toContain(name);
  });

  it("reconnaît les emojis avec ou sans sélecteur de variante", () => {
    expect(emojiIcon("🛡️")).toBe("shield");
    expect(emojiIcon("🛡")).toBe("shield");
    expect(emojiIcon("🙂")).toBeUndefined();
  });

  it("remplace les emojis connus dans un texte", () => {
    expect(splitEmojiText("🌀 Patrouille · 🔩 12 et 🙂")).toEqual([{ icon: "patrol" }, " Patrouille · ", { icon: "scrap" }, " 12 et 🙂"]);
    expect(splitEmojiText("sans emoji")).toEqual(["sans emoji"]);
  });
});
