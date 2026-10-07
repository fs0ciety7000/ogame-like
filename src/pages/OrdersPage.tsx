import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { CalendarDays, CheckCircle2, ChevronRight, CircleDashed, ClipboardList, Gift } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { HudCallout, HudChip, StatTile, EmptyState, HUD_TONE, type HudTone } from "@/components/ui/hud";
import { HudPanel } from "@/components/ui/panel";
import { DailyMissionsCard } from "@/components/game/DailyMissionsCard";
import { ContractsCard } from "@/components/game/ContractsCard";
import { ChallengeCard } from "@/components/game/ChallengeCard";
import { useAgenda } from "@/components/game/AgendaCard";
import { AGENDA_LABELS, type AgendaItem } from "@/game/agenda";
import { AgendaIcon } from "@/components/game/agendaStyle";
import { describeClaims, pendingClaims } from "@/game/claimAll";
import { dailyOrders, type DailyOrder, type OrderState } from "@/game/dailyOrders";
import { useNowTicker } from "@/hooks/useNowTicker";
import { cn, formatDateTime } from "@/lib/utils";
import { claimAllRewards, GameActionError } from "@/services/playerService";
import { useFleetStore } from "@/store/fleetStore";
import { usePlayerStore } from "@/store/playerStore";

/* 5.30 : Ordres du jour (docs/proposals/journal-de-bord.md, option 1).
   Tout ce qui se fait chaque jour, au même endroit : liste de contrôle,
   « Tout réclamer », cartes des missions, contrats et défi, puis les
   rendez-vous des 7 prochains jours. Couleurs : mint = à réclamer,
   accent = à faire, neutre = fait, ember = week-end chargé. */

const STATE: Record<OrderState, { tone: HudTone; label: string }> = {
  ready: { tone: "mint", label: "À réclamer" },
  todo: { tone: "accent", label: "À faire" },
  done: { tone: "neutral", label: "Fait" },
};

const DAY = 24 * 3600_000;

function OrderRow({ order }: { order: DailyOrder }) {
  const s = STATE[order.state];
  return (
    <li>
      <Link
        to={order.link}
        className={cn("glass-panel hud-cut-sm relative flex items-center gap-3 px-3 py-2.5 transition-colors hover:border-cyan-glow/40", order.state === "done" && "opacity-60")}
      >
        <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ background: HUD_TONE[s.tone] }} />
        {order.state === "done" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-500" /> : <CircleDashed className="h-4 w-4 shrink-0" style={{ color: HUD_TONE[s.tone] }} />}
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-sm text-slate-100">{order.label}</span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500">{order.period}</span>
          </span>
          <span className="block text-xs text-slate-400">{order.detail}</span>
        </span>
        {order.value && <span className="font-mono text-sm tabular-nums text-slate-200">{order.value}</span>}
        <HudChip size="sm" tone={s.tone} className="hidden sm:inline-flex">
          {s.label}
        </HudChip>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
      </Link>
    </li>
  );
}

