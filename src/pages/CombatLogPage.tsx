import { toast } from "sonner";
import { Share2 } from "lucide-react";
import { shareReport } from "@/services/sharedReportService";
import { PlayerName } from "@/components/ui/player-name";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { EmptyState } from "@/components/ui/hud";
import { Pager, usePaged, EmptyAction } from "@/components/ui/panel";
import { motion } from "framer-motion";
import { Eye, Sword, Shield, ShieldAlert, Trophy } from "lucide-react";
import { VictoryCardDialog } from "@/components/game/VictoryCardDialog";
import { victoryCardFromReport } from "@/lib/victoryCardFromReport";
import { usePlayerStore } from "@/store/playerStore";
import { useAllianceTag } from "@/store/directoryStore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { fetchBattleReport, fetchSpyReport, subscribeBattleLog, subscribeSpyLog } from "@/services/playerService";
import { SpyReportView } from "@/components/game/SpyModal";
import { SPY_TIER_LABELS } from "@/game/espionage";
import { useAuthStore } from "@/store/authStore";
import { combatDisplayFromReportForViewer, showCombatResult } from "@/store/combatModalStore";
import { toMillis, formatNumber, timeAgo } from "@/lib/utils";
import type { BattleReport, CombatOutcome, SpyReport } from "@/types/game";

const OUTCOME_STYLE: Record<"victory" | "defeat" | "draw", { label: string; variant: "success" | "danger" | "warning" }> = {
  victory: { label: "Victoire", variant: "success" },
  defeat: { label: "Défaite", variant: "danger" },
  draw: { label: "Match nul", variant: "warning" },
};

function outcomeForViewer(outcome: CombatOutcome, isAttacker: boolean): "victory" | "defeat" | "draw" {
  if (outcome === "draw") return "draw";
  const won = isAttacker ? outcome === "attacker_win" : outcome === "defender_win";
  return won ? "victory" : "defeat";
}

