import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Eye, Loader2, Swords } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { CombatReplay } from "@/components/game/CombatReplay";
import { SpyReportView } from "@/components/game/SpyModal";
import { ResourceIcon } from "@/components/ui/game-icon";
import { fetchSharedReport, type SharedReport } from "@/services/sharedReportService";
import { combatDisplayFromReportForViewer, showCombatResult } from "@/store/combatModalStore";
import { formatCompact, formatNumber } from "@/lib/utils";
import type { BattleReport, SpyReport } from "@/types/game";

/* Rapport partagé (v3.8) : vu par n'importe quel joueur qui a le lien,
   du point de vue de l'attaquant (combat) ou de l'espion. */

function when(ms: number) {
  return new Date(ms).toLocaleString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

function BattleView({ report }: { report: BattleReport }) {
  const loot = Object.entries(report.loot ?? {}).filter(([, v]) => (v ?? 0) > 0);
  const winner = report.outcome === "attacker_win" ? report.attackerPseudo : report.outcome === "defender_win" ? report.defenderPseudo : null;
  return (
    <Card className="flex flex-col gap-3 p-4">
      <p className="text-sm text-slate-300">
        <strong className="text-cyan-glow">{report.attackerPseudo}</strong> attaque <strong className="text-danger-glow">{report.defenderPseudo}</strong> ·{" "}
        {winner ? (
          <>
            victoire de <strong className="text-slate-100">{winner}</strong>
          </>
        ) : (
          "égalité"
        )}
      </p>
      <CombatReplay
        myPower={report.attackerPower}
        opponentPower={report.defenderPower}
        myLossPercent={report.attackerLossPercent}
        opponentLossPercent={report.defenderLossPercent}
        outcome={report.outcome}
        perspective="attacker"
      />
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div className="border border-white/5 p-2">
          <p className="text-slate-500">Puissance attaquant</p>
          <p className="tabular-mono text-sm text-slate-100">{formatNumber(report.attackerPower)}</p>
        </div>
        <div className="border border-white/5 p-2">
          <p className="text-slate-500">Puissance défenseur</p>
          <p className="tabular-mono text-sm text-slate-100">{formatNumber(report.defenderPower)}</p>
        </div>
        <div className="border border-white/5 p-2">
          <p className="text-slate-500">Pertes attaquant</p>
          <p className="tabular-mono text-sm text-slate-100">{Math.round(report.attackerLossPercent * 100)} %</p>
        </div>
        <div className="border border-white/5 p-2">
          <p className="text-slate-500">Pertes défenseur</p>
          <p className="tabular-mono text-sm text-slate-100">{Math.round(report.defenderLossPercent * 100)} %</p>
        </div>
      </div>
      {loot.length > 0 && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-mint-glow">
          Butin :
          {loot.map(([res, n]) => (
            <span key={res} className="flex items-center gap-1">
              <ResourceIcon id={res} /> {formatCompact(n ?? 0)}
            </span>
          ))}
        </p>
      )}
      <Button variant="outline" size="sm" className="self-start" onClick={() => showCombatResult(combatDisplayFromReportForViewer(report, report.attackerUid))}>
        Détail des pertes
      </Button>
    </Card>
  );
}

export function SharedReportPage() {
  const { id = "" } = useParams();
  const [shared, setShared] = useState<SharedReport | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setShared(null);
    setError(false);
    fetchSharedReport(id)
      .then(setShared)
      .catch(() => setError(true));
  }, [id]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Cosmic Empires / Archives"
        title="Rapport partagé"
        description={shared ? `Partagé par ${shared.ownerPseudo || "un commandant"} · ${when(shared.data.timestamp ?? shared.createdAtMs)}` : undefined}
      />
      {!shared && !error && (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </p>
      )}
      {error && (
        <Card className="p-6 text-sm text-slate-400">
          Ce rapport n'existe pas ou n'est plus partagé. <Link to="/game/combats" className="text-cyan-glow underline">Retour au journal de combat</Link>
        </Card>
      )}
      {shared?.kind === "battle" && (
        <>
          <p className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.16em] text-slate-500">
            <Swords className="h-3.5 w-3.5" /> Rapport de combat
          </p>
          <BattleView report={shared.data as BattleReport} />
        </>
      )}
      {shared?.kind === "spy" && (
        <>
          <p className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.16em] text-slate-500">
            <Eye className="h-3.5 w-3.5" /> Rapport d'espionnage · cible {(shared.data as SpyReport).targetPseudo}
          </p>
          <Card className="p-4">
            <SpyReportView report={shared.data as SpyReport} />
          </Card>
        </>
      )}
    </div>
  );
}
