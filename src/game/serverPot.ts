import type { ResourceId } from "@/types/game";

/* =====================================================
   v5.10 : pot commun « Serveur ». Les taxes du marché (offres et ordres
   d'achat) et la part perdue des cadeaux hors alliance n'y disparaissent
   plus : elles s'accumulent ici (game_config « server_pot ») pour de futurs
   concours ou récompenses collectives. Seule l'administration en dispose.
===================================================== */

export const SERVER_POT_KEY = "server_pot";

export type PotSource = "market" | "gift" | "auction" | "exchange" | "admin";

export const POT_SOURCE_LABELS: Record<PotSource, string> = {
  market: "Taxes du marché",
  gift: "Taxe des cadeaux",
  auction: "Taxe des enchères",
  exchange: "Taxe du comptoir d'échange",
  admin: "Administration",
};

export interface ServerPot {
  /** Solde actuel par ressource. */
  resources: Partial<Record<ResourceId, number>>;
  /** Total reçu depuis la création, par source puis ressource. */
  totals: Partial<Record<PotSource, Partial<Record<ResourceId, number>>>>;
  /** 5.26 : Ambre de Ruche (taxe des enchères en Ambre), à part des ressources :
   *  le casino et les concours ne versent que des ressources. */
  amber: number;
  /** Ambre reçue depuis la création. */
  amberTotal: number;
  /** Derniers mouvements (+ entrées, − sorties), 100 au plus. */
  log: { atMs: number; source: PotSource; resources: Partial<Record<ResourceId, number>>; amber?: number; note?: string }[];
  updatedAtMs: number;
}

export function emptyServerPot(): ServerPot {
  return { resources: {}, totals: {}, amber: 0, amberTotal: 0, log: [], updatedAtMs: 0 };
}

function cleanAmounts(raw: unknown): Partial<Record<ResourceId, number>> {
  const out: Partial<Record<ResourceId, number>> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const n = Math.floor(Number(v));
    if (Number.isFinite(n) && n !== 0) out[k as ResourceId] = n;
  }
  return out;
}

export function normalizeServerPot(raw: unknown): ServerPot {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<ServerPot>;
  const totals: ServerPot["totals"] = {};
  for (const src of Object.keys(POT_SOURCE_LABELS) as PotSource[]) {
    const t = cleanAmounts(r.totals?.[src]);
    if (Object.keys(t).length) totals[src] = t;
  }
  return {
    resources: cleanAmounts(r.resources),
    totals,
    amber: Math.max(0, Math.floor(Number(r.amber)) || 0),
    amberTotal: Math.max(0, Math.floor(Number(r.amberTotal)) || 0),
    log: (Array.isArray(r.log) ? r.log : [])
      .filter((l) => l && typeof l === "object" && (l.source as string) in POT_SOURCE_LABELS)
      .map((l) => ({ atMs: Number(l.atMs) || 0, source: l.source, resources: cleanAmounts(l.resources), ...(Number(l.amber) ? { amber: Math.floor(Number(l.amber)) } : {}), ...(l.note ? { note: String(l.note).slice(0, 200) } : {}) }))
      .slice(-100),
    updatedAtMs: Number(r.updatedAtMs) || 0,
  };
}

/** Verse des ressources dans le pot (montants positifs seulement). */
export function addToPot(pot: ServerPot, source: PotSource, amounts: Partial<Record<string, number>>, now: number, note?: string): ServerPot {
  const add: Partial<Record<ResourceId, number>> = {};
  for (const [k, v] of Object.entries(amounts)) {
    const n = Math.floor(Number(v));
    if (Number.isFinite(n) && n > 0) add[k as ResourceId] = n;
  }
  if (Object.keys(add).length === 0) return pot;
  const resources = { ...pot.resources };
  const total = { ...(pot.totals[source] ?? {}) };
  for (const [k, n] of Object.entries(add) as [ResourceId, number][]) {
    resources[k] = (resources[k] ?? 0) + n;
    total[k] = (total[k] ?? 0) + n;
  }
  return {
    ...pot,
    resources,
    totals: { ...pot.totals, [source]: total },
    log: [...pot.log, { atMs: now, source, resources: add, ...(note ? { note } : {}) }].slice(-100),
    updatedAtMs: now,
  };
}

/** Retire des ressources du pot (administration) ; jamais sous zéro. */
export function takeFromPot(pot: ServerPot, amounts: Partial<Record<string, number>>, now: number, note: string): ServerPot {
  const resources = { ...pot.resources };
  const taken: Partial<Record<ResourceId, number>> = {};
  for (const [k, v] of Object.entries(amounts)) {
    const want = Math.floor(Number(v));
    if (!Number.isFinite(want) || want <= 0) continue;
    const n = Math.min(want, resources[k as ResourceId] ?? 0);
    if (n <= 0) continue;
    resources[k as ResourceId] = (resources[k as ResourceId] ?? 0) - n;
    taken[k as ResourceId] = -n;
  }
  if (Object.keys(taken).length === 0) return pot;
  return { ...pot, resources, log: [...pot.log, { atMs: now, source: "admin" as PotSource, resources: taken, note }].slice(-100), updatedAtMs: now };
}

/** Part d'un cadeau perdue en route (versée au pot). */
export function giftTax(sent: Partial<Record<string, number>>, delivered: Partial<Record<string, number>>): Partial<Record<ResourceId, number>> {
  const out: Partial<Record<ResourceId, number>> = {};
  for (const [k, v] of Object.entries(sent)) {
    const lost = Math.floor(Number(v) || 0) - Math.floor(Number(delivered[k]) || 0);
    if (lost > 0) out[k as ResourceId] = lost;
  }
  return out;
}

/** 5.26 : verse de l'Ambre dans le pot (taxe des enchères en Ambre). */
export function addAmberToPot(pot: ServerPot, source: PotSource, amount: number, now: number, note?: string): ServerPot {
  const n = Math.floor(Number(amount));
  if (!(n > 0)) return pot;
  return {
    ...pot,
    amber: pot.amber + n,
    amberTotal: pot.amberTotal + n,
    log: [...pot.log, { atMs: now, source, resources: {}, amber: n, ...(note ? { note } : {}) }].slice(-100),
    updatedAtMs: now,
  };
}

/** Retire de l'Ambre du pot (administration) ; jamais sous zéro. Renvoie le pot et la quantité retirée. */
export function takeAmberFromPot(pot: ServerPot, amount: number, now: number, note: string): { pot: ServerPot; taken: number } {
  const n = Math.min(Math.floor(Number(amount)) || 0, pot.amber);
  if (!(n > 0)) return { pot, taken: 0 };
  return { pot: { ...pot, amber: pot.amber - n, log: [...pot.log, { atMs: now, source: "admin", resources: {}, amber: -n, note } as ServerPot["log"][number]].slice(-100), updatedAtMs: now }, taken: n };
}
