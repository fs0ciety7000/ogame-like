import { Lock, Hourglass } from "lucide-react";
import { cn } from "@/lib/utils";
import { checkPrereqs, TECHNOLOGIES, type TechDef } from "@/game/technologies";

const COL_WIDTH = 216;
const ROW_HEIGHT = 108;
const NODE_WIDTH = 184;
const NODE_HEIGHT = 80;
const PADDING = 24;

function depthOf(id: string, cache: Map<string, number>): number {
  const cached = cache.get(id);
  if (cached !== undefined) return cached;
  const tech = TECHNOLOGIES.find((t) => t.id === id);
  const prereqIds = tech ? Object.keys(tech.prereq) : [];
  const depth = prereqIds.length === 0 ? 0 : 1 + Math.max(...prereqIds.map((p) => depthOf(p, cache)));
  cache.set(id, depth);
  return depth;
}

interface Edge {
  from: string;
  to: string;
  /** Un prérequis peut se trouver plus d'une colonne en arrière (ex: tech16
   *  dépend de tech7, deux colonnes plus tôt). Une ligne droite couperait
   *  alors en diagonale à travers les nœuds des colonnes intermédiaires —
   *  ces arêtes contournent donc par un couloir au-dessus de la grille
   *  plutôt que par le coude direct utilisé pour les colonnes adjacentes. */
  spansColumns: boolean;
}

function buildLayout() {
  const cache = new Map<string, number>();
  const columns: TechDef[][] = [];
  const depthById = new Map<string, number>();
  for (const tech of TECHNOLOGIES) {
    const depth = depthOf(tech.id, cache);
    depthById.set(tech.id, depth);
    (columns[depth] ??= []).push(tech);
  }

  // Passe de gauche à droite : chaque colonne est réordonnée selon la
  // position moyenne (barycentre) de ses prérequis dans les colonnes déjà
  // posées, pour que les liens restent globalement horizontaux au lieu de
  // s'entrecroiser dans tous les sens (heuristique classique de
  // dessin de graphes en couches, une seule passe suffit ici vu la taille).
  const rowById = new Map<string, number>();
  columns[0].forEach((t, i) => rowById.set(t.id, i));
  for (let c = 1; c < columns.length; c++) {
    const scored = columns[c].map((t, i) => {
      const prereqRows = Object.keys(t.prereq)
        .map((id) => rowById.get(id))
        .filter((r): r is number => r !== undefined);
      const barycenter = prereqRows.length > 0 ? prereqRows.reduce((a, b) => a + b, 0) / prereqRows.length : i;
      return { t, i, barycenter };
    });
    scored.sort((a, b) => a.barycenter - b.barycenter || a.i - b.i);
    columns[c] = scored.map((s) => s.t);
    columns[c].forEach((t, i) => rowById.set(t.id, i));
  }

  const maxRows = Math.max(...columns.map((c) => c.length));
  const positions = new Map<string, { x: number; y: number; col: number }>();
  columns.forEach((col, colIdx) => {
    const rowOffset = ((maxRows - col.length) * ROW_HEIGHT) / 2;
    col.forEach((tech, rowIdx) => {
      positions.set(tech.id, {
        x: PADDING + colIdx * COL_WIDTH,
        y: PADDING + rowOffset + rowIdx * ROW_HEIGHT,
        col: colIdx,
      });
    });
  });

  const edges: Edge[] = [];
  for (const tech of TECHNOLOGIES) {
    for (const prereqId of Object.keys(tech.prereq)) {
      if (!positions.has(prereqId)) continue;
      edges.push({
        from: prereqId,
        to: tech.id,
        spansColumns: (depthById.get(tech.id) ?? 0) - (depthById.get(prereqId) ?? 0) > 1,
      });
    }
  }

  return {
    positions,
    edges,
    width: columns.length * COL_WIDTH + PADDING * 2 - (COL_WIDTH - NODE_WIDTH),
    height: maxRows * ROW_HEIGHT + PADDING * 2 - (ROW_HEIGHT - NODE_HEIGHT),
  };
}

