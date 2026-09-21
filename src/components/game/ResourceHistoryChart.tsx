import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { RESOURCE_LIST } from "@/game/resources";
import { formatNumber, timeAgo } from "@/lib/utils";
import type { ResourceHistoryPoint, ResourceId } from "@/types/game";

const CHART_WIDTH = 600;
const CHART_HEIGHT = 200;
const PADDING_Y = 16;

export function ResourceHistoryChart({ history }: { history: ResourceHistoryPoint[] | undefined }) {
  const [selected, setSelected] = useState<ResourceId>("scrap");
  const def = RESOURCE_LIST.find((r) => r.id === selected)!;

  const series = useMemo(
    () => (history ?? []).map((p) => ({ t: p.t, v: p.r[selected] ?? 0 })),
    [history, selected],
  );

  const chart = useMemo(() => {
    if (series.length < 2) return null;
    const values = series.map((p) => p.v);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const step = CHART_WIDTH / (series.length - 1);

    const coords = series.map((p, i) => {
      const x = i * step;
      const y = PADDING_Y + (1 - (p.v - min) / span) * (CHART_HEIGHT - PADDING_Y * 2);
      return { x, y };
    });

    const line = coords.map((c) => `${c.x},${c.y}`).join(" ");
    const area = `M${coords[0].x},${CHART_HEIGHT} L${line.split(" ").join(" L")} L${coords[coords.length - 1].x},${CHART_HEIGHT} Z`;

    return { coords, line, area };
  }, [series]);

  const color = def.rarity === "rare" ? "var(--color-gold-glow)" : "var(--color-cyan-glow)";
  const gradientId = `resource-history-grad-${selected}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Évolution des ressources</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Tabs value={selected} onValueChange={(v) => setSelected(v as ResourceId)}>
          <div className="-mx-1 overflow-x-auto px-1">
            <TabsList>
              {RESOURCE_LIST.map((r) => (
                <TabsTrigger key={r.id} value={r.id} title={r.name}>
                  {r.emoji}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>

        {!chart ? (
          <p className="py-10 text-center text-sm text-slate-500">
            Historique en cours de constitution — reviens dans quelques temps pour voir l'évolution de tes ressources.
          </p>
        ) : (
          <div>
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-xs text-slate-500">{timeAgo(series[0].t)}</span>
              <AnimatedNumber
                value={series[series.length - 1].v}
                format={formatNumber}
                className="font-display text-lg tabular-nums text-slate-100"
              />
              <span className="text-xs text-slate-500">maintenant</span>
            </div>
            <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="h-40 w-full sm:h-48" preserveAspectRatio="none">
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={chart.area} fill={`url(#${gradientId})`} stroke="none" />
              <polyline
                points={chart.line}
                fill="none"
                stroke={color}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
