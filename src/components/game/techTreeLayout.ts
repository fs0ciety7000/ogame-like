import { TECHNOLOGIES } from "@/game/technologies";

/** Agencement de l'arbre du Labo, posé à la main (l'arbre est statique) :
 *  une colonne "Fondations" pour les deux racines, puis une bande
 *  horizontale par branche, de gauche à droite dans l'ordre de déblocage.
 *  Les positions sont choisies pour que les liens passent dans les
 *  intervalles entre les cartes plutôt qu'à travers elles. */

export const COL_WIDTH = 270;
export const ROW_HEIGHT = 104;
export const NODE_WIDTH = 200;
export const NODE_HEIGHT = 64;

/** col = palier (gauche → droite), row = ligne (fractionnaire autorisé). */
export const TECH_GRID: Record<string, { col: number; row: number }> = {
  // Fondations
  tech1: { col: 0, row: 1.75 },
  tech3: { col: 0, row: 3.25 },
  // Économie
  tech4: { col: 1, row: 0 },
  tech6: { col: 2, row: 0 },
  // Logistique
  tech9: { col: 1, row: 1 },
  tech11: { col: 3, row: 1 },
  // Défense
  tech2: { col: 1, row: 2 },
  tech8: { col: 1, row: 3 },
  tech14: { col: 2, row: 2 },
  tech12: { col: 2, row: 3 },
  tech17: { col: 3, row: 2 },
  // Armement
  tech5: { col: 1, row: 4 },
  tech10: { col: 1, row: 5 },
  tech7: { col: 2, row: 4 },
  tech13: { col: 3, row: 4 },
  tech15: { col: 3, row: 5 },
  tech16: { col: 4, row: 5 },
  tech18: { col: 5, row: 4 },
  tech19: { col: 6, row: 4.5 },
};

export interface TechLane {
  id: string;
  label: string;
  fromCol: number;
  toCol: number;
  fromRow: number;
  toRow: number;
}

const LAST_COL = Math.max(...Object.values(TECH_GRID).map((p) => p.col));
const LAST_ROW = Math.max(...Object.values(TECH_GRID).map((p) => Math.ceil(p.row)));

export const TECH_LANES: TechLane[] = [
  { id: "lane-base", label: "Fondations", fromCol: 0, toCol: 0, fromRow: 0, toRow: LAST_ROW },
  { id: "lane-eco", label: "Économie", fromCol: 1, toCol: LAST_COL, fromRow: 0, toRow: 0 },
  { id: "lane-logi", label: "Logistique", fromCol: 1, toCol: LAST_COL, fromRow: 1, toRow: 1 },
  { id: "lane-def", label: "Défense", fromCol: 1, toCol: LAST_COL, fromRow: 2, toRow: 3 },
  { id: "lane-atk", label: "Armement", fromCol: 1, toCol: LAST_COL, fromRow: 4, toRow: 5 },
];

const LANE_PAD_X = 16;
const LANE_PAD_TOP = 26;
const LANE_PAD_BOTTOM = 8;

export function techPosition(id: string): { x: number; y: number } {
  const cell = TECH_GRID[id] ?? { col: 0, row: 0 };
  return { x: cell.col * COL_WIDTH, y: cell.row * ROW_HEIGHT };
}

export function laneRect(lane: TechLane) {
  return {
    x: lane.fromCol * COL_WIDTH - LANE_PAD_X,
    y: lane.fromRow * ROW_HEIGHT - LANE_PAD_TOP,
    width: (lane.toCol - lane.fromCol) * COL_WIDTH + NODE_WIDTH + LANE_PAD_X * 2,
    height: (lane.toRow - lane.fromRow) * ROW_HEIGHT + NODE_HEIGHT + LANE_PAD_TOP + LANE_PAD_BOTTOM,
  };
}

/** Tous les prérequis, directs et indirects, d'une technologie. */
export function techAncestors(id: string): Set<string> {
  const out = new Set<string>();
  const stack = [id];
  while (stack.length > 0) {
    const currentId = stack.pop();
    const tech = TECHNOLOGIES.find((t) => t.id === currentId);
    for (const reqId of Object.keys(tech?.prereq ?? {})) {
      if (!out.has(reqId)) {
        out.add(reqId);
        stack.push(reqId);
      }
    }
  }
  return out;
}

/** Technologies qui requièrent directement `id`. */
export function techDependents(id: string): Set<string> {
  return new Set(TECHNOLOGIES.filter((t) => id in t.prereq).map((t) => t.id));
}
