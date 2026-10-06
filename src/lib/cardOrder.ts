import { create } from "zustand";

/* 5.24 : ordre personnalisé des cartes des pages en grille (Bâtiments, Unités,
   Missions, État-major, Colonies…), mémorisé sur l'appareil, page par page.
   Les cartes ajoutées après coup (nouveau contenu) se placent à la fin. */

const KEY = "cosmic-empires:card-order";

type Orders = Record<string, string[]>;

function read(): Orders {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}") as unknown;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const out: Orders = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (Array.isArray(v)) out[k] = v.filter((x): x is string => typeof x === "string").slice(0, 500);
    }
    return out;
  } catch {
    return {};
  }
}

export const useCardOrders = create<{ orders: Orders }>(() => ({ orders: read() }));

function save(orders: Orders) {
  useCardOrders.setState({ orders });
  try {
    localStorage.setItem(KEY, JSON.stringify(orders));
  } catch {
    /* stockage indisponible : ordre gardé pour la session */
  }
}

/** Ordre affiché : d'abord l'ordre enregistré (cartes encore présentes), puis les autres dans l'ordre par défaut. */
export function applyOrder(ids: string[], saved: string[] | undefined): string[] {
  if (!saved || saved.length === 0) return ids;
  const present = new Set(ids);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of saved) {
    if (present.has(id) && !seen.has(id)) {
      out.push(id);
      seen.add(id);
    }
  }
  for (const id of ids) if (!seen.has(id)) out.push(id);
  return out;
}

/**
 * Déplace `active` à la place de `over` dans la liste visible, puis fusionne avec
 * l'ordre complet de la page (les cartes filtrées, absentes de `visible`, gardent leur rang).
 */
export function moveCard(full: string[], visible: string[], active: string, over: string): string[] {
  const from = visible.indexOf(active);
  const to = visible.indexOf(over);
  if (from < 0 || to < 0 || from === to) return full;
  const nextVisible = [...visible];
  nextVisible.splice(from, 1);
  nextVisible.splice(to, 0, active);
  // Les emplacements occupés par les cartes visibles sont remplis dans le nouvel ordre.
  const slots = new Set(visible);
  let k = 0;
  return full.map((id) => (slots.has(id) ? nextVisible[k++] : id));
}

export function setCardOrder(page: string, order: string[]) {
  save({ ...useCardOrders.getState().orders, [page]: order });
}

export function resetCardOrder(page: string) {
  const next = { ...useCardOrders.getState().orders };
  delete next[page];
  save(next);
}
