import { RESOURCE_LIST } from "@/game/resources";
import { useLiveResources, useProductionRates } from "@/hooks/useLiveResources";
import { usePlayerStore } from "@/store/playerStore";
import { formatCompact, formatNumber } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Sparkline } from "@/components/ui/sparkline";
import { motion } from "framer-motion";
import { useFxStore } from "@/store/fxStore";
import { economySnapshot } from "@/game/economy";
import { HostileFleetAlert } from "@/components/game/FleetsPanel";
import { EventBadge } from "@/components/game/EventBanner";
import { UltimatumBadge } from "@/components/game/PirateUltimatum";
import { cn } from "@/lib/utils";

export function ResourceHud() {
  const player = usePlayerStore((s) => s.player);
  const resources = useLiveResources(player);
  const rates = useProductionRates(player, resources);
  const pulse = useFxStore((s) => s.hudPulse);

  if (!resources || !player) return null;

  const history = player.resourceHistory ?? [];
  const economy = economySnapshot({ ...player, resources }, Date.now());

  const common = RESOURCE_LIST.filter((r) => r.rarity === "common");
  const rare = RESOURCE_LIST.filter((r) => r.rarity === "rare");

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 xl:flex xl:flex-wrap xl:items-stretch">
      {common.map((res) => {
        const rate = rates[res.id] ?? 0;
        const trend = history.slice(-12).map((p) => p.r[res.id] ?? 0);
        const full = economy.full.includes(res.id);
        const fill = Number.isFinite(economy.capacity) && economy.capacity > 0 ? (resources[res.id] / economy.capacity) * 100 : 0;
        return (
          <Tooltip key={res.id}>
            <TooltipTrigger asChild>
              <motion.div
                key={pulse[res.id] ?? 0}
                data-hud-res={res.id}
                initial={pulse[res.id] ? { scale: 1.08 } : false}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 14 }}
                className={cn(
                  "hud-cut-sm relative flex min-w-[9.5rem] items-center gap-2 overflow-hidden border bg-space-900/70 px-2.5 pb-2 pt-1.5 xl:flex-1",
                  full ? "border-ember-glow/60" : "border-cyan-glow/15",
                )}
              >
                <span className="text-lg leading-none">{res.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <AnimatedNumber value={resources[res.id]} format={formatCompact} className="tabular-mono text-[15px] font-semibold text-white" />
                    {full ? (
                      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ember-glow">plein</span>
                    ) : rate !== 0 ? (
                      <span className={cn("tabular-mono text-[10px]", rate > 0 ? "text-mint-glow" : "text-danger-glow")}>
                        {rate > 0 ? "+" : ""}
                        {formatCompact(rate)}/s
                      </span>
                    ) : null}
                  </div>
                  <p className="truncate font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">{res.name}</p>
                </div>
                {trend.length >= 2 && <Sparkline values={trend} className="hidden 2xl:block" />}
                <span className="absolute inset-x-0 bottom-0 h-[3px] bg-white/[0.05]">
                  <span
                    className="block h-full transition-[width] duration-700"
                    style={{
                      width: `${Math.min(100, fill)}%`,
                      background: full ? "var(--color-ember-glow)" : fill > 85 ? "var(--color-gold-glow)" : "linear-gradient(90deg, var(--color-cyan-glow), var(--color-mint-glow))",
                    }}
                  />
                </span>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>
              {res.name} : {formatNumber(resources[res.id])} / {Number.isFinite(economy.capacity) ? formatNumber(economy.capacity) : "∞"}
              {rate !== 0 && ` (${rate > 0 ? "+" : ""}${formatNumber(rate)}/s)`}
              {full && " — entrepôt plein, production à l'arrêt"}
              {res.id === "energy" && economy.upkeep > 0 && ` — entretien de la flotte : −${formatNumber(Math.round(economy.upkeep))}/s`}
            </TooltipContent>
          </Tooltip>
        );
      })}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
      <HostileFleetAlert />
      <EventBadge />
      <UltimatumBadge />
      {economy.outage && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="animate-pulse-alert border border-danger-glow/60 bg-danger-glow/15 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-danger-glow">
              ⚡ Panne d'énergie
            </span>
          </TooltipTrigger>
          <TooltipContent>
            L'entretien de ta flotte consomme plus d'énergie que tu n'en produis : les autres productions tournent à 50 %. Améliore le
            Réacteur ou réduis ta flotte.
          </TooltipContent>
        </Tooltip>
      )}


      {rare.map((res) => (
        <Tooltip key={res.id}>
          <TooltipTrigger asChild>
            <motion.div
              key={pulse[res.id] ?? 0}
              data-hud-res={res.id}
              initial={pulse[res.id] ? { scale: 1.15 } : false}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 14 }}
              className="flex items-center gap-1.5 border border-gold-glow/15 bg-gold-glow/[0.04] px-2 py-1 text-xs"
            >
              <span className="text-sm leading-none">{res.emoji}</span>
              <AnimatedNumber value={resources[res.id]} format={formatCompact} className="tabular-mono text-slate-200" />
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            {res.name} : {formatNumber(resources[res.id])}
          </TooltipContent>
        </Tooltip>
      ))}
      </div>
    </div>
  );
}
