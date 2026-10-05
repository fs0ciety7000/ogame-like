import { useState } from "react";
import { FileText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HudChip, StatBar } from "@/components/ui/hud";
import { findTech } from "@/game/technologies";
import { getUnitBuildTime, UNITS, UNIT_TO_TECH, unitLevelBonus, type UnitDef } from "@/game/units";
import { SPEC_STATS, specLevels, unitDesignation, unitEfficiency, unitRanks, unitSpecAt, type SpecStat } from "@/game/unitSpec";
import { assetUrl } from "@/lib/assets";
import { cn, formatDuration, formatNumber } from "@/lib/utils";
import type { PlayerState } from "@/types/game";

/* 5.16 : fiche technique d'une unité, façon plan d'ingénieur : désignation,
   silhouette sur trame, caractéristiques au niveau actuel et au maximum,
   rang face aux autres unités, efficacité, et tableau niveau par niveau. */

const STAT_COLOR: Record<SpecStat, string> = {
  attack: "var(--color-danger-glow)",
  defense: "var(--color-cyan-glow)",
  speed: "var(--color-mint-glow)",
  cargo: "var(--color-gold-glow)",
};

export function UnitSpecButton({ unit, player }: { unit: UnitDef; player: PlayerState }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)} title="Fiche technique">
        <FileText className="h-3.5 w-3.5" /> Fiche technique
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">{open && <UnitSpecSheet unit={unit} player={player} />}</DialogContent>
      </Dialog>
    </>
  );
}

export function UnitSpecSheet({ unit, player }: { unit: UnitDef; player: PlayerState }) {
  const level = Math.max(0, player.units[unit.id]?.level ?? 0);
  const shown = Math.max(1, level);
  const now = unitSpecAt(unit, shown, player.techLevels);
  const max = unitSpecAt(unit, unit.maxLevel, player.techLevels);
  // Échelle des barres : la meilleure unité au niveau maximum (même technos).
  const scale = Object.fromEntries(SPEC_STATS.map(({ id }) => [id, Math.max(1, ...UNITS.map((u) => unitSpecAt(u, u.maxLevel, player.techLevels)[id]))])) as Record<SpecStat, number>;
  const ranks = unitRanks(unit);
  const eff = unitEfficiency(unit);
  const tech = findTech(UNIT_TO_TECH[unit.id]);
  const levels = specLevels(unit.maxLevel);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-2 border-b border-white/10 pb-2">
        <span className="font-mono text-[10px] tracking-[0.2em] text-cyan-glow">{unitDesignation(unit)}</span>
        <DialogTitle className="hud-title text-xl text-slate-100">{unit.name}</DialogTitle>
        <span className="ml-auto flex flex-wrap gap-1.5">
          <HudChip size="sm" tone={unit.category === "attack" ? "danger" : "accent"}>
            {unit.category === "attack" ? "Attaque" : "Défense"}
          </HudChip>
          <HudChip size="sm" tone="neutral">
            {level > 0 ? `Niveau ${level} / ${unit.maxLevel}` : `Niveau max ${unit.maxLevel}`}
          </HudChip>
        </span>
      </div>
      <DialogDescription className="sr-only">Fiche technique de l'unité {unit.name}.</DialogDescription>

      <div className="grid gap-4 md:grid-cols-[1fr_1.1fr]">
        {/* Silhouette sur trame de plan, avec cotes */}
        <div className="spec-blueprint hud-cut-sm relative grid min-h-52 place-items-center overflow-hidden border border-cyan-glow/20">
          <img src={assetUrl(unit.image)} alt={unit.name} className="relative max-h-44 w-[80%] object-contain" />
          <span className="absolute left-2 top-2 font-mono text-[9px] tracking-[0.2em] text-cyan-glow/70">VUE DE PROFIL · ÉCH. 1:200</span>
          <span className="absolute bottom-2 left-2 font-mono text-[9px] tracking-[0.2em] text-slate-500">HANGAR {unit.hangarSpace} PL.</span>
          <span className="absolute bottom-2 right-2 font-mono text-[9px] tracking-[0.2em] text-slate-500">{unit.id.toUpperCase()}</span>
        </div>

        {/* Caractéristiques */}
        <div className="flex flex-col gap-2.5">
          {SPEC_STATS.map(({ id, label, short }) => (
            <div key={id} className="grid grid-cols-[1fr_auto] items-end gap-3">
              <StatBar label={short} value={now[id]} max={scale[id]} color={STAT_COLOR[id]} display={formatNumber(now[id])} />
              <span className="pb-0.5 text-right font-mono text-[10px] tabular-nums text-slate-500" title={`${label} : rang ${ranks[id].rank} sur ${ranks[id].of} (valeur de base)`}>
                max {formatNumber(max[id])} · #{ranks[id].rank}/{ranks[id].of}
              </span>
            </div>
          ))}
          <dl className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-white/10 pt-2 font-mono text-[11px] tabular-nums">
            <dt className="text-slate-500">Coût</dt>
            <dd className="text-right text-slate-200">
              {formatNumber(unit.cost.scrap)} ferr. · {formatNumber(unit.cost.energy)} én.
            </dd>
            <dt className="text-slate-500">Construction</dt>
            <dd className="text-right text-slate-200">{formatDuration(getUnitBuildTime(unit, player.techLevels, player))}</dd>
            <dt className="text-slate-500">Gain par niveau</dt>
            <dd className="text-right text-slate-200">+{formatNumber(unitLevelBonus(unit))} ATK / DEF</dd>
            <dt className="text-slate-500">ATK / 1 000 res.</dt>
            <dd className="text-right text-slate-200">{eff.attackPerK}</dd>
            <dt className="text-slate-500">RÉS / 1 000 res.</dt>
            <dd className="text-right text-slate-200">{eff.defensePerK}</dd>
            <dt className="text-slate-500">Puissance / place</dt>
            <dd className="text-right text-slate-200">{eff.powerPerSlot}</dd>
            <dt className="text-slate-500">Soute / place</dt>
            <dd className="text-right text-slate-200">{eff.cargoPerSlot}</dd>
            <dt className="text-slate-500">Débloquée par</dt>
            <dd className="truncate text-right text-slate-200">{unit.blueprint ? "Plan Kesh'Vaar" : (tech?.nom ?? "—")}</dd>
          </dl>
        </div>
      </div>

      {/* Niveau par niveau */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] font-mono text-[11px] tabular-nums">
          <thead>
            <tr className="text-left font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
              <th className="py-1 pr-2 font-normal">Niv.</th>
              {SPEC_STATS.map((s) => (
                <th key={s.id} className="py-1 pr-2 text-right font-normal">
                  {s.short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {levels.map((l) => {
              const v = unitSpecAt(unit, l, player.techLevels);
              return (
                <tr key={l} className={cn("border-t border-white/5", l === level && "bg-cyan-glow/10 text-cyan-glow")}>
                  <td className="py-1 pr-2">{l}</td>
                  {SPEC_STATS.map((s) => (
                    <td key={s.id} className="py-1 pr-2 text-right text-slate-200">
                      {formatNumber(v[s.id])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-1.5 text-[11px] text-slate-500">Attaque et défense incluent tes technos de puissance et de blindage. Vitesse et soute se multiplient par le niveau ; une flotte avance à la vitesse de son vaisseau le plus lent.</p>
      </div>
    </div>
  );
}
