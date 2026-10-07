import { useEffect, useState } from "react";
import { EmptyAction } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/hud";
import { Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { pb } from "@/lib/pocketbase";
import { seasonLabel } from "@/game/seasons";
import { cn, formatNumber } from "@/lib/utils";
import type { SeasonResult } from "@/types/game";

/* v4.9.3 : historique des saisons du joueur sur sa page de profil (classement, XP, récompense). */

const PODIUM = ["text-gold-glow", "text-slate-200", "text-[var(--th-medal-bronze)]"];

export function SeasonHistoryCard({ uid, currentXp }: { uid: string; currentXp: number }) {
  const [list, setList] = useState<SeasonResult[] | null>(null);
  useEffect(() => {
    pb.collection("season_results")
      .getList<SeasonResult>(1, 24, { filter: pb.filter('uid = {:uid} && kind != "alliance"', { uid }), sort: "-seasonId" })
      .then((r) => setList(r.items))
      .catch(() => setList([]));
  }, [uid]);
  if (!list) return null;
  const best = list.length > 0 ? Math.min(...list.map((s) => s.rank)) : null;
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-gold-glow" />
        <h2 className="hud-title text-sm">Historique des saisons</h2>
        {best !== null && (
          <span className="ml-auto font-mono text-[11px] text-slate-400">
            meilleur rang : <b className="text-gold-glow">{best}</b>
            <sup>{best === 1 ? "er" : "e"}</sup> · {list.length} saison{list.length > 1 ? "s" : ""}
          </span>
        )}
      </div>
      <p className="mb-2 text-xs text-slate-500">Saison en cours : {formatNumber(currentXp)} XP.</p>
      {list.length === 0 ? (
        <EmptyState size="sm" icon={<Trophy />} title="Aucune saison terminée" action={<EmptyAction to="/game/joueurs?mode=season">Classement en cours</EmptyAction>}>
          Ton premier classement apparaîtra ici à la clôture.
        </EmptyState>
      ) : (
        <div className="flex flex-col divide-y divide-white/5 border border-white/5">
          {list.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-3 py-2 text-sm">
              <span className={cn("w-10 font-display text-lg font-bold", PODIUM[s.rank - 1] ?? "text-slate-400")}>
                {s.rank}
                <sup className="text-[11px]">{s.rank === 1 ? "er" : "e"}</sup>
              </span>
              <span className="flex-1 text-slate-200 first-letter:uppercase">{seasonLabel(s.seasonId)}</span>
              <span className="font-mono text-xs text-slate-400">{formatNumber(s.seasonXp)} XP</span>
              {s.reward?.title && <span className="w-full border-l-2 border-gold-glow/50 pl-2 text-[11px] text-gold-glow sm:w-auto">{s.reward.title}</span>}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
