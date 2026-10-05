import { useMemo, useState } from "react";
import { SkeletonCards } from "@/components/ui/skeleton";
import { HudPanel } from "@/components/ui/panel";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight, Crown, Flag, History, Hourglass, Medal, Skull, Swords, Trophy, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState, HudChip } from "@/components/ui/hud";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlayerName } from "@/components/ui/player-name";
import { BossRecapDialog } from "@/components/game/BossRecap";
import { BOSS_KIND_LABELS, bossHistoryState, bossRecords, entryRank, myBossStats, type BossHistoryEntry, type BossKind } from "@/game/bossHistory";
import { bossMonthOf } from "@/game/chronicles";
import type { LeviathanState } from "@/game/leviathan";
import { useLeviathan } from "@/services/leviathanService";
import { useSeasonBoss } from "@/services/seasonBossService";
import { useBossHistory } from "@/services/bossHistoryService";
import { usePlayerStore } from "@/store/playerStore";
import { assetUrl } from "@/lib/assets";
import { formatCompact, formatDuration, alpha } from "@/lib/utils";

/* v5.10 : Hall of fame des boss (différent du Palmarès des saisons) — records, champions et historique des combats. */

const MEDALS = ["var(--th-medal-gold)", "var(--th-medal-silver)", "var(--th-medal-bronze)"];
type Filter = "all" | "mine" | BossKind;

function dateLabel(ms: number) {
  return new Date(ms).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function Record({ icon: Icon, label, value, sub, color }: { icon: typeof Trophy; label: string; value: string; sub?: React.ReactNode; color: string }) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
        <Icon className="h-3.5 w-3.5" style={{ color }} /> {label}
      </span>
      <span className="font-display text-xl tabular-nums text-slate-100">{value}</span>
      {sub && <span className="text-xs text-slate-400">{sub}</span>}
    </Card>
  );
}

