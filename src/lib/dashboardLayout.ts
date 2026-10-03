import { create } from "zustand";

/* v4.5 : ordre et visibilité des cartes de l'accueil, mémorisés sur l'appareil. */

export type DashboardSection = "next" | "planet" | "colonies" | "fleets" | "leviathan" | "challenge" | "event" | "contracts" | "economy" | "power" | "log";

export const DASHBOARD_SECTIONS: { id: DashboardSection; label: string }[] = [
  { id: "next", label: "Que faire maintenant" },
  { id: "fleets", label: "Flottes en vol" },
  { id: "planet", label: "Planète et développement" },
  { id: "colonies", label: "Colonies" },
  { id: "leviathan", label: "Boss mondiaux" },
  { id: "challenge", label: "Défi de la semaine" },
  { id: "event", label: "Évènement" },
  { id: "contracts", label: "Contrats du jour" },
  { id: "economy", label: "Production et prochaines fins" },
  { id: "power", label: "Puissance et combats" },
  { id: "log", label: "Journal système" },
];

const KEY = "cosmic-empires:dashboard-layout";

export interface DashboardLayout {
  order: DashboardSection[];
  hidden: DashboardSection[];
}

export function defaultLayout(): DashboardLayout {
  return { order: DASHBOARD_SECTIONS.map((s) => s.id), hidden: [] };
}

/** Complète un ordre enregistré : sections inconnues retirées, nouvelles ajoutées à la fin. */
export function normalizeLayout(raw: unknown): DashboardLayout {
  const ids = DASHBOARD_SECTIONS.map((s) => s.id);
  const r = (raw ?? {}) as Partial<DashboardLayout>;
  const order = Array.isArray(r.order) ? r.order.filter((id, i, a): id is DashboardSection => ids.includes(id) && a.indexOf(id) === i) : [];
  for (const id of ids) if (!order.includes(id)) order.push(id);
  const hidden = Array.isArray(r.hidden) ? r.hidden.filter((id): id is DashboardSection => ids.includes(id)) : [];
  return { order, hidden };
}

function read(): DashboardLayout {
  try {
    return normalizeLayout(JSON.parse(localStorage.getItem(KEY) ?? "null"));
  } catch {
    return defaultLayout();
  }
}

export const useDashboardLayout = create<DashboardLayout>(() => read());

export function setDashboardLayout(layout: DashboardLayout) {
  useDashboardLayout.setState(layout);
  try {
    localStorage.setItem(KEY, JSON.stringify(layout));
  } catch {
    /* non mémorisé */
  }
}

export function moveSection(layout: DashboardLayout, id: DashboardSection, delta: -1 | 1): DashboardLayout {
  const order = [...layout.order];
  const i = order.indexOf(id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= order.length) return layout;
  [order[i], order[j]] = [order[j], order[i]];
  return { ...layout, order };
}

export function toggleSection(layout: DashboardLayout, id: DashboardSection): DashboardLayout {
  const hidden = layout.hidden.includes(id) ? layout.hidden.filter((h) => h !== id) : [...layout.hidden, id];
  return { ...layout, hidden };
}
