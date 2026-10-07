import { GameActionError } from "@/game/errors";

/* =====================================================
   Messagerie privée (v3.7) : règles partagées client / serveur.
===================================================== */

export const MESSAGE_RULES = {
  maxLength: 1000,
  /** Messages envoyés au plus par minute et par jour (anti-spam). */
  perMinute: 8,
  perDay: 300,
};

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const MESSAGE_RULES_META = {
  maxLength: { label: "Longueur d'un message privé", unit: "caractères", min: 50, max: 10_000 },
  perMinute: { label: "Messages par minute, au plus", min: 1, max: 120 },
  perDay: { label: "Messages par jour, au plus", min: 1, max: 10_000 },
};

/** Texte nettoyé, ou erreur si vide ou trop long. */
export function sanitizeMessageText(raw: unknown): string {
  const text = String(raw ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!text) throw new GameActionError("Message vide.");
  if (text.length > MESSAGE_RULES.maxLength) throw new GameActionError(`Message trop long (${MESSAGE_RULES.maxLength} caractères max).`);
  return text;
}

/** Erreur si l'expéditeur a dépassé son quota. */
export function assertMessageQuota(lastMinute: number, lastDay: number): void {
  if (lastMinute >= MESSAGE_RULES.perMinute) throw new GameActionError("Tu envoies trop de messages : patiente une minute.");
  if (lastDay >= MESSAGE_RULES.perDay) throw new GameActionError("Quota de messages du jour atteint.");
}

export interface PrivateMessage {
  id: string;
  fromUid: string;
  fromPseudo: string;
  toUid: string;
  toPseudo: string;
  text: string;
  createdAtMs: number;
  readAtMs: number;
}

export interface Conversation {
  uid: string;
  pseudo: string;
  last: PrivateMessage;
  unread: number;
}

/** Conversations (une par interlocuteur), la plus récente d'abord. */
export function groupConversations(messages: PrivateMessage[], me: string): Conversation[] {
  const byUid = new Map<string, Conversation>();
  for (const m of [...messages].sort((a, b) => b.createdAtMs - a.createdAtMs)) {
    const mine = m.fromUid === me;
    const uid = mine ? m.toUid : m.fromUid;
    const pseudo = mine ? m.toPseudo : m.fromPseudo;
    let conv = byUid.get(uid);
    if (!conv) {
      conv = { uid, pseudo, last: m, unread: 0 };
      byUid.set(uid, conv);
    }
    if (!mine && !m.readAtMs) conv.unread += 1;
  }
  return [...byUid.values()];
}

/** 5.26.2 : une conversation archivée reste cachée tant qu'aucun message n'arrive après l'archivage. */
export function isConversationArchived(conv: Pick<Conversation, "uid" | "last">, archive: Record<string, number> | undefined): boolean {
  const at = archive?.[conv.uid];
  return !!at && conv.last.createdAtMs <= at;
}

/** Archive (ou ressort) une conversation ; 100 conversations archivées au plus. */
export function setConversationArchived(archive: Record<string, number> | undefined, uid: string, archived: boolean, now: number): Record<string, number> {
  const next = { ...(archive ?? {}) };
  if (archived) next[uid] = now;
  else delete next[uid];
  const keys = Object.keys(next).sort((a, b) => next[b] - next[a]);
  for (const k of keys.slice(100)) delete next[k];
  return next;
}

