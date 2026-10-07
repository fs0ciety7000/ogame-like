import { Gauge } from "lucide-react";
import { HudCallout, HudChip } from "@/components/ui/hud";
import { FoldSection, HudPanel } from "@/components/ui/panel";
import { useNowTicker } from "@/hooks/useNowTicker";
import { XP_SOURCE_LABELS } from "@/game/xpAudit";
import { XP_TIER_RULES, xpDayState, xpTierStatus } from "@/game/xpTiers";
import { cn, formatNumber } from "@/lib/utils";
import type { PlayerState } from "@/types/game";

/* 5.18 : XP du jour par source et palier en cours (plein tarif, réduit, très réduit). */

const RATE_TONE = (rate: number) => (rate >= 1 ? "mint" : rate >= XP_TIER_RULES.midRate ? "gold" : "danger") as "mint" | "gold" | "danger";

/** `fold` (6.14.67, UX-6) : section repliable, fermée par défaut (Missions : la grille passe d'abord). */
export function XpTiersCard({ player, compact = false, fold = false }: { player: Pick<PlayerState, "stats" | "testMode">; compact?: boolean; fold?: boolean }) {
  useNowTicker();
  if (!XP_TIER_RULES.enabled) return null;
  const rows = xpTierStatus(player, Date.now());
  // XP réellement créditée aujourd'hui, toutes sources (succès compris).
  const today = xpDayState(player, Date.now());
  const total = Object.values(today.applied).reduce((s, n) => s + (n ?? 0), 0);
  const shown = compact ? rows.filter((r) => r.gross > 0 || r.source === "mission") : rows;
  const aside = (
    <span className="font-mono text-[11px] text-slate-500">
      aujourd'hui <span className="text-slate-200">+{formatNumber(Math.round(total))} XP</span> · remise à zéro à minuit
    </span>
  );
  const body = (
    <>
      {player.testMode && (
        <HudCallout tone="ember" className="text-xs text-slate-300">
          Compte test : les missions se terminent aussitôt et ne rapportent pas d'XP, ce compteur reste donc vide pour elles.
        </HudCallout>
      )}
      <p className="text-xs text-slate-400">
        Chaque activité rapporte son XP pleine jusqu'à un premier seuil par jour, puis {Math.round(XP_TIER_RULES.midRate * 100)} %, puis {Math.round(XP_TIER_RULES.highRate * 100)} %. Varier les activités rapporte plus que répéter la même. Les succès ne sont pas concernés.
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {shown.map((r) => {
          const [a, b] = r.thresholds;
          const pctA = Math.min(100, (r.gross / Math.max(1, b)) * 100);
          return (
            <li key={r.source} className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-300">{XP_SOURCE_LABELS[r.source]}</span>
                <span className="ml-auto font-mono text-slate-400">
                  {formatNumber(Math.round(r.gross))} / {formatNumber(a)}
                </span>
                <HudChip size="sm" tone={RATE_TONE(r.rate)}>
                  {Math.round(r.rate * 100)} %
                </HudChip>
              </div>
              <div className="relative h-1.5 w-full overflow-hidden bg-slate-800">
                <div className={cn("h-full", r.rate >= 1 ? "bg-mint-glow" : r.rate >= XP_TIER_RULES.midRate ? "bg-gold-glow" : "bg-danger-glow")} style={{ width: `${pctA}%` }} />
                <span aria-hidden className="absolute inset-y-0 w-px bg-slate-400" style={{ left: `${(a / Math.max(1, b)) * 100}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
  if (fold) {
    return (
      <FoldSection id="missions-xp" title={<><Gauge /> XP du jour par activité</>} tone="accent" defaultOpen={false} aside={aside}>
        {body}
      </FoldSection>
    );
  }
  return (
    <HudPanel icon={<Gauge />} title="XP du jour par activité" tone="accent" aside={aside}>
      {body}
    </HudPanel>
  );
}
