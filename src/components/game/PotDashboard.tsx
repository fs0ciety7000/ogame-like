import { useMemo, useState } from "react";
import { BarChart3, Table2, ChartColumn } from "lucide-react";
import { HudPanel } from "@/components/ui/panel";
import { EmptyState, HudChip, StatTile } from "@/components/ui/hud";
import { AmberAmount } from "@/components/ui/amber";
import { POT_DAILY_DAYS, POT_SOURCE_LABELS, type PotSource, type ServerPot } from "@/game/serverPot";
import { formatCompact } from "@/lib/utils";
import { cn } from "@/lib/utils";

/* 5.26.2 : tableau de bord du pot commun. Entrées par jour et par source sur
   30 jours (barres empilées, équivalent ressource commune : une rare vaut 50).
   L'Ambre n'a pas la même unité : elle reste à part (tuile + tableau). */

const SERIES: { id: Exclude<PotSource, "admin">; color: string }[] = [
  { id: "market", color: "var(--chart-1)" },
  { id: "gift", color: "var(--chart-2)" },
  { id: "auction", color: "var(--chart-3)" },
  { id: "exchange", color: "var(--chart-4)" },
];

const SHORT: Record<string, string> = { market: "Marché", gift: "Cadeaux", auction: "Enchères", exchange: "Comptoir" };

type Day = { day: string; values: Record<string, number>; total: number; amber: number };

function lastDays(daily: ServerPot["daily"], now: number): Day[] {
  const out: Day[] = [];
  for (let i = POT_DAILY_DAYS - 1; i >= 0; i--) {
    const day = new Date(now - i * 86_400_000).toISOString().slice(0, 10);
    const row = daily?.[day] ?? {};
    const values = Object.fromEntries(SERIES.map((s) => [s.id, row[s.id] ?? 0]));
    out.push({ day, values, total: SERIES.reduce((a, s) => a + (row[s.id] ?? 0), 0), amber: row.amber ?? 0 });
  }
  return out;
}

const shortDay = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

