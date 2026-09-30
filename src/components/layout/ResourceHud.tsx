import { RESOURCE_LIST } from "@/game/resources";
import { useLiveResources, useProductionRates } from "@/hooks/useLiveResources";
import { usePlayerStore } from "@/store/playerStore";
import { formatCompact, formatNumber } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Sparkline } from "@/components/ui/sparkline";
import { motion } from "framer-motion";
import { useFxStore } from "@/store/fxStore";

export function ResourceHud() {
  const player = usePlayerStore((s) => s.player);
  const resources = useLiveResources(player);
  const rates = useProductionRates(player);
  const pulse = useFxStore((s) => s.hudPulse);

  if (!resources || !player) return null;

  const history = player.resourceHistory ?? [];

  const common = RESOURCE_LIST.filter((r) => r.rarity === "common");
  const rare = RESOURCE_LIST.filter((r) => r.rarity === "rare");

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 md:justify-start">
      {common.map((res) => {
        const rate = rates[res.id] ?? 0;
        const trend = history.slice(-12).map((p) => p.r[res.id] ?? 0);
        return (
          <Tooltip key={res.id}>
            <TooltipTrigger asChild>
              <motion.div
                key={pulse[res.id] ?? 0}
                data-hud-res={res.id}
                initial={pulse[res.id] ? { scale: 1.18, borderColor: "rgba(94,255,196,0.8)" } : false}
                animate={{ scale: 1, borderColor: "rgba(255,255,255,0.05)" }}
                transition={{ type: "spring", stiffness: 380, damping: 14 }}
                className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-space-800/70 px-2.5 py-1.5 text-sm"
              >
                <span className="text-base leading-none">{res.emoji}</span>
                <AnimatedNumber
                  value={resources[res.id]}
                  format={formatCompact}
                  className="tabular-mono font-medium text-slate-100"
                />
                {trend.length >= 2 && <Sparkline values={trend} className="hidden lg:block" />}
                {rate > 0 && <span className="tabular-mono text-[10px] text-mint-glow">+{formatCompact(rate)}/s</span>}
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>
              {res.name} : {formatNumber(resources[res.id])} {rate > 0 && `(+${formatNumber(rate)}/s)`}
            </TooltipContent>
          </Tooltip>
        );
      })}

      <span className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />

      {rare.map((res) => (
        <Tooltip key={res.id}>
          <TooltipTrigger asChild>
            <motion.div
              key={pulse[res.id] ?? 0}
              data-hud-res={res.id}
              initial={pulse[res.id] ? { scale: 1.18, borderColor: "rgba(255,209,102,0.8)" } : false}
              animate={{ scale: 1, borderColor: "rgba(255,255,255,0.05)" }}
              transition={{ type: "spring", stiffness: 380, damping: 14 }}
              className="hidden items-center gap-1.5 rounded-lg border border-white/5 bg-space-800/50 px-2 py-1.5 text-sm sm:flex"
            >
              <span className="text-base leading-none opacity-80">{res.emoji}</span>
              <AnimatedNumber value={resources[res.id]} format={formatCompact} className="tabular-mono text-slate-300" />
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            {res.name} : {formatNumber(resources[res.id])}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
