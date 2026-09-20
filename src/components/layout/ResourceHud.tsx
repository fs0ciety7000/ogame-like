import { RESOURCE_LIST } from "@/game/resources";
import { useLiveResources, useProductionRates } from "@/hooks/useLiveResources";
import { usePlayerStore } from "@/store/playerStore";
import { formatCompact, formatNumber } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AnimatedNumber } from "@/components/ui/animated-number";

export function ResourceHud() {
  const player = usePlayerStore((s) => s.player);
  const resources = useLiveResources(player);
  const rates = useProductionRates(player);

  if (!resources) return null;

  const common = RESOURCE_LIST.filter((r) => r.rarity === "common");
  const rare = RESOURCE_LIST.filter((r) => r.rarity === "rare");

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 md:justify-start">
      {common.map((res) => {
        const rate = rates[res.id] ?? 0;
        return (
          <Tooltip key={res.id}>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-space-800/70 px-2.5 py-1.5 text-sm tabular-nums">
                <span className="text-base leading-none">{res.emoji}</span>
                <AnimatedNumber
                  value={resources[res.id]}
                  format={formatCompact}
                  className="font-medium text-slate-100"
                />
                {rate > 0 && <span className="text-[10px] text-mint-glow">+{formatCompact(rate)}/s</span>}
              </div>
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
            <div className="hidden items-center gap-1.5 rounded-lg border border-white/5 bg-space-800/50 px-2 py-1.5 text-sm tabular-nums sm:flex">
              <span className="text-base leading-none opacity-80">{res.emoji}</span>
              <AnimatedNumber value={resources[res.id]} format={formatCompact} className="text-slate-300" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {res.name} : {formatNumber(resources[res.id])}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
