/* =====================================================
   5.26 : modération des comptes. Un bannissement est permanent
   (untilMs null) ou temporaire, toujours motivé. Tant qu'il court, le
   serveur refuse la connexion et toutes les requêtes du joueur ; à
   l'échéance il tombe tout seul. Liste gardée dans la collection
   `moderation` (lecture réservée à l'équipe).
===================================================== */

export const MODERATION_KEYS = { bans: "bans" } as const;

export interface BanEntry {
  uid: string;
  pseudo: string;
  /** null = permanent. */
  untilMs: number | null;
  reason: string;
  byName: string;
  atMs: number;
}

export type BanList = Record<string, BanEntry>;

export const BAN_DURATIONS: { label: string; hours: number | null }[] = [
  { label: "24 h", hours: 24 },
  { label: "3 jours", hours: 72 },
  { label: "7 jours", hours: 168 },
  { label: "30 jours", hours: 720 },
  { label: "Permanent", hours: null },
];

const MAX_REASON = 300;

export function normalizeBans(raw: unknown): BanList {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: BanList = {};
  for (const [uid, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!v || typeof v !== "object") continue;
    const r = v as Record<string, unknown>;
    const until = Number(r.untilMs);
    out[uid] = {
      uid,
      pseudo: typeof r.pseudo === "string" ? r.pseudo.slice(0, 40) : "",
      untilMs: r.untilMs === null || r.untilMs === undefined ? null : Number.isFinite(until) ? until : null,
      reason: typeof r.reason === "string" ? r.reason.slice(0, MAX_REASON) : "",
      byName: typeof r.byName === "string" ? r.byName.slice(0, 60) : "",
      atMs: Number(r.atMs) || 0,
    };
  }
  return out;
}

/** Bannissement en cours pour ce joueur (null s'il n'y en a pas ou s'il est échu). */
export function activeBan(bans: BanList, uid: string, now: number): BanEntry | null {
  const b = bans[uid];
  if (!b) return null;
  return b.untilMs === null || b.untilMs > now ? b : null;
}

/** Nouveau bannissement (remplace le précédent). `hours` nul = permanent. */
export function banPlayer(bans: BanList, input: { uid: string; pseudo: string; hours: number | null; reason: string; byName: string }, now: number): BanList {
  const reason = input.reason.trim();
  if (!input.uid) throw new Error("Joueur manquant.");
  if (reason.length < 5) throw new Error("Indique un motif (5 caractères au moins).");
  if (input.hours !== null && !(input.hours > 0 && input.hours <= 24 * 3650)) throw new Error("Durée invalide.");
  const entry: BanEntry = {
    uid: input.uid,
    pseudo: input.pseudo.slice(0, 40),
    untilMs: input.hours === null ? null : Math.round(now + input.hours * 3_600_000),
    reason: reason.slice(0, MAX_REASON),
    byName: input.byName.slice(0, 60),
    atMs: now,
  };
  return { ...bans, [input.uid]: entry };
}

export function unbanPlayer(bans: BanList, uid: string): BanList {
  const next = { ...bans };
  delete next[uid];
  return next;
}

/** Retire les bannissements échus (liste tenue courte). */
export function pruneBans(bans: BanList, now: number): BanList {
  const out: BanList = {};
  for (const [uid, b] of Object.entries(bans)) if (activeBan(bans, uid, now) || now - (b.untilMs ?? now) < 30 * 86_400_000) out[uid] = b;
  return out;
}

/** Requêtes encore permises à un joueur banni : de quoi afficher l'écran de bannissement. */
export function allowedWhileBanned(method: string, path: string): boolean {
  if (path === "/api/cosmic/ban/me" || path === "/api/cosmic/status" || path === "/api/health") return true;
  if (path.indexOf("/api/realtime") === 0) return true;
  return method === "GET" && /^\/api\/collections\/game_config\/records/.test(path);
}

/** Message affiché au joueur. */
export function banMessage(b: BanEntry): string {
  return b.untilMs === null ? `Compte banni définitivement. Motif : ${b.reason}` : `Compte suspendu jusqu'au ${new Date(b.untilMs).toISOString().slice(0, 16).replace("T", " ")} (UTC). Motif : ${b.reason}`;
}
