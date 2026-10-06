import { EmptyAction } from "@/components/ui/panel";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { EmptyState, HudChip, type HudTone } from "@/components/ui/hud";
import { Sparkles } from "lucide-react";
import { EFFECT_SOURCE_LABELS, EFFECT_STATS, effectStatLabel, formatEffectValue, type EffectSheetLine, type EffectSourceKind, type EffectStatInfo } from "@/game/effects";
import { playerEffectSheet } from "@/game/modifiers";
import { RESOURCE_LABELS } from "@/game/resources";
import type { PlayerState } from "@/types/game";

/* v5.14 : fiche d'effets. Tout ce qui modifie l'empire, d'où ça vient,
   et quand un plafond est atteint. Lue dans le circuit d'effets. */

const SOURCE_TONE: Record<EffectSourceKind, HudTone> = {
  tech: "accent",
  officer: "gold",
  relic: "violet",
  talent: "mint",
  territory: "ember",
  capsule: "danger",
  season: "neutral",
};

const GROUPS: { id: EffectStatInfo["group"]; label: string }[] = [
  { id: "combat", label: "Combat" },
  { id: "economie", label: "Économie" },
  { id: "durees", label: "Durées" },
  { id: "flottes", label: "Flottes" },
  { id: "renseignement", label: "Renseignement" },
];

function Line({ line }: { line: EffectSheetLine }) {
  const capped = Math.abs(line.raw - line.total) > 1e-9;
  return (
    <li className="flex flex-col gap-1.5 border-t border-white/5 py-2 first:border-t-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="text-sm text-slate-100">
          {effectStatLabel(line.stat, line.target, { resource: (id) => RESOURCE_LABELS[id] ?? id })}
          <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-slate-500">{line.layer === "tech" ? "technologies" : "empire"}</span>
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          {line.sources.map((s) => (
            <HudChip key={`${s.source.kind}-${s.source.id}-${s.scope}`} size="sm" tone={SOURCE_TONE[s.source.kind]} className="whitespace-normal" title={EFFECT_SOURCE_LABELS[s.source.kind]}>
              {s.source.label} {formatEffectValue(line.stat, s.value)}
              {s.scope === "pvp" ? " · entre joueurs" : s.scope === "colonies" ? " · colonies" : s.scope === "home" ? " · planète mère" : s.scope === "pve" ? " · contre les PNJ" : s.scope === "warlord" ? " · contre les seigneurs" : ""}
            </HudChip>
          ))}
        </div>
      </div>
      <div className="shrink-0 text-left sm:text-right">
        <p className="font-mono text-base tabular-nums text-slate-100">{formatEffectValue(line.stat, line.total)}</p>
        {capped && <p className="text-[11px] text-ember-glow">plafond atteint</p>}
      </div>
    </li>
  );
}

export function EffectSheet({ player, now }: { player: PlayerState; now: number }) {
  // La fiche bouge peu : recalcul à la minute.
  const minute = Math.floor(now / 60_000);
  const lines = useMemo(() => playerEffectSheet(player, minute * 60_000), [player, minute]);
  if (lines.length === 0)
    return (
      <EmptyState icon={<Sparkles className="h-6 w-6" />} title="Aucun effet actif" action={<EmptyAction to="/game/etat-major">Recruter un officier</EmptyAction>}>
        Recherche des technologies, nomme des officiers et équipe des reliques : leurs effets s'affichent ici.
      </EmptyState>
    );
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {GROUPS.map((g) => {
        const own = lines.filter((l) => EFFECT_STATS[l.stat].group === g.id);
        if (own.length === 0) return null;
        return (
          <Card key={g.id} className="p-4">
            <h3 className="hud-title mb-2 text-sm text-slate-100">{g.label}</h3>
            <ul>
              {own.map((l) => (
                <Line key={`${l.layer}-${l.stat}-${l.target ?? ""}`} line={l} />
              ))}
            </ul>
          </Card>
        );
      })}
      <p className="text-xs text-slate-500 lg:col-span-2">
        Les technologies agissent sur chaque unité et chaque formule de base ; les bonus de l'empire (officiers, reliques, talents, territoire) multiplient ensuite le résultat. Les durées de l'empire sont plafonnées à −50 %, celles des technologies à −75 %.
      </p>
    </div>
  );
}
