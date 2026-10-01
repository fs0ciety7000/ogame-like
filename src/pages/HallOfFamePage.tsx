import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/hud";
import { motion } from "framer-motion";
import { Crown, Medal, Timer, Trophy, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { fetchSeasonResults, subscribeLeaderboard, type LeaderboardEntry } from "@/services/playerService";
import { currentSeasonId, SEASON_RULES, seasonEndMs, seasonLabel } from "@/game/seasons";
import { useNowTicker } from "@/hooks/useNowTicker";
import { useAuthStore } from "@/store/authStore";
import { cn, formatDuration, formatNumber } from "@/lib/utils";
import type { Alliance, SeasonResult } from "@/types/game";
import { subscribeAlliances } from "@/services/allianceService";
import { ALLIANCE_RULES, allianceStandings } from "@/game/alliances";
import { warSeasonBonuses } from "@/game/wars";
import { pb } from "@/lib/pocketbase";
import { StaffBadge } from "@/components/ui/staff-badge";

const PODIUM_STYLE = [
  { color: "text-gold-glow", ring: "border-gold-glow/60 bg-gold-glow/10", icon: Crown, height: "h-28" },
  { color: "text-slate-200", ring: "border-slate-300/40 bg-slate-300/5", icon: Medal, height: "h-20" },
  { color: "text-ember-glow", ring: "border-ember-glow/50 bg-ember-glow/5", icon: Medal, height: "h-16" },
];

function Podium({ results, uid }: { results: SeasonResult[]; uid?: string }) {
  // Ordre d'affichage : 2e, 1er, 3e.
  const order = [results[1], results[0], results[2]];
  return (
    <div className="grid grid-cols-3 items-end gap-2">
      {order.map((r, i) => {
        if (!r) return <div key={i} />;
        const style = PODIUM_STYLE[r.rank - 1];
        const Icon = style.icon;
        return (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: r.rank * 0.08 }}
            className="flex flex-col items-center gap-1 text-center"
          >
            <Icon className={cn("h-5 w-5", style.color)} />
            <p className={cn("max-w-full truncate text-sm font-semibold", r.uid === uid ? "text-gold-glow" : "text-slate-100")}>{r.pseudo}</p>
            <p className="tabular-mono text-[11px] text-slate-400">{formatNumber(r.seasonXp)} XP</p>
            <div className={cn("flex w-full items-start justify-center rounded-t-lg border pt-1 font-display text-lg", style.ring, style.height, style.color)}>
              {r.rank}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/** Palmarès des saisons : podium et top 10 de chaque mois terminé. */
export function HallOfFamePage() {
  useNowTicker();
  const uid = useAuthStore((s) => s.user?.uid);
  const [results, setResults] = useState<SeasonResult[] | null>(null);
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const season = currentSeasonId();

  useEffect(() => {
    fetchSeasonResults()
      .then(setResults)
      .catch(() => setResults([]));
  }, []);
  useEffect(() => subscribeLeaderboard(setPlayers), []);
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  useEffect(() => subscribeAlliances(setAlliances), []);
  // v3.2 : bonus des guerres gagnées pendant la saison en cours.
  const [warBonuses, setWarBonuses] = useState<Record<string, number>>({});
  useEffect(() => {
    pb.collection("alliance_wars")
      .getFullList<{ winnerId: string; seasonId: string }>({ filter: pb.filter("seasonId = {:s} && winnerId != ''", { s: season }), fields: "winnerId,seasonId" })
      .then((wars) => setWarBonuses(warSeasonBonuses(wars, season)))
      .catch(() => setWarBonuses({}));
  }, [season]);

  const bySeason = useMemo(() => {
    const map = new Map<string, SeasonResult[]>();
    for (const r of results ?? []) if (r.kind !== "alliance") map.set(r.seasonId, [...(map.get(r.seasonId) ?? []), r]);
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([id, list]) => [id, list.sort((a, b) => a.rank - b.rank)] as const);
  }, [results]);

  const allianceWinners = new Map((results ?? []).filter((r) => r.kind === "alliance" && r.rank === 1).map((r) => [r.seasonId, r]));
  const liveAlliances = allianceStandings(
    players.map((p) => ({ allianceId: p.allianceId, seasonXp: p.seasonId === season ? p.seasonXp : 0 })),
    warBonuses,
  ).slice(0, 3);
  const live = players
    .map((p) => ({ ...p, sxp: p.seasonId === season ? p.seasonXp : 0 }))
    .filter((p) => p.sxp > 0)
    .sort((a, b) => b.sxp - a.sxp)
    .slice(0, 5);
  const left = Math.max(0, (seasonEndMs() - Date.now()) / 1000);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Cosmic Empires / Archives" title="Palmarès" description="Les meilleurs empires de chaque saison, et les récompenses de fin de mois." />

      <Card className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Trophy className="h-4 w-4 text-gold-glow" />
          <h2 className="font-display text-base text-white">Saison en cours : {seasonLabel(season)}</h2>
          <span className="ml-auto flex items-center gap-1 text-xs text-slate-400">
            <Timer className="h-3.5 w-3.5" /> fin dans {formatDuration(left)}
          </span>
        </div>
        {live.length === 0 ? (
          <p className="text-sm text-slate-500">Personne n'a encore gagné d'XP ce mois-ci.</p>
        ) : (
          <ol className="space-y-1 text-sm">
            {live.map((p, i) => (
              <li
                key={p.uid}
                className={cn(
                  "flex items-center gap-3 border-l-2 px-3 py-1.5",
                  p.uid === uid ? "border-cyan-glow bg-cyan-glow/[0.08]" : i < 3 ? "border-gold-glow/60 bg-white/[0.025]" : "border-white/10",
                )}
              >
                <span className={cn("hud-title w-8 text-lg tabular-nums", i === 0 ? "text-gold-glow" : i === 1 ? "text-slate-200" : i === 2 ? "text-[#e19b6d]" : "text-slate-600")}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={cn("font-semibold", p.uid === uid ? "text-cyan-glow" : "text-slate-200")}>{p.pseudo}</span>
                <StaffBadge uid={p.uid} compact />
                <span className="tabular-mono ml-auto text-xs text-slate-400">{formatNumber(p.sxp)} XP</span>
              </li>
            ))}
          </ol>
        )}
        {liveAlliances.length > 0 && (
          <div className="border border-cyan-glow/20 bg-cyan-glow/[0.03] p-3 text-sm">
            <p className="mb-1 flex items-center gap-1.5 text-xs text-cyan-glow">
              <Users className="h-3.5 w-3.5" /> Alliances (somme des {ALLIANCE_RULES.seasonTopMembers} meilleurs membres)
            </p>
            {liveAlliances.map((a) => {
              const al = alliances.find((x) => x.id === a.allianceId);
              return (
                <p key={a.allianceId} className="flex items-center gap-2">
                  <span className="tabular-mono w-6 text-xs text-slate-500">#{a.rank}</span>
                  <span className="text-slate-200">{al ? `[${al.tag}] ${al.name}` : "Alliance dissoute"}</span>
                  <span className="tabular-mono ml-auto text-xs text-slate-400">{formatNumber(a.score)} XP</span>
                </p>
              );
            })}
            <p className="mt-1 text-[11px] text-slate-500">
              Alliance championne : +{ALLIANCE_RULES.seasonRewardHours} h de production et le titre « {ALLIANCE_RULES.seasonTitle} » pour chaque membre ayant au moins{" "}
              {SEASON_RULES.participationXp} XP de saison.
            </p>
          </div>
        )}
        <div className="grid gap-2 border-l-2 border-gold-glow/50 bg-gold-glow/[0.04] p-3 text-xs text-slate-400 sm:grid-cols-2">
          {[...SEASON_RULES.tiers]
            .sort((a, b) => a.maxRank - b.maxRank)
            .map((t, i, all) => {
              const from = i === 0 ? 1 : all[i - 1].maxRank + 1;
              return (
                <p key={t.maxRank}>
                  <strong className="text-slate-200">{from === t.maxRank ? `${from}er` : `${from}e – ${t.maxRank}e`}</strong> : {t.hours} h de production
                  {t.rare > 0 && ` + ${t.rare} de chaque ressource rare`}
                  {t.title && ` · titre « ${t.title} »`}
                </p>
              );
            })}
          <p>
            <strong className="text-slate-200">Participants</strong> (≥ {SEASON_RULES.participationXp} XP de saison) : {SEASON_RULES.participationHours} h de production
          </p>
        </div>
      </Card>

      {results === null ? (
        <p className="text-sm text-slate-500">Chargement…</p>
      ) : bySeason.length === 0 ? (
        <Card><EmptyState icon="🏆" title="Aucune saison terminée">Le premier palmarès sera publié au début du mois prochain.</EmptyState></Card>
      ) : (
        bySeason.map(([seasonId, list]) => (
          <Card key={seasonId} className="flex flex-col gap-4 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-base text-white">{seasonLabel(seasonId)}</h2>
              {allianceWinners.get(seasonId) && (
                <span className="ml-auto flex items-center gap-1 text-xs text-cyan-glow">
                  <Users className="h-3.5 w-3.5" /> Alliance championne : {allianceWinners.get(seasonId)!.pseudo} ({formatNumber(allianceWinners.get(seasonId)!.seasonXp)} XP)
                </span>
              )}
            </div>
            <Podium results={list.slice(0, 3)} uid={uid} />
            {list.length > 3 && (
              <ol className="space-y-1 border-t border-white/5 pt-3 text-sm">
                {list.slice(3, 10).map((r) => (
                  <li key={r.id} className="flex items-center gap-2">
                    <span className="tabular-mono w-6 text-xs text-slate-500">#{r.rank}</span>
                    <span className={r.uid === uid ? "text-gold-glow" : "text-slate-200"}>{r.pseudo}</span>
                    <span className="tabular-mono ml-auto text-xs text-slate-400">{formatNumber(r.seasonXp)} XP</span>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
