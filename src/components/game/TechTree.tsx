import { memo, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Activity,
  Bot,
  Crosshair,
  Factory,
  Flame,
  FlaskConical,
  Hourglass,
  Lock,
  Microscope,
  Navigation,
  Orbit,
  Package,
  Plane,
  Radar,
  Rocket,
  Satellite,
  Shield,
  ShieldCheck,
  Ship,
  Swords,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { checkPrereqs, TECHNOLOGIES, type TechDef } from "@/game/technologies";
import {
  laneRect,
  NODE_HEIGHT,
  NODE_WIDTH,
  TECH_LANES,
  techAncestors,
  techDependents,
  techPosition,
} from "@/components/game/techTreeLayout";

const TECH_ICONS: Record<string, LucideIcon> = {
  tech1: Microscope,
  tech2: Shield,
  tech3: Zap,
  tech4: Factory,
  tech5: Swords,
  tech6: Satellite,
  tech7: FlaskConical,
  tech8: ShieldCheck,
  tech9: Bot,
  tech10: Ship,
  tech11: Package,
  tech12: Radar,
  tech13: Plane,
  tech14: Rocket,
  tech15: Activity,
  tech16: Flame,
  tech17: Crosshair,
  tech18: Navigation,
  tech19: Orbit,
};

type TechStatus = "locked" | "available" | "active" | "maxed";

const STATUS_COLOR: Record<TechStatus, string> = {
  locked: "var(--color-space-500)",
  available: "var(--color-cyan-glow)",
  active: "var(--color-mint-glow)",
  maxed: "var(--color-gold-glow)",
};

/** "related" : fait partie de la chaîne de la techno survolée/sélectionnée ;
 *  "dimmed" : hors chaîne, estompée pour faire ressortir le chemin. */
type Emphasis = "focus" | "related" | "normal" | "dimmed";

type TechNodeData = {
  tech: TechDef;
  level: number;
  status: TechStatus;
  selected: boolean;
  emphasis: Emphasis;
};
type LaneNodeData = { label: string };

type TechFlowNode = Node<TechNodeData, "tech">;
type LaneFlowNode = Node<LaneNodeData, "lane">;

const TechNode = memo(function TechNode({ data }: NodeProps<TechFlowNode>) {
  const { tech, level, status, selected, emphasis } = data;
  const Icon = TECH_ICONS[tech.id] ?? Microscope;
  const color = STATUS_COLOR[status];
  const percent = Math.min(100, (level / tech.maxLevel) * 100);
  const size = 40;
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-xl border bg-space-800/90 px-2.5 backdrop-blur transition-all duration-200",
        status === "locked" ? "border-white/5" : "border-white/10",
        selected && "ring-2 ring-cyan-glow/70",
        emphasis === "dimmed" && "opacity-35",
        emphasis === "focus" && "shadow-[0_0_24px_-6px_var(--color-cyan-glow)]",
      )}
      style={{ width: NODE_WIDTH, height: NODE_HEIGHT, borderColor: status !== "locked" && emphasis !== "dimmed" ? `color-mix(in srgb, ${color} 35%, transparent)` : undefined }}
    >
      <Handle type="target" position={Position.Left} className="!pointer-events-none !opacity-0" />
      <div className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="absolute inset-0 -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth={3} fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - percent / 100)}
            style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
          />
        </svg>
        {status === "locked" ? (
          <Lock className="h-4 w-4 text-slate-500" />
        ) : (
          <Icon className="h-4 w-4" style={{ color }} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-xs font-medium", status === "locked" ? "text-slate-400" : "text-slate-100")}>
          {tech.nom}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
          {status === "active" && <Hourglass className="h-3 w-3 animate-pulse-slow text-mint-glow" />}
          <span className="tabular-mono">
            Niv. {level}/{tech.maxLevel}
          </span>
          {status === "maxed" && <span className="text-gold-glow">MAX</span>}
          {status === "active" && <span className="text-mint-glow">en cours</span>}
        </p>
      </div>
      <Handle type="source" position={Position.Right} className="!pointer-events-none !opacity-0" />
    </div>
  );
});

const LaneNode = memo(function LaneNode({ data, width, height }: NodeProps<LaneFlowNode>) {
  return (
    <div
      className="relative rounded-2xl border border-white/5 bg-white/[0.015]"
      style={{ width, height }}
    >
      <span className="absolute left-3 top-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
        {data.label}
      </span>
    </div>
  );
});

const NODE_TYPES = { tech: TechNode, lane: LaneNode };