/** Rendez-vous des 7 prochains jours, regroupés par jour. */
function WeekAgenda({ now }: { now: number }) {
  const items = useAgenda(now, 7);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, i) => start.getTime() + i * DAY);
  const on = (day: number) => items.filter((it) => it.startMs < day + DAY && (it.endMs ?? it.startMs + 1) > day);
  // Week-end chargé : 3 rendez-vous ou plus entre samedi et dimanche (constat Q4 de l'audit).
  const weekend = days.filter((d) => [0, 6].includes(new Date(d).getDay()));
  const weekendItems = new Set(weekend.flatMap((d) => on(d).map((it) => it.id)));
  const busy = weekendItems.size >= 3;
  if (items.length === 0) {
    return <EmptyState size="sm" icon={<CalendarDays />} title="Semaine calme">Aucun boss, événement ni épisode dans les 7 prochains jours.</EmptyState>;
  }
  return (
    <div className="flex flex-col gap-3">
      {busy && (
        <HudCallout tone="ember" className="text-sm text-slate-300">
          <strong className="text-slate-100">Week-end chargé</strong> : <span className="font-mono tabular-nums">{weekendItems.size}</span> rendez-vous entre samedi et dimanche. Prépare ta flotte et tes ressources dès vendredi.
        </HudCallout>
      )}
      <ol className="flex flex-col gap-2">
        {days.map((day) => {
          const list = on(day);
          if (list.length === 0) return null;
          const d = new Date(day);
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          return (
            <li key={day} className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
              <span className={cn("w-28 shrink-0 font-mono text-[11px] uppercase tracking-wider", isWeekend ? "text-ember-glow" : "text-slate-400")}>
                {formatDateTime(d, "weekdayNum")}
              </span>
              <span className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                {list.map((it: AgendaItem) => (
                  <HudChip key={it.id} asChild size="sm" tone="neutral" className="max-w-full">
                    <Link to={it.link} title={`${AGENDA_LABELS[it.kind]} : ${it.title}`}>
                      <AgendaIcon kind={it.kind} className="h-3 w-3 shrink-0 text-violet-glow" />
                      <span className="truncate">{it.title}</span>
                    </Link>
                  </HudChip>
                ))}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function OrdersPage() {
  useNowTicker();
  const now = Date.now();
  const player = usePlayerStore((s) => s.player);
  const expeditionActive = useFleetStore((s) => s.fleets.some((f) => f.mission === "expedition" && f.status !== "done"));
  const [busy, setBusy] = useState(false);
  if (!player) return null;
  const orders = dailyOrders(player, now, { expeditionActive });
  const pending = pendingClaims(player, now);
  const todo = orders.filter((o) => o.state === "todo").length;
  const done = orders.filter((o) => o.state === "done").length;

  const claim = async () => {
    setBusy(true);
    try {
      const out = await claimAllRewards();
      const text = describeClaims(out ?? {});
      if (text) toast.success("Récompenses réclamées", { description: `${text}.` });
      else toast("Rien à réclamer pour l'instant.");
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Réclamation impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Journal de bord"
        title="Ordres du jour"
        description="Ce qui se fait chaque jour, au même endroit. Un clic récupère tout ce qui est prêt."
        right={
          <Button disabled={busy || pending.length === 0} onClick={() => void claim()}>
            <Gift className="h-4 w-4" /> Tout réclamer{pending.length > 0 && <span className="font-mono tabular-nums"> · {pending.length}</span>}
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-2">
        <StatTile size="sm" tone={pending.length > 0 ? "mint" : "neutral"} icon={<Gift className="h-4 w-4" />} label="À réclamer" value={<span className="font-mono">{pending.length}</span>} sub={pending.length > 0 ? "un clic sur « Tout réclamer »" : "rien en attente"} />
        <StatTile size="sm" tone={todo > 0 ? "accent" : "neutral"} icon={<CircleDashed className="h-4 w-4" />} label="À faire" value={<span className="font-mono">{todo}</span>} sub="ouvre la ligne pour agir" />
        <StatTile size="sm" tone="neutral" icon={<CheckCircle2 className="h-4 w-4" />} label="Fait" value={<span className="font-mono">{done} / {orders.length}</span>} sub="pour aujourd'hui" />
      </div>

      <HudPanel icon={<ClipboardList />} title="Liste de contrôle" tone="mint">
        <ul className="flex flex-col gap-2">
          {orders.map((o) => (
            <OrderRow key={o.id} order={o} />
          ))}
        </ul>
      </HudPanel>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div id="missions" className="scroll-mt-24">
          <DailyMissionsCard now={now} />
        </div>
        <div id="contrats" className="scroll-mt-24">
          <ContractsCard />
        </div>
      </div>

      <ChallengeCard />

      <HudPanel icon={<CalendarDays />} title="Rendez-vous de la semaine" tone="accent">
        <WeekAgenda now={now} />
      </HudPanel>
    </div>
  );
}
