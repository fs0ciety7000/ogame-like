import { useIsAdmin } from "@/services/adminService";
import { Link } from "react-router-dom";
import { CalendarDays, CalendarPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { HudChip, EmptyState } from "@/components/ui/hud";
import { Tooltip, TooltipCard, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AGENDA_COLORS, AGENDA_LABELS, upcomingAgenda, type AgendaItem, type AgendaKind } from "@/game/agenda";
import { contestPhase } from "@/game/contests";
import { useContests } from "@/services/contestService";
import { useLeviathan } from "@/services/leviathanService";
import { useSeasonBoss } from "@/services/seasonBossService";
import { isActive } from "@/game/leviathan";
import { bossCountdown } from "@/components/game/BossStage";
import { agendaToIcs, downloadIcs } from "@/lib/ical";
import { cn, alpha } from "@/lib/utils";

/* v5.10.5 : frise des 30 prochains jours sur l'accueil (boss, événements,
   Chroniques, concours, fin de saison). */

const DAYS = 30;
const DAY = 24 * 3600_000;
const ROWS: AgendaKind[] = ["leviathan", "seasonboss", "event", "contest", "chronicle", "season"];

const when = (ms: number) => new Date(ms).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function useAgenda(now: number, days = DAYS): AgendaItem[] {
  const contests = useContests();
  // v5.13 : les concours ne sont montrés qu'aux administrateurs.
  const admin = useIsAdmin();
  const leviathan = useLeviathan();
  const seasonBoss = useSeasonBoss();
  const extra: AgendaItem[] = (admin ? (contests?.list ?? []) : [])
    .filter((c) => ["scheduled", "running"].includes(contestPhase(c, now)))
    .map((c) => ({ id: c.id, kind: "contest", title: `Concours : ${c.title}`, startMs: c.startMs, endMs: c.endMs, link: "/game/concours", emoji: "🎁" }));
  // Un boss déjà abattu (ou retiré) dans sa fenêtre en cours n'est plus « en cours ».
  const over = (st: typeof leviathan) => (st && !isActive(st, now) ? st.startMs : null);
  const doneLev = over(leviathan);
  const doneSb = over(seasonBoss);
  return upcomingAgenda(now, days, extra).map((i) =>
    (i.kind === "leviathan" && doneLev !== null && i.startMs <= now && i.startMs <= doneLev && (i.endMs ?? 0) > doneLev) || (i.kind === "seasonboss" && doneSb !== null && i.startMs <= now && i.startMs <= doneSb && (i.endMs ?? 0) > doneSb)
      ? { ...i, done: true }
      : i,
  );
}

/** 5.15.7 : vue « Mois » : grille du mois (lundi en premier), un repère coloré par événement du jour. */
function MonthGrid({ now, items }: { now: number; items: AgendaItem[] }) {
  const d = new Date(now);
  const y = d.getFullYear();
  const m = d.getMonth();
  const first = new Date(y, m, 1);
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const today = d.getDate();
  const cells = Array.from({ length: lead + daysInMonth }, (_, i) => (i < lead ? null : i - lead + 1));
  const dayItems = (day: number) => {
    const start = new Date(y, m, day).getTime();
    const end = start + DAY;
    return items.filter((i) => i.startMs < end && (i.endMs ?? i.startMs + 1) > start);
  };
  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-7 gap-1 font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500">
        {["lun", "mar", "mer", "jeu", "ven", "sam", "dim"].map((w) => (
          <span key={w} className="text-center">
            {w}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <span key={`e${i}`} />;
          const list = dayItems(day);
          const past = day < today;
          const cell = (
            <span
              style={{ "--d": i } as React.CSSProperties}
              className={cn(
                "cal-cell flex h-12 flex-col justify-between border px-1 py-0.5",
                day === today ? "border-cyan-glow/70 bg-cyan-glow/[0.08]" : "border-white/5 bg-white/[0.02]",
                past && "opacity-40",
              )}
            >
              <span className={cn("font-mono text-[10px] tabular-nums", day === today ? "text-cyan-glow" : "text-slate-400")}>{day}</span>
              <span className="flex flex-wrap gap-0.5">
                {[...new Set(list.map((it) => it.kind))].map((k) => (
                  <i key={k} className="h-1.5 w-3" style={{ background: AGENDA_COLORS[k] }} />
                ))}
              </span>
            </span>
          );
          return list.length === 0 ? (
            <span key={day}>{cell}</span>
          ) : (
            <Tooltip key={day}>
              <TooltipTrigger asChild>
                <button type="button" className="text-left" aria-label={`${day} : ${list.map((it) => it.title).join(", ")}`}>
                  {cell}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <TooltipCard title={new Date(y, m, day).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} rows={list.map((it) => ({ label: `${it.emoji ?? ""} ${it.title}`, value: AGENDA_LABELS[it.kind] }))} />
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-slate-500">
        {ROWS.filter((k) => items.some((i) => i.kind === k)).map((k) => (
          <span key={k} className="inline-flex items-center gap-1">
            <i className="h-1.5 w-3" style={{ background: AGENDA_COLORS[k] }} /> {AGENDA_LABELS[k]}
          </span>
        ))}
      </p>
    </div>
  );
}

export function AgendaCard({ now }: { now: number }) {
  const items = useAgenda(now);
  const [view, setView] = useState<"frise" | "mois">(() => {
    try {
      return localStorage.getItem("cosmic:agenda-view") === "mois" ? "mois" : "frise";
    } catch {
      return "frise";
    }
  });
  const pick = (v: "frise" | "mois") => {
    setView(v);
    try {
      localStorage.setItem("cosmic:agenda-view", v);
    } catch {
      /* préférence d'affichage seulement */
    }
  };
  const start = now;
  const span = DAYS * DAY;
  const x = (ms: number) => Math.max(0, Math.min(100, ((ms - start) / span) * 100));
  const rows = ROWS.filter((k) => items.some((i) => i.kind === k));
  const next = items.filter((i) => (i.endMs ?? i.startMs) > now && !i.done).slice(0, 6);
  const weeks = Array.from({ length: Math.floor(DAYS / 7) + 1 }, (_, i) => i * 7);
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="hud-title flex items-center gap-2 text-sm">
          <CalendarDays className="h-4 w-4 text-cyan-glow" /> {view === "mois" ? "Ce mois-ci" : `Les ${DAYS} prochains jours`}
        </h2>
        <HudChip asChild size="sm" tone="neutral" className="ml-auto">
          <button
            type="button"
            title="Télécharger les rendez-vous des 30 prochains jours (.ics), avec un rappel 30 min avant"
            onClick={() => downloadIcs(agendaToIcs(items.filter((i) => (i.endMs ?? i.startMs) > now), window.location.origin, now))}
          >
            <CalendarPlus className="h-3 w-3" /> Mon agenda
          </button>
        </HudChip>
        <div className="flex gap-1" role="tablist" aria-label="Vue de l'agenda">
          {(["frise", "mois"] as const).map((v) => (
            <HudChip key={v} asChild size="sm" tone={view === v ? "accent" : "neutral"}>
              <button type="button" role="tab" aria-selected={view === v} onClick={() => pick(v)}>
                {v === "frise" ? "30 jours" : "Mois"}
              </button>
            </HudChip>
          ))}
        </div>
      </div>
      {view === "mois" ? (
        <MonthGrid now={now} items={items} />
      ) : items.length === 0 ? (
        <EmptyState size="sm" icon="🗓️" title="Rien de programmé">Les boss, événements et Chroniques à venir s'afficheront ici.</EmptyState>
      ) : (
        <>
          <div className="relative hidden sm:block" aria-hidden>
            <div className="relative ml-28 h-4 border-b border-white/10">
              {weeks.map((d) => (
                <span key={d} className="absolute top-0 -translate-x-1/2 font-mono text-[9px] text-slate-500" style={{ left: `${(d / DAYS) * 100}%` }}>
                  {d === 0 ? "auj." : new Date(now + d * DAY).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </span>
              ))}
            </div>
            <div className="mt-1 flex flex-col gap-1">
              {rows.map((k) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="shrink-0 truncate text-[10px] font-mono uppercase tracking-[0.12em] text-slate-500" style={{ width: "6.5rem" }}>
                    {AGENDA_LABELS[k]}
                  </span>
                  <div className="relative h-5 flex-1 bg-white/[0.02]">
                    {weeks.map((d) => (
                      <span key={d} className="absolute inset-y-0 w-px bg-white/5" style={{ left: `${(d / DAYS) * 100}%` }} />
                    ))}
                    {items
                      .filter((i) => i.kind === k)
                      .map((i) => {
                        const left = x(i.startMs);
                        const width = i.endMs ? Math.max(1.2, x(i.endMs) - left) : 0;
                        return (
                          <Tooltip key={i.id}>
                            <TooltipTrigger asChild>
                              <Link
                                to={i.link}
                                className={cn("absolute top-0.5 h-4 transition-transform hover:scale-y-125", !i.endMs && "w-2.5 -translate-x-1/2 rotate-45 scale-75")}
                                style={{ left: `${left}%`, width: i.endMs ? `${width}%` : undefined, background: AGENDA_COLORS[k], boxShadow: i.done ? undefined : `0 0 8px ${alpha(AGENDA_COLORS[k], 53)}`, opacity: i.done ? 0.3 : 1 }}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              {i.emoji} {i.title}
                              {i.done ? " (terminé)" : ""} · {when(i.startMs)}
                              {i.endMs ? ` → ${when(i.endMs)}` : ""}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <ul className="flex flex-col gap-1">
            {next.map((i) => {
              const live = i.startMs <= now;
              return (
                <li key={i.id}>
                  {/* v5.14 : sur téléphone, la date passe sous le titre (il était coupé à 5 lettres). */}
                  <Link to={i.link} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm hover:text-white sm:flex-nowrap">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: AGENDA_COLORS[i.kind] }} />
                    <span className="min-w-0 flex-1 truncate text-slate-200">
                      {i.emoji} {i.title}
                    </span>
                    <span className="w-full pl-4 font-mono text-[11px] text-slate-400 sm:w-auto sm:shrink-0 sm:pl-0">{live ? `en cours · fin dans ${bossCountdown((i.endMs ?? now) - now)}` : `${when(i.startMs)} · dans ${bossCountdown(i.startMs - now)}`}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Card>
  );
}
