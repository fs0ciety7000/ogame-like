/* =====================================================
   5.26 : canal global du serveur (page Communications).
   - Filtre : grossièretés masquées par le serveur (liste de base +
     mots ajoutés par l'équipe), insensible aux accents et à la casse.
   - Cadence : un message toutes les 4 s, 8 par minute au plus.
   - Signalement : masqué d'office à 3 signalements, en attente de l'équipe.
   - Sourdine : l'équipe peut retirer la parole (durée, motif) ; chaque
     joueur peut aussi masquer quelqu'un chez lui.
===================================================== */

export const GLOBAL_CHAT_RULES = {
  maxLength: 300,
  cooldownMs: 4000,
  perMinute: 8,
  reportsToHide: 3,
  /** Messages gardés en base (les plus anciens sont effacés). */
  keep: 500,
  /** Messages chargés à l'ouverture. */
  page: 60,
};

export const CHAT_MODERATION_KEYS = { mutes: "chat_mutes", filter: "chat_filter" } as const;

/** Liste de base (mots entiers ; variantes au pluriel couvertes par le « s? »). */
export const BASE_FILTER = ["connard", "connasse", "salope", "encule", "enculé", "pute", "batard", "bâtard", "fdp", "ntm", "nique", "pd", "tapette", "negro", "bougnoule", "youpin"];

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Masque les mots interdits (étoiles de même longueur). */
export function filterText(text: string, extra: readonly string[] = []): { text: string; masked: boolean } {
  const words = [...new Set([...BASE_FILTER, ...extra].map(fold).filter((w) => w.length >= 2))];
  if (words.length === 0) return { text, masked: false };
  const folded = fold(text);
  const marks = new Array(text.length).fill(false);
  for (const w of words) {
    const re = new RegExp(`(^|[^a-z0-9])(${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}s?)(?=$|[^a-z0-9])`, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(folded))) {
      const start = m.index + m[1].length;
      for (let i = start; i < start + m[2].length; i++) marks[i] = true;
      if (re.lastIndex === m.index) re.lastIndex++;
    }
  }
  // Le texte replié garde la longueur de l'original pour les lettres latines courantes.
  if (folded.length !== text.length) return { text, masked: false };
  const out = [...text].map((c, i) => (marks[i] ? "*" : c)).join("");
  return { text: out, masked: out !== text };
}

/** Nettoie et vérifie un message avant envoi. */
export function cleanGlobalMessage(raw: unknown): string {
  const text = String(raw ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, GLOBAL_CHAT_RULES.maxLength);
  if (!text) throw new Error("Message vide.");
  return text;
}

/** Cadence d'envoi : refuse si trop rapproché (renvoie le message d'erreur, ou null). */
export function rateLimitError(recentSentAtMs: number[], now: number): string | null {
  const last = Math.max(0, ...recentSentAtMs);
  if (now - last < GLOBAL_CHAT_RULES.cooldownMs) return "Doucement : un message toutes les 4 secondes.";
  if (recentSentAtMs.filter((t) => now - t < 60_000).length >= GLOBAL_CHAT_RULES.perMinute) return "Trop de messages en une minute : patiente un peu.";
  return null;
}

export interface ChatMute {
  untilMs: number | null;
  reason: string;
  byName: string;
}
export type ChatMutes = Record<string, ChatMute>;

export function normalizeMutes(raw: unknown): ChatMutes {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: ChatMutes = {};
  for (const [uid, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!v || typeof v !== "object") continue;
    const r = v as Record<string, unknown>;
    out[uid] = { untilMs: r.untilMs === null ? null : Number(r.untilMs) || 0, reason: String(r.reason ?? "").slice(0, 200), byName: String(r.byName ?? "").slice(0, 60) };
  }
  return out;
}

export function activeMute(mutes: ChatMutes, uid: string, now: number): ChatMute | null {
  const m = mutes[uid];
  return m && (m.untilMs === null || m.untilMs > now) ? m : null;
}

export function normalizeFilter(raw: unknown): string[] {
  const words = (raw as { words?: unknown } | null)?.words;
  return (Array.isArray(words) ? words : []).map((w) => String(w).trim().slice(0, 40)).filter(Boolean).slice(0, 200);
}

