import { Shield, Swords } from "lucide-react";
import { findFaction } from "@/game/pirates";
import { threatEstimate, type ThreatVerdict } from "@/game/threat";
import type { Fleet } from "@/game/fleets";
import { usePlayerStore } from "@/store/playerStore";
import { useFleetStore } from "@/store/fleetStore";
import { usePiercedFleet } from "@/store/phalanxStore";
import { HudChip } from "@/components/ui/hud";
import { cn, formatCompact } from "@/lib/utils";

const VERDICT: Record<ThreatVerdict, { label: string; color: string }> = {
  safe: { label: "Tes défenses tiennent", color: "var(--color-mint-glow)" },
  close: { label: "Combat serré", color: "var(--color-gold-glow)" },
  danger: { label: "Tu risques de perdre", color: "var(--color-danger-glow)" },
};

/** v5.1 : attaque de la flotte hostile contre la défense de la planète visée. */
export function ThreatGauge({ fleet, compact, className }: { fleet: Fleet; compact?: boolean; className?: string }) {
  const player = usePlayerStore((s) => s.player);
  const fleets = useFleetStore((s) => s.fleets);
  // 6.14.49 (É30-1c) : la phalange perce le leurre (vraie composition) et les capsules ; le verdict se refait sur ces valeurs.
  const pierced = usePiercedFleet(fleet.mission === "attack" ? fleet.id : undefined);
  if (!player) return null;
  const fleetOnly = fleet.mission === "pirate" && findFaction(fleet.factionId ?? "varan")?.raid.target === "fleet";
  const seen = pierced ? { ...fleet, units: pierced.units, power: pierced.power } : fleet;
  const t = threatEstimate(seen, player, { fleetOnly, garrisons: fleets });
  const v = VERDICT[t.verdict];
  const total = t.attack + t.defense;
  const atkPct = total > 0 ? Math.max(4, Math.min(96, (t.attack / total) * 100)) : 50;
  return (
    <div className={cn("text-left", className)}>
      <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
        <span className="flex items-center gap-1 text-danger-glow">
          <Swords className="h-3 w-3" /> {t.estimated ? "≈ " : ""}
          {formatCompact(t.attack)}
        </span>
        <span className="font-semibold" style={{ color: v.color }}>
          {v.label}
        </span>
        <span className="flex items-center gap-1 text-cyan-glow">
          {formatCompact(t.defense)} <Shield className="h-3 w-3" />
        </span>
      </div>
      <div className="mt-1 flex h-1.5 overflow-hidden bg-white/[0.06]" title="Attaque adverse / ta défense">
        <div className="h-full bg-danger-glow/80" style={{ width: `${atkPct}%` }} />
        <div className="h-full flex-1 bg-cyan-glow/70" />
      </div>
      {pierced && (
        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-violet-glow">
          <HudChip size="sm" tone="violet" title="Ta lune voit à travers le brouilleur et les capsules de cette flotte.">
            Percé par la phalange
          </HudChip>
          {!compact && pierced.piercedText && <span>{pierced.piercedText.replace(/^Percé par la phalange : /, "")}</span>}
          {compact && pierced.pierced?.decoy && <span>leurre détecté</span>}
        </p>
      )}
      {!compact && (
        <p className="mt-1 text-[11px] text-slate-500">
          Attaque {t.shield > 0 ? `après bouclier (−${Math.round(t.shield * 100)} %)` : ""} contre ta défense sur {t.targetName}
          {fleetOnly ? " (flotte à quai seulement)" : ""}{t.garrison > 0 ? `, garnisons alliées comprises (+${formatCompact(t.garrison)})` : ""}. Estimation{t.estimated ? ", composition évaluée avec tes niveaux" : ""}.
        </p>
      )}
    </div>
  );
}
