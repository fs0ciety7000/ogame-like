import { describe, expect, it } from "vitest";
import { assertMessageQuota, groupConversations, MESSAGE_RULES, sanitizeMessageText, type PrivateMessage } from "@/game/messages";

const msg = (id: string, fromUid: string, toUid: string, createdAtMs: number, readAtMs = 0): PrivateMessage => ({
  id,
  fromUid,
  fromPseudo: fromUid.toUpperCase(),
  toUid,
  toPseudo: toUid.toUpperCase(),
  text: id,
  createdAtMs,
  readAtMs,
});

describe("private messages", () => {
  it("cleans and bounds the text", () => {
    expect(sanitizeMessageText("  salut\r\n\n\n\nça va ?  ")).toBe("salut\n\nça va ?");
    expect(() => sanitizeMessageText("   ")).toThrow("vide");
    expect(() => sanitizeMessageText("x".repeat(MESSAGE_RULES.maxLength + 1))).toThrow("trop long");
  });

  it("limits the sending rate", () => {
    expect(() => assertMessageQuota(0, 0)).not.toThrow();
    expect(() => assertMessageQuota(MESSAGE_RULES.perMinute, 0)).toThrow("minute");
    expect(() => assertMessageQuota(0, MESSAGE_RULES.perDay)).toThrow("jour");
  });

  it("groups messages by interlocutor, newest first, with unread counts", () => {
    const convs = groupConversations([msg("a", "bob", "me", 1), msg("b", "me", "bob", 2), msg("c", "eve", "me", 3), msg("d", "eve", "me", 4, 9)], "me");
    expect(convs.map((c) => [c.uid, c.pseudo, c.last.id, c.unread])).toEqual([
      ["eve", "EVE", "d", 1],
      ["bob", "BOB", "b", 1],
    ]);
  });
});
