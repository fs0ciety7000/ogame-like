import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, CalendarClock, Copy, FlaskConical, Hammer, ListPlus, Pencil, Play, Plus, Rocket, Trash2, Wand2, X } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { UpcomingTimeline } from "@/components/game/UpcomingTimeline";
import { BuildPlanCard } from "@/components/game/BuildPlanCard";
import { HudPanel } from "@/components/ui/panel";
import { EmptyState, HudTag } from "@/components/ui/hud";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { askConfirm } from "@/components/ui/confirm-dialog";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import { useFleetStore } from "@/store/fleetStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { BUILDINGS } from "@/game/buildings";
import { UNITS } from "@/game/units";
import { TECHNOLOGIES } from "@/game/technologies";
import { unitsAwayOf } from "@/game/fleets";
import { previewTemplate, stepLabel, templateFromQueues, TEMPLATE_RULES, type ActionStep, type ActionTemplate, type StepPreview } from "@/game/actionTemplates";
import { deleteActionTemplate, saveActionTemplate, useActionTemplates } from "@/lib/actionTemplateStore";
import { GameActionError, performGameAction, planBuilding } from "@/services/playerService";
import { cn } from "@/lib/utils";
import type { PlayerState } from "@/types/game";

/* 5.26 : Planificateur. Tout ce qui tourne (chantiers, recherches, unités,
   flottes), la file planifiée des bâtiments et des modèles d'actions
   réutilisables (« Éco du matin », « Escadre de défense »…). */

const KIND_ICON = { building: Hammer, units: Rocket, research: FlaskConical } as const;
const KIND_LABEL = { building: "Bâtiment +1", units: "Unités", research: "Recherche" } as const;

const OUTCOME: Record<StepPreview["outcome"], { label: string; tone: "mint" | "accent" | "danger" }> = {
  start: { label: "Lancé", tone: "mint" },
  plan: { label: "Programmé", tone: "accent" },
  queue: { label: "En file", tone: "accent" },
  error: { label: "Impossible", tone: "danger" },
};

function choices(player: PlayerState, kind: ActionStep["kind"]): { id: string; name: string }[] {
  if (kind === "building") return BUILDINGS.filter((b) => player.buildings[b.id]?.unlocked || b.startsUnlocked).map((b) => ({ id: b.id, name: b.name }));
  if (kind === "units") return UNITS.filter((u) => (player.units[u.id]?.level ?? 0) > 0).map((u) => ({ id: u.id, name: u.name }));
  return TECHNOLOGIES.map((t) => ({ id: t.id, name: t.nom }));
}

