import { Link } from "react-router-dom";
import { Award, Clock, Medal, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PlayerName } from "@/components/ui/player-name";
import { ResourceIcon } from "@/components/ui/game-icon";
import { METRICS } from "@/game/achievements";
import { contestPhase, contestPurse, contestScore, type Contest } from "@/game/contests";
import { RESOURCE_LIST } from "@/game/resources";
import type { ServerPot } from "@/game/serverPot";
import { bossCountdown } from "@/components/game/BossStage";
import { cn, formatCompact, alpha } from "@/lib/utils";
import type { PlayerState, ResourceId } from "@/types/game";

/* v5.10.5 : un concours du pot commun — critère, temps restant, prix, classement. */

const MEDALS = ["var(--th-medal-gold)", "var(--th-medal-silver)", "var(--th-medal-bronze)"];

function Purse({ amounts, share = 1 }: { amounts: Partial<Record<ResourceId, number>>; share?: number }) {
  const list = RESOURCE_LIST.map((r) => [r.id, Math.floor((amounts[r.id] ?? 0) * share)] as [ResourceId, number]).filter(([, v]) => v > 0);
  if (list.length === 0) return <span className="text-slate-500">—</span>;
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {list.map(([id, v]) => (
        <span key={id} className="inline-flex items-center gap-1 font-mono tabular-nums">
          <ResourceIcon id={id} /> {formatCompact(v)}
        </span>
      ))}
    </span>
  );
}

export function ContestCard({ contest: c, player, pot, now, compact = false }: { contest: Contest; player: PlayerState; pot: ServerPot | null; now: number; compact?: boolean }) {
  const phase = contestPhase(c, now);
  const metric = METRICS[c.metric]?.label ?? c.metric;
  const purse = c.results ? null : pot ? contestPurse(c, pot) : null;
  const myRank = c.standings.findIndex((s) => s.uid === player.uid);
  const myScore = phase === "running" || phase === "ending" ? contestScore(c, player) : (c.standings.find((s) => s.uid === player.uid)?.score ?? 0);
  const label = phase === "scheduled" ? `Commence dans ${bossCountdown(c.startMs - now)}` : phase === "running" ? `Se termine dans ${bossCountdown(c.endMs - now)}` : phase === "ending" ? "Résultats imminents" : "Terminé";
  const tone = phase === "running" ? "var(--color-mint-glow)" : phase === "scheduled" ? "var(--color-cyan-glow)" : "var(--color-slate-400)";
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-start gap-2">
        <Trophy className="mt-0.5 h-5 w-5 text-gold-glow" />
        <div className="min-w-0 flex-1">
          <p className="hud-title text-sm text-slate-100">{c.title}</p>
          <p className="text-xs text-slate-400">
            Critère : <span className="text-slate-200">{metric}</span> (progression pendant le concours)
          </p>
        </div>
        <span className="inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: tone, borderColor: `${alpha(tone, 40)}` }}>
          <Clock className="h-3 w-3" /> {label}
        </span>
      </div>
      {!compact && c.description && <p className="text-sm text-slate-300">{c.description}</p>}

      {c.results ? (
        <ol className="flex flex-col gap-1.5">
          {c.results.map((r) => (
            <li key={r.uid} className={cn("flex flex-wrap items-center gap-2 text-sm", r.uid === player.uid && "text-cyan-glow")}>
              <span className="w-7 font-mono text-xs font-bold" style={{ color: MEDALS[r.rank - 1] ?? "var(--color-slate-500)" }}>
                #{r.rank}
              </span>
              <PlayerName uid={r.uid} pseudo={r.pseudo} className="min-w-0 flex-1 truncate" />
              <span className="text-xs">
                <Purse amounts={r.resources} />
              </span>
            </li>
          ))}
          {c.results.length === 0 && <li className="text-xs text-slate-500">Personne n'a progressé : le pot reste intact.</li>}
        </ol>
      ) : (
        <>
          <div className="flex flex-col gap-1 border border-gold-glow/20 bg-gold-glow/[0.04] p-2 text-xs text-slate-300">
            <span className="flex items-center gap-1.5 text-gold-glow">
              <Award className="h-3.5 w-3.5" /> {Math.round(c.potShare * 100)} % du pot commun en jeu
            </span>
            {purse && (
              <div className="grid gap-1">
                {c.places.map((share, i) => (
                  <span key={i} className="flex flex-wrap items-center gap-2">
                    <span className="w-16 shrink-0 font-mono" style={{ color: MEDALS[i] ?? "var(--color-slate-400)" }}>
                      {i === 0 ? "1re" : `${i + 1}e`} place
                    </span>
                    <Purse amounts={purse} share={share} />
                  </span>
                ))}
              </div>
            )}
          </div>
          {phase !== "scheduled" && (
            <div className="flex flex-col gap-1.5">
              <p className="flex items-center gap-1.5 text-xs text-slate-400">
                <Medal className="h-3.5 w-3.5 text-cyan-glow" /> Ton score : <strong className="font-mono text-slate-100">{formatCompact(myScore)}</strong>
                {myRank >= 0 ? ` · ${myRank === 0 ? "1er" : `${myRank + 1}e`} au dernier relevé` : ""}
              </p>
              {!compact && (
                <ol className="flex flex-col gap-1">
                  {c.standings.length === 0 && <li className="text-xs text-slate-500">Pas encore de classement : il est relevé tous les quarts d'heure.</li>}
                  {c.standings.slice(0, 10).map((s, i) => (
                    <li key={s.uid} className={cn("flex items-center gap-2 text-sm", s.uid === player.uid && "text-cyan-glow")}>
                      <span className="w-7 font-mono text-xs font-bold" style={{ color: MEDALS[i] ?? "var(--color-slate-500)" }}>
                        #{i + 1}
                      </span>
                      <PlayerName uid={s.uid} pseudo={s.pseudo} className="min-w-0 flex-1 truncate" />
                      <span className="font-mono text-xs tabular-nums">{formatCompact(s.score)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </>
      )}
      {compact && (
        <Link to="/game/concours" className="self-start text-xs text-cyan-glow hover:underline">
          Voir le concours →
        </Link>
      )}
    </Card>
  );
}
