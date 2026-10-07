import { canDiplomacyIn } from "@/game/alliances";
import { GameActionError } from "@/game/errors";
import type { Alliance } from "@/types/game";

/* =====================================================
   Diplomatie (v3.8) : pactes de non-agression entre alliances et canal
   partagé. Un pacte proposé par le fondateur ou un officier devient actif
   quand l'autre alliance l'accepte. Rompu, il protège encore pendant le
   préavis. Tant qu'il lie les deux alliances, ni attaque ni guerre.
===================================================== */

export const DIPLOMACY_RULES = {
  /** Préavis de rupture, en heures (le pacte protège encore). */
  breakNoticeHours: 24,
  /** Pactes simultanés (proposés, actifs ou en préavis) par alliance. */
  maxPacts: 3,
  messageMax: 500,
};

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const DIPLOMACY_RULES_META = {
  breakNoticeHours: { label: "Préavis de rupture d'un pacte", unit: "h", min: 0, max: 336, hint: "Le pacte protège encore pendant le préavis." },
  maxPacts: { label: "Pactes simultanés par alliance", min: 0, max: 20, hint: "Proposés, actifs ou en préavis." },
  messageMax: { label: "Message diplomatique : longueur", unit: "caractères", min: 20, max: 5000 },
};

export type PactStatus = "proposed" | "active" | "ending" | "ended" | "declined" | "cancelled";

export interface AlliancePact {
  id: string;
  allianceA: string;
  allianceB: string;
  tagA: string;
  tagB: string;
  nameA: string;
  nameB: string;
  status: PactStatus;
  /** Alliance qui a proposé (A). */
  proposedByUid: string;
  proposedByPseudo: string;
  createdAtMs: number;
  acceptedAtMs: number;
  /** Fin du préavis (rupture), 0 sinon. */
  endsAtMs: number;
  brokenByTag: string;
}

type Pact = Omit<AlliancePact, "id">;
type AllianceInfo = Pick<Alliance, "id" | "tag" | "name" | "createdBy" | "members" | "roles" | "profile">;

const HOUR = 3_600_000;

/** Statut réel à `now` (un préavis échu termine le pacte). */
export function pactStatusAt(p: Pick<AlliancePact, "status" | "endsAtMs">, now: number): PactStatus {
  return p.status === "ending" && p.endsAtMs > 0 && now >= p.endsAtMs ? "ended" : p.status;
}

/** Le pacte interdit-il les attaques entre les deux alliances à `now` ? */
export function pactBinds(p: Pick<AlliancePact, "status" | "endsAtMs">, now: number): boolean {
  const s = pactStatusAt(p, now);
  return s === "active" || s === "ending";
}

/** Relation encore ouverte (comptée dans la limite, canal disponible). */
export function pactOpen(p: Pick<AlliancePact, "status" | "endsAtMs">, now: number): boolean {
  const s = pactStatusAt(p, now);
  return s === "proposed" || s === "active" || s === "ending";
}

export function involves(p: Pick<AlliancePact, "allianceA" | "allianceB">, allianceId: string): boolean {
  return p.allianceA === allianceId || p.allianceB === allianceId;
}

/** Pacte qui lie les deux alliances, ou null. */
export function bindingPactBetween<T extends Pick<AlliancePact, "allianceA" | "allianceB" | "status" | "endsAtMs">>(pacts: T[], a: string, b: string, now: number): T | null {
  if (!a || !b || a === b) return null;
  return pacts.find((p) => involves(p, a) && involves(p, b) && pactBinds(p, now)) ?? null;
}

function assertLeader(alliance: AllianceInfo, uid: string, what: string) {
  if (!canDiplomacyIn(alliance, uid)) throw new GameActionError(`Seuls le fondateur, les officiers et les diplomates peuvent ${what}.`);
}

export function proposePact(input: { actorUid: string; actorPseudo: string; own: AllianceInfo; target: AllianceInfo; pacts: Pact[]; atWar: boolean; now: number }): Pact {
  const { own, target, pacts, now } = input;
  assertLeader(own, input.actorUid, "proposer un pacte");
  if (own.id === target.id) throw new GameActionError("Impossible de signer un pacte avec sa propre alliance.");
  if (input.atWar) throw new GameActionError(`Vous êtes en guerre contre [${target.tag}] : la paix d'abord.`);
  if (pacts.some((p) => involves(p, own.id) && involves(p, target.id) && pactOpen(p, now))) throw new GameActionError(`Une relation est déjà en cours avec [${target.tag}].`);
  const count = (id: string) => pacts.filter((p) => involves(p, id) && pactOpen(p, now)).length;
  if (count(own.id) >= DIPLOMACY_RULES.maxPacts) throw new GameActionError(`${DIPLOMACY_RULES.maxPacts} pactes au plus par alliance.`);
  if (count(target.id) >= DIPLOMACY_RULES.maxPacts) throw new GameActionError(`[${target.tag}] a déjà ${DIPLOMACY_RULES.maxPacts} pactes.`);
  return {
    allianceA: own.id,
    allianceB: target.id,
    tagA: own.tag,
    tagB: target.tag,
    nameA: own.name,
    nameB: target.name,
    status: "proposed",
    proposedByUid: input.actorUid,
    proposedByPseudo: input.actorPseudo,
    createdAtMs: now,
    acceptedAtMs: 0,
    endsAtMs: 0,
    brokenByTag: "",
  };
}

/** Réponse de l'alliance invitée (B) ou retrait de la proposante (A). */
export function answerPact(pact: Pact, own: AllianceInfo, actorUid: string, answer: "accept" | "decline" | "cancel", now: number): Pact {
  if (pactStatusAt(pact, now) !== "proposed") throw new GameActionError("Ce pacte n'est plus en attente.");
  if (answer === "cancel") {
    if (own.id !== pact.allianceA) throw new GameActionError("Seule l'alliance qui a proposé peut retirer sa proposition.");
    assertLeader(own, actorUid, "retirer une proposition");
    return { ...pact, status: "cancelled" };
  }
  if (own.id !== pact.allianceB) throw new GameActionError("Seule l'alliance invitée peut répondre.");
  assertLeader(own, actorUid, "répondre à un pacte");
  return answer === "accept" ? { ...pact, status: "active", acceptedAtMs: now } : { ...pact, status: "declined" };
}

export function breakPact(pact: Pact, own: AllianceInfo, actorUid: string, now: number): Pact {
  if (!involves(pact, own.id)) throw new GameActionError("Ce pacte ne concerne pas ton alliance.");
  if (pactStatusAt(pact, now) !== "active") throw new GameActionError("Ce pacte n'est pas actif.");
  assertLeader(own, actorUid, "rompre un pacte");
  return { ...pact, status: "ending", endsAtMs: now + DIPLOMACY_RULES.breakNoticeHours * HOUR, brokenByTag: own.tag };
}

export function sanitizePactMessage(raw: unknown): string {
  const text = String(raw ?? "").trim();
  if (!text) throw new GameActionError("Message vide.");
  if (text.length > DIPLOMACY_RULES.messageMax) throw new GameActionError(`Message trop long (${DIPLOMACY_RULES.messageMax} caractères max).`);
  return text;
}
