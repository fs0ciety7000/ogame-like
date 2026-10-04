import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarRange, ChevronLeft, ChevronRight, GripVertical, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AGENDA_COLORS, AGENDA_LABELS, upcomingAgenda, type AgendaItem } from "@/game/agenda";
import { currentGameContent, validateRules, type GameRules } from "@/game/content";
import { EVENT_RULES } from "@/game/events";
import { SEASON_BOSS_RULES } from "@/game/chronicles";
import { saveContentSection } from "@/services/contentService";
import { useAgenda } from "@/components/game/AgendaCard";
import { cn } from "@/lib/utils";

/* =====================================================
   v5.10.5 : planificateur d'événements. Calendrier du mois avec tous les
   rendez-vous (boss, week-ends, Chroniques, concours, fin de saison).
   Les dates précises (boss) et les événements programmés se déplacent
   par glisser-déposer ou se suppriment ; un clic sur « + » en ajoute.
   Les rendez-vous mensuels se règlent dans l'onglet Règles.
===================================================== */

const DAY = 24 * 3600_000;
const DOW = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/** Minuit local (navigateur) du jour d'un instant. */
function dayStart(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

type AddKind = "levDate" | "sbDate" | "scheduled";

export function PlannerPanel() {
  const [offset, setOffset] = useState(0);
  const [rules, setRules] = useState<GameRules>(() => currentGameContent().rules);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);
  const now = Date.now();
  const month = new Date();
  month.setDate(1);
  month.setHours(0, 0, 0, 0);
  month.setMonth(month.getMonth() + offset);
  const first = dayStart(month.getTime() - ((month.getDay() + 6) % 7) * DAY);
  const days = Array.from({ length: 42 }, (_, i) => first + i * DAY);
  const liveContests = useAgenda(now, 120).filter((i) => i.kind === "contest");

  // Frise calculée sur les règles en cours d'édition (aperçu avant enregistrement).
  const items = useMemo(() => {
    const saved = { ev: { ...EVENT_RULES }, sb: { ...SEASON_BOSS_RULES } };
    Object.assign(EVENT_RULES, { bossDates: rules.events.bossDates, scheduled: rules.events.scheduled });
    Object.assign(SEASON_BOSS_RULES, { dates: rules.seasonBoss.dates });
    try {
      const from = Math.min(now, first);
      return upcomingAgenda(from, Math.ceil((first + 42 * DAY - from) / DAY), liveContests);
    } finally {
      Object.assign(EVENT_RULES, saved.ev);
      Object.assign(SEASON_BOSS_RULES, saved.sb);
    }
  }, [rules, first, now, liveContests]);

  const update = (fn: (r: GameRules) => GameRules) => {
    setRules((r) => fn(r));
    setDirty(true);
  };

  const move = (item: AgendaItem, toDay: number) => {
    const src = item.source;
    if (!src) return;
    const delta = toDay - dayStart(item.startMs);
    if (delta === 0) return;
    if (src.type === "levDate") update((r) => ({ ...r, events: { ...r.events, bossDates: (r.events.bossDates ?? []).map((d) => (d.startMs === src.startMs ? { ...d, startMs: d.startMs + delta } : d)) } }));
    if (src.type === "sbDate") update((r) => ({ ...r, seasonBoss: { ...r.seasonBoss, dates: (r.seasonBoss.dates ?? []).map((d) => (d.startMs === src.startMs ? { ...d, startMs: d.startMs + delta } : d)) } }));
    if (src.type === "scheduled") update((r) => ({ ...r, events: { ...r.events, scheduled: r.events.scheduled.map((e) => (e.id === src.id ? { ...e, startMs: e.startMs + delta, endMs: e.endMs + delta } : e)) } }));
  };

  const remove = (item: AgendaItem) => {
    const src = item.source;
    if (!src) return;
    if (src.type === "levDate") update((r) => ({ ...r, events: { ...r.events, bossDates: (r.events.bossDates ?? []).filter((d) => d.startMs !== src.startMs) } }));
    if (src.type === "sbDate") update((r) => ({ ...r, seasonBoss: { ...r.seasonBoss, dates: (r.seasonBoss.dates ?? []).filter((d) => d.startMs !== src.startMs) } }));
    if (src.type === "scheduled") update((r) => ({ ...r, events: { ...r.events, scheduled: r.events.scheduled.filter((e) => e.id !== src.id) } }));
  };

  const add = (day: number, kind: AddKind, eventType?: string) => {
    const at = day + 18 * 3600_000;
    if (kind === "levDate") update((r) => ({ ...r, events: { ...r.events, bossDates: [...(r.events.bossDates ?? []), { startMs: at, durationHours: r.leviathan.durationHours }] } }));
    if (kind === "sbDate") update((r) => ({ ...r, seasonBoss: { ...r.seasonBoss, dates: [...(r.seasonBoss.dates ?? []), { startMs: at, durationHours: r.seasonBoss.durationHours }] } }));
    if (kind === "scheduled" && eventType) update((r) => ({ ...r, events: { ...r.events, scheduled: [...r.events.scheduled, { id: `plan${Date.now().toString(36)}`, type: eventType, startMs: at, endMs: at + 48 * 3600_000 }] } }));
    setAdding(null);
  };

  const errors = validateRules(rules);
  const save = async () => {
    if (errors.length) return void toast.error(errors.slice(0, 3).join(" · "));
    setBusy(true);
    try {
      await saveContentSection("rules", rules);
      setDirty(false);
      toast.success("Planning enregistré.");
    } catch (err) {
      toast.error(`Enregistrement impossible : ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="hud-title flex items-center gap-2 text-sm text-white">
          <CalendarRange className="h-4 w-4 text-cyan-glow" /> Planificateur
        </h2>
        <div className="ml-auto flex items-center gap-1">
          <Button size="sm" variant="ghost" aria-label="Mois précédent" onClick={() => setOffset((o) => o - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="w-36 text-center font-display text-sm capitalize text-white">{month.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</span>
          <Button size="sm" variant="ghost" aria-label="Mois suivant" onClick={() => setOffset((o) => o + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="sm" disabled={!dirty || busy || errors.length > 0} onClick={() => void save()}>
            Enregistrer
          </Button>
        </div>
      </div>
      <p className="text-xs text-slate-400">
        Glisse une date précise (boss) ou un événement programmé sur un autre jour, ou survole-le pour le retirer. « + » ajoute une apparition le jour choisi à 18 h. Les rendez-vous mensuels (week-end du Léviathan, du boss de saison, rotation) se règlent dans l'onglet Règles.
      </p>
      {errors.length > 0 && <p className="text-xs text-danger-glow">{errors.slice(0, 3).join(" · ")}</p>}
      <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.12em] text-slate-400">
        {(Object.keys(AGENDA_LABELS) as (keyof typeof AGENDA_LABELS)[]).map((k) => (
          <span key={k} className="inline-flex items-center gap-1">
            <i className="h-2 w-2 rounded-full" style={{ background: AGENDA_COLORS[k] }} /> {AGENDA_LABELS[k]}
          </span>
        ))}
      </div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[44rem] grid-cols-7 gap-px border border-white/10 bg-white/10">
          {DOW.map((d) => (
            <div key={d} className="bg-space-900 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
              {d}
            </div>
          ))}
          {days.map((d) => {
            const inMonth = new Date(d).getMonth() === month.getMonth();
            const today = d === dayStart(now);
            const list = items.filter((i) => dayStart(i.startMs) === d || (i.endMs && i.startMs < d && i.endMs > d && new Date(d).getDay() === 1));
            return (
              <div
                key={d}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain");
                  const item = items.find((i) => i.id === id);
                  if (item) move(item, d);
                }}
                className={cn("relative flex min-h-24 flex-col gap-0.5 bg-space-950 p-1", !inMonth && "opacity-40", today && "ring-1 ring-inset ring-cyan-glow/60")}
              >
                <div className="flex items-center justify-between">
                  <span className={cn("font-mono text-[11px]", today ? "text-cyan-glow" : "text-slate-500")}>{new Date(d).getDate()}</span>
                  {d >= dayStart(now) && (
                    <button type="button" aria-label="Ajouter" onClick={() => setAdding(adding === d ? null : d)} className="text-slate-600 hover:text-cyan-glow">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {list.map((i) => (
                  <div
                    key={i.id}
                    draggable={!!i.source}
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", i.id)}
                    title={`${i.title}${i.endMs ? ` (${Math.round((i.endMs - i.startMs) / 3600_000)} h)` : ""}${i.source ? " — glisser pour déplacer" : ""}`}
                    className={cn("group flex items-center gap-0.5 truncate px-1 py-0.5 text-[10px] text-space-950", i.source ? "cursor-grab" : "opacity-80")}
                    style={{ background: AGENDA_COLORS[i.kind] }}
                  >
                    {i.source && <GripVertical className="h-3 w-3 shrink-0" />}
                    <span className="min-w-0 flex-1 truncate font-semibold">
                      {i.emoji} {i.title}
                    </span>
                    {i.source && (
                      <button type="button" aria-label="Retirer" onClick={() => remove(i)} className="hidden shrink-0 group-hover:block">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
                {adding === d && (
                  <div className="absolute left-1 top-6 z-10 flex w-48 flex-col gap-0.5 border border-cyan-glow/30 bg-space-900 p-1 text-xs shadow-xl">
                    <button type="button" className="px-2 py-1 text-left hover:bg-white/5" onClick={() => add(d, "levDate")}>
                      🐋 Léviathan (date précise)
                    </button>
                    <button type="button" className="px-2 py-1 text-left hover:bg-white/5" onClick={() => add(d, "sbDate")}>
                      ⚔️ Boss de saison (date précise)
                    </button>
                    {rules.events.types.map((t) => (
                      <button key={t.id} type="button" className="px-2 py-1 text-left hover:bg-white/5" onClick={() => add(d, "scheduled", t.id)}>
                        {t.emoji} {t.name} (48 h)
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