function Leaders({ title, icon: Icon, list, unit }: { title: string; icon: typeof Trophy; list: { uid: string; pseudo: string; count: number }[]; unit: string }) {
  return (
    <HudPanel icon={<Icon />} title={title} tone="gold">
      {list.length === 0 ? (
        <EmptyState size="sm" icon="🏆" title="Personne pour l'instant">Le premier boss abattu ouvrira ce classement.</EmptyState>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {list.map((p, i) => (
            <li key={p.uid} className="flex items-center gap-2 text-sm">
              <span className="w-6 font-mono text-xs font-bold" style={{ color: MEDALS[i] ?? "var(--color-slate-500)" }}>
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
    </HudPanel>
  );
}

function FightRow({ e, index, onOpen, uid }: { e: BossHistoryEntry; index: number; onOpen: () => void; uid: string }) {
  const mine = uid ? entryRank(e, uid) : null;
  const reduce = useReducedMotion();
  const tone = e.won ? "var(--color-mint-glow)" : "var(--color-ember-glow)";
  const pct = e.maxHp > 0 ? Math.min(100, Math.round((e.totalDamage / e.maxHp) * 100)) : 0;
  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 10) * 0.04 }}
      className="relative overflow-hidden border border-white/[0.06] bg-white/[0.02] transition-colors hover:border-white/20 hover:bg-white/[0.04]"
    >
      {/* v5.10.3 : toute la ligne ouvre le bilan du combat. */}
      <button type="button" onClick={onOpen} aria-label={`Voir le bilan : ${e.name}, ${dateLabel(e.endedAtMs)}`} className="absolute inset-0 z-10 cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-cyan-glow" />
      {e.image && <img src={assetUrl(e.image)} alt="" className="absolute inset-y-0 right-0 h-full w-1/2 object-cover opacity-15 [mask-image:linear-gradient(to_left,black,transparent)]" />}
      <div className="relative flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center border" style={{ color: tone, borderColor: `${alpha(tone, 40)}`, background: `${alpha(tone, 7)}` }}>
            {e.won ? <Trophy className="h-5 w-5" /> : <Flag className="h-5 w-5" />}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-sm text-slate-100">{e.name}</p>
            <p className="text-[11px] text-slate-500">
              {BOSS_KIND_LABELS[e.kind]}
              {e.allianceName ? ` · ${e.allianceName}` : ""} · {dateLabel(e.endedAtMs)} · {e.won ? "abattu" : `retiré à ${pct} %`} en {formatDuration((e.endedAtMs - e.startMs) / 1000)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 sm:justify-end">
          <span>
            <strong className="text-slate-100">{e.participants}</strong> commandants · <strong className="text-slate-100">{formatCompact(e.totalDamage)}</strong> dégâts
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
          {mine && (
            <span className="hud-chip hud-chip-sm hud-tone-accent" title="Ton rang dans ce combat">
              Toi : #{mine.rank}
            </span>
          )}
          <ChevronRight className="hidden h-4 w-4 text-slate-500 sm:block" aria-hidden />
        </div>
      </div>
    </motion.li>
  );
}

export function BossHallPage() {
  const all = useBossHistory();
  const allianceId = usePlayerStore((s) => s.player?.allianceId);
  const [filter, setFilter] = useState<Filter>("all");
  const [opened, setOpened] = useState<BossHistoryEntry | null>(null);
  const uid = usePlayerStore((s) => s.player?.uid ?? "");
  const leviathan = useLeviathan();
  const seasonBoss = useSeasonBoss();
  // Les boss d'alliance ne sont visibles que pour leur alliance.
  const visible = useMemo(() => (all ?? []).filter((e) => e.kind !== "allianceboss" || (allianceId && e.allianceId === allianceId)), [all, allianceId]);
  const shown = filter === "all" ? visible : filter === "mine" ? visible.filter((e) => uid && entryRank(e, uid)) : visible.filter((e) => e.kind === filter);
  const mineStats = uid ? myBossStats(visible, uid) : [];
  const server = visible.filter((e) => e.kind !== "allianceboss");
  const rec = bossRecords(server);
  const filters: [Filter, string][] = [
    ["all", "Tous"],
    ["mine", "Mes combats"],
    ["leviathan", "Boss mondiaux"],
    ["seasonboss", "Boss de saison"],
    ["allianceboss", "Mon alliance"],
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader backdrop="/assets/blog/articles/5-10/couverture.webp"
        eyebrow="Grands ennemis"
        title="Hall of fame des boss"
        description="Chaque colosse affronté par le serveur, ses chiffres et ceux qui l'ont fait plier. Records et champions sont calculés sur le Léviathan et les boss de saison."
      />

      {all === null ? (
        <SkeletonCards count={3} />
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState icon={<Crown className="h-10 w-10 text-gold-glow" />} title="Le Hall attend ses légendes">
            Chaque boss abattu ou retiré y entre dès la fin de son combat.
          </EmptyState>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Record icon={Swords} label="Combats" value={String(rec.fights)} sub={`${rec.kills} victoire${rec.kills > 1 ? "s" : ""}`} color="var(--color-cyan-glow)" />
            <Record
              icon={Zap}
              label="Plus gros total"
              value={rec.bestHit ? formatCompact(rec.bestHit.damage) : "—"}
              sub={rec.bestHit ? <><PlayerName uid={rec.bestHit.uid} pseudo={rec.bestHit.pseudo} /> · {rec.bestHit.boss}</> : undefined}
              color="var(--color-ember-glow)"
            />
            <Record icon={Hourglass} label="Victoire la plus rapide" value={rec.fastest ? formatDuration(rec.fastest.durationMs / 1000) : "—"} sub={rec.fastest ? `${rec.fastest.name}, ${dateLabel(rec.fastest.endedAtMs)}` : undefined} color="var(--color-mint-glow)" />
            <Record icon={Crown} label="Champion" value={rec.champions[0]?.pseudo ?? "—"} sub={rec.champions[0] ? `${rec.champions[0].count} fois n° 1 des dégâts` : undefined} color="var(--color-gold-glow)" />
          </div>

          {mineStats.length > 0 && <MyRecords stats={mineStats} />}

          <div className="grid gap-4 lg:grid-cols-2">
            <Leaders title="N° 1 des dégâts (boss abattus)" icon={Crown} list={rec.champions} unit="victoire" />
            <Leaders title="Coups de grâce" icon={Skull} list={rec.finishers} unit="coup" />
          </div>

          <HudPanel
            icon={<History />}
            title="Historique des combats"
            aside={filters.map(([id, label]) => (
              <HudChip key={id} asChild size="sm" tone={filter === id ? "accent" : "neutral"}>
                <button type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>
                  {label}
                </button>
              </HudChip>
            ))}
          >
            {shown.length === 0 ? <EmptyState size="sm" icon="🔎" title="Rien dans cette catégorie">Essaie un autre filtre.</EmptyState> : <ul className="flex flex-col gap-2">{shown.map((e, i) => <FightRow key={e.id} e={e} index={i} uid={uid} onOpen={() => setOpened(e)} />)}</ul>}
          </HudPanel>
        </>
      )}
      {opened && <HallRecap e={opened} uid={uid} live={{ leviathan, seasonboss: seasonBoss }} onClose={() => setOpened(null)} />}
    </div>
  );
}

/** v5.10.5 : mes meilleurs rangs, par type de boss. */
function MyRecords({ stats }: { stats: ReturnType<typeof myBossStats> }) {
  return (
    <HudPanel icon={<Medal />} title="Mes records" tone="accent">
      <div className="grid gap-2 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.kind} className="flex flex-col gap-0.5 border border-white/[0.06] bg-white/[0.02] p-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{BOSS_KIND_LABELS[s.kind]}</span>
            <span className="font-display text-xl text-slate-100">
              <span style={{ color: MEDALS[s.bestRank - 1] ?? "var(--color-cyan-glow)" }}>#{s.bestRank}</span>
              <span className="ml-1.5 text-xs text-slate-400">meilleur rang</span>
            </span>
            <span className="text-xs text-slate-400">
              {s.fights} combat{s.fights > 1 ? "s" : ""} · {s.wins} victoire{s.wins > 1 ? "s" : ""} · record {formatCompact(s.bestDamage)} dégâts
              {s.finishers > 0 ? ` · ${s.finishers} coup${s.finishers > 1 ? "s" : ""} de grâce` : ""}
            </span>
            {s.best && <span className="truncate text-[11px] text-slate-500">{s.best.name}, {dateLabel(s.best.endedAtMs)}</span>}
          </div>
        ))}
      </div>
    </HudPanel>
  );
}

/** Bilan d'un combat archivé : l'état complet s'il est encore celui du boss en jeu, sinon l'archive. */
function HallRecap({ e, uid, live, onClose }: { e: BossHistoryEntry; uid: string; live: Partial<Record<BossKind, LeviathanState | null>>; onClose: () => void }) {
  const archived = bossHistoryState(e);
  const current = live[e.kind];
  const full = current && current.id === archived.state.id && current.status !== "active" ? current : null;
  const state = full ?? archived.state;
  const accent = e.kind === "leviathan" ? "var(--color-danger-glow)" : e.kind === "seasonboss" ? (bossMonthOf(state)?.theme.accent ?? undefined) : undefined;
  return (
    <BossRecapDialog
      open
      onOpenChange={(o) => !o && onClose()}
      state={state}
      uid={uid}
      name={e.name}
      image={e.image}
      accent={accent}
      totals={full ? undefined : archived.totals}
      missingNote={full || archived.complete ? undefined : "Ce combat a été archivé avant l'enregistrement de tous les participants : seul le podium est connu."}
    />
  );
}
