import { useEffect, useState } from "react";
import { Crown, Scroll, ChartColumn } from "lucide-react";
import { Card } from "@/components/ui/card";
import { HudTag, EmptyState } from "@/components/ui/hud";
import { pb } from "@/lib/pocketbase";
import { assetUrl } from "@/lib/assets";
import { ALLIANCE_SAGA_KEY, ALLIANCE_SAGA_RULES, readAllianceSaga, sagaMonthId, sagaObjectiveLabel, sagaOf, type AllianceSagaState } from "@/game/allianceSaga";
import { formatInt } from "@/game/format";
import { cn } from "@/lib/utils";

/* v5.5 : saga d'alliance du mois (objectifs communs, classement, récompenses). */

export function AllianceSagaTab({ allianceId }: { allianceId: string }) {
  const [state, setState] = useState<AllianceSagaState | null>(null);
  // v5.6 : progression en direct de mon alliance (le classement complet est recalculé chaque heure).
  const [live, setLive] = useState<{ monthId: string; allianceId: string; progress: number[]; points: number } | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () =>
      pb
        .send("/api/cosmic/alliance/saga/live", { method: "GET" })
        .then((r) => alive && setLive(r))
        .catch(() => undefined);
    void load();
    const t = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);
  useEffect(() => {
    let alive = true;
    pb.collection("game_config")
      .getFirstListItem(`key = "${ALLIANCE_SAGA_KEY}"`)
      .then((r) => alive && setState(readAllianceSaga((r as { data?: unknown }).data)))
      .catch(() => alive && setState(readAllianceSaga(null)));
    return () => {
      alive = false;
    };
  }, []);

  if (!state) return <Card className="p-4 text-sm text-slate-400">Chargement de la saga…</Card>;
  const monthId = sagaMonthId(Date.now());
  const saga = sagaOf(state, monthId);
  if (!saga) return <Card className="p-4 text-sm text-slate-400">La saga de ce mois s'écrit dans l'heure : reviens un peu plus tard.</Card>;
  const rows = state.standing?.monthId === monthId ? state.standing.rows : [];
  const ranked = rows.find((r) => r.allianceId === allianceId);
  const fresh = live && live.monthId === monthId && live.allianceId === allianceId ? live : null;
  const mine = fresh ? { ...(ranked ?? { rank: 0 }), progress: fresh.progress, points: fresh.points } : ranked;
  const top = rows.slice(0, 10);

  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-hidden p-0" style={{ boxShadow: `inset 0 2px 0 ${saga.accent}` }}>
        <div className="relative">
          <img src={assetUrl(saga.image)} alt="" className="h-28 w-full object-cover opacity-60 sm:h-36" />
          <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-space-950/60 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <p className="hud-eyebrow flex items-center gap-1.5 text-[11px]" style={{ color: saga.accent }}>
              <Scroll className="h-3.5 w-3.5" /> Saga d'alliance
            </p>
            <h2 className="hud-title text-xl text-slate-100">{saga.title}</h2>
          </div>
        </div>
        <div className="flex flex-col gap-3 p-4">
          <p className="text-sm italic text-slate-300">{saga.lore}</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {saga.objectives.map((o, i) => {
              const done = mine?.progress[i] ?? 0;
              const pct = Math.min(100, (done / Math.max(1, o.count)) * 100);
              return (
                <div key={o.type} className="flex flex-col gap-1.5 border border-white/10 p-3">
                  <p className="text-xs text-slate-400">{sagaObjectiveLabel(o.type)}</p>
                  <p className="font-mono text-sm text-slate-100">
                    {formatInt(done)} / {formatInt(o.count)}
                  </p>
                  <div className="h-1.5 bg-white/5">
                    <div className="h-full" style={{ width: `${pct}%`, background: saga.accent }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-400">
            Chaque action de chaque membre compte. {ALLIANCE_SAGA_RULES.pointsPerObjective} points par objectif atteint, jusqu'à {ALLIANCE_SAGA_RULES.pointsPerObjective * ALLIANCE_SAGA_RULES.overflowCap} en le dépassant. Fin du mois : {ALLIANCE_SAGA_RULES.rewardHours.map((h, i) => `${i + 1}${i === 0 ? "re" : "e"} ${h} h`).join(", ")} de production des membres versées au trésor ; titre « {saga.winnerTitle} » pour les membres de la première.
          </p>
        </div>
      </Card>
      <Card className="flex flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-gold-glow" />
          <h3 className="hud-title text-sm text-slate-100">Classement de la saga</h3>
          {state.standing && <span className="ml-auto text-[11px] text-slate-500">classement mis à jour chaque heure · ta progression en direct</span>}
        </div>
        {top.length === 0 ? (
          <EmptyState size="sm" icon={<ChartColumn />} title="Pas encore de classement">Il se calcule chaque heure.</EmptyState>
        ) : (
          top.map((r) => (
            <div key={r.allianceId} className={cn("flex items-center gap-3 border-t border-white/5 pt-2 text-sm", r.allianceId === allianceId && "text-cyan-glow")}>
              <span className="w-6 font-mono text-slate-400">{r.rank}</span>
              <span className="min-w-0 flex-1 truncate">
                [{r.tag}] {r.name}
              </span>
              {r.rank <= ALLIANCE_SAGA_RULES.rewardHours.length && r.points > 0 && <HudTag tone="gold">{ALLIANCE_SAGA_RULES.rewardHours[r.rank - 1]} h</HudTag>}
              <span className="font-mono">{formatInt(r.points)} pts</span>
            </div>
          ))
        )}
        {mine && mine.rank > 10 && (
          <p className="border-t border-white/5 pt-2 text-sm text-cyan-glow">
            Ton alliance : {mine.rank}e · {formatInt(mine.points)} pts
          </p>
        )}
      </Card>
    </div>
  );
}
