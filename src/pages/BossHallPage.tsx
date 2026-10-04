import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Crown, Flag, Hourglass, Skull, Swords, Trophy, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/hud";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlayerName } from "@/components/ui/player-name";
import { BOSS_KIND_LABELS, bossRecords, type BossHistoryEntry, type BossKind } from "@/game/bossHistory";
import { useBossHistory } from "@/services/bossHistoryService";
import { usePlayerStore } from "@/store/playerStore";
import { assetUrl } from "@/lib/assets";
import { cn, formatCompact, formatDuration } from "@/lib/utils";

/* v5.10 : Hall of fame des boss (différent du Palmarès des saisons) — records, champions et historique des combats. */

const MEDALS = ["#ffd86b", "#cbd5e1", "#e0a26b"];
type Filter = "all" | BossKind;

function dateLabel(ms: number) {
  return new Date(ms).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function Record({ icon: Icon, label, value, sub, color }: { icon: typeof Trophy; label: string; value: string; sub?: React.ReactNode; color: string }) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
        <Icon className="h-3.5 w-3.5" style={{ color }} /> {label}
      </span>
      <span className="font-display text-xl tabular-nums text-white">{value}</span>
      {sub && <span className="text-xs text-slate-400">{sub}</span>}
    </Card>
  );
}

function Leaders({ title, icon: Icon, list, unit }: { title: string; icon: typeof Trophy; list: { uid: string; pseudo: string; count: number }[]; unit: string }) {
  return (
    <Card className="flex flex-col gap-2 p-4">
      <h2 className="hud-title flex items-center gap-2 text-sm">
        <Icon className="h-4 w-4 text-gold-glow" /> {title}
      </h2>
      {list.length === 0 ? (
        <p className="text-xs text-slate-500">Personne pour l'instant.</p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {list.map((p, i) => (
            <li key={p.uid} className="flex items-center gap-2 text-sm">
              <span className="w-6 font-mono text-xs font-bold" style={{ color: MEDALS[i] ?? "#64748b" }}>
                #{i + 1}
              </span>
              <PlayerName uid={p.uid} pseudo={p.pseudo} className="min-w-0 flex-1 truncate" />
              <span className="font-mono text-xs text-slate-400">
                {p.count} {unit}
                {p.count > 1 ? "s" : ""}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

function FightRow({ e, index }: { e: BossHistoryEntry; index: number }) {
  const reduce = useReducedMotion();
  const tone = e.won ? "#5cf2b0" : "#ffb347";
  const pct = e.maxHp > 0 ? Math.min(100, Math.round((e.totalDamage / e.maxHp) * 100)) : 0;
  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 10) * 0.04 }}
      className="relative overflow-hidden border border-white/[0.06] bg-white/[0.02]"
    >
      {e.image && <img src={assetUrl(e.image)} alt="" className="absolute inset-y-0 right-0 h-full w-1/2 object-cover opacity-15 [mask-image:linear-gradient(to_left,black,transparent)]" />}
      <div className="relative flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center border" style={{ color: tone, borderColor: `${tone}66`, background: `${tone}12` }}>
            {e.won ? <Trophy className="h-5 w-5" /> : <Flag className="h-5 w-5" />}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-sm text-white">{e.name}</p>
            <p className="text-[11px] text-slate-500">
              {BOSS_KIND_LABELS[e.kind]}
              {e.allianceName ? ` · ${e.allianceName}` : ""} · {dateLabel(e.endedAtMs)} · {e.won ? "abattu" : `retiré à ${pct} %`} en {formatDuration((e.endedAtMs - e.startMs) / 1000)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 sm:justify-end">
          <span>
            <strong className="text-white">{e.participants}</strong> commandants · <strong className="text-white">{formatCompact(e.totalDamage)}</strong> dégâts
          </span>
          {e.top.slice(0, 3).map((t, i) => (
            <span key={t.uid} className="inline-flex items-center gap-1">
              <span className="font-mono font-bold" style={{ color: MEDALS[i] }}>
                #{i + 1}
              </span>
              <PlayerName uid={t.uid} pseudo={t.pseudo} className="max-w-28 truncate text-slate-200" />
            </span>
          ))}
          {e.killedBy && (
            <span className="inline-flex items-center gap-1 text-danger-glow">
              <Skull className="h-3.5 w-3.5" /> coup de grâce : <PlayerName uid={e.killedBy.uid} pseudo={e.killedBy.pseudo} className="text-slate-200" />
            </span>
          )}
        </div>
      </div>
    </motion.li>
  );
}

export function BossHallPage() {
  const all = useBossHistory();
  const allianceId = usePlayerStore((s) => s.player?.allianceId);
  const [filter, setFilter] = useState<Filter>("all");
  // Les boss d'alliance ne sont visibles que pour leur alliance.
  const visible = useMemo(() => (all ?? []).filter((e) => e.kind !== "allianceboss" || (allianceId && e.allianceId === allianceId)), [all, allianceId]);
  const shown = filter === "all" ? visible : visible.filter((e) => e.kind === filter);
  const server = visible.filter((e) => e.kind !== "allianceboss");
  const rec = bossRecords(server);
  const filters: [Filter, string][] = [
    ["all", "Tous"],
    ["leviathan", "Léviathan"],
    ["seasonboss", "Boss de saison"],
    ["allianceboss", "Mon alliance"],
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Grands ennemis"
        title="Hall of fame des boss"
        description="Chaque colosse affronté par le serveur, ses chiffres et ceux qui l'ont fait plier. Records et champions sont calculés sur le Léviathan et les boss de saison."
      />

      {all === null ? (
        <p className="text-sm text-slate-500">Chargement…</p>
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState icon={<Crown className="h-10 w-10 text-gold-glow" />} title="Le Hall attend ses légendes">
            Chaque boss abattu ou retiré y entre dès la fin de son combat.
          </EmptyState>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Record icon={Swords} label="Combats" value={String(rec.fights)} sub={`${rec.kills} victoire${rec.kills > 1 ? "s" : ""}`} color="#4be8ff" />
            <Record
              icon={Zap}
              label="Plus gros total"
              value={rec.bestHit ? formatCompact(rec.bestHit.damage) : "—"}
              sub={rec.bestHit ? <><PlayerName uid={rec.bestHit.uid} pseudo={rec.bestHit.pseudo} /> · {rec.bestHit.boss}</> : undefined}
              color="#ff8a4c"
            />
            <Record icon={Hourglass} label="Victoire la plus rapide" value={rec.fastest ? formatDuration(rec.fastest.durationMs / 1000) : "—"} sub={rec.fastest ? `${rec.fastest.name}, ${dateLabel(rec.fastest.endedAtMs)}` : undefined} color="#5cf2b0" />
            <Record icon={Crown} label="Champion" value={rec.champions[0]?.pseudo ?? "—"} sub={rec.champions[0] ? `${rec.champions[0].count} fois n° 1 des dégâts` : undefined} color="#ffd86b" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Leaders title="N° 1 des dégâts (boss abattus)" icon={Crown} list={rec.champions} unit="victoire" />
            <Leaders title="Coups de grâce" icon={Skull} list={rec.finishers} unit="coup" />
          </div>

          <Card className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="hud-title text-sm">Historique des combats</h2>
              <div className="ml-auto flex flex-wrap gap-1">
                {filters.map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFilter(id)}
                    className={cn("border px-2 py-1 text-xs transition-colors", filter === id ? "border-cyan-glow/60 bg-cyan-glow/10 text-cyan-glow" : "border-white/10 text-slate-400 hover:text-white")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {shown.length === 0 ? <p className="text-xs text-slate-500">Rien dans cette catégorie.</p> : <ul className="flex flex-col gap-2">{shown.map((e, i) => <FightRow key={e.id} e={e} index={i} />)}</ul>}
          </Card>
        </>
      )}
    </div>
  );
}
