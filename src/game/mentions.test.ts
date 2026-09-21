import { describe, expect, it } from "vitest";
import { splitMentions } from "./mentions";

describe("splitMentions", () => {
  it("returns a single non-mention segment when there is nothing to match", () => {
    expect(splitMentions("Salut tout le monde", [])).toEqual([{ text: "Salut tout le monde", isMention: false }]);
  });

  it("returns a single non-mention segment when no pseudo matches", () => {
    expect(splitMentions("Salut tout le monde", ["Voidwalker"])).toEqual([
      { text: "Salut tout le monde", isMention: false },
    ]);
  });

  it("highlights a single-word mention", () => {
    expect(splitMentions("Salut @Voidwalker !", ["Voidwalker", "Nova Prime"])).toEqual([
      { text: "Salut ", isMention: false },
      { text: "@Voidwalker", isMention: true },
      { text: " !", isMention: false },
    ]);
  });

  it("highlights a multi-word mention", () => {
    expect(splitMentions("Hey @Nova Prime tu es là ?", ["Voidwalker", "Nova Prime"])).toEqual([
      { text: "Hey ", isMention: false },
      { text: "@Nova Prime", isMention: true },
      { text: " tu es là ?", isMention: false },
    ]);
  });

  it("prefers the longest matching pseudo when one is a prefix of another", () => {
    expect(splitMentions("@Nova Prime attaque !", ["Nova", "Nova Prime"])).toEqual([
      { text: "@Nova Prime", isMention: true },
      { text: " attaque !", isMention: false },
    ]);
  });

  it("handles multiple mentions in the same message", () => {
    expect(splitMentions("@Voidwalker et @Nova Prime, go !", ["Voidwalker", "Nova Prime"])).toEqual([
      { text: "@Voidwalker", isMention: true },
      { text: " et ", isMention: false },
      { text: "@Nova Prime", isMention: true },
      { text: ", go !", isMention: false },
    ]);
  });
});
