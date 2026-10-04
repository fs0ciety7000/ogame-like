import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PlayerName } from "@/components/ui/player-name";
import { LEAGUE_RULES, LEAGUE_TIERS, LEAGUES_KEY, leagueInfo, leagueStandings, leagueTier, normalizeLeagues, type LeagueState, type LeagueTier } from "@/game/leagues";
import { currentSeasonId, seasonEndMs, seasonLabel } from "@/game/seasons";
import { bossCountdown } from "@/components/game/BossStage";
import { pb } from "@/lib/pocketbase";
import { cn, formatNumber } from "@/lib/utils";
import type { LeaderboardEntry } from "@/services/playerService";

/* v5.10.5 : ligues de classement (bronze → diamant), montées et descentes à la fin de la saison. */

export function useLeagues(): LeagueState | null {
  const [state, setState] = useState<LeagueState | null>(null);
  useEffect(() => {
    let alive = true;
    pb.collection("game_config")
      .getFirstListItem<{ data: unknown }>(pb.filter("key = {:k}", { k: LEAGUES_KEY }))
      .then((r) => alive && setState(normalizeLeagues(r.data)))
      .catch(() => alive && setState(normalizeLeagues(null)));
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

export function LeaguePanel({ players, uid }: { players: LeaderboardEntry[]; uid: string }) {
  const state = useLeagues();
  const mine = leagueTier(state, uid);
  const [tier, setTier] = useState<LeagueTier | null>(null);
  const shown = tier ?? mine;
  const season = currentSeasonId();
  const now = Date.now();
  if (!state) return <p className="text-sm text-slate-500">Chargement…</p>;
  const rows = leagueStandings(players.map((p) => ({ ...p, seasonId: p.seasonId ?? undefined })), state, season, shown);
  const info = leagueInfo(shown);
  const myInfo = leagueInfo(mine);
  const myRow = rows.find((r) => r.uid === uid);
  const last = state.last?.moves[uid];
  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-wrap items-center gap-4 p-4" style={{ borderColor: `${myInfo.color}55` }}>
        <span className="grid h-14 w-14 place-items-center border-2 text-3xl" style={{ borderColor: myInfo.color, background: `${myInfo.color}18` }}>
          {myInfo.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="hud-eyebrow text-[10px]" style={{ color: myInfo.color }}>
            Ta ligue · {seasonLabel(season)}
          </p>
          <p className="hud-title text-xl text-white">{myInfo.label}</p>
          <p className="text-xs text-slate-400">
            {myRow ? `${myRow.rank}${myRow.rank === 1 ? "er" : "e"} sur ${rows.length && shown === mine ? rows.length : "?"} · ` : ""}
            {myRow?.zone === "up" ? "en zone de promotion" : myRow?.zone === "down" ? "en zone de relégation" : "en zone de maintien"} · fin de saison dans {bossCountdown(seasonEndMs(now) - now)}
          </p>
          {last && (
            <p className="text-[11px] text-slate-500">
              Saison dernière : {leagueInfo(last.from).label}, {last.rank}
              {last.rank === 1 ? "er" : "e"}
              {last.to !== last.from ? ` → ${leagueInfo(last.to).label}` : ""}
            </p>
          )}
        </div>
        <p className="max-w-sm text-xs text-slate-400">
          À la fin de la saison, les {Math.round(LEAGUE_RULES.promotePct * 100)} % premiers de chaque ligue montent, les {Math.round(LEAGUE_RULES.relegatePct * 100)} % derniers (et les inactifs) descendent. Chaque participant reçoit {myInfo.rewardHours} h de production en {myInfo.label} (jusqu'à {LEAGUE_TIERS[LEAGUE_TIERS.length - 1].rewardHours} h en Diamant).
        </p>
      </Card>
      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Ligues">
        {LEAGUE_TIERS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={shown === t.id}
            onClick={() => setTier(t.id)}
            className={cn("border px-3 py-1.5 text-xs font-semibold", shown === t.id ? "text-space-950" : "text-slate-300")}
            style={shown === t.id ? { background: t.color, borderColor: t.color } : { borderColor: `${t.color}55` }}
          >
            {t.emoji} {t.label}
            {t.id === mine ? " (toi)" : ""}
          </button>
        ))}
      </div>
      <Card className="divide-y divide-white/5">
        {rows.length === 0 && <p className="p-4 text-sm text-slate-500">Personne en {info.label} pour l'instant.</p>}
        {rows.map((r) => (
          <div key={r.uid} className={cn("flex items-center gap-3 px-3 py-2 text-sm", r.uid === uid && "bg-cyan-glow/5")}>
            <span className="w-8 text-center font-mono text-xs tabular-nums text-slate-400">#{r.rank}</span>
            <PlayerName uid={r.uid} pseudo={r.pseudo} className={cn("min-w-0 flex-1 truncate", r.uid === uid && "text-cyan-glow")} />
            <span className="font-mono text-xs tabular-nums text-slate-300">{formatNumber(r.seasonXp)} XP</span>
            <span className="w-24 text-right text-[11px]">
              {r.zone === "up" && (
                <span className="inline-flex items-center gap-0.5 text-mint-glow">
                  <ArrowUp className="h-3 w-3" /> monte
                </span>
              )}
              {r.zone === "down" && (
                <span className="inline-flex items-center gap-0.5 text-danger-glow">
                  <ArrowDown className="h-3 w-3" /> descend
                </span>
              )}
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}
