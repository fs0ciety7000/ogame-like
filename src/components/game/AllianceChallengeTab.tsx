import { useEffect, useState } from "react";
import { Medal, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ResourceIcon } from "@/components/ui/game-icon";
import { allianceNextWeekMs } from "@/game/allianceBoss";
import { ALLIANCE_CHALLENGE_REWARDS, findAllianceChallenge, type AllianceChallengeState } from "@/game/allianceChallenge";
import { RESOURCE_LIST } from "@/game/resources";
import { bossCountdown } from "@/components/game/BossStage";
import { fetchAllianceChallenge } from "@/services/allianceService";
import { cn, formatCompact } from "@/lib/utils";
import type { ResourceId } from "@/types/game";

/* v5.10.5 : défi d'alliance de la semaine — classement entre alliances, prix au trésor. */

const MEDALS = ["var(--th-medal-gold)", "var(--th-medal-silver)", "var(--th-medal-bronze)"];

export function AllianceChallengeTab({ allianceId }: { allianceId: string }) {
  const [state, setState] = useState<AllianceChallengeState | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    const load = () => void fetchAllianceChallenge().then((s) => alive && setState(s));
    load();
    const id = setInterval(load, 5 * 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);
  const now = Date.now();
  if (state === undefined) return <p className="text-sm text-slate-500">Chargement…</p>;
  if (state === null) return <p className="text-sm text-slate-500">Le premier défi commencera au prochain relevé (tous les quarts d'heure).</p>;
  const challenge = findAllianceChallenge(state.challengeId);
  const mine = state.standings.findIndex((s) => s.allianceId === allianceId);
  const prev = state.previous;
  const prevChallenge = prev ? findAllianceChallenge(prev.challengeId) : null;
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-start gap-3">
          <span className="grid h-12 w-12 place-items-center border border-gold-glow/40 bg-gold-glow/10 text-2xl">{challenge.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="hud-eyebrow text-[10px] text-gold-glow">Défi d'alliance de la semaine</p>
            <p className="hud-title text-lg text-white">{challenge.name}</p>
            <p className="text-xs text-slate-400">{challenge.hint} Le score de l'alliance est la progression cumulée de ses membres depuis lundi.</p>
          </div>
          <span className="font-mono text-xs text-slate-400">Fin dans {bossCountdown(allianceNextWeekMs(now) - now)}</span>
        </div>
        <p className="text-xs text-slate-300">
          Ton alliance : <strong className="text-white">{mine >= 0 ? `${mine + 1}${mine === 0 ? "re" : "e"} place` : "pas encore classée"}</strong>
          {mine >= 0 ? ` · ${formatCompact(state.standings[mine].score)} points` : ""}
        </p>
        <ol className="flex flex-col gap-1.5">
          {state.standings.length === 0 && <li className="text-xs text-slate-500">Aucune alliance n'a encore marqué de point cette semaine.</li>}
          {state.standings.map((s, i) => (
            <li key={s.allianceId} className={cn("grid grid-cols-[2rem_1fr_auto] items-center gap-2 text-sm", s.allianceId === allianceId && "text-cyan-glow")}>
              <span className="font-mono text-xs font-bold" style={{ color: MEDALS[i] ?? "var(--color-slate-500)" }}>
                #{i + 1}
              </span>
              <span className="min-w-0 truncate">
                <span className="font-mono text-gold-glow">[{s.tag}]</span> {s.name} <span className="text-[11px] text-slate-500">· {s.contributors} membre(s) actif(s)</span>
              </span>
              <span className="font-mono text-xs tabular-nums">{formatCompact(s.score)}</span>
            </li>
          ))}
        </ol>
      </Card>
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-2 p-4 text-sm text-slate-300">
          <h2 className="hud-title flex items-center gap-2 text-sm">
            <Trophy className="h-4 w-4 text-gold-glow" /> Récompenses
          </h2>
          {ALLIANCE_CHALLENGE_REWARDS.map((h, i) => (
            <p key={i}>
              <span className="font-mono" style={{ color: MEDALS[i] }}>
                {i === 0 ? "1re" : `${i + 1}e`} place
              </span>{" "}
              : {h} h de production cumulée des membres, versées au trésor.
            </p>
          ))}
          <p className="text-xs text-slate-500">Le classement est relevé tous les quarts d'heure ; les prix tombent lundi à minuit.</p>
        </Card>
        {prev && prevChallenge && (
          <Card className="flex flex-col gap-2 p-4">
            <h2 className="hud-title flex items-center gap-2 text-sm">
              <Medal className="h-4 w-4 text-cyan-glow" /> Semaine dernière : {prevChallenge.emoji} {prevChallenge.name}
            </h2>
            {prev.results.length === 0 && <p className="text-xs text-slate-500">Personne n'a marqué de point.</p>}
            {prev.results.map((r) => (
              <div key={r.allianceId} className={cn("flex flex-col text-sm", r.allianceId === allianceId && "text-cyan-glow")}>
                <span>
                  <span className="font-mono" style={{ color: MEDALS[r.rank - 1] }}>
                    #{r.rank}
                  </span>{" "}
                  [{r.tag}] {r.name}
                </span>
                <span className="flex flex-wrap gap-2 pl-6 text-[11px] text-slate-400">
                  {RESOURCE_LIST.filter((x) => (r.reward[x.id as ResourceId] ?? 0) > 0).map((x) => (
                    <span key={x.id} className="inline-flex items-center gap-1 font-mono">
                      <ResourceIcon id={x.id as ResourceId} /> +{formatCompact(r.reward[x.id as ResourceId] ?? 0)}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