function StepRow({ step, index, total, onMove, onRemove }: { step: ActionStep; index: number; total: number; onMove: (d: -1 | 1) => void; onRemove: () => void }) {
  const Icon = KIND_ICON[step.kind];
  return (
    <li className="flex items-center gap-2 border border-white/5 bg-white/[0.02] px-2 py-1.5 text-xs">
      <span className="w-5 font-mono text-slate-500">{index + 1}.</span>
      <Icon className="h-3.5 w-3.5 shrink-0 text-cyan-glow" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-slate-200">{stepLabel(step)}</span>
      <button type="button" aria-label="Monter" disabled={index === 0} onClick={() => onMove(-1)} className="p-1 text-slate-500 hover:text-cyan-glow disabled:opacity-30">
        <ArrowUp className="h-3.5 w-3.5" />
      </button>
      <button type="button" aria-label="Descendre" disabled={index === total - 1} onClick={() => onMove(1)} className="p-1 text-slate-500 hover:text-cyan-glow disabled:opacity-30">
        <ArrowDown className="h-3.5 w-3.5" />
      </button>
      <button type="button" aria-label="Retirer l'étape" onClick={onRemove} className="p-1 text-slate-500 hover:text-danger-glow">
        <X className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

function TemplateEditor({ player, initial, onClose }: { player: PlayerState; initial: { id?: string; name: string; steps: ActionStep[] } | null; onClose: () => void }) {
  const uid = useAuthStore((s) => s.user?.uid);
  const [name, setName] = useState(initial?.name ?? "");
  const [steps, setSteps] = useState<ActionStep[]>(initial?.steps ?? []);
  const [kind, setKind] = useState<ActionStep["kind"]>("building");
  const [pick, setPick] = useState("");
  const [qty, setQty] = useState(10);
  const list = useMemo(() => choices(player, kind), [player, kind]);
  const picked = list.some((c) => c.id === pick) ? pick : (list[0]?.id ?? "");
  const full = steps.length >= TEMPLATE_RULES.maxSteps;

  const add = () => {
    if (!picked || full) return;
    setSteps((s) => [...s, kind === "units" ? { kind, id: picked, qty: Math.max(1, qty) } : { kind, id: picked }]);
  };
  const move = (i: number, d: -1 | 1) =>
    setSteps((s) => {
      const n = [...s];
      [n[i], n[i + d]] = [n[i + d], n[i]];
      return n;
    });
  const save = () => {
    if (!uid) return;
    try {
      saveActionTemplate(uid, { id: initial?.id, name, steps });
      toast.success("Modèle enregistré.");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Enregistrement impossible.");
    }
  };

  return (
    <Dialog open={!!initial} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogTitle>{initial?.id ? "Modifier le modèle" : "Nouveau modèle"}</DialogTitle>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom (ex. Éco du matin)" maxLength={32} aria-label="Nom du modèle" />
        <div className="flex flex-col gap-2 border border-cyan-glow/15 bg-cyan-glow/[0.03] p-3">
          <p className="hud-eyebrow text-[10px] text-slate-500">Ajouter une étape</p>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Type d'étape">
            {(Object.keys(KIND_LABEL) as ActionStep["kind"][]).map((k) => (
              <Button key={k} size="sm" variant={kind === k ? "secondary" : "ghost"} aria-pressed={kind === k} onClick={() => setKind(k)}>
                {KIND_LABEL[k]}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={picked} onChange={(e) => setPick(e.target.value)} aria-label="Élément" className="hud-cut-sm min-w-0 flex-1 border border-white/10 bg-space-900 px-2 py-1.5 text-sm text-slate-100">
              {list.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {kind === "units" && <NumberInput size="sm" value={qty} onChange={setQty} min={1} max={TEMPLATE_RULES.maxUnitQty} aria-label="Quantité" className="w-36" />}
            <Button size="sm" onClick={add} disabled={!picked || full}>
              <Plus className="h-3.5 w-3.5" /> Ajouter
            </Button>
          </div>
          {list.length === 0 && <p className="text-[11px] text-slate-500">Rien de débloqué dans cette catégorie pour l'instant.</p>}
        </div>
        {steps.length === 0 ? (
          <p className="text-xs text-slate-500">Aucune étape. Les étapes s'exécutent dans l'ordre ; une étape impossible n'empêche pas les suivantes.</p>
        ) : (
          <ol className="flex max-h-72 flex-col gap-1 overflow-y-auto">
            {steps.map((s, i) => (
              <StepRow key={`${i}-${s.kind}-${s.id}`} step={s} index={i} total={steps.length} onMove={(d) => move(i, d)} onRemove={() => setSteps((l) => l.filter((_, j) => j !== i))} />
            ))}
          </ol>
        )}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] text-slate-500">
            {steps.length}/{TEMPLATE_RULES.maxSteps} étapes
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={save} disabled={steps.length === 0}>
              Enregistrer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ApplyDialog({ template, preview, onClose }: { template: ActionTemplate | null; preview: StepPreview[]; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const runnable = preview.filter((p) => p.actions.length > 0);
  const apply = async () => {
    setBusy(true);
    let done = 0;
    const failed: string[] = [];
    for (const p of runnable) {
      try {
        for (const a of p.actions) await performGameAction(a);
        done++;
      } catch (err) {
        failed.push(`${stepLabel(p.step)} : ${err instanceof GameActionError ? err.message : "action impossible"}`);
      }
    }
    setBusy(false);
    if (done > 0) toast.success(`${template?.name} : ${done} étape${done > 1 ? "s" : ""} appliquée${done > 1 ? "s" : ""}.`);
    if (failed.length) toast.error(failed.slice(0, 3).join(" · "));
    onClose();
  };
  return (
    <Dialog open={!!template} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogTitle>Appliquer « {template?.name} »</DialogTitle>
        <p className="text-xs text-slate-400">Aperçu calculé avec les règles du serveur, sur l'état actuel de ton empire.</p>
        <ol className="flex max-h-80 flex-col gap-1 overflow-y-auto">
          {preview.map((p, i) => {
            const o = OUTCOME[p.outcome];
            const Icon = KIND_ICON[p.step.kind];
            return (
              <li key={i} className="flex items-start gap-2 border border-white/5 bg-white/[0.02] px-2 py-1.5 text-xs">
                <span className="w-5 font-mono text-slate-500">{i + 1}.</span>
                <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="text-slate-200">{stepLabel(p.step)}</span>
                  <span className={cn("block text-[11px]", p.outcome === "error" ? "text-danger-glow" : "text-slate-500")}>{p.message}</span>
                </span>
                <HudTag tone={o.tone}>{o.label}</HudTag>
              </li>
            );
          })}
        </ol>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] text-slate-500">
            {runnable.length}/{preview.length} réalisables
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              Annuler
            </Button>
            <Button onClick={() => void apply()} disabled={busy || runnable.length === 0}>
              <Play className="h-3.5 w-3.5" /> Appliquer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function QuickPlan({ player }: { player: PlayerState }) {
  const list = useMemo(() => choices(player, "building"), [player]);
  const [pick, setPick] = useState("");
  const [busy, setBusy] = useState(false);
  const picked = list.some((c) => c.id === pick) ? pick : (list[0]?.id ?? "");
  const submit = async () => {
    setBusy(true);
    try {
      await planBuilding(picked);
      toast.success("Amélioration programmée.");
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Action impossible.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select value={picked} onChange={(e) => setPick(e.target.value)} aria-label="Bâtiment à programmer" className="hud-cut-sm min-w-0 flex-1 border border-white/10 bg-space-900 px-2 py-1.5 text-sm text-slate-100">
        {list.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <Button size="sm" variant="secondary" onClick={() => void submit()} disabled={busy || !picked}>
        <ListPlus className="h-3.5 w-3.5" /> Programmer
      </Button>
    </div>
  );
}

export function PlannerPage() {
  useNowTicker();
  const now = Date.now();
  const player = usePlayerStore((s) => s.player);
  const queues = usePlayerStore((s) => s.queues);
  const uid = useAuthStore((s) => s.user?.uid);
  const fleets = useFleetStore((s) => s.fleets);
  const templates = useActionTemplates(uid);
  const [editing, setEditing] = useState<{ id?: string; name: string; steps: ActionStep[] } | null>(null);
  const [applying, setApplying] = useState<ActionTemplate | null>(null);
  if (!player || !queues) return null;

  const preview = applying ? previewTemplate(player, queues, applying.steps, now, uid ? unitsAwayOf(fleets, uid) : {}) : [];
  const current = templateFromQueues(queues);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Cosmic Empires / Logistique" title="Planificateur" description="Tout ce qui tourne, ce qui suit, et tes modèles d'actions réutilisables." />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="flex min-w-0 flex-col gap-4" aria-label="En cours">
          <UpcomingTimeline queues={queues} now={now} />
          <BuildPlanCard player={player} queues={queues} now={now} />
          <HudPanel icon={<CalendarClock />} title="Programmer un bâtiment" tone="accent">
            <QuickPlan player={player} />
          </HudPanel>
        </section>

        <section className="flex min-w-0 flex-col gap-4" aria-label="Modèles">
          <HudPanel
            icon={<Wand2 />}
            title="Modèles d'actions"
            tone="accent"
            aside={
              <span className="font-mono text-[11px] text-slate-500">
                {templates.length}/{TEMPLATE_RULES.maxTemplates}
              </span>
            }
          >
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setEditing({ name: "", steps: [] })} disabled={templates.length >= TEMPLATE_RULES.maxTemplates}>
                <Plus className="h-3.5 w-3.5" /> Nouveau modèle
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing({ name: "File actuelle", steps: current })} disabled={current.length === 0 || templates.length >= TEMPLATE_RULES.maxTemplates} title="Reprend la file planifiée, les unités en file et les recherches en cours">
                <Copy className="h-3.5 w-3.5" /> Depuis la file actuelle
              </Button>
            </div>
            {templates.length === 0 ? (
              <EmptyState size="sm" icon={<Wand2 />} title="Aucun modèle">
                Enregistre une suite d'actions (bâtiments, unités, recherches) et rejoue-la en un clic.
              </EmptyState>
            ) : (
              <ul className="flex flex-col gap-2">
                {templates.map((t) => (
                  <li key={t.id} className="flex flex-col gap-2 border border-white/5 bg-white/[0.02] p-3">
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate font-display text-sm font-semibold text-slate-100">{t.name}</span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {t.steps.length} étape{t.steps.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-[11px] text-slate-500">{t.steps.map(stepLabel).join(" → ")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <Button size="sm" onClick={() => setApplying(t)}>
                        <Play className="h-3.5 w-3.5" /> Appliquer
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing({ id: t.id, name: t.name, steps: t.steps })}>
                        <Pencil className="h-3.5 w-3.5" /> Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-auto"
                        aria-label={`Supprimer ${t.name}`}
                        onClick={() =>
                          void askConfirm({ title: `Supprimer « ${t.name} » ?`, confirmLabel: "Supprimer", tone: "danger" }).then((ok) => ok && uid && deleteActionTemplate(uid, t.id))
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[11px] text-slate-500">
              Un bâtiment est lancé tout de suite si son chantier est libre et payable, sinon programmé dans la file planifiée. Modèles gardés sur cet appareil.
            </p>
          </HudPanel>
        </section>
      </div>
      <TemplateEditor key={editing?.id ?? (editing ? "new" : "none")} player={player} initial={editing} onClose={() => setEditing(null)} />
      <ApplyDialog template={applying} preview={preview} onClose={() => setApplying(null)} />
    </div>
  );
}