export function PotDashboard({ pot }: { pot: ServerPot }) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const [hover, setHover] = useState<number | null>(null);
  const days = useMemo(() => lastDays(pot.daily, Date.now()), [pot.daily]);
  const total = days.reduce((a, d) => a + d.total, 0);
  const amber = days.reduce((a, d) => a + d.amber, 0);
  const bySource = SERIES.map((s) => ({ ...s, sum: days.reduce((a, d) => a + d.values[s.id], 0) }));
  const top = [...bySource].sort((a, b) => b.sum - a.sum)[0];
  const max = Math.max(1, ...days.map((d) => d.total));
  const hovered = hover !== null ? days[hover] : null;

  return (
    <HudPanel
      icon={<BarChart3 />}
      title={`Entrées du pot · ${POT_DAILY_DAYS} jours`}
      tone="gold"
      aside={
        <div className="flex gap-1" role="group" aria-label="Affichage">
          <HudChip size="sm" tone={view === "chart" ? "accent" : "neutral"} asChild>
            <button type="button" onClick={() => setView("chart")} aria-pressed={view === "chart"}>
              <BarChart3 className="h-3 w-3" /> Graphique
            </button>
          </HudChip>
          <HudChip size="sm" tone={view === "table" ? "accent" : "neutral"} asChild>
            <button type="button" onClick={() => setView("table")} aria-pressed={view === "table"}>
              <Table2 className="h-3 w-3" /> Tableau
            </button>
          </HudChip>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile size="sm" tone="gold" label="Total 30 j" value={<span className="font-mono">{formatCompact(total)}</span>} sub="équiv. ressource commune" />
        <StatTile size="sm" tone="accent" label="Moyenne / jour" value={<span className="font-mono">{formatCompact(Math.round(total / POT_DAILY_DAYS))}</span>} />
        <StatTile size="sm" tone="neutral" label="Première source" value={<span className="text-base">{top.sum > 0 ? SHORT[top.id] : "—"}</span>} sub={top.sum > 0 ? `${Math.round((top.sum / Math.max(1, total)) * 100)} % des entrées` : undefined} />
        <StatTile size="sm" tone="gold" label="Ambre 30 j" value={<AmberAmount value={amber} label={false} className="font-mono tabular-nums" />} sub="taxe des enchères et dons des mécènes" />
      </div>

      {total === 0 && amber === 0 ? (
        <EmptyState icon={<ChartColumn />} title="Pas encore d'entrée" size="sm">
          Les taxes du marché, des cadeaux, des enchères et du comptoir d'échange s'afficheront ici jour après jour.
        </EmptyState>
      ) : view === "chart" ? (
        <div className="flex flex-col gap-2">
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-300" aria-label="Légende">
            {bySource.map((s) => (
              <li key={s.id} className="inline-flex items-center gap-1.5">
                <span aria-hidden className="h-2.5 w-2.5" style={{ background: s.color }} />
                {POT_SOURCE_LABELS[s.id]}
              </li>
            ))}
          </ul>
          <div className="relative">
            <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between border-t border-dashed border-white/10 font-mono text-[11px] tabular-nums text-slate-500">
              <span className="-mt-2 bg-space-900 pr-1">{formatCompact(max)}</span>
            </div>
            <div className="flex h-44 items-end gap-[2px] border-b border-white/15 pt-3" onMouseLeave={() => setHover(null)}>
              {days.map((d, i) => (
                <button
                  key={d.day}
                  type="button"
                  className={cn("flex h-full min-w-0 flex-1 flex-col-reverse justify-start gap-[2px] focus-visible:outline focus-visible:outline-1 focus-visible:outline-cyan-glow", hover !== null && hover !== i && "opacity-50")}
                  onMouseEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  aria-label={`${shortDay(d.day)} : ${formatCompact(d.total)}`}
                >
                  {SERIES.map((s) =>
                    d.values[s.id] > 0 ? <span key={s.id} className="w-full shrink-0" style={{ height: `${(d.values[s.id] / max) * 100}%`, minHeight: 2, background: s.color }} /> : null,
                  )}
                </button>
              ))}
            </div>
            {hovered && (
              <div
                className="hud-cut-sm pointer-events-none absolute top-0 z-10 w-48 border border-cyan-glow/30 bg-space-800/95 p-2 text-xs backdrop-blur-sm"
                style={hover! < POT_DAILY_DAYS / 2 ? { left: `${((hover! + 1) / POT_DAILY_DAYS) * 100}%` } : { right: `${((POT_DAILY_DAYS - hover!) / POT_DAILY_DAYS) * 100}%` }}
              >
                <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-slate-400">{hovered.day}</p>
                {SERIES.map((s) => (
                  <p key={s.id} className="flex items-center justify-between gap-2 text-slate-300">
                    <span className="inline-flex items-center gap-1.5">
                      <span aria-hidden className="h-2 w-2" style={{ background: s.color }} />
                      {SHORT[s.id]}
                    </span>
                    <span className="font-mono tabular-nums text-slate-100">{formatCompact(hovered.values[s.id])}</span>
                  </p>
                ))}
                <p className="mt-1 flex justify-between border-t border-white/10 pt-1 text-slate-300">
                  Total <span className="font-mono tabular-nums text-slate-100">{formatCompact(hovered.total)}</span>
                </p>
                {hovered.amber > 0 && (
                  <p className="flex justify-between text-slate-300">
                    Ambre <AmberAmount value={hovered.amber} label={false} className="font-mono tabular-nums" />
                  </p>
                )}
              </div>
            )}
            <div className="mt-1 flex justify-between font-mono text-[11px] tabular-nums text-slate-500">
              <span>{shortDay(days[0].day)}</span>
              <span>{shortDay(days[Math.floor(days.length / 2)].day)}</span>
              <span>aujourd'hui</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-h-80 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-space-900 text-left font-mono text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-1 pr-2 font-normal">Jour</th>
                {SERIES.map((s) => (
                  <th key={s.id} className="px-2 py-1 text-right font-normal">
                    {SHORT[s.id]}
                  </th>
                ))}
                <th className="px-2 py-1 text-right font-normal">Total</th>
                <th className="py-1 pl-2 text-right font-normal">Ambre</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums text-slate-300">
              {[...days].reverse().map((d) => (
                <tr key={d.day} className="border-t border-white/5">
                  <td className="py-1 pr-2 text-slate-400">{d.day}</td>
                  {SERIES.map((s) => (
                    <td key={s.id} className="px-2 py-1 text-right">
                      {d.values[s.id] ? formatCompact(d.values[s.id]) : "·"}
                    </td>
                  ))}
                  <td className="px-2 py-1 text-right text-slate-100">{d.total ? formatCompact(d.total) : "·"}</td>
                  <td className="py-1 pl-2 text-right">{d.amber || "·"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </HudPanel>
  );
}
