import { useIsAdmin } from "@/services/adminService";
import { Link } from "react-router-dom";
import { CalendarDays, CalendarPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { HudChip, EmptyState } from "@/components/ui/hud";
import { Tooltip, TooltipCard, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useChatRooms } from "@/services/globalChatService";
import { ROOM_EVENT_RULES } from "@/game/globalChat";
import { AGENDA_LABELS, upcomingAgenda, type AgendaItem, type AgendaKind } from "@/game/agenda";
import { AGENDA_TONE, AgendaIcon } from "@/components/game/agendaStyle";
import { contestPhase } from "@/game/contests";
import { useContests } from "@/services/contestService";
import { useLeviathan } from "@/services/leviathanService";
import { useSeasonBoss } from "@/services/seasonBossService";
import { isActive } from "@/game/leviathan";
import { bossCountdown } from "@/components/game/BossStage";
import { agendaToIcs, downloadIcs } from "@/lib/ical";
import { cn, alpha, formatDateTime } from "@/lib/utils";

/* v5.10.5 : frise des 30 prochains jours sur l'accueil (boss, événements,
   Chroniques, concours, fin de saison). */

const DAYS = 30;
const DAY = 24 * 3600_000;
const ROWS: AgendaKind[] = ["leviathan", "seasonboss", "event", "contest", "room", "chronicle", "season"];

const when = (ms: number) => formatDateTime(ms, "short", "server");

export function useAgenda(now: number, days = DAYS): AgendaItem[] {
  const contests = useContests();
  // v5.13 : les concours ne sont montrés qu'aux administrateurs.
  const admin = useIsAdmin();
  const leviathan = useLeviathan();
  const seasonBoss = useSeasonBoss();
  const extra: AgendaItem[] = (admin ? (contests?.list ?? []) : [])
    .filter((c) => ["scheduled", "running"].includes(contestPhase(c, now)))
    .map((c) => ({ id: c.id, kind: "contest", title: `Concours : ${c.title}`, startMs: c.startMs, endMs: c.endMs, link: "/game/concours" }));
  // 5.27 : événements programmés par les créateurs de salons.
  const { rooms } = useChatRooms();
  for (const r of rooms) {
    if (r.eventAtMs && r.eventAtMs + ROOM_EVENT_RULES.durationHours * 3600_000 > now && r.eventAtMs < now + days * DAY)
      extra.push({ id: `room-${r.id}`, kind: "room", title: `#${r.name} : ${r.eventLabel}`, startMs: r.eventAtMs, endMs: r.eventAtMs + ROOM_EVENT_RULES.durationHours * 3600_000, link: `/game/messages?onglet=global&salon=${r.id}` });
  }
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
      <div className="grid grid-cols-7 gap-1 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
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
                // 6.14.148 (AU28) : jour passé en texte atténué et fond vide, sans opacité sur le texte (DESIGN.md, 6.14.97).
                day === today ? "border-cyan-glow/70 bg-cyan-glow/[0.08]" : past ? "border-transparent" : "border-white/5 bg-white/[0.02]",
              )}
            >
              <span className={cn("font-mono text-[11px] tabular-nums", day === today ? "text-cyan-glow" : past ? "text-slate-500" : "text-slate-400")}>{day}</span>
              <span className="flex flex-wrap gap-0.5">
                {[...new Set(list.map((it) => it.kind))].map((k) => (
                  <AgendaIcon key={k} kind={k} className={cn("h-3 w-3", past ? "text-slate-500" : "text-violet-glow")} />
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
                <TooltipCard title={formatDateTime(new Date(y, m, day), "weekday")} rows={list.map((it) => ({ label: it.title, value: AGENDA_LABELS[it.kind] }))} />
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-slate-500">
        {ROWS.filter((k) => items.some((i) => i.kind === k)).map((k) => (
          <span key={k} className="inline-flex items-center gap-1">
            <AgendaIcon kind={k} className="h-3 w-3 text-violet-glow" /> {AGENDA_LABELS[k]}
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
        <EmptyState size="sm" icon={<CalendarDays />} title="Rien de programmé">Les boss, événements et Chroniques à venir s'afficheront ici.</EmptyState>
      ) : (
        <>
          <div className="relative hidden sm:block" aria-hidden>
            <div className="relative ml-32 h-4 border-b border-white/10">
              {weeks.map((d) => (
                <span key={d} className="absolute top-0 -translate-x-1/2 font-mono text-[11px] text-slate-500" style={{ left: `${(d / DAYS) * 100}%` }}>
                  {d === 0 ? "auj." : formatDateTime(now + d * DAY, "dayShort")}
                </span>
              ))}
            </div>
            <div className="mt-1 flex flex-col gap-1">
              {rows.map((k) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="flex shrink-0 items-center gap-1 truncate text-[11px] font-mono uppercase tracking-[0.12em] text-slate-500" style={{ width: "7.5rem" }}>
                    <AgendaIcon kind={k} className="h-3 w-3 shrink-0 text-violet-glow" />
                    <span className="truncate">{AGENDA_LABELS[k]}</span>
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
                                style={{ left: `${left}%`, width: i.endMs ? `${width}%` : undefined, background: AGENDA_TONE, boxShadow: i.done ? undefined : `0 0 8px ${alpha(AGENDA_TONE, 53)}`, opacity: i.done ? 0.3 : 1 }}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              {AGENDA_LABELS[k]} : {i.title}
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
                  <Link to={i.link} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm hover:text-slate-100 sm:flex-nowrap">
                    <AgendaIcon kind={i.kind} />
                    <span className="min-w-0 flex-1 truncate text-slate-200">{i.title}</span>
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
