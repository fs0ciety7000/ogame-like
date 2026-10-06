import type { ResourceId } from "@/types/game";
import { RESOURCE_LIST } from "@/game/resources";

/* =====================================================
   v5.10 : pot commun « Serveur ». Les taxes du marché (offres et ordres
   d'achat) et la part perdue des cadeaux hors alliance n'y disparaissent
   plus : elles s'accumulent ici (game_config « server_pot ») pour de futurs
   concours ou récompenses collectives. Seule l'administration en dispose.
===================================================== */

export const SERVER_POT_KEY = "server_pot";

export type PotSource = "market" | "gift" | "auction" | "exchange" | "donation" | "admin";

export const POT_SOURCE_LABELS: Record<PotSource, string> = {
  market: "Taxes du marché",
  gift: "Taxe des cadeaux",
  auction: "Taxe des enchères",
  exchange: "Taxe du comptoir d'échange",
  donation: "Dons des mécènes",
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
  /** 5.26.3 : Ambre reçue par source (enchères, dons des mécènes). */
  amberTotals?: Partial<Record<PotSource, number>>;
  /** 5.26.2 : entrées par jour (AAAA-MM-JJ, UTC) et par source, en équivalent ressource
   *  commune (une rare = 50), 30 jours glissants. L'Ambre a sa propre colonne. */
  daily?: Record<string, Partial<Record<PotSource | "amber", number>>>;
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

export const POT_DAILY_DAYS = 30;
/** Valeur d'une ressource rare en ressource commune (taux du comptoir). */
const RARE_WEIGHT = 50;

const dayOf = (now: number) => new Date(now).toISOString().slice(0, 10);

function normalizeDaily(raw: unknown): NonNullable<ServerPot["daily"]> {
  const out: NonNullable<ServerPot["daily"]> = {};
  if (!raw || typeof raw !== "object") return out;
  const keys = [...Object.keys(POT_SOURCE_LABELS), "amber"];
  for (const day of Object.keys(raw as object).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().slice(-POT_DAILY_DAYS)) {
    const row = (raw as Record<string, Record<string, unknown>>)[day] ?? {};
    const clean: Partial<Record<PotSource | "amber", number>> = {};
    for (const k of keys) {
      const n = Math.floor(Number(row[k]));
      if (n > 0) clean[k as PotSource] = n;
    }
    out[day] = clean;
  }
  return out;
}

/** Ajoute une entrée à l'agrégat du jour (30 jours gardés). */
function bumpDaily(pot: ServerPot, key: PotSource | "amber", value: number, now: number): ServerPot["daily"] {
  if (!(value > 0)) return pot.daily;
  const day = dayOf(now);
  const daily = { ...(pot.daily ?? {}) };
  daily[day] = { ...(daily[day] ?? {}), [key]: (daily[day]?.[key] ?? 0) + Math.floor(value) };
  const days = Object.keys(daily).sort();
  for (const d of days.slice(0, Math.max(0, days.length - POT_DAILY_DAYS))) delete daily[d];
  return daily;
}

/** Valeur en équivalent ressource commune. */
export function potValue(amounts: Partial<Record<string, number>>): number {
  return Object.entries(amounts).reduce((a, [k, v]) => a + Math.max(0, Number(v) || 0) * (RESOURCE_LIST.find((r) => r.id === k)?.rarity === "rare" ? RARE_WEIGHT : 1), 0);
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
    daily: normalizeDaily(r.daily),
    amberTotal: Math.max(0, Math.floor(Number(r.amberTotal)) || 0),
    amberTotals: Object.fromEntries(
      (Object.keys(POT_SOURCE_LABELS) as PotSource[]).map((src) => [src, Math.max(0, Math.floor(Number(r.amberTotals?.[src])) || 0)] as const).filter(([, n]) => n > 0),
    ),
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
    daily: source === "admin" ? pot.daily : bumpDaily(pot, source, potValue(add), now),
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
    amberTotals: { ...pot.amberTotals, [source]: (pot.amberTotals?.[source] ?? 0) + n },
    daily: bumpDaily(pot, "amber", n, now),
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
