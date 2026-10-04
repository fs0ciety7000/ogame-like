import type { ResourceId } from "@/types/game";

/* =====================================================
   v5.10 : pot commun « Serveur ». Les taxes du marché (offres et ordres
   d'achat) et la part perdue des cadeaux hors alliance n'y disparaissent
   plus : elles s'accumulent ici (game_config « server_pot ») pour de futurs
   concours ou récompenses collectives. Seule l'administration en dispose.
===================================================== */

export const SERVER_POT_KEY = "server_pot";

export type PotSource = "market" | "gift" | "admin";

export const POT_SOURCE_LABELS: Record<PotSource, string> = {
  market: "Taxes du marché",
  gift: "Taxe des cadeaux",
  admin: "Administration",
};

export interface ServerPot {
  /** Solde actuel par ressource. */
  resources: Partial<Record<ResourceId, number>>;
  /** Total reçu depuis la création, par source puis ressource. */
  totals: Partial<Record<PotSource, Partial<Record<ResourceId, number>>>>;
  /** Derniers mouvements (+ entrées, − sorties), 100 au plus. */
  log: { atMs: number; source: PotSource; resources: Partial<Record<ResourceId, number>>; note?: string }[];
  updatedAtMs: number;
}

export function emptyServerPot(): ServerPot {
  return { resources: {}, totals: {}, log: [], updatedAtMs: 0 };
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
    log: (Array.isArray(r.log) ? r.log : [])
      .filter((l) => l && typeof l === "object" && (l.source as string) in POT_SOURCE_LABELS)
      .map((l) => ({ atMs: Number(l.atMs) || 0, source: l.source, resources: cleanAmounts(l.resources), ...(l.note ? { note: String(l.note).slice(0, 200) } : {}) }))
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
