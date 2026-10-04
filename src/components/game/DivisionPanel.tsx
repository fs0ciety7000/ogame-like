import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { HudChip, StatTile } from "@/components/ui/hud";
import { TokenIcon } from "@/components/casino/TokenIcon";
import { bossCountdown } from "@/components/game/BossStage";
import { LEAGUE_RULES, LEAGUE_TIERS, LEAGUES_KEY, leagueInfo, leagueStandings, leagueTier, leagueWeekEnd, leagueWeekLabel, normalizeLeagues, weeklyScore, type LeagueEntry, type LeagueRow, type LeagueState, type LeagueTier } from "@/game/leagues";
import { pb } from "@/lib/pocketbase";
import { cn, formatNumber } from "@/lib/utils";

/* 5.15 : divisions du classement de saison (docs/DESIGN.md : StatTile pour
   sa division, HudChip pour choisir une division et pour les zones). */

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

/** Vue choisie dans l'onglet Saison : une division, ou le classement général. */
export type DivisionView = LeagueTier | "general";

const ordinal = (n: number) => `${n}${n === 1 ? "er" : "e"}`;

/** En-tête : ta division, ton rang, ton XP de la semaine, la fin de semaine ; puis le choix de la division. */
/** 5.15.7 : tes dernières semaines de division (gardées par le serveur). */
function DivisionHistory({ state, uid }: { state: LeagueState; uid: string }) {
  const list = state.history?.[uid] ?? [];
  if (list.length === 0) return null;
  return (
    <div className="glass-panel hud-cut-sm flex flex-col gap-2 p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">Tes {list.length} dernière{list.length > 1 ? "s" : ""} semaine{list.length > 1 ? "s" : ""}</p>
      <ol className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-8">
        {list.map((h) => {
          const t = leagueInfo(h.tier);
          const Move = h.move === "up" ? ArrowUp : h.move === "down" ? ArrowDown : Minus;
          return (
            <li key={h.weekId} className="hud-cut-sm flex flex-col gap-0.5 border-l-2 bg-white/[0.02] px-2 py-1.5" style={{ borderColor: t.color }} title={`${leagueWeekLabel(h.weekId)} : ${t.label}, ${ordinal(h.rank)}, ${formatNumber(h.score)} XP`}>
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500">{leagueWeekLabel(h.weekId)}</span>
              <span className="flex items-center gap-1 text-xs" style={{ color: t.color }}>
                {t.label}
                <Move aria-label={h.move === "up" ? "montée" : h.move === "down" ? "descente" : "maintien"} className={cn("h-3 w-3", h.move === "up" ? "text-mint-glow" : h.move === "down" ? "text-ember-glow" : "text-slate-500")} />
              </span>
              <span className="font-mono text-[11px] tabular-nums text-slate-300">
                {ordinal(h.rank)} · {formatNumber(h.score)} XP
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function DivisionPanel({ state, entries, uid, view, onView, generalRank }: { state: LeagueState; entries: LeagueEntry[]; uid: string; view: DivisionView; onView: (v: DivisionView) => void; generalRank: number | null }) {
  const now = Date.now();
  const mine = leagueTier(state, uid, entries);
  const info = leagueInfo(mine);
  const rows = leagueStandings(entries, state, mine);
  const me = rows.find((r) => r.uid === uid);
  const meEntry = entries.find((e) => e.uid === uid);
  const last = state.last?.moves[uid];
  const started = !!state.weekId;
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div style={{ ["--color-gold-glow" as string]: info.color }}>
          <StatTile tone="gold" label="Ta division" value={info.label} sub={last ? `Semaine passée : ${leagueInfo(last.from).label}, ${ordinal(last.rank)}${last.to !== last.from ? ` → ${leagueInfo(last.to).label}` : ""}` : started ? "Placée selon la puissance de ton empire" : "Placement au prochain passage du serveur"} />
        </div>
        <StatTile tone={me?.zone === "up" ? "mint" : me?.zone === "down" ? "ember" : "neutral"} label="Rang dans la division" value={me ? `${ordinal(me.rank)} / ${rows.length}` : "—"} sub={me?.zone === "up" ? "Zone de promotion" : me?.zone === "down" ? "Zone de relégation" : "Zone de maintien"} />
        <StatTile tone="accent" label="XP de la semaine" value={formatNumber(meEntry ? weeklyScore(state, meEntry) : 0)} sub={generalRank ? `Saison : ${ordinal(generalRank)} au général` : undefined} />
        <StatTile tone="neutral" label="Fin de semaine" value={bossCountdown(leagueWeekEnd(now) - now)} sub={started ? leagueWeekLabel(state.weekId) : undefined} />
      </div>
      <DivisionHistory state={state} uid={uid} />
      <p className="text-xs text-slate-400">
        Chaque lundi, les {Math.round(LEAGUE_RULES.promotePct * 100)} % premiers de chaque division montent, les {Math.round(LEAGUE_RULES.relegatePct * 100)} % derniers (et ceux qui n'ont rien gagné) descendent. Chaque joueur actif reçoit des jetons du casino selon sa division (<TokenIcon size={12} /> {info.tokens} en {info.label}, jusqu'à {LEAGUE_TIERS[LEAGUE_TIERS.length - 1].tokens} en Mythique) ; le premier gagne le titre « Champion {info.label} ».
      </p>
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Divisions">
        {[...LEAGUE_TIERS].reverse().map((t) => (
          <HudChip key={t.id} asChild size="md" tone="neutral" style={view === t.id ? { ["--c" as string]: t.color } : undefined}>
            <button type="button" role="tab" aria-selected={view === t.id} onClick={() => onView(t.id)} className={view === t.id ? "text-slate-100" : "text-slate-400"}>
              <span aria-hidden className="inline-block h-2 w-2" style={{ background: t.color }} />
              {t.label}
              {t.id === mine ? " · toi" : ""}
            </button>
          </HudChip>
        ))}
        <HudChip asChild size="md" tone={view === "general" ? "accent" : "neutral"}>
          <button type="button" role="tab" aria-selected={view === "general"} onClick={() => onView("general")} className={view === "general" ? "text-slate-100" : "text-slate-400"}>
            Général
          </button>
        </HudChip>
      </div>
    </div>
  );
}

/** Score de la semaine et zone d'un joueur dans sa division (cellule de la liste). */
export function DivisionScore({ row, className }: { row: Pick<LeagueRow, "score" | "zone">; className?: string }) {
  return (
    <span className={`flex flex-wrap items-center justify-end gap-2 ${className ?? ""}`}>
      <span className="font-mono text-sm tabular-nums text-slate-200">{formatNumber(row.score)} XP</span>
      {row.zone === "up" ? (
        <HudChip tone="mint" size="sm">
          <ArrowUp className="h-3 w-3" /> Monte
        </HudChip>
      ) : row.zone === "down" ? (
        <HudChip tone="ember" size="sm">
          <ArrowDown className="h-3 w-3" /> Descend
        </HudChip>
      ) : (
        <HudChip tone="neutral" size="sm">
          <Minus className="h-3 w-3" /> Reste
        </HudChip>
      )}
    </span>
  );
}