/** Signalement : ajoute le joueur (une fois) et dit s'il faut masquer le message. */
export function addReport(reporters: unknown, uid: string): { reporters: string[]; hide: boolean } {
  const list = (Array.isArray(reporters) ? reporters : []).filter((x): x is string => typeof x === "string");
  const next = list.includes(uid) ? list : [...list, uid];
  return { reporters: next, hide: next.length >= GLOBAL_CHAT_RULES.reportsToHide };
}

/* ---------- 5.26.2 : réactions emote et salons thématiques ---------- */

/** Réactions proposées sous un message (jeu fixe : lisible et modérable). */
export const CHAT_REACTIONS = ["👍", "😂", "🔥", "😮", "😢", "👏"] as const;
export type ChatReactions = Partial<Record<string, string[]>>;

export function normalizeReactions(raw: unknown): ChatReactions {
  const out: ChatReactions = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const e of CHAT_REACTIONS) {
    const list = (raw as Record<string, unknown>)[e];
    if (Array.isArray(list)) {
      const uids = [...new Set(list.filter((x): x is string => typeof x === "string"))].slice(0, 200);
      if (uids.length) out[e] = uids;
    }
  }
  return out;
}

/** Ajoute ou retire la réaction d'un joueur. */
export function toggleReaction(raw: unknown, emoji: string, uid: string): ChatReactions {
  if (!(CHAT_REACTIONS as readonly string[]).includes(emoji)) throw new Error("Réaction inconnue.");
  const r = normalizeReactions(raw);
  const list = r[emoji] ?? [];
  const next = list.includes(uid) ? list.filter((x) => x !== uid) : [...list, uid];
  if (next.length) r[emoji] = next;
  else delete r[emoji];
  return r;
}

export const CHAT_ROOM_RULES = {
  nameMin: 3,
  nameMax: 24,
  topicMax: 120,
  /** Salons ouverts par joueur, et sur tout le serveur. */
  perOwner: 1,
  maxOpen: 30,
  /** Un salon sans message depuis N jours se ferme tout seul. */
  idleDays: 14,
};

export interface ChatRoom {
  id: string;
  name: string;
  topic: string;
  ownerUid: string;
  ownerPseudo: string;
  createdAtMs: number;
  lastMessageAtMs: number;
  closed: boolean;
}

/** Vérifie un nouveau salon (nom filtré, plafonds par joueur et serveur). */
export function validateRoom(raw: unknown, ctx: { ownerOpen: number; totalOpen: number; names: string[]; extraFilter?: readonly string[] }): { name: string; topic: string } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const name = String(r.name ?? "").replace(/\s+/g, " ").trim();
  const topic = String(r.topic ?? "").replace(/\s+/g, " ").trim().slice(0, CHAT_ROOM_RULES.topicMax);
  if (name.length < CHAT_ROOM_RULES.nameMin || name.length > CHAT_ROOM_RULES.nameMax) throw new Error(`Nom du salon : ${CHAT_ROOM_RULES.nameMin} à ${CHAT_ROOM_RULES.nameMax} caractères.`);
  if (filterText(name, ctx.extraFilter).masked || filterText(topic, ctx.extraFilter).masked) throw new Error("Nom ou sujet refusé par le filtre du canal.");
  if (ctx.names.some((n) => fold(n) === fold(name)) || fold(name) === "global") throw new Error("Un salon porte déjà ce nom.");
  if (ctx.ownerOpen >= CHAT_ROOM_RULES.perOwner) throw new Error("Tu as déjà un salon ouvert : ferme-le d'abord.");
  if (ctx.totalOpen >= CHAT_ROOM_RULES.maxOpen) throw new Error("Trop de salons ouverts sur le serveur pour l'instant.");
  return { name, topic };
}

/** Salon resté muet trop longtemps (fermeture automatique). */
export function roomIdle(room: Pick<ChatRoom, "createdAtMs" | "lastMessageAtMs">, now: number): boolean {
  return now - Math.max(room.createdAtMs, room.lastMessageAtMs) > CHAT_ROOM_RULES.idleDays * 86_400_000;
}
