import { afterEach, describe, expect, it } from "vitest";
import { performPlayerAction } from "@/game/actions";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { storageCapacityOf } from "@/game/economy";
import { flushState } from "@/game/flush";
import { REGISTERED_RULES } from "@/game/ruleRegistry";
import { overflowOfGain, overflowSentence, STORAGE_OVERFLOW_RULES, storageOverflowView } from "@/game/storageOverflow";
import type { PlayerState, QueuesState } from "@/types/game";

/* 6.14.155 (revue AU28, lot R8 / AE-L8, constat AE-14) : gains versés au-delà de l'entrepôt, dits au joueur.
   Le versement ne change pas (I6 : versé en entier, stock gardé, production arrêtée) ; la ligne du Journal le dit. */

const NOW = Date.UTC(2026, 9, 20, 10);
const DEFAULTS = structuredClone(STORAGE_OVERFLOW_RULES);
afterEach(() => {
  Object.assign(STORAGE_OVERFLOW_RULES, structuredClone(DEFAULTS));
});

function fresh(): { p: PlayerState; q: QueuesState } {
  const p = defaultPlayerState("u1", "Plein") as PlayerState;
  p.createdAtMs = NOW - 30 * 86_400_000;
  return { p, q: defaultQueues() as QueuesState };
}

describe("6.14.155 (R8) : récompense au-delà de l'entrepôt", () => {
  it("le versement est inchangé (I6) : la récompense de série passe au-dessus de la capacité, et le Journal le dit", () => {
    const { p, q } = fresh();
    const cap = storageCapacityOf(p);
    p.resources = { ...p.resources, scrap: cap, energy: cap, nano: cap, data: cap };
    const out = performPlayerAction(p, q, { type: "streakClaim" }, NOW);
    const note = out.notifications.find((n) => n.title === "Récompense de série récupérée");
    expect(note).toBeTruthy();
    // Stock versé en entier, au-dessus de la capacité.
    expect(out.player.resources.scrap).toBeGreaterThan(cap);
    const gained = Math.floor(out.player.resources.scrap - cap);
    expect(note!.message).toContain("Au-delà de l'entrepôt");
    expect(note!.data?.overflow?.scrap).toBe(gained);
    expect(note!.data?.resources?.scrap).toBe(gained);
  });

  it("sous la capacité : aucune ligne, aucun champ `overflow`", () => {
    const { p, q } = fresh();
    p.resources = { ...p.resources, scrap: 0, energy: 0, nano: 0, data: 0 };
    const out = performPlayerAction(p, q, { type: "streakClaim" }, NOW);
    const note = out.notifications.find((n) => n.title === "Récompense de série récupérée")!;
    expect(note.message).not.toContain("Au-delà");
    expect(note.data?.overflow).toBeUndefined();
  });

  it("seule la part au-dessus de la capacité est comptée", () => {
    const { p } = fresh();
    const cap = storageCapacityOf(p);
    p.resources = { ...p.resources, scrap: cap + 4_000, energy: cap - 10_000 };
    const over = overflowOfGain(p, { scrap: 10_000, energy: 5_000, reinforcedSteel: 50 });
    expect(over).toEqual({ scrap: 4_000 });
    expect(overflowSentence(over)).toBe("Au-delà de l'entrepôt : 4\u202f000 ferraille. Leur production est arrêtée tant que tu n'as pas dépensé ce surplus.");
  });

  it("une mission terminée au-delà de l'entrepôt le dit aussi (rattrapage, notification non lue)", () => {
    const { p, q } = fresh();
    const cap = storageCapacityOf(p);
    p.resources = { ...p.resources, scrap: cap };
    q.activeMissions = [{ key: "forage_profond", endTime: NOW - 1000 }];
    const out = flushState(p, q, NOW);
    const note = out.notifications.find((n) => n.title === "Mission terminée")!;
    expect(note.message).toContain("Au-delà de l'entrepôt");
    expect((note.data?.overflow?.scrap ?? 0) > 0).toBe(true);
    expect(out.player.resources.scrap).toBeGreaterThan(cap);
  });

  it("réglable : désactivé, seuil et texte viennent des règles (registre, Tous les réglages)", () => {
    expect(REGISTERED_RULES.storageOverflow.target()).toBe(STORAGE_OVERFLOW_RULES);
    const { p } = fresh();
    const cap = storageCapacityOf(p);
    p.resources = { ...p.resources, scrap: cap + 500 };
    expect(overflowOfGain(p, { scrap: 500 })).toEqual({}); // sous le seuil de 1 000
    STORAGE_OVERFLOW_RULES.minAmount = 0;
    expect(overflowOfGain(p, { scrap: 500 })).toEqual({ scrap: 500 });
    STORAGE_OVERFLOW_RULES.journalText = "Trop plein : {list}.";
    expect(overflowSentence({ scrap: 500 })).toBe("Trop plein : 500 ferraille.");
    STORAGE_OVERFLOW_RULES.enabled = false;
    expect(overflowOfGain(p, { scrap: 500 })).toEqual({});
    expect(storageOverflowView(p).any).toBe(false);
  });

  it("carte « Ce que tu risques » : stock au-delà de la capacité, par ressource commune", () => {
    const { p } = fresh();
    const cap = storageCapacityOf(p);
    p.resources = { ...p.resources, scrap: cap + 2_500, energy: cap, nano: 0, data: 0 };
    const v = storageOverflowView(p);
    expect(v.capacity).toBe(cap);
    expect(v.over).toEqual({ scrap: 2_500 });
    expect(v.any).toBe(true);
  });
});
