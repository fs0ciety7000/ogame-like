import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { HudChip, type HudTone } from "@/components/ui/hud";
import { EFFECT_SOURCE_LABELS, EFFECT_STATS, effectStatLabel, formatEffectValue, type EffectSourceKind } from "@/game/effects";
import { effectImpactReport, SEASON_SHARE_NOTE } from "@/game/impact";
import { RESOURCE_LABELS } from "@/game/resources";
import { useContentStore } from "@/services/contentService";

/* v5.14 : rapport d'impact du circuit d'effets — qui peut donner quoi, et jusqu'où. */

const TONE: Record<EffectSourceKind, HudTone> = { tech: "accent", officer: "gold", relic: "violet", talent: "mint", territory: "ember", capsule: "danger", season: "neutral" };

export function ImpactReportPanel() {
  // Abonné au contenu : recalculé quand il change (technos, reliques…). Calcul léger.
  useContentStore((s) => s.version);
  const rows = effectImpactReport();
  const [filter, setFilter] = useState<EffectSourceKind | "all">("all");
  const shown = rows.filter((r) => filter === "all" || r.sources.some((s) => s.kind === filter));
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles className="h-4 w-4 text-gold-glow" />
        <h2 className="hud-title text-sm text-slate-100">Rapport d'impact des effets</h2>
        <div className="ml-auto flex flex-wrap gap-1">
          {(["all", "tech", "officer", "relic", "talent", "territory"] as const).map((k) => (
            <HudChip key={k} asChild size="sm" tone={filter === k ? "accent" : "neutral"}>
              <button type="button" onClick={() => setFilter(k)}>
                {k === "all" ? "Tout" : EFFECT_SOURCE_LABELS[k]}
              </button>
            </HudChip>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-400">
        Pour chaque grandeur, toutes les sources que le contenu peut donner, à leur maximum, et le total théorique (plafonds compris). Ajouter une technologie, une relique ou un rôle d'officier met ce rapport à jour. {SEASON_SHARE_NOTE}
      </p>
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        {shown.map((r) => (
          <div key={`${r.layer}-${r.stat}-${r.target ?? ""}`} className="hud-cut-sm flex flex-col gap-1.5 border border-white/10 p-3">
            <div className="flex flex-wrap items-baseline gap-2">
              <p className="text-sm text-slate-100">{effectStatLabel(r.stat, r.target, { resource: (id) => RESOURCE_LABELS[id] ?? id })}</p>
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{r.layer === "tech" ? "technologies" : "empire"} · {EFFECT_STATS[r.stat].group}</span>
              <span className="ml-auto font-mono text-sm tabular-nums text-slate-100">{formatEffectValue(r.stat, r.total)}</span>
            </div>
            {r.capped && <p className="text-[11px] text-ember-glow">Plafonné : {formatEffectValue(r.stat, r.raw)} cumulables, plafond {formatEffectValue(r.stat, r.total)}.</p>}
            <div className="flex flex-wrap gap-1">
              {r.sources.map((s, i) => (
                <HudChip key={`${s.kind}-${s.label}-${i}`} size="sm" tone={TONE[s.kind]} className="whitespace-normal" title={s.note}>
                  {s.label} {formatEffectValue(r.stat, s.max)}
                </HudChip>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
