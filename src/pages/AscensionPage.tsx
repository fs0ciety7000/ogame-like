import { Card } from "@/components/ui/card";
import { HudCallout, HudMeter, StatTile } from "@/components/ui/hud";
import { PageHeader } from "@/components/layout/PageHeader";
import { AscensionCard, ascensionProgress, ASCENSION_UNLOCK_PCT } from "@/components/game/AscensionCard";
import { TalentTreeCard } from "@/components/game/TalentTreeCard";
import { ASCENSION_RULES, ascensionCount } from "@/game/ascension";
import { usePlayerStore } from "@/store/playerStore";
import { formatNumber } from "@/lib/utils";

/* 5.15 : l'Ascension a sa propre page (avant : une carte en haut de
   Bâtiments, masquée tant que le seuil n'était pas atteint). Verrouillée,
   la page montre le chemin qui reste à parcourir. */

export function AscensionPage() {
  const player = usePlayerStore((s) => s.player);
  if (!player) return null;
  const progress = ascensionProgress(player);
  const count = ascensionCount(player);
  const pct = progress.needed > 0 ? Math.min(100, (progress.levels / progress.needed) * 100) : 100;
  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Cosmic Empires / Empire" title="Ascension" description="Recommence plus fort : ton empire repart de zéro, avec des bonus permanents et des talents." />
      {progress.unlocked ? (
        <>
          <AscensionCard />
          <TalentTreeCard />
        </>
      ) : (
        <Card className="flex flex-col gap-4 p-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatTile tone="neutral" label="Niveaux de bâtiments" value={`${formatNumber(progress.levels)} / ${formatNumber(progress.needed)}`} sub={`Objectif : ${Math.round(ASCENSION_UNLOCK_PCT * 100)} % des ${formatNumber(progress.maxLevels)} niveaux possibles`} />
            <StatTile tone="gold" label="Prochaine ascension" value={`+${Math.round((count + 1) * ASCENSION_RULES.productionPerAscension * 100)} %`} sub="de production, pour toujours" />
            <StatTile tone="accent" label="Reste à construire" value={formatNumber(Math.max(0, progress.needed - progress.levels))} sub="niveaux de bâtiments de base" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
              <span>Progression vers l'Ascension</span>
              <span className="tabular-nums text-slate-300">{Math.floor(pct)} %</span>
            </div>
            <HudMeter percent={pct} />
          </div>
          <HudCallout tone="accent" className="text-sm text-slate-300">
            L'Ascension s'ouvre quand tes bâtiments de base atteignent {Math.round(ASCENSION_UNLOCK_PCT * 100)} % de leurs niveaux maximum (les bâtiments de fin de partie ne comptent pas). Tu y gagnes un bonus de production et de vitesse de construction, des points de talent et une étoile à côté de ton pseudo.
          </HudCallout>
        </Card>
      )}
    </div>
  );
}
