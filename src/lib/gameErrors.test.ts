import { describe, expect, it } from "vitest";
import { GAME_ERROR_TEXTS, gameErrorText, isGameMessage, isServerFault } from "@/lib/gameErrors";

/* 6.14.112 (AU27, AC-16) : erreurs du serveur traduites. */

describe("gameErrorText", () => {
  it("garde le message du jeu (français) quel que soit le statut, sauf 500", () => {
    expect(gameErrorText(403, "Le pseudo se change depuis ton profil.")).toBe("Le pseudo se change depuis ton profil.");
    expect(gameErrorText(409, "Cette offre vient d'être prise.")).toBe("Cette offre vient d'être prise.");
    expect(gameErrorText(503, "Le jeu est en maintenance : réessaie à la réouverture.")).toMatch(/maintenance/);
    expect(gameErrorText(400, "Ressources insuffisantes.")).toBe("Ressources insuffisantes.");
    expect(gameErrorText(500, "TypeError: x is undefined")).toBe(GAME_ERROR_TEXTS.server);
  });

  it("remplace un message générique de PocketBase (anglais) ou absent par un texte clair", () => {
    expect(gameErrorText(403, "You are not allowed to perform this request.")).toBe(GAME_ERROR_TEXTS.forbidden);
    expect(gameErrorText(429, "Too Many Requests.")).toBe(GAME_ERROR_TEXTS.tooMany);
    expect(gameErrorText(409, undefined)).toBe(GAME_ERROR_TEXTS.conflict);
    expect(gameErrorText(503, "")).toBe(GAME_ERROR_TEXTS.restarting);
    expect(gameErrorText(0, "Something went wrong while processing your request.")).toBe(GAME_ERROR_TEXTS.network);
    expect(gameErrorText(400, "Something went wrong while processing your request.")).toBe(GAME_ERROR_TEXTS.badRequest);
    expect(isGameMessage("Failed to load the collection.")).toBe(false);
  });

  it("seules les vraies erreurs du serveur partent à l'équipe", () => {
    expect(isServerFault(500)).toBe(true);
    expect(isServerFault(502)).toBe(false);
    expect(isServerFault(503)).toBe(false);
    expect(isServerFault(403)).toBe(false);
  });
});
