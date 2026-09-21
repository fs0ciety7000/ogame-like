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

function buildLayout() {
  const cache = new Map<string, number>();
  const columns: TechDef[][] = [];
  for (const tech of TECHNOLOGIES) {
    const depth = depthOf(tech.id, cache);
    (columns[depth] ??= []).push(tech);
  }
  const maxRows = Math.max(...columns.map((c) => c.length));
  const positions = new Map<string, { x: number; y: number }>();
  columns.forEach((col, colIdx) => {
    const rowOffset = ((maxRows - col.length) * ROW_HEIGHT) / 2;
    col.forEach((tech, rowIdx) => {
      positions.set(tech.id, {
        x: PADDING + colIdx * COL_WIDTH,
        y: PADDING + rowOffset + rowIdx * ROW_HEIGHT,
      });
    });
  });
  return {
    positions,
    width: columns.length * COL_WIDTH + PADDING * 2 - (COL_WIDTH - NODE_WIDTH),
    height: maxRows * ROW_HEIGHT + PADDING * 2 - (ROW_HEIGHT - NODE_HEIGHT),
  };
}

const LAYOUT = buildLayout();

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
  return (
    <div className="glass-panel max-h-[480px] overflow-auto rounded-2xl p-2">
      <div className="relative" style={{ width: LAYOUT.width, height: LAYOUT.height }}>
        <svg className="pointer-events-none absolute inset-0" width={LAYOUT.width} height={LAYOUT.height}>
          {TECHNOLOGIES.flatMap((tech) => {
            const to = LAYOUT.positions.get(tech.id)!;
            return Object.keys(tech.prereq).map((prereqId) => {
              const from = LAYOUT.positions.get(prereqId);
              if (!from) return null;
              const satisfied = (levels[prereqId] ?? 0) >= tech.prereq[prereqId];
              return (
                <line
                  key={`${prereqId}->${tech.id}`}
                  x1={from.x + NODE_WIDTH}
                  y1={from.y + NODE_HEIGHT / 2}
                  x2={to.x}
                  y2={to.y + NODE_HEIGHT / 2}
                  stroke={satisfied ? "var(--color-mint-glow)" : "var(--color-space-500)"}
                  strokeOpacity={satisfied ? 0.5 : 0.6}
                  strokeWidth={1.5}
                />
              );
            });
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
