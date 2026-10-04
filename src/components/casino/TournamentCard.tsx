import { Trophy } from "lucide-react";
import { HudPanel } from "@/components/ui/panel";
import { HudChip } from "@/components/ui/hud";
import { TokenIcon } from "@/components/casino/TokenIcon";
import { casinoClosesAt, tournamentRanking, type CasinoState } from "@/game/casino";
import { useNowTicker } from "@/hooks/useNowTicker";
import { cn, formatDuration } from "@/lib/utils";

/* v5.12 : tournoi de l'ouverture en cours (points des tirages) et podium du précédent. */

const MEDAL = ["var(--th-medal-gold)", "var(--th-medal-silver)", "var(--th-medal-bronze)"];

function Rank({ i }: { i: number }) {
  return (
    <span className="w-6 shrink-0 text-center font-mono text-xs font-bold tabular-nums" style={{ color: MEDAL[i] ?? "var(--th-text-500)" }}>
      {i + 1}
    </span>
  );
}

export function TournamentCard({ casino, uid }: { casino: CasinoState; uid: string }) {
  useNowTicker();
  const now = Date.now();
  const s = casino.settings;
  const ranking = tournamentRanking(casino.tournament);
  const mineIdx = ranking.findIndex((r) => r.uid === uid);
  const closes = casinoClosesAt(s, now);
  const last = casino.lastTournament;
  const prizes = s.rewards.tournament;

  return (
    <HudPanel
      icon={<Trophy />}
      title="Tournoi"
      tone="gold"
      aside={
        casino.tournament && (
          <HudChip size="sm" tone="mint" alert>
            {closes ? `Fin dans ${formatDuration(Math.max(0, closes - now) / 1000)}` : "En cours"}
          </HudChip>
        )
      }
    >
      <p className="text-xs text-slate-400">
        Chaque tirage rapporte des points (7-7-7 : 100, trois étoiles : 30…). À la fermeture, le podium gagne{" "}
        {prizes.slice(0, 3).map((n, i) => (
          <span key={i}>
            {i > 0 && (i === Math.min(prizes.length, 3) - 1 ? " et " : ", ")}
            <b className="text-slate-200">{n}</b>
          </span>
        ))}{" "}
        jetons, et le premier porte le titre <b className="text-gold-glow">« {s.rewards.tournamentTitle} »</b> jusqu'au tournoi suivant.
      </p>

      {ranking.length === 0 ? (
        <p className="text-xs text-slate-500">{casino.tournament ? "Personne n'a encore joué : le premier tirage prend la tête." : "Le tournoi commence à la prochaine ouverture."}</p>
      ) : (
        <ol className="grid gap-1">
          {ranking.slice(0, 5).map((r, i) => (
            <li key={r.uid} className={cn("flex items-center gap-2 px-1 py-0.5 text-xs", r.uid === uid && "hud-callout hud-tone-accent")}>
              <Rank i={i} />
              <span className="min-w-0 flex-1 truncate text-slate-200">{r.pseudo}</span>
              <span className="font-mono text-[10px] text-slate-500">{r.spins} tir.</span>
              <span className="w-14 text-right font-mono font-bold tabular-nums text-slate-100">{r.points} pts</span>
            </li>
          ))}
          {mineIdx >= 5 && (
            <li className="hud-callout hud-tone-accent flex items-center gap-2 px-1 py-0.5 text-xs">
              <Rank i={mineIdx} />
              <span className="min-w-0 flex-1 truncate text-slate-200">Toi</span>
              <span className="w-14 text-right font-mono font-bold tabular-nums text-slate-100">{ranking[mineIdx].points} pts</span>
            </li>
          )}
        </ol>
      )}

      {last && last.podium.length > 0 && (
        <div className="border-t border-white/5 pt-2">
          <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">Tournoi précédent · {last.participants} joueur{last.participants > 1 ? "s" : ""}</p>
          <ol className="grid gap-1">
            {last.podium.slice(0, 3).map((p, i) => (
              <li key={p.uid} className="flex items-center gap-2 text-xs">
                <Rank i={i} />
                <span className="min-w-0 flex-1 truncate text-slate-300">
                  {p.pseudo}
                  {p.uid === last.titleUid && <span className="ml-1 text-gold-glow">· {s.rewards.tournamentTitle}</span>}
                </span>
                <span className="font-mono text-slate-400">{p.points} pts</span>
                {p.tokens > 0 && (
                  <span className="inline-flex items-center gap-1 font-mono text-gold-glow">
                    <TokenIcon size={12} />+{p.tokens}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </HudPanel>
  );
}
