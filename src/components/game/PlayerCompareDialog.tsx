import { useEffect, useMemo, useState } from "react";
import { Loader2, Scale } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { EmptyState } from "@/components/ui/hud";
import { fetchPlayerSheet, type LeaderboardEntry, type PlayerSheet } from "@/services/playerService";
import { compareRows, compareScore, type CompareRow, type CompareSide } from "@/game/playerCompare";
import { getRankLabel } from "@/game/ranks";
import { cn, formatNumber } from "@/lib/utils";

/* 5.26 : deux joueurs côte à côte (par défaut : toi contre la cible choisie au
   classement). Chaque ligne signale le meilleur des deux en vert. */

function sideOf(sheet: PlayerSheet): CompareSide {
  const f = sheet.feats;
  const ranks = sheet.seasons.map((s) => s.rank).filter((r) => r > 0);
  return {
    xp: sheet.entry.xp,
    seasonXp: sheet.entry.seasonXp,
    ascensions: sheet.entry.ascensions ?? 0,
    createdAtMs: sheet.entry.createdAtMs,
    colonies: sheet.entry.planets?.length ?? 0,
    victories: f?.victories ?? 0,
    defeats: f?.defeats ?? 0,
    missions: f?.missions ?? 0,
    expeditions: f?.expeditions ?? 0,
    achievements: f?.achievements ?? 0,
    titles: f?.titles.length ?? 0,
    warsWon: f?.warsWon ?? 0,
    bounties: f?.bounties ?? 0,
    bossKills: f?.leviathanKills ?? 0,
    bestSeasonRank: ranks.length ? Math.min(...ranks) : null,
    seasonsPlayed: sheet.seasons.length,
  };
}

function fmt(row: CompareRow, v: number | null) {
  if (v === null) return "—";
  if (row.format === "percent") return `${v} %`;
  if (row.format === "days") return `${formatNumber(v)} j`;
  if (row.format === "rank") return `#${v}`;
  return formatNumber(v);
}

const GROUPS: { id: CompareRow["group"]; label: string }[] = [
  { id: "progression", label: "Progression" },
  { id: "combat", label: "Combat" },
  { id: "activite", label: "Activité" },
];

export function PlayerCompareDialog({ pair, players, onClose }: { pair: { a: string; b: string } | null; players: LeaderboardEntry[]; onClose: () => void }) {
  const [bUid, setBUid] = useState<string | null>(null);
  const [sheets, setSheets] = useState<{ a: PlayerSheet; b: PlayerSheet } | null>(null);
  const [error, setError] = useState(false);
  const aUid = pair?.a ?? null;
  const target = bUid ?? pair?.b ?? null;

  useEffect(() => {
    setBUid(null);
  }, [pair]);

  useEffect(() => {
    if (!aUid || !target) return;
    let alive = true;
    setSheets(null);
    setError(false);
    Promise.all([fetchPlayerSheet(aUid), fetchPlayerSheet(target)])
      .then(([a, b]) => alive && setSheets({ a, b }))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [aUid, target]);

  const rows = useMemo(() => (sheets ? compareRows(sideOf(sheets.a), sideOf(sheets.b), Date.now()) : []), [sheets]);
  const score = compareScore(rows);
  const choices = players.filter((p) => p.uid !== aUid && !p.npc);

  return (
    <Dialog open={!!pair} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogTitle className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-cyan-glow" /> Comparer
        </DialogTitle>
        <label className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          Face à
          <select
            value={target ?? ""}
            onChange={(e) => setBUid(e.target.value)}
            className="hud-cut-sm min-w-0 flex-1 border border-white/10 bg-space-900 px-2 py-1.5 text-sm text-slate-100"
            aria-label="Joueur à comparer"
          >
            {target && !choices.some((p) => p.uid === target) && <option value={target}>{sheets?.b.entry.pseudo ?? "…"}</option>}
            {choices.map((p) => (
              <option key={p.uid} value={p.uid}>
                {p.pseudo} · {formatNumber(p.xp)} XP
              </option>
            ))}
          </select>
        </label>
        {error ? (
          <EmptyState icon={<Scale className="h-5 w-5" />} title="Comparaison impossible">
            Une des deux fiches n'a pas pu être lue. Réessaie dans un instant.
          </EmptyState>
        ) : !sheets ? (
          <div className="flex justify-center py-10 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              {(["a", "b"] as const).map((k, i) => {
                const e = sheets[k].entry;
                const won = score[k] > score[k === "a" ? "b" : "a"];
                return (
                  <div key={k} className={cn("flex min-w-0 items-center gap-2", i === 1 && "order-3 flex-row-reverse text-right")}>
                    <PlayerAvatar uid={e.uid} pseudo={e.pseudo} file={e.avatar} className="h-11 w-11 shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-semibold text-slate-100">{e.pseudo}</p>
                      <p className="truncate text-[11px] text-slate-500">{getRankLabel(e.xp)}</p>
                      <p className={cn("font-mono text-xs tabular-nums", won ? "text-mint-glow" : "text-slate-400")}>{score[k]} ligne{score[k] > 1 ? "s" : ""} en tête</p>
                    </div>
                  </div>
                );
              })}
              <span className="order-2 font-mono text-xs text-slate-500">VS</span>
            </div>
            {GROUPS.map((g) => (
              <div key={g.id}>
                <p className="hud-eyebrow mb-1.5 text-[11px] text-slate-500">{g.label}</p>
                <div className="flex flex-col divide-y divide-white/5 border border-white/5">
                  {rows
                    .filter((r) => r.group === g.id)
                    .map((r) => (
                      <div key={r.key} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 py-1.5 text-sm">
                        <span className={cn("font-mono tabular-nums", r.winner === "a" ? "text-mint-glow" : "text-slate-300")}>{fmt(r, r.a)}</span>
                        <span className="text-center text-[11px] text-slate-500">{r.label}</span>
                        <span className={cn("text-right font-mono tabular-nums", r.winner === "b" ? "text-mint-glow" : "text-slate-300")}>{fmt(r, r.b)}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
            <p className="text-[11px] text-slate-500">Chiffres des fiches publiques ; ressources, flotte et défenses restent secrètes (l'espionnage les révèle).</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
