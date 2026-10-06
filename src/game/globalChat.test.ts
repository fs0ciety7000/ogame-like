import { describe, expect, it } from "vitest";
import { activeMute, addReport, cleanGlobalMessage, filterText, KESH_REACTION, mentions, parseMentions, roomEventLive, validateRoomEvent, normalizeReactions, rateLimitError, roomIcon, roomIdle, toggleReaction, validateRoom } from "@/game/globalChat";

describe("canal global", () => {
  it("masque les grossièretés, accents et casse compris, sans toucher aux mots qui les contiennent", () => {
    expect(filterText("Espèce de CONNARD !").text).toBe("Espèce de ******* !");
    expect(filterText("enculés va").text).toBe("******* va");
    expect(filterText("Le concombre est bon").masked).toBe(false);
    expect(filterText("salut spdq", ["spdq"]).text).toBe("salut ****");
  });
  it("nettoie le message", () => {
    expect(cleanGlobalMessage("  bonjour   tout\n le monde ")).toBe("bonjour tout le monde");
    expect(() => cleanGlobalMessage("   ")).toThrow();
    expect(cleanGlobalMessage("x".repeat(500))).toHaveLength(300);
  });
  it("limite la cadence", () => {
    const now = 1_000_000;
    expect(rateLimitError([now - 1000], now)).toMatch(/4 secondes/);
    expect(rateLimitError([now - 5000], now)).toBeNull();
    expect(rateLimitError(Array.from({ length: 8 }, (_, i) => now - 50_000 + i * 5000), now)).toMatch(/minute/);
  });
  it("masque à 3 signalements, un par joueur", () => {
    let r = addReport([], "a");
    r = addReport(r.reporters, "a");
    expect(r).toEqual({ reporters: ["a"], hide: false });
    r = addReport(addReport(r.reporters, "b").reporters, "c");
    expect(r.hide).toBe(true);
  });
  it("sourdine temporaire ou permanente", () => {
    expect(activeMute({ u: { untilMs: 10, reason: "x", byName: "" } }, "u", 11)).toBeNull();
    expect(activeMute({ u: { untilMs: null, reason: "x", byName: "" } }, "u", 1e15)).not.toBeNull();
  });
});

describe("5.26.2 : réactions et salons", () => {
  it("bascule une réaction et refuse les emotes hors liste", () => {
    let r = toggleReaction({}, "🔥", "a");
    r = toggleReaction(r, "🔥", "b");
    expect(r["🔥"]).toEqual(["a", "b"]);
    r = toggleReaction(r, "🔥", "a");
    expect(r["🔥"]).toEqual(["b"]);
    expect(toggleReaction(r, "🔥", "b")).toEqual({});
    expect(() => toggleReaction({}, "💩", "a")).toThrow();
    expect(normalizeReactions({ "👍": ["a", "a", 3], "x": ["b"] })).toEqual({ "👍": ["a"] });
  });

  it("5.26.3 : réaction kesh'vaar réservée aux acheteurs, mais toujours retirable ; icônes de salon filtrées", () => {
    expect(() => toggleReaction({}, KESH_REACTION, "a")).toThrow(/Comptoir/);
    const r = toggleReaction({}, KESH_REACTION, "a", true);
    expect(r[KESH_REACTION]).toEqual(["a"]);
    expect(toggleReaction(r, KESH_REACTION, "a")).toEqual({});
    expect(normalizeReactions(r)).toEqual(r);
    expect(roomIcon("skull")).toBe("skull");
    expect(roomIcon("<script>")).toBe("");
  });

  it("valide un salon (nom, filtre, doublon, plafonds) et repère les salons muets", () => {
    const ctx = { ownerOpen: 0, totalOpen: 0, names: ["Commerce"] };
    expect(validateRoom({ name: "  Chasseurs   de boss ", topic: "Raids" }, ctx)).toEqual({ name: "Chasseurs de boss", topic: "Raids" });
    expect(() => validateRoom({ name: "ab" }, ctx)).toThrow(/caractères/);
    expect(() => validateRoom({ name: "commerce" }, ctx)).toThrow(/déjà/);
    expect(() => validateRoom({ name: "Global" }, ctx)).toThrow(/déjà/);
    expect(() => validateRoom({ name: "Salle des connards" }, ctx)).toThrow(/filtre/);
    expect(() => validateRoom({ name: "Alliances" }, { ...ctx, ownerOpen: 1 })).toThrow(/ferme/);
    expect(() => validateRoom({ name: "Alliances" }, { ...ctx, totalOpen: 30 })).toThrow(/Trop/);
    expect(roomIdle({ createdAtMs: 0, lastMessageAtMs: 0 }, 15 * 86_400_000)).toBe(true);
    expect(roomIdle({ createdAtMs: 0, lastMessageAtMs: 10 * 86_400_000 }, 15 * 86_400_000)).toBe(false);
  });
});

describe("5.27 : mentions et événements de salon", () => {
  it("repère les @pseudo, sans doublon ni adresse e-mail", () => {
    expect(parseMentions("salut @Testeur et @testeur, @Bob_2 !")).toEqual(["Testeur", "Bob_2"]);
    expect(parseMentions("écris à moi@test.dev")).toEqual([]);
    expect(parseMentions("@a1 @b2 @c3 @d4 @e5 @f6 @g7".replace(/(\w\d)/g, "$1x"))).toHaveLength(5);
    expect(mentions("go @Éloïse", "éloïse")).toBe(true);
    expect(mentions("go @Eloise", "Bob")).toBe(false);
  });

  it("valide un événement : libellé, date à venir, 7 jours au plus", () => {
    const now = 1_000_000_000;
    expect(validateRoomEvent({ label: "x", atMs: 0 }, now)).toEqual({ label: "", atMs: 0 });
    expect(validateRoomEvent({ label: "  Raid de   boss ", atMs: now + 3600_000 }, now)).toEqual({ label: "Raid de boss", atMs: now + 3600_000 });
    expect(() => validateRoomEvent({ label: "ok", atMs: now + 1 }, now)).toThrow(/caractères/);
    expect(() => validateRoomEvent({ label: "Raid", atMs: now - 1 }, now)).toThrow(/à venir/);
    expect(() => validateRoomEvent({ label: "Raid", atMs: now + 8 * 86_400_000 }, now)).toThrow(/7 jours/);
    expect(roomEventLive({ eventAtMs: now }, now + 30 * 60_000)).toBe(true);
    expect(roomEventLive({ eventAtMs: now }, now + 2 * 3600_000)).toBe(false);
  });
});
