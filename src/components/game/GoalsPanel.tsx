import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Flag, Plus, Trash2, Wand2 } from "lucide-react";
import { HudPanel } from "@/components/ui/panel";
import { EmptyState, HudCallout, HudMeter, HudTag } from "@/components/ui/hud";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { ResourceIcon } from "@/components/ui/game-icon";
import { BUILDINGS } from "@/game/buildings";
import { TECHNOLOGIES } from "@/game/technologies";
import { UNITS } from "@/game/units";
import { GOAL_RULES, planGoal, type Goal, type GoalKind, type GoalPlan } from "@/game/goals";
import type { ActionStep } from "@/game/actionTemplates";
import { addGoal, removeGoal, useGoals } from "@/lib/goalStore";
import { cn, formatCompact, formatDuration } from "@/lib/utils";
import type { PlayerState, QueuesState, ResourceId } from "@/types/game";

/* 5.26 : objectifs personnels : un but, le plan pour y arriver (prérequis
   compris), ce qui manque et une date estimée. Un plan se transforme en
   modèle d'actions du Planificateur. */

const KINDS: { id: GoalKind; label: string }[] = [
  { id: "building", label: "Bâtiment" },
  { id: "tech", label: "Technologie" },
  { id: "unitLevel", label: "Niveau d'unité" },
  { id: "fleet", label: "Flotte" },
];

function targets(kind: GoalKind) {
  if (kind === "building") return BUILDINGS.map((b) => ({ id: b.id, name: b.name, max: b.maxLevel }));
  if (kind === "tech") return TECHNOLOGIES.map((t) => ({ id: t.id, name: t.nom, max: t.maxLevel }));
  return UNITS.filter((u) => !u.elite || kind === "fleet").map((u) => ({ id: u.id, name: u.name, max: kind === "fleet" ? GOAL_RULES.maxFleet : 50 }));
}

/** Étapes d'un plan → étapes de modèle (bâtiments et unités ; recherches une par une). */
export function planToTemplate(plan: GoalPlan): ActionStep[] {
  const out: ActionStep[] = [];
  for (const s of plan.steps) {
    if (s.kind === "building") out.push({ kind: "building", id: s.id });
    else if (s.kind === "tech") out.push({ kind: "research", id: s.id });
    else if (s.kind === "units") out.push({ kind: "units", id: s.id, qty: s.level });
  }
  return out.slice(0, 20);
}

function eta(plan: GoalPlan) {
  if (plan.done) return "atteint";
  if (!Number.isFinite(plan.etaSeconds)) return "hors de portée pour l'instant";
  return `≈ ${formatDuration(plan.etaSeconds)}`;
}

function GoalRow({ goal, plan, onRemove, onTemplate }: { goal: Goal; plan: GoalPlan; onRemove: () => void; onTemplate: () => void }) {
  const [open, setOpen] = useState(false);
  const missing = Object.entries(plan.missing) as [ResourceId, number][];
  return (
    <li className="flex flex-col gap-2 border border-white/5 bg-white/[0.02] p-3">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate font-display text-sm font-semibold text-slate-100">{plan.label}</span>
        {plan.done ? <HudTag tone="mint">Atteint</HudTag> : <span className={cn("font-mono text-[11px] tabular-nums", Number.isFinite(plan.etaSeconds) ? "text-cyan-glow" : "text-ember-glow")}>{eta(plan)}</span>}
      </div>
      <HudMeter percent={plan.progress * 100} tone={plan.done ? "var(--color-mint-glow)" : "var(--color-cyan-glow)"} />
      {!plan.done && (
        <>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
            <span className="font-mono">{plan.steps.length} étape{plan.steps.length > 1 ? "s" : ""}</span>
            <span>chantiers {formatDuration(plan.buildSeconds)}</span>
            {missing.length > 0 ? (
              <span className="flex flex-wrap items-center gap-2">
                manque
                {missing.map(([r, n]) => (
                  <span key={r} className="inline-flex items-center gap-1 font-mono text-ember-glow">
                    <ResourceIcon id={r} /> {formatCompact(n)}
                  </span>
                ))}
              </span>
            ) : (
              <span className="text-mint-glow">ressources réunies</span>
            )}
          </p>
          {plan.blockers.length > 0 && (
            <HudCallout tone="ember" className="text-[11px]">
              {plan.blockers.map((b) => (
                <span key={b} className="block">
                  {b}
                </span>
              ))}
            </HudCallout>
          )}
          {open && (
            <ol className="flex max-h-56 flex-col gap-0.5 overflow-y-auto border-l border-cyan-glow/20 pl-3 text-[11px]">
              {plan.steps.map((s, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-5 font-mono text-slate-600">{i + 1}.</span>
                  <span className="min-w-0 flex-1 truncate text-slate-300">{s.label}</span>
                  {s.seconds > 0 && <span className="font-mono text-slate-500">{formatDuration(s.seconds)}</span>}
                </li>
              ))}
            </ol>
          )}
        </>
      )}
      <div className="flex flex-wrap gap-1.5">
        {!plan.done && (
          <Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !open && "-rotate-90")} /> Plan
          </Button>
        )}
        {!plan.done && plan.steps.length > 0 && (
          <Button size="sm" variant="ghost" onClick={onTemplate} title="Crée un modèle d'actions à partir des étapes (20 au plus)">
            <Wand2 className="h-3.5 w-3.5" /> En faire un modèle
          </Button>
        )}
        <Button size="sm" variant="ghost" className="ml-auto" aria-label={`Retirer l'objectif ${plan.label}`} onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </li>
  );
}

