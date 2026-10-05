import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarRange, ChevronLeft, ChevronRight, CopyPlus, GripVertical, Plus, Repeat, Trash2 } from "lucide-react";
import { sameWeekdayNextMonth } from "@/lib/calendarShift";
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
  const [dragging, setDragging] = useState<string | null>(null);
  // 5.16 : récurrence choisie pour les événements ajoutés (semaines, occurrences).
  const [repeat, setRepeat] = useState<{ weeks: number; count: number } | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const now = Date.now();
  const month = new Date();
  month.setDate(1);
  month.setHours(0, 0, 0, 0);
  month.setMonth(month.getMonth() + offset);
  // Jours construits sur le calendrier (et non par pas de 24 h) : le passage à l'heure d'hiver ne double plus un jour.
  const lead = (month.getDay() + 6) % 7;
  const days = Array.from({ length: 42 }, (_, i) => new Date(month.getFullYear(), month.getMonth(), 1 - lead + i).getTime());
  const first = days[0];
  const last = days[41];
  const liveContests = useAgenda(now, 120).filter((i) => i.kind === "contest");

  // Frise calculée sur les règles en cours d'édition (aperçu avant enregistrement).
  const items = useMemo(() => {
    const saved = { ev: { ...EVENT_RULES }, sb: { ...SEASON_BOSS_RULES } };
    Object.assign(EVENT_RULES, { bossDates: rules.events.bossDates, scheduled: rules.events.scheduled });
    Object.assign(SEASON_BOSS_RULES, { dates: rules.seasonBoss.dates });
    try {
      const from = Math.min(now, first);
      return upcomingAgenda(from, Math.ceil((last + DAY - from) / DAY) + 1, liveContests);
    } finally {
      Object.assign(EVENT_RULES, saved.ev);
      Object.assign(SEASON_BOSS_RULES, saved.sb);
    }
  }, [rules, first, last, now, liveContests]);

  const update = (fn: (r: GameRules) => GameRules) => {
    setRules((r) => fn(r));
    setDirty(true);
  };

  /** Même heure de la journée, un autre jour (calendrier local : le changement d'heure ne décale rien). */
  const sameTimeOn = (ms: number, toDay: number) => {
    const from = new Date(ms);
    const to = new Date(toDay);
    to.setHours(from.getHours(), from.getMinutes(), 0, 0);
    return to.getTime();
  };
  const addSkip = (list: number[] | undefined, at: number) => [...new Set([...(list ?? []), at])];

  const move = (item: AgendaItem, toDay: number) => {
    const src = item.source;
    if (!src || toDay === dayStart(item.startMs)) return;
    const at = sameTimeOn(item.startMs, toDay);
    const shift = at - item.startMs;
    const hours = Math.round(((item.endMs ?? item.startMs) - item.startMs) / 3600_000);
    if (src.type === "levDate") update((r) => ({ ...r, events: { ...r.events, bossDates: (r.events.bossDates ?? []).map((d) => (d.startMs === src.startMs ? { ...d, startMs: at } : d)) } }));
    if (src.type === "sbDate") update((r) => ({ ...r, seasonBoss: { ...r.seasonBoss, dates: (r.seasonBoss.dates ?? []).map((d) => (d.startMs === src.startMs ? { ...d, startMs: at } : d)) } }));
    if (src.type === "scheduled") update((r) => ({ ...r, events: { ...r.events, scheduled: r.events.scheduled.map((e) => (e.id === src.id ? { ...e, startMs: e.startMs + shift, endMs: e.endMs + shift } : e)) } }));
    // 5.15.14 : une apparition régulière déplacée = annulée à sa place + date précise le jour choisi.
    if (src.type === "levGen") update((r) => ({ ...r, events: { ...r.events, bossSkips: addSkip(r.events.bossSkips, src.startMs), bossDates: [...(r.events.bossDates ?? []), { startMs: at, durationHours: hours }] } }));
    if (src.type === "sbGen") update((r) => ({ ...r, seasonBoss: { ...r.seasonBoss, skips: addSkip(r.seasonBoss.skips, src.startMs), dates: [...(r.seasonBoss.dates ?? []), { startMs: at, durationHours: hours }] } }));
    if (src.type === "rotation")
      update((r) => ({
        ...r,
        events: { ...r.events, rotationSkips: addSkip(r.events.rotationSkips, src.startMs), scheduled: [...r.events.scheduled, { id: `plan${Date.now().toString(36)}`, type: src.eventType, startMs: at, endMs: at + hours * 3600_000 }] },
      }));
  };

  const remove = (item: AgendaItem) => {
    const src = item.source;
    if (!src) return;
    if (src.type === "levDate") update((r) => ({ ...r, events: { ...r.events, bossDates: (r.events.bossDates ?? []).filter((d) => d.startMs !== src.startMs) } }));
    if (src.type === "sbDate") update((r) => ({ ...r, seasonBoss: { ...r.seasonBoss, dates: (r.seasonBoss.dates ?? []).filter((d) => d.startMs !== src.startMs) } }));
    if (src.type === "scheduled") update((r) => ({ ...r, events: { ...r.events, scheduled: r.events.scheduled.filter((e) => e.id !== src.id) } }));
    if (src.type === "levGen") update((r) => ({ ...r, events: { ...r.events, bossSkips: addSkip(r.events.bossSkips, src.startMs) } }));
    if (src.type === "sbGen") update((r) => ({ ...r, seasonBoss: { ...r.seasonBoss, skips: addSkip(r.seasonBoss.skips, src.startMs) } }));
    if (src.type === "rotation") update((r) => ({ ...r, events: { ...r.events, rotationSkips: addSkip(r.events.rotationSkips, src.startMs) } }));
  };

  // Apparitions régulières annulées (encore à venir), qu'on peut rétablir d'un clic.
  const skipped = [...(rules.events.bossSkips ?? []), ...(rules.seasonBoss.skips ?? []), ...(rules.events.rotationSkips ?? [])].filter((t) => t > now).length;
  const restore = () =>
    update((r) => ({ ...r, events: { ...r.events, bossSkips: (r.events.bossSkips ?? []).filter((t) => t <= now), rotationSkips: (r.events.rotationSkips ?? []).filter((t) => t <= now) }, seasonBoss: { ...r.seasonBoss, skips: (r.seasonBoss.skips ?? []).filter((t) => t <= now) } }));

  const add = (day: number, kind: AddKind, eventType?: string) => {
    const at = day + 18 * 3600_000;
    if (kind === "levDate") update((r) => ({ ...r, events: { ...r.events, bossDates: [...(r.events.bossDates ?? []), { startMs: at, durationHours: r.leviathan.durationHours }] } }));
    if (kind === "sbDate") update((r) => ({ ...r, seasonBoss: { ...r.seasonBoss, dates: [...(r.seasonBoss.dates ?? []), { startMs: at, durationHours: r.seasonBoss.durationHours }] } }));
    if (kind === "scheduled" && eventType)
      update((r) => ({
        ...r,
        events: {
          ...r.events,
          scheduled: [...r.events.scheduled, { id: `plan${Date.now().toString(36)}`, type: eventType, startMs: at, endMs: at + 48 * 3600_000, ...(repeat ? { repeatWeeks: repeat.weeks, repeatCount: repeat.count } : {}) }],
        },
      }));
    setAdding(null);
  };

  // 5.16 : copie des dates précises et des événements programmés du mois affiché vers le mois suivant
  // (même jour de la semaine, même rang : « 2e samedi » → « 2e samedi »).
  const monthStart = month.getTime();
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 1).getTime();
  const inShownMonth = (ms: number) => ms >= monthStart && ms < monthEnd;
  const copyCount =
    (rules.events.bossDates ?? []).filter((d) => inShownMonth(d.startMs)).length +
    (rules.seasonBoss.dates ?? []).filter((d) => inShownMonth(d.startMs)).length +
    rules.events.scheduled.filter((e) => !e.repeatWeeks && inShownMonth(e.startMs)).length;
  const copyToNextMonth = () => {
    const stamp = Date.now().toString(36);
    update((r) => ({
      ...r,
      events: {
        ...r.events,
        bossDates: [...(r.events.bossDates ?? []), ...(r.events.bossDates ?? []).filter((d) => inShownMonth(d.startMs)).map((d) => ({ ...d, startMs: sameWeekdayNextMonth(d.startMs) }))],
        scheduled: [
          ...r.events.scheduled,
          ...r.events.scheduled
            .filter((e) => !e.repeatWeeks && inShownMonth(e.startMs))
            .map((e, i) => {
              const startMs = sameWeekdayNextMonth(e.startMs);
              return { ...e, id: `copy${stamp}${i}`, startMs, endMs: startMs + (e.endMs - e.startMs) };
            }),
        ],
      },
      seasonBoss: { ...r.seasonBoss, dates: [...(r.seasonBoss.dates ?? []), ...(r.seasonBoss.dates ?? []).filter((d) => inShownMonth(d.startMs)).map((d) => ({ ...d, startMs: sameWeekdayNextMonth(d.startMs) }))] },
    }));
    setOffset((o) => o + 1);
    toast.success(`${copyCount} rendez-vous copiés vers le mois suivant (à enregistrer).`);
  };

  const errors = validateRules(rules);
  const save = async () => {
    if (errors.length) return void toast.error(errors.slice(0, 3).join(" · "));
    setBusy(true);
    try {
      // Les annulations passées ne servent plus : on les retire avant d'enregistrer.
      const old = now - 7 * DAY;
      const keep = (l?: number[]) => (l ?? []).filter((t) => t > old);
      await saveContentSection("rules", { ...rules, events: { ...rules.events, bossSkips: keep(rules.events.bossSkips), rotationSkips: keep(rules.events.rotationSkips) }, seasonBoss: { ...rules.seasonBoss, skips: keep(rules.seasonBoss.skips) } });
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
        Glisse un boss ou un événement du week-end sur un autre jour (même heure), ou survole-le pour le retirer. « + » ajoute une apparition le jour choisi à 18 h. Les épisodes des Chroniques, la fin de saison et les concours ont des dates fixes. Le rythme régulier (rotation, boss hebdomadaires) se règle dans l'onglet Règles.
      </p>
      {skipped > 0 && (
        <p className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="font-mono tabular-nums text-gold-glow">{skipped}</span> apparition{skipped > 1 ? "s" : ""} régulière{skipped > 1 ? "s" : ""} annulée{skipped > 1 ? "s" : ""} ou déplacée{skipped > 1 ? "s" : ""}.
          <Button size="sm" variant="ghost" onClick={restore}>
            Rétablir le rythme régulier
          </Button>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <Button size="sm" variant="secondary" disabled={copyCount === 0} onClick={copyToNextMonth}>
          <CopyPlus className="h-3.5 w-3.5" /> Copier ce mois vers le suivant
        </Button>
        <span>
          {copyCount > 0 ? `${copyCount} date${copyCount > 1 ? "s" : ""} précise${copyCount > 1 ? "s" : ""} et événement${copyCount > 1 ? "s" : ""} programmé${copyCount > 1 ? "s" : ""}, même jour de la semaine et même rang (« 2e samedi »).` : "Rien à copier : aucune date précise ni événement programmé ce mois-ci."}
        </span>
      </div>
      {errors.length > 0 && <p className="text-xs text-danger-glow">{errors.slice(0, 3).join(" · ")}</p>}
      <div className="flex flex-wrap gap-3 text-[10px] font-mono uppercase tracking-[0.12em] text-slate-400">
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
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (over !== d) setOver(d);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver((o) => (o === d ? null : o));
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain") || dragging;
                  const item = items.find((i) => i.id === id);
                  if (item) move(item, d);
                  setDragging(null);
                  setOver(null);
                }}
                className={cn(
                  "relative flex min-h-24 flex-col gap-0.5 bg-space-950 p-1",
                  !inMonth && "opacity-40",
                  today && "ring-1 ring-inset ring-cyan-glow/60",
                  dragging && over === d && "bg-cyan-glow/10 ring-1 ring-inset ring-cyan-glow",
                )}
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
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", i.id);
                      e.dataTransfer.effectAllowed = "move";
                      setDragging(i.id);
                    }}
                    onDragEnd={() => {
                      setDragging(null);
                      setOver(null);
                    }}
                    title={`${i.title}${i.endMs ? ` (${Math.round((i.endMs - i.startMs) / 3600_000)} h)` : ""}${i.source ? " · glisser pour déplacer" : " · date fixe"}`}
                    className={cn("group flex items-center gap-0.5 truncate px-1 py-0.5 text-[10px] text-space-950", i.source ? "cursor-grab active:cursor-grabbing" : "cursor-default opacity-80", dragging === i.id && "opacity-40")}
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
                  <div className="absolute left-1 top-6 z-10 flex w-52 flex-col gap-0.5 border border-cyan-glow/30 bg-space-900 p-1 text-xs">
                    <label className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-slate-400">
                      <Repeat className="h-3 w-3" /> Événement :
                      <select
                        value={repeat ? `${repeat.weeks}x${repeat.count}` : ""}
                        onChange={(e) => {
                          const [w, c] = e.target.value.split("x").map(Number);
                          setRepeat(e.target.value ? { weeks: w, count: c } : null);
                        }}
                        className="min-w-0 flex-1 border border-white/10 bg-space-950 px-1 py-0.5 text-slate-200"
                      >
                        <option value="">une fois</option>
                        <option value="1x4">chaque semaine ×4</option>
                        <option value="2x4">toutes les 2 semaines ×4</option>
                        <option value="4x6">toutes les 4 semaines ×6</option>
                      </select>
                    </label>
                    <button type="button" className="px-2 py-1 text-left hover:bg-white/5" onClick={() => add(d, "levDate")}>
                      🐋 Boss mondial (date précise)
                    </button>
                    <button type="button" className="px-2 py-1 text-left hover:bg-white/5" onClick={() => add(d, "sbDate")}>
                      ⚔️ Boss de saison (date précise)
                    </button>
                    {rules.events.types.map((t) => (
                      <button key={t.id} type="button" className="px-2 py-1 text-left hover:bg-white/5" onClick={() => add(d, "scheduled", t.id)}>
                        {t.emoji} {t.name} (48 h{repeat ? `, ×${repeat.count}` : ""})
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
