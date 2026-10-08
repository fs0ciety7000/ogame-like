/* =====================================================
   5.27 : mécènes du mois. Ambre versée au pot commun (dons au Comptoir,
   taxe des enchères payée en Ambre), cumulée par joueur sur le mois en
   cours (UTC). Le podium du mois précédent est gardé. L'état vit dans
   game_config (« patrons »), lisible par tous.
===================================================== */

export const PATRONS_KEY = "patrons";
/** 6.9.0 (AU4) : places du classement des mécènes (GameRules.patrons). */
export const PATRON_RULES = {
  top: 10,
  /** 6.14.104 (AA3, AA-9) : Ambre versée pour chaque palier du badge « Mécène » (dans l'ordre, croissant). */
  tiers: { bronze: 25, argent: 100, or: 500, grand: 2000 } as Record<"bronze" | "argent" | "or" | "grand", number>,
};

export interface PatronEntry {
  uid: string;
  pseudo: string;
  amber: number;
}

export interface PatronsState {
  /** AAAA-MM (UTC). */
  month: string;
  byUid: Record<string, { pseudo: string; amber: number }>;
  /** Podium du mois précédent. */
  last: { month: string; top: PatronEntry[] } | null;
}

const monthKey = (now: number) => new Date(now).toISOString().slice(0, 7);

/** Classement du mois, du plus généreux au moins généreux. */
export function topPatrons(state: PatronsState, n = PATRON_RULES.top): PatronEntry[] {
  return Object.entries(state.byUid)
    .map(([uid, v]) => ({ uid, pseudo: v.pseudo, amber: v.amber }))
    .filter((e) => e.amber > 0)
    .sort((a, b) => b.amber - a.amber || (a.pseudo < b.pseudo ? -1 : a.pseudo > b.pseudo ? 1 : 0))
    .slice(0, n);
}

/** Lecture tolérante ; un nouveau mois archive le podium et repart de zéro. */
export function patronsState(raw: unknown, now: number): PatronsState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<PatronsState>;
  const month = monthKey(now);
  const byUid: PatronsState["byUid"] = {};
  for (const [uid, v] of Object.entries(r.byUid ?? {})) {
    const amber = Math.max(0, Math.floor(Number(v?.amber) || 0));
    if (amber > 0) byUid[uid] = { pseudo: String(v?.pseudo ?? "").slice(0, 40), amber };
  }
  const last = r.last && typeof r.last.month === "string" && Array.isArray(r.last.top) ? { month: r.last.month, top: r.last.top.slice(0, 3) } : null;
  if (r.month && r.month !== month) return { month, byUid: {}, last: { month: r.month, top: topPatrons({ month: r.month, byUid, last: null }, 3) } };
  return { month, byUid, last };
}

export function addPatronage(raw: unknown, uid: string, pseudo: string, amber: number, now: number): PatronsState {
  const st = patronsState(raw, now);
  const n = Math.floor(Number(amber) || 0);
  if (!(n > 0) || !uid) return st;
  const cur = st.byUid[uid]?.amber ?? 0;
  return { ...st, byUid: { ...st.byUid, [uid]: { pseudo: pseudo || st.byUid[uid]?.pseudo || "?", amber: cur + n } } };
}
