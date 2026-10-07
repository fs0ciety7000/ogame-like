import { beforeEach, describe, expect, it } from "vitest";
import { applyGameContent } from "@/game/content";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { adminEditCount, adminEditDiff, applyAdminEdit } from "@/game/adminEdit";
import { storageCapacityOf } from "@/game/economy";
import { hangarLoad } from "@/game/hangar";
import { GameActionError } from "@/game/errors";
import type { PlayerState } from "@/types/game";

/* 6.14.65 (AC-B, revue AU27) : l'éditeur admin n'envoie que des différences, appliquées sur la fiche fraîche. */

const NOW = Date.UTC(2026, 9, 7, 12);
const player = (): PlayerState => ({ ...defaultPlayerState("t", "Testeur"), createdAt: NOW }) as PlayerState;

beforeEach(() => applyGameContent({}));

describe("6.14.65 édition admin par différences", () => {
  it("diff : seuls les champs changés partent, en écarts", () => {
    const a = player();
    a.resources = { ...a.resources, scrap: 1000 };
    a.units = { chasseur: { level: 1, count: 4 } };
    const b = structuredClone(a);
    expect(adminEditDiff(a, b)).toEqual({});
    b.resources.scrap = 1500;
    b.units.chasseur = { level: 2, count: 3 };
    b.buildings.extracteur_ferraille = { ...b.buildings.extracteur_ferraille, level: b.buildings.extracteur_ferraille.level + 2 };
    b.techLevels = { ...b.techLevels, tech1: 1 };
    b.xp = (a.xp ?? 0) + 10;
    const d = adminEditDiff(a, b);
    expect(d).toEqual({ xp: 10, resources: { scrap: 500 }, units: { chasseur: { level: 1, count: -1 } }, buildings: { extracteur_ferraille: { level: 2 } }, techLevels: { tech1: 1 } });
    expect(adminEditCount(d)).toBe(6);
  });

  it("les écarts s'appliquent sur l'état frais, pas sur l'instantané de l'éditeur", () => {
    const opened = player();
    opened.resources = { ...opened.resources, scrap: 1000 };
    opened.units = { chasseur: { level: 1, count: 4 } };
    const draft = structuredClone(opened);
    draft.resources.scrap = 1500;
    draft.units.chasseur.count = 3;
    // Entre-temps, le joueur a dépensé 400 ferraille et construit 6 chasseurs.
    const fresh = structuredClone(opened);
    fresh.resources.scrap = 600;
    fresh.units.chasseur.count = 10;
    const out = applyAdminEdit(fresh, defaultQueues(), {}, adminEditDiff(opened, draft), NOW);
    expect(fresh.resources.scrap).toBe(1100);
    expect(fresh.units.chasseur.count).toBe(9);
    expect(out.changes["resources.scrap"]).toEqual({ avant: 600, après: 1100 });
  });

  it("un retrait plus grand que le stock s'arrête à 0", () => {
    const p = player();
    p.resources = { ...p.resources, scrap: 100 };
    p.xp = 5;
    applyAdminEdit(p, defaultQueues(), {}, { resources: { scrap: -500 }, xp: -50 }, NOW);
    expect(p.resources.scrap).toBe(0);
    expect(p.xp).toBe(0);
  });

  it("plafonds : entrepôt (une ressource commune), niveaux maximaux, hangar", () => {
    const p = player();
    const cap = storageCapacityOf(p);
    p.resources = { ...p.resources, scrap: 0 };
    expect(() => applyAdminEdit(structuredClone(p), defaultQueues(), {}, { resources: { scrap: cap + 1 } }, NOW)).toThrow(/Entrepôt/);
    const ok = structuredClone(p);
    applyAdminEdit(ok, defaultQueues(), {}, { resources: { scrap: cap } }, NOW);
    expect(ok.resources.scrap).toBe(cap);
    expect(() => applyAdminEdit(structuredClone(p), defaultQueues(), {}, { buildings: { extracteur_ferraille: { level: 10_000 } } }, NOW)).toThrow(/hors limites/);
    expect(() => applyAdminEdit(structuredClone(p), defaultQueues(), {}, { techLevels: { tech1: -5 } }, NOW)).toThrow(/hors limites/);
    const free = hangarLoad(p, defaultQueues(), {}, "attack", NOW).free;
    expect(() => applyAdminEdit(structuredClone(p), defaultQueues(), {}, { units: { chasseur: { count: free + 1_000_000 } } }, NOW)).toThrow(/Hangar d'attaque/);
    // Les vaisseaux en vol occupent leur place.
    const room = structuredClone(p);
    expect(() => applyAdminEdit(room, defaultQueues(), { chasseur: free }, { units: { chasseur: { count: 1 } } }, NOW)).toThrow(/Hangar d'attaque/);
  });

  it("une surcharge existante n'empêche pas un retrait", () => {
    const p = player();
    const cap = hangarLoad(p, defaultQueues(), {}, "attack", NOW).capacity;
    p.units = { chasseur: { level: 1, count: cap + 50 } };
    applyAdminEdit(p, defaultQueues(), {}, { units: { chasseur: { count: -10 } } }, NOW);
    expect(p.units.chasseur.count).toBe(cap + 40);
  });

  it("refus : identifiant inconnu, valeur invalide, rien à changer", () => {
    const p = player();
    expect(() => applyAdminEdit(p, defaultQueues(), {}, { resources: { or: 5 } }, NOW)).toThrow(GameActionError);
    expect(() => applyAdminEdit(p, defaultQueues(), {}, { units: { inconnu: { count: 1 } } }, NOW)).toThrow(/Unité inconnue/);
    expect(() => applyAdminEdit(p, defaultQueues(), {}, { xp: "beaucoup" }, NOW)).toThrow(/invalide/);
    expect(() => applyAdminEdit(p, defaultQueues(), {}, {}, NOW)).toThrow(/Aucune modification/);
  });
});
