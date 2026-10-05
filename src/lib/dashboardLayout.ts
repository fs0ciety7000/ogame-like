import { create } from "zustand";

/* v4.5 : ordre et visibilité des cartes de l'accueil, mémorisés sur l'appareil.
   5.21.1 : deux colonnes (principale, latérale), glisser-déposer, et un bloc
   unique « Progression et récompenses » (missions, passe, chroniques, contrats,
   défi de la semaine) au lieu de cinq cartes empilées. */

export type DashboardSection = "next" | "fleets" | "empire" | "economy" | "progress" | "log" | "workshop" | "colonies" | "leviathan" | "events";
export type DashboardColumn = "main" | "side";

export const DASHBOARD_SECTIONS: { id: DashboardSection; label: string; column: DashboardColumn }[] = [
  { id: "next", label: "Que faire maintenant", column: "main" },
  { id: "fleets", label: "Flottes en vol", column: "main" },
  { id: "progress", label: "Progression et récompenses", column: "main" },
  { id: "economy", label: "Production et prochaines fins", column: "main" },
  { id: "log", label: "Journal système", column: "main" },
  { id: "empire", label: "Planète, puissance et combats", column: "side" },
  { id: "workshop", label: "Atelier de réparation", column: "side" },
  { id: "events", label: "Évènements et agenda", column: "side" },
  { id: "leviathan", label: "Boss mondiaux", column: "side" },
  { id: "colonies", label: "Colonies", column: "side" },
];

/** Anciennes sections (avant 5.21.1) : fusionnées dans les nouvelles. */
const LEGACY: Record<string, DashboardSection> = { planet: "empire", power: "empire", challenge: "progress", contracts: "progress", event: "events" };

const KEY = "cosmic-empires:dashboard-layout";

export interface DashboardLayout {
  /** Ordre de chaque colonne. */
  main: DashboardSection[];
  side: DashboardSection[];
  hidden: DashboardSection[];
}

export function defaultLayout(): DashboardLayout {
  return {
    main: DASHBOARD_SECTIONS.filter((s) => s.column === "main").map((s) => s.id),
    side: DASHBOARD_SECTIONS.filter((s) => s.column === "side").map((s) => s.id),
    hidden: [],
  };
}

/** Complète une disposition enregistrée : anciennes sections converties, inconnues retirées, nouvelles ajoutées. */
export function normalizeLayout(raw: unknown): DashboardLayout {
  const ids = DASHBOARD_SECTIONS.map((s) => s.id);
  const r = (raw ?? {}) as Partial<DashboardLayout> & { order?: string[] };
  const seen = new Set<DashboardSection>();
  const clean = (list: unknown): DashboardSection[] => {
    const out: DashboardSection[] = [];
    for (const v of Array.isArray(list) ? list : []) {
      const id = (LEGACY[String(v)] ?? v) as DashboardSection;
      if (ids.includes(id) && !seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    }
    return out;
  };
  let main: DashboardSection[];
  let side: DashboardSection[];
  if (Array.isArray(r.main) || Array.isArray(r.side)) {
    main = clean(r.main);
    side = clean(r.side);
  } else {
    // Ancien format (une seule liste) : chaque section va dans sa colonne par défaut, dans l'ordre choisi.
    const order = clean(r.order);
    main = order.filter((id) => DASHBOARD_SECTIONS.find((s) => s.id === id)?.column === "main");
    side = order.filter((id) => DASHBOARD_SECTIONS.find((s) => s.id === id)?.column === "side");
  }
  for (const s of DASHBOARD_SECTIONS) if (!seen.has(s.id)) (s.column === "main" ? main : side).push(s.id);
  const hidden = [...new Set((Array.isArray(r.hidden) ? r.hidden : []).map((v) => (LEGACY[String(v)] ?? v) as DashboardSection))].filter((id) => ids.includes(id));
  return { main, side, hidden };
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

export function columnOf(layout: DashboardLayout, id: DashboardSection): DashboardColumn {
  return layout.side.includes(id) ? "side" : "main";
}

/** Déplace une section dans sa colonne (−1 : monter, +1 : descendre). */
export function moveSection(layout: DashboardLayout, id: DashboardSection, delta: -1 | 1): DashboardLayout {
  const col = columnOf(layout, id);
  const list = [...layout[col]];
  const i = list.indexOf(id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= list.length) return layout;
  [list[i], list[j]] = [list[j], list[i]];
  return { ...layout, [col]: list };
}

/** Glisser-déposer : place `id` dans `column`, avant `before` (fin de colonne si absent). */
export function dropSection(layout: DashboardLayout, id: DashboardSection, column: DashboardColumn, before?: DashboardSection | null): DashboardLayout {
  if (id === before) return layout;
  const main = layout.main.filter((x) => x !== id);
  const side = layout.side.filter((x) => x !== id);
  const target = column === "main" ? main : side;
  const at = before ? target.indexOf(before) : -1;
  target.splice(at < 0 ? target.length : at, 0, id);
  return { ...layout, main, side };
}

/** Change de colonne (bouton, pour les écrans tactiles). */
export function switchColumn(layout: DashboardLayout, id: DashboardSection): DashboardLayout {
  return dropSection(layout, id, columnOf(layout, id) === "main" ? "side" : "main");
}

export function toggleSection(layout: DashboardLayout, id: DashboardSection): DashboardLayout {
  const hidden = layout.hidden.includes(id) ? layout.hidden.filter((h) => h !== id) : [...layout.hidden, id];
  return { ...layout, hidden };
}
