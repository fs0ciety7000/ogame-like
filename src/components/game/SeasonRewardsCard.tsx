import type { ReactNode } from "react";
import { AmberAmount } from "@/components/ui/amber";
import { HUD_TONE, type HudTone } from "@/components/ui/hud";
import { SEASON_RULES, seasonEndMs, seasonMonthPhrase, type SeasonPrize } from "@/game/seasons";
import { formatCompact, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

/* 5.15.4 : récompenses de fin de saison (onglet Saison en cours du classement
   et palmarès) : champion, 2e-3e au prorata, chaque joueur actif. */

function Prize({ prize, prefix }: { prize: SeasonPrize; prefix?: string }) {
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs tabular-nums text-slate-200">
      {prefix && <span className="text-slate-500">{prefix}</span>}
      <span>{formatNumber(prize.tokens)} jetons</span>
      <AmberAmount value={prize.amber} />
      <span>{formatCompact(prize.common)} de chaque ressource commune</span>
    </span>
  );
}

function Row({ tone, label, children }: { tone: HudTone; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-l-2 py-1.5 pl-3" style={{ borderColor: HUD_TONE[tone] }}>
      <p className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: HUD_TONE[tone] }}>
        {label}
      </p>
      {children}
    </div>
  );
}

export function SeasonRewardsCard({ seasonId, className }: { seasonId: string; className?: string }) {
  const days = Math.max(0, Math.ceil((seasonEndMs() - Date.now()) / 86_400_000));
  return (
    <div className={cn("glass-panel hud-cut flex flex-col gap-2 p-4", className)}>
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h3 className="hud-title text-sm text-white">Récompenses de fin de saison</h3>
        <span className="font-mono text-[11px] text-slate-500">
          versées le 1er du mois · encore {days} jour{days > 1 ? "s" : ""}
        </span>
      </div>
      <div className="grid gap-2 lg:grid-cols-3">
        <Row tone="gold" label="1er">
          <p className="text-xs text-slate-300">
            Titre « {SEASON_RULES.champion.title} {seasonMonthPhrase(seasonId)} »
          </p>
          <Prize prize={SEASON_RULES.champion} />
        </Row>
        <Row tone="accent" label="2e et 3e">
          <p className="text-xs text-slate-300">Se partagent, au prorata de leur XP de saison :</p>
          <Prize prize={SEASON_RULES.podium} />
        </Row>
        <Row tone="mint" label="Chaque joueur actif">
          <p className="text-xs text-slate-300">Au moins {formatNumber(SEASON_RULES.participationXp)} XP de saison, en plus du reste :</p>
          <Prize prize={SEASON_RULES.participation} />
        </Row>
      </div>
    </div>
  );
}