export function GoalsPanel({ uid, player, queues, now, onTemplate }: { uid: string; player: PlayerState; queues: QueuesState; now: number; onTemplate: (name: string, steps: ActionStep[]) => void }) {
  const goals = useGoals(uid);
  const [kind, setKind] = useState<GoalKind>("building");
  const [target, setTarget] = useState("");
  const [value, setValue] = useState(10);
  const list = useMemo(() => targets(kind), [kind]);
  const picked = list.find((t) => t.id === target) ?? list[0];
  // Recalcul à chaque minute environ (le minuteur de page fournit `now`).
  const plans = useMemo(() => goals.map((g) => ({ goal: g, plan: planGoal(player, queues, g, now) })), [goals, player, queues, Math.floor(now / 60_000)]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = () => {
    if (!picked) return;
    try {
      addGoal(uid, { kind, target: picked.id, value: Math.min(value, picked.max) });
      toast.success("Objectif ajouté.");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <HudPanel icon={<Flag />} title="Objectifs" tone="accent" aside={<span className="font-mono text-[11px] text-slate-500">{goals.length}/{GOAL_RULES.maxGoals}</span>}>
      <div className="flex flex-col gap-2 border border-cyan-glow/15 bg-cyan-glow/[0.03] p-2.5">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Type d'objectif">
          {KINDS.map((k) => (
            <Button key={k.id} size="sm" variant={kind === k.id ? "secondary" : "ghost"} aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>
              {k.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={picked?.id ?? ""} onChange={(e) => setTarget(e.target.value)} aria-label="Cible" className="hud-cut-sm min-w-0 flex-1 border border-white/10 bg-space-900 px-2 py-1.5 text-sm text-slate-100">
            {list.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <NumberInput size="sm" value={value} onChange={setValue} min={1} max={picked?.max ?? 100} aria-label={kind === "fleet" ? "Nombre d'exemplaires" : "Niveau visé"} suffix={kind === "fleet" ? "ex." : "niv."} className="w-44" />
          <Button size="sm" onClick={submit} disabled={!picked || goals.length >= GOAL_RULES.maxGoals}>
            <Plus className="h-3.5 w-3.5" /> Fixer
          </Button>
        </div>
      </div>
      {plans.length === 0 ? (
        <EmptyState size="sm" icon={<Flag />} title="Aucun objectif">
          Fixe un but (« Croiseur niveau 10 », « Fonderie niveau 15 ») : le plan et la date estimée se calculent tout seuls.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {plans.map(({ goal, plan }) => (
            <GoalRow key={goal.id} goal={goal} plan={plan} onRemove={() => removeGoal(uid, goal.id)} onTemplate={() => onTemplate(`Objectif : ${plan.label}`.slice(0, 32), planToTemplate(plan))} />
          ))}
        </ul>
      )}
      <p className="text-[11px] text-slate-500">Estimation à production constante : la date se raccourcit à mesure que tes mines montent. Objectifs gardés sur cet appareil.</p>
    </HudPanel>
  );
}