/** v3.8 : copie un lien vers le rapport, à coller en message privé ou au canal d'alliance. */
function ShareButton({ kind, id, withLabel }: { kind: "battle" | "spy"; id: string; withLabel?: boolean }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      title="Copier un lien de partage"
      className="flex shrink-0 items-center gap-1 px-3 py-2 text-xs text-slate-400 transition-colors hover:text-cyan-glow disabled:opacity-50"
      onClick={async () => {
        setBusy(true);
        try {
          const url = await shareReport(kind, id);
          await navigator.clipboard?.writeText(url).catch(() => {});
          toast.success("Lien copié", { description: "Colle-le dans un message privé ou le canal d'alliance." });
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Partage impossible.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <Share2 className="h-3.5 w-3.5" />
      {withLabel && "Partager"}
    </button>
  );
}

export function CombatLogPage() {
  const uid = useAuthStore((s) => s.user?.uid);
  const [reports, setReports] = useState<BattleReport[]>([]);
  const [spyReports, setSpyReports] = useState<SpyReport[]>([]);
  const [openSpy, setOpenSpy] = useState<string | null>(null);
  // v4.1 : carte de victoire.
  const player = usePlayerStore((s) => s.player);
  const allianceTag = useAllianceTag(player?.uid, player?.allianceId) ?? undefined;
  const [card, setCard] = useState<{ input: ReturnType<typeof victoryCardFromReport>; target: string } | null>(null);

  useEffect(() => {
    if (!uid) return;
    return subscribeBattleLog(uid, setReports);
  }, [uid]);
  useEffect(() => {
    if (!uid) return;
    return subscribeSpyLog(uid, setSpyReports);
  }, [uid]);
  // v5.10 : « ?rapport=<id> » (lien d'une notification de combat) ouvre ce rapport.
  const [params, setParams] = useSearchParams();
  const wanted = params.get("rapport");
  useEffect(() => {
    if (!uid || !wanted) return;
    let alive = true;
    void (async () => {
      const report = reports.find((r) => r.id === wanted) ?? (await fetchBattleReport(wanted));
      if (!alive) return;
      if (report) showCombatResult(combatDisplayFromReportForViewer(report, uid));
      else toast.error("Ce rapport n'existe plus.");
      setParams((p) => {
        p.delete("rapport");
        return p;
      }, { replace: true });
    })();
    return () => {
      alive = false;
    };
    // Une seule ouverture par lien : on ne relance pas quand la liste se met à jour.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, wanted]);

  // 5.22 : « ?espion=<id> » (notification de rapport d'espionnage) ouvre ce rapport.
  const wantedSpy = params.get("espion");
  const [extraSpy, setExtraSpy] = useState<SpyReport | null>(null);
  useEffect(() => {
    if (!uid || !wantedSpy) return;
    let alive = true;
    void (async () => {
      const report = spyReports.find((r) => r.id === wantedSpy) ?? (await fetchSpyReport(wantedSpy));
      if (!alive) return;
      if (report) {
        if (!spyReports.some((r) => r.id === report.id)) setExtraSpy(report);
        setOpenSpy(report.id);
        requestAnimationFrame(() => document.getElementById(`espion-${report.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
      } else toast.error("Ce rapport d'espionnage n'existe plus.");
      setParams((p) => {
        p.delete("espion");
        return p;
      }, { replace: true });
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, wantedSpy]);
  const spyList = extraSpy && !spyReports.some((r) => r.id === extraSpy.id) ? [extraSpy, ...spyReports] : spyReports;
  // 5.24 : rapports paginés, combats et espionnage (taille des Réglages).
  const battlePage = usePaged(reports);
  const spyPage = usePaged(spyList);
  const showSpyIndex = spyPage.showIndex;
  useEffect(() => {
    if (!openSpy) return;
    const i = spyList.findIndex((r) => r.id === openSpy);
    if (i >= 0) showSpyIndex(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seulement à l'ouverture d'un rapport
  }, [openSpy]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Cosmic Empires / Archives" title="Journal de combat" description="Historique des attaques lancées et reçues." />
      <VictoryCardDialog card={card?.input ?? null} target={card?.target ?? "/game"} onClose={() => setCard(null)} />

      <Card className="divide-y divide-white/5">
        {reports.length === 0 && (
          <EmptyState icon="⚔️" title="Aucun combat" action={<EmptyAction to="/game/joueurs">Trouver une cible</EmptyAction>}>Tes attaques lancées et reçues apparaîtront ici.</EmptyState>
        )}
        {battlePage.items.map((report, index) => {
          if (!uid) return null;
          const isAttacker = report.attackerUid === uid;
          const opponent = isAttacker ? <PlayerName uid={report.defenderUid} pseudo={report.defenderPseudo} /> : <PlayerName uid={report.attackerUid} pseudo={report.attackerPseudo} />;
          const result = outcomeForViewer(report.outcome, isAttacker);
          const myPower = isAttacker ? report.attackerPower : report.defenderPower;
          const opponentPower = isAttacker ? report.defenderPower : report.attackerPower;

          return (
            <motion.div
              key={report.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: Math.min(index, 10) * 0.02 }}
              className="flex items-center"
            >
              <button
                type="button"
                onClick={() => showCombatResult(combatDisplayFromReportForViewer(report, uid))}
                className="flex min-w-0 flex-1 items-center gap-3 p-3 text-left transition hover:bg-white/5"
              >
              {isAttacker ? (
                <Sword className="h-4 w-4 shrink-0 text-cyan-glow" />
              ) : (
                <Shield className="h-4 w-4 shrink-0 text-gold-glow" />
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-slate-100">
                    {isAttacker ? "Toi" : opponent} <span className="text-slate-500">vs</span>{" "}
                    {isAttacker ? opponent : "Toi"}
                  </span>
                  <Badge variant={OUTCOME_STYLE[result].variant} className="shrink-0">
                    {OUTCOME_STYLE[result].label}
                  </Badge>
                </div>
                <p className="tabular-mono text-xs text-slate-500">
                  Puissance {formatNumber(myPower)} contre {formatNumber(opponentPower)}
                  {(() => {
                    const xp = isAttacker ? report.attackerXpDelta : report.defenderXpDelta;
                    if (xp === undefined || xp === 0) return null;
                    return (
                      <span className={xp > 0 ? "ml-2 text-mint-glow" : "ml-2 text-danger-glow"}>
                        {xp > 0 ? "+" : ""}
                        {xp} XP
                      </span>
                    );
                  })()}
                </p>
              </div>

              <span className="tabular-mono shrink-0 text-xs text-slate-500">{timeAgo(toMillis(report.timestamp))}</span>
              </button>
              {result === "victory" && (
                <button
                  type="button"
                  title="Carte de victoire"
                  className="flex shrink-0 items-center gap-1 px-2 py-2 text-xs text-gold-glow transition-colors hover:text-slate-100"
                  onClick={() => player && setCard({ input: victoryCardFromReport(report, player, allianceTag), target: `/game/rapport/${report.id}` })}
                >
                  <Trophy className="h-3.5 w-3.5" />
                </button>
              )}
              <ShareButton kind="battle" id={report.id} />
            </motion.div>
          );
        })}
      </Card>
      <Pager {...battlePage.pager} />

      <h2 className="hud-title mt-2 flex items-center gap-2 text-base text-slate-100">
        <Eye className="h-4 w-4 text-cyan-glow" /> Espionnage
      </h2>
      <Card className="divide-y divide-white/5">
        {spyList.length === 0 && <EmptyState icon="🛰️" title="Aucun rapport" action={<EmptyAction to="/game/galaxie">Ouvrir la carte</EmptyAction>}>Envoie des sondes depuis la carte ou la liste des joueurs.</EmptyState>}
        {spyPage.items.map((r) => {
          const mine = r.spyUid === uid;
          return (
            <div key={r.id} id={`espion-${r.id}`} className="scroll-mt-24 p-3">
              {mine ? (
                <button type="button" className="flex w-full items-center gap-3 text-left" onClick={() => setOpenSpy(openSpy === r.id ? null : r.id)}>
                  <Eye className="h-4 w-4 shrink-0 text-cyan-glow" />
                  <span className="flex-1 text-sm text-slate-200">
                    {r.targetPseudo ?? "?"} <span className="text-xs text-slate-500">· {SPY_TIER_LABELS[r.tier ?? 0]}</span>
                  </span>
                  <span className="tabular-mono text-xs text-slate-500">{timeAgo(r.timestamp)}</span>
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-danger-glow" />
                  <span className="flex-1 text-sm text-slate-300">
                    {r.spyPseudo} t'a espionné ({r.probes ?? 0} sonde{(r.probes ?? 0) > 1 ? "s" : ""} abattue{(r.probes ?? 0) > 1 ? "s" : ""})
                  </span>
                  <span className="tabular-mono text-xs text-slate-500">{timeAgo(r.timestamp)}</span>
                </div>
              )}
              {mine && openSpy === r.id && (
                <div className="mt-3">
                  <SpyReportView report={r} />
                  <div className="mt-2">
                    <ShareButton kind="spy" id={r.id} withLabel />
                  </div>
                  {(r.tier ?? 0) >= 2 && (
                    <Link to={`/game/simulateur?mode=player&rapport=${r.id}`} className="mt-2 inline-block font-mono text-[11px] uppercase tracking-[0.15em] text-cyan-glow hover:underline">
                      Simuler une attaque →
                    </Link>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </Card>
      <Pager {...spyPage.pager} />
    </div>
  );
}