const LAYOUT = buildLayout();

/** Coude à angle droit (comme un schéma de câblage) plutôt qu'une diagonale
 *  libre : plus facile à suivre à l'œil quand plusieurs lignes se croisent. */
function elbowPath(from: { x: number; y: number }, to: { x: number; y: number }): string {
  const startX = from.x + NODE_WIDTH;
  const startY = from.y + NODE_HEIGHT / 2;
  const endX = to.x;
  const endY = to.y + NODE_HEIGHT / 2;
  const midX = startX + (endX - startX) / 2;
  return `M ${startX},${startY} L ${midX},${startY} L ${midX},${endY} L ${endX},${endY}`;
}

/** Contournement par le couloir au-dessus de la grille, pour ne pas couper
 *  en diagonale à travers les colonnes intermédiaires. `lane` décale
 *  légèrement chaque arête de ce type pour limiter les recouvrements. */
function bypassPath(from: { x: number; y: number }, to: { x: number; y: number }, lane: number): string {
  const startX = from.x + NODE_WIDTH;
  const startY = from.y + NODE_HEIGHT / 2;
  const laneY = 8 + lane * 4;
  const endX = to.x + NODE_WIDTH / 2;
  const endY = to.y;
  return `M ${startX},${startY} L ${startX},${laneY} L ${endX},${laneY} L ${endX},${endY}`;
}

export function TechTree({
  levels,
  selectedId,
  activeIds,
  onSelect,
}: {
  levels: Record<string, number>;
  selectedId: string;
  activeIds: Set<string>;
  onSelect: (id: string) => void;
}) {
  let bypassCount = 0;

  return (
    <div className="glass-panel max-h-[480px] overflow-auto rounded-2xl p-2">
      <div className="relative" style={{ width: LAYOUT.width, height: LAYOUT.height }}>
        <svg className="pointer-events-none absolute inset-0" width={LAYOUT.width} height={LAYOUT.height}>
          {LAYOUT.edges.map((edge) => {
            const from = LAYOUT.positions.get(edge.from)!;
            const to = LAYOUT.positions.get(edge.to)!;
            const tech = TECHNOLOGIES.find((t) => t.id === edge.to)!;
            const satisfied = (levels[edge.from] ?? 0) >= tech.prereq[edge.from];
            const path = edge.spansColumns ? bypassPath(from, to, bypassCount++) : elbowPath(from, to);
            return (
              <path
                key={`${edge.from}->${edge.to}`}
                d={path}
                fill="none"
                stroke={satisfied ? "var(--color-mint-glow)" : "var(--color-space-500)"}
                strokeOpacity={satisfied ? 0.55 : 0.6}
                strokeWidth={1.5}
                strokeDasharray={edge.spansColumns ? "3 3" : undefined}
              />
            );
          })}
        </svg>

        {TECHNOLOGIES.map((tech) => {
          const pos = LAYOUT.positions.get(tech.id)!;
          const level = levels[tech.id] ?? 0;
          const check = checkPrereqs(tech, levels);
          const active = activeIds.has(tech.id);
          const maxed = level >= tech.maxLevel;

          return (
            <button
              key={tech.id}
              onClick={() => onSelect(tech.id)}
              className={cn(
                "glass-panel !absolute flex flex-col justify-center rounded-xl p-2.5 text-left transition-all",
                selectedId === tech.id && "border-cyan-glow/60 shadow-[0_0_0_1px_var(--color-cyan-glow)]",
                !check.valid && "opacity-40",
                maxed && "border-gold-glow/40",
              )}
              style={{ left: pos.x, top: pos.y, width: NODE_WIDTH, height: NODE_HEIGHT }}
            >
              <div className="flex items-center gap-1.5 text-xs text-slate-100">
                {!check.valid && <Lock className="h-3 w-3 shrink-0 text-slate-500" />}
                {active && <Hourglass className="h-3 w-3 shrink-0 animate-pulse-slow text-mint-glow" />}
                <span className="truncate font-medium">{tech.nom}</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Niveau {level} / {tech.maxLevel} {maxed && "(max)"}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
