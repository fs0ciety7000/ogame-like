import { useEffect, useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ALLIANCE_RULES, allianceStandings, projectState } from "@/game/alliances";
import { currentSeasonId } from "@/game/seasons";
import { warSeasonBonuses } from "@/game/wars";
import { pb } from "@/lib/pocketbase";
import { subscribeAlliances } from "@/services/allianceService";
import { subscribeLeaderboard, type LeaderboardEntry } from "@/services/playerService";
import { cn, formatCompact } from "@/lib/utils";
import type { Alliance } from "@/types/game";

/** Classement des alliances (v3.5.1) : score de saison, membres, XP,
 *  paliers de projets, recherches et guerres gagnées. */
export function AllianceRanking({ currentId }: { currentId?: string | null }) {
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [wars, setWars] = useState<{ winnerId: string; seasonId: string }[]>([]);
  const season = currentSeasonId();
  useEffect(() => subscribeAlliances(setAlliances), []);
  useEffect(() => subscribeLeaderboard(setPlayers), []);
  useEffect(() => {
    pb.collection("alliance_wars")
      .getFullList<{ winnerId: string; seasonId: string }>({ filter: "winnerId != ''", fields: "winnerId,seasonId" })
      .then(setWars)
      .catch(() => setWars([]));
  }, []);

  const rows = useMemo(() => {
    const standings = allianceStandings(
      players.map((p) => ({ allianceId: p.allianceId, seasonXp: p.seasonId === season ? p.seasonXp : 0 })),
      warSeasonBonuses(wars, season),
    );
    const scoreOf = new Map(standings.map((s) => [s.allianceId, s.score]));
    return alliances
      .map((a) => {
        const members = players.filter((p) => p.allianceId === a.id);
        return {
          a,
          score: scoreOf.get(a.id) ?? 0,
          xp: members.reduce((s, p) => s + (p.xp ?? 0), 0),
          projects: ALLIANCE_RULES.projects.reduce((s, def) => s + projectState(a, def.id).level, 0),
          research: Object.values(a.research ?? {}).reduce((s: number, n) => s + (Number(n) || 0), 0),
          warsWon: wars.filter((w) => w.winnerId === a.id).length,
        };
      })
      .sort((x, y) => y.score - x.score || y.xp - x.xp);
  }, [alliances, players, wars, season]);

  const maxProjects = ALLIANCE_RULES.projects.reduce((s, p) => s + p.maxLevel, 0);
  const maxResearch = ALLIANCE_RULES.researches.reduce((s, r) => s + r.maxLevel, 0);

  return (
    <Card className="flex flex-col gap-3 p-4">
      <h3 className="flex items-center gap-2 font-display text-sm text-white">
        <Trophy className="h-4 w-4 text-gold-glow" /> Classement des alliances
      </h3>
      <p className="text-[11px] text-slate-500">
        Score de saison : somme des {ALLIANCE_RULES.seasonTopMembers} meilleures XP de saison des membres, plus le bonus des guerres gagnées ce mois-ci.
      </p>
      {rows.length === 0 && <p className="text-xs text-slate-500">Aucune alliance.</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-[10px] font-mono uppercase tracking-[0.12em] text-slate-500">
              <th className="py-1.5 pr-2">#</th>
              <th className="py-1.5 pr-2">Alliance</th>
              <th className="py-1.5 pr-2 text-right">Score saison</th>
              <th className="py-1.5 pr-2 text-right">Membres</th>
              <th className="py-1.5 pr-2 text-right">XP totale</th>
              <th className="py-1.5 pr-2 text-right">Projets</th>
              <th className="py-1.5 pr-2 text-right">Recherches</th>
              <th className="py-1.5 text-right">Guerres gagnées</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.a.id} className={cn("border-t border-white/5", r.a.id === currentId && "bg-cyan-glow/[0.07]")}>
                <td className={cn("py-2 pr-2 font-mono", i === 0 ? "text-gold-glow" : "text-slate-500")}>{i + 1}</td>
                <td className="py-2 pr-2">
                  <span className="mr-1.5 font-mono text-xs text-gold-glow">[{r.a.tag}]</span>
                  <span className={r.a.id === currentId ? "text-cyan-glow" : "text-slate-100"}>{r.a.name}</span>
                </td>
                <td className="tabular-mono py-2 pr-2 text-right text-slate-200">{formatCompact(r.score)}</td>
                <td className="tabular-mono py-2 pr-2 text-right text-slate-300">
                  {r.a.members.length} / {ALLIANCE_RULES.maxMembers}
                </td>
                <td className="tabular-mono py-2 pr-2 text-right text-slate-300">{formatCompact(r.xp)}</td>
                <td className="tabular-mono py-2 pr-2 text-right text-slate-300">
                  {r.projects} / {maxProjects}
                </td>
                <td className="tabular-mono py-2 pr-2 text-right text-slate-300">
                  {r.research} / {maxResearch}
                </td>
                <td className="tabular-mono py-2 text-right text-slate-300">{r.warsWon}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