function techStatus(tech: TechDef, levels: Record<string, number>, activeIds: Set<string>): TechStatus {
  const level = levels[tech.id] ?? 0;
  if (level >= tech.maxLevel) return "maxed";
  if (activeIds.has(tech.id)) return "active";
  return checkPrereqs(tech, levels).valid ? "available" : "locked";
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
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const focusId = hoveredId ?? selectedId;
  const activeKey = [...activeIds].sort().join(",");

  const { nodes, edges } = useMemo(() => {
    const ancestors = techAncestors(focusId);
    const dependents = techDependents(focusId);
    // Chaîne complète de prérequis de la techno focalisée + ce qu'elle débloque.
    const chain = new Set([focusId, ...ancestors]);

    const laneNodes: LaneFlowNode[] = TECH_LANES.map((lane) => {
      const rect = laneRect(lane);
      return {
        id: lane.id,
        type: "lane",
        position: { x: rect.x, y: rect.y },
        width: rect.width,
        height: rect.height,
        data: { label: lane.label },
        draggable: false,
        selectable: false,
        focusable: false,
        zIndex: -1,
        style: { pointerEvents: "none" },
      };
    });

    const techNodes: TechFlowNode[] = TECHNOLOGIES.map((tech) => {
      const emphasis: Emphasis =
        tech.id === focusId ? "focus" : chain.has(tech.id) || dependents.has(tech.id) ? "related" : "dimmed";
      return {
        id: tech.id,
        type: "tech",
        position: techPosition(tech.id),
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        data: {
          tech,
          level: levels[tech.id] ?? 0,
          status: techStatus(tech, levels, activeIds),
          selected: tech.id === selectedId,
          emphasis,
        },
        draggable: false,
        connectable: false,
      };
    });

    const flowEdges: Edge[] = [];
    for (const tech of TECHNOLOGIES) {
      for (const [reqId, reqLevel] of Object.entries(tech.prereq)) {
        const satisfied = (levels[reqId] ?? 0) >= reqLevel;
        const inChain = chain.has(tech.id) && chain.has(reqId);
        const unlocks = reqId === focusId;
        const highlighted = inChain || unlocks;
        const color = unlocks && !inChain
          ? "var(--color-cyan-glow)"
          : satisfied
            ? "var(--color-mint-glow)"
            : "var(--color-danger-glow)";

        flowEdges.push({
          id: `${reqId}->${tech.id}`,
          source: reqId,
          target: tech.id,
          animated: highlighted && !satisfied,
          zIndex: highlighted ? 1 : 0,
          style: highlighted
            ? { stroke: color, strokeWidth: 2, opacity: 0.95 }
            : { stroke: "var(--color-space-500)", strokeWidth: 1.25, opacity: 0.35 },
          label: highlighted ? `Niv. ${reqLevel}` : undefined,
          labelStyle: { fill: "#e7ecff", fontSize: 10, fontWeight: 600 },
          labelBgStyle: { fill: "var(--color-space-900)", stroke: color, strokeWidth: 1 },
          labelBgPadding: [5, 2],
          labelBgBorderRadius: 6,
        });
      }
    }

    return { nodes: [...laneNodes, ...techNodes] as Node[], edges: flowEdges };
    // activeKey remplace activeIds (nouvel objet Set à chaque rendu du parent).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, selectedId, levels, activeKey]);

  return (
    <div className="flex flex-col gap-2">
      <div className="glass-panel tech-flow h-[520px] overflow-hidden rounded-2xl">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          colorMode="dark"
          fitView
          fitViewOptions={{ padding: 0.06 }}
          minZoom={0.3}
          maxZoom={1.6}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnScroll={false}
          panOnScroll={false}
          preventScrolling={false}
          zoomOnDoubleClick={false}
          proOptions={{ hideAttribution: true }}
          onNodeClick={(_, node) => node.type === "tech" && onSelect(node.id)}
          onNodeMouseEnter={(_, node) => node.type === "tech" && setHoveredId(node.id)}
          onNodeMouseLeave={() => setHoveredId(null)}
          style={{ background: "transparent" }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(75,232,255,0.12)" bgColor="transparent" />
          <Controls showInteractive={false} position="bottom-left" />
        </ReactFlow>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[11px] text-slate-400">
        <LegendDot color={STATUS_COLOR.available} label="Disponible" />
        <LegendDot color={STATUS_COLOR.active} label="En cours" />
        <LegendDot color={STATUS_COLOR.maxed} label="Niveau max" />
        <LegendDot color={STATUS_COLOR.locked} label="Verrouillée" />
        <span className="text-slate-500">
          Survole une technologie : sa chaîne de prérequis s'allume (vert = rempli, rouge = manquant, bleu = ce qu'elle débloque).
        </span>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
