import { useMemo, useState } from "react";
import { LineChart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResourceIcon } from "@/components/ui/game-icon";
import { RESOURCE_LIST } from "@/game/resources";
import { MARKET_HISTORY_RULES, priceHistory, referencePrice } from "@/game/marketHistory";
import type { MarketOffer } from "@/game/market";
import type { ResourceId } from "@/types/game";
import { formatDecimal } from "@/lib/utils";

/* v4.8 : prix des échanges conclus, par ressource, relatif au comptoir. */

const W = 600;
const H = 180;
const PAD = 18;

type Trade = Pick<MarketOffer, "giveRes" | "giveAmount" | "wantRes" | "wantAmount" | "filledAtMs">;

export function formatRatio(r: number): string {
  return `× ${formatDecimal(r, 2)}`;
}

export function MarketPriceChart({ trades, now }: { trades: Trade[]; now: number }) {
  const [res, setRes] = useState<ResourceId>("scrap");
  const points = useMemo(() => priceHistory(trades, res, now), [trades, res, now]);
  const ref = useMemo(() => referencePrice(trades, res, now), [trades, res, now]);
  const def = RESOURCE_LIST.find((r) => r.id === res)!;
  const color = def.rarity === "rare" ? "var(--color-gold-glow)" : "var(--color-cyan-glow)";

  const chart = useMemo(() => {
    if (points.length === 0) return null;
    const start = now - MARKET_HISTORY_RULES.days * 86400_000;
    const values = [...points.map((p) => p.median), 1];
    const max = Math.max(...values) * 1.15;
    const min = Math.min(...values) * 0.85;
    const x = (t: number) => ((t - start) / (now - start)) * W;
    const y = (v: number) => PAD + (1 - (v - min) / (max - min || 1)) * (H - PAD * 2);
    const coords = points.map((p) => ({ x: x(p.day + 43200_000), y: y(p.median), p }));
    return { coords, line: coords.map((c) => `${c.x},${c.y}`).join(" "), base: y(1) };
  }, [points, now]);

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="hud-title flex items-center gap-2 text-sm">
          <LineChart className="h-4 w-4 text-cyan-glow" /> Prix des {MARKET_HISTORY_RULES.days} derniers jours
        </h2>
        <span className="ml-auto text-[11px] text-slate-500">× 1 = prix du comptoir</span>
      </div>
      <Tabs value={res} onValueChange={(v) => setRes(v as ResourceId)}>
        <div className="-mx-1 overflow-x-auto px-1">
          <TabsList>
            {RESOURCE_LIST.map((r) => (
              <TabsTrigger key={r.id} value={r.id} title={r.name}>
                <ResourceIcon id={r.id} className="h-5 w-5" />
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>
      {!chart ? (
        <p className="py-8 text-center text-sm text-slate-500">Aucun échange de {def.name.toLowerCase()} sur la période.</p>
      ) : (
        <div>
          <div className="mb-1 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs">
            <span className="text-slate-400">{def.name}</span>
            {ref ? (
              <span>
                Prix habituel : <strong className="font-mono text-slate-100">{formatRatio(ref.median)}</strong>
                <span className="text-slate-500"> ({ref.trades} échanges)</span>
              </span>
            ) : (
              <span className="text-slate-500">Moins de {MARKET_HISTORY_RULES.minTrades} échanges : pas encore de prix habituel.</span>
            )}
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full" preserveAspectRatio="none" role="img" aria-label={`Prix médian par jour de ${def.name}`}>
            <line x1={0} x2={W} y1={chart.base} y2={chart.base} stroke="currentColor" className="text-slate-600" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
            {chart.coords.length > 1 && <polyline points={chart.line} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />}
            {chart.coords.map((c) => (
              <circle key={c.p.day} cx={c.x} cy={c.y} r={3.5} fill={color}>
                <title>{`${new Date(c.p.day).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} : ${formatRatio(c.p.median)} (${c.p.trades} échange${c.p.trades > 1 ? "s" : ""})`}</title>
              </circle>
            ))}
          </svg>
          <div className="mt-1 flex justify-between text-[10px] text-slate-500">
            <span>il y a {MARKET_HISTORY_RULES.days} j</span>
            <span>pointillés : prix du comptoir</span>
            <span>aujourd'hui</span>
          </div>
        </div>
      )}
    </Card>
  );
}
