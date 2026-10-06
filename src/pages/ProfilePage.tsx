import { AscensionStars } from "@/components/game/AscensionCard";
import { EmptyAction } from "@/components/ui/panel";
import { assetUrl } from "@/lib/assets";
import { LevelTicks, StatTile, EmptyState } from "@/components/ui/hud";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { GameActionError, setActiveTitle } from "@/services/playerService";
import type { PlayerTitle } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadialGauge } from "@/components/ui/radial-gauge";
import { PageHeader } from "@/components/layout/PageHeader";
import { usePlayerStore } from "@/store/playerStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { getRankIcon, getRankIndex, getRankLabel, getRankProgress, RANKS } from "@/game/ranks";
import { BUILDINGS, effectiveBuildingLevel } from "@/game/buildings";
import { UNITS } from "@/game/units";
import { ACHIEVEMENTS } from "@/game/achievements";
import { AchievementMedal } from "@/pages/AchievementsPage";
import { Link } from "react-router-dom";
import { formatCompact, formatNumber, cn } from "@/lib/utils";
import { TitleBadge } from "@/components/game/TitleBadge";
import { TITLES, titleProgress, titleRarity } from "@/game/titles";
import { GameIcon } from "@/components/ui/game-icon";
import { SeasonHistoryCard } from "@/components/game/SeasonHistoryCard";
import { ProfileStyleCard } from "@/components/game/ProfileStyleCard";
import { ReferralCard } from "@/components/game/ReferralCard";
import { RenameCard } from "@/components/game/RenameCard";
import { AvatarCard } from "@/components/game/AvatarCard";
import { EmpireShareActions } from "@/components/game/EmpireShareActions";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";

function usePlaytimeDisplay(baseSeconds: number) {
  useNowTicker();
  const baseRef = useRef(baseSeconds);
  const resetAtRef = useRef(Date.now());

  if (baseRef.current !== baseSeconds) {
    baseRef.current = baseSeconds;
    resetAtRef.current = Date.now();
  }

  const elapsed = Math.floor((Date.now() - resetAtRef.current) / 1000);
  return baseSeconds + elapsed;
}

export function ProfilePage() {
  const player = usePlayerStore((s) => s.player);
  const playtime = usePlaytimeDisplay(player?.playtimeSeconds ?? 0);

  if (!player) return null;

  const rankIndex = getRankIndex(player.xp);
  const progress = getRankProgress(player.xp);
  const hours = Math.floor(playtime / 3600);
  const minutes = Math.floor((playtime % 3600) / 60);

  const buildingsTotal = BUILDINGS.reduce((sum, b) => sum + effectiveBuildingLevel(player.buildings, b.id), 0);
  const buildingsPercent = Math.floor((buildingsTotal / Math.max(1, BUILDINGS.reduce((s, b) => s + b.maxLevel, 0))) * 100);

  const unitsTotal = UNITS.reduce((sum, u) => sum + (player.units[u.id]?.level ?? 0), 0);
  const unitsPercent = Math.floor((unitsTotal / Math.max(1, UNITS.reduce((s, u) => s + u.maxLevel, 0))) * 100);

  const fights = player.victories + player.defeats;
  const unlocked = ACHIEVEMENTS.filter((a) => a.enabled && (player.unlockedAchievements ?? []).includes(a.id)).length;
  const achievementsTotal = ACHIEVEMENTS.filter((a) => a.enabled).length;

  /* 5.25 : deux colonnes. À gauche, le dossier (rang, chiffres, progression, palmarès) ;
     à droite, tout ce que le joueur modifie (avatar, bannière et devise, pseudo, parrainage). */
  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Cosmic Empires / Dossier" title="Profil" description="Progression, statistiques et rang." right={
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
            {/* Sur une colonne, la personnalisation passe sous le dossier : raccourci direct. */}
            <Button asChild variant="ghost" size="sm" className="xl:hidden">
              <a href="#personnalisation">
                <Palette className="h-3.5 w-3.5" /> Personnaliser
              </a>
            </Button>
            <EmpireShareActions player={player} kind="profile" />
          </div>
        } />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        {/* ---------- Dossier ---------- */}
        <section className="flex min-w-0 flex-col gap-6" aria-label="Dossier du commandant">
          <Card className="flex flex-col gap-5 p-5">
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
              <RadialGauge value={progress.percent} size={104} strokeWidth={5}>
                <img src={getRankIcon(player.xp)} alt="" className="h-16 w-16 object-contain" />
              </RadialGauge>
              <div className="min-w-0 flex-1">
                <p className="hud-eyebrow text-slate-500">Rang actuel</p>
                <p className="font-display text-2xl text-slate-100">{getRankLabel(player.xp)}</p>
                <AscensionStars count={player.ascensions} full className="my-1" />
                <p className="font-mono text-sm tabular-nums text-cyan-glow">{formatNumber(player.xp)} XP</p>
                <Progress value={progress.percent} className="mt-2 h-1.5" />
                <p className="mt-1.5 flex flex-wrap justify-center gap-x-4 text-xs text-slate-500 sm:justify-start">
                  <span>{rankIndex > 0 ? `Précédent : ${RANKS[rankIndex - 1]?.name}` : "Premier rang"}</span>
                  <span>{progress.next ? `Suivant : ${progress.next} à ${formatNumber(progress.nextXp ?? 0)} XP` : "Rang maximum atteint"}</span>
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
              <StatTile label="Victoires" value={formatNumber(player.victories)} tone="mint" sub={`${fights > 0 ? Math.round((player.victories / fights) * 100) : 0} % de réussite`} />
              <StatTile label="Défaites" value={formatNumber(player.defeats)} tone="danger" sub={`${formatNumber(fights)} combats`} />
              <div className="col-span-2 sm:col-span-1">
                <StatTile label="Temps de jeu" value={`${hours}h ${minutes.toString().padStart(2, "0")}`} tone="accent" />
              </div>
            </div>
          </Card>

          <RankLadder xp={player.xp} />

          <TitlesCard titles={player.titles ?? []} active={player.activeTitle ?? ""} />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Succès</CardTitle>
              <Link to="/game/succes" className="text-xs text-cyan-glow hover:underline">
                <span className="font-mono tabular-nums">{unlocked} / {achievementsTotal}</span> · Tout voir →
              </Link>
            </CardHeader>
            <CardContent>
              {(() => {
                const recent = (player.unlockedAchievements ?? [])
                  .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
                  .filter((a): a is (typeof ACHIEVEMENTS)[number] => !!a)
                  .slice(-8)
                  .reverse();
                return recent.length === 0 ? (
                  <EmptyState size="sm" icon="🏅" title="Aucun succès" action={<EmptyAction to="/game/succes">Voir les succès</EmptyAction>}>
                    Ta première victoire t'en rapportera un !
                  </EmptyState>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {recent.map((a) => (
                      <div key={a.id} className="flex w-20 flex-col items-center gap-1 text-center" title={a.description}>
                        <AchievementMedal a={a} unlocked size={64} />
                        <span className="text-[10px] leading-tight text-slate-300">{a.name}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          <SeasonHistoryCard uid={player.uid} currentXp={player.seasonXp ?? 0} />

          <div className="grid gap-6 lg:grid-cols-2">
            <ProgressList title="Bâtiments" percent={buildingsPercent} rows={BUILDINGS.map((b) => ({ id: b.id, name: b.name, level: effectiveBuildingLevel(player.buildings, b.id), max: b.maxLevel }))} />
            <ProgressList title="Unités" percent={unitsPercent} rows={UNITS.map((u) => ({ id: u.id, name: u.name, level: player.units[u.id]?.level ?? 0, max: u.maxLevel }))} />
          </div>
        </section>

        {/* ---------- Personnalisation ---------- */}
        <section id="personnalisation" className="@container flex min-w-0 scroll-mt-20 flex-col gap-6" aria-label="Personnalisation">
          <p className="hud-eyebrow -mb-3 text-cyan-glow/80">Personnalisation</p>
          <AvatarCard player={player} />
          <ProfileStyleCard player={player} />
          <RenameCard player={player} />
          <ReferralCard player={player} />
        </section>
      </div>
    </div>
  );
}

/** Niveaux des bâtiments ou des unités, repliés au-delà de 8 lignes. */
function ProgressList({ title, percent, rows }: { title: string; percent: number; rows: { id: string; name: string; level: number; max: number }[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? rows : rows.slice(0, 8);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <span className="font-mono text-xs tabular-nums text-slate-400">{percent} %</span>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {shown.map((r) => (
          <div key={r.id}>
            <div className="flex justify-between text-xs text-slate-400">
              <span>{r.name}</span>
              <span className="tabular-mono">
                {r.level} / {r.max}
              </span>
            </div>
            <LevelTicks level={r.level} max={r.max} next={false} className="mt-1" />
          </div>
        ))}
        {rows.length > 8 && (
          <button type="button" onClick={() => setAll((v) => !v)} className="font-mono text-[10px] uppercase tracking-[0.14em] text-cyan-glow hover:underline">
            {all ? "Replier" : `Afficher les ${rows.length - 8} autres`}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

/** Titres gagnés en fin de saison : le joueur choisit celui qui s'affiche. */
/** Échelle complète des rangs : atteints, actuel, à venir. */
function RankLadder({ xp }: { xp: number }) {
  const [open, setOpen] = useState(false);
  const current = getRankIndex(xp);
  const shown = open ? RANKS : RANKS.slice(Math.max(0, current - 2), current + 4);
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <h3 className="font-display text-sm text-slate-100">Échelle des rangs</h3>
        <span className="text-xs text-slate-500">
          {current + 1} / {RANKS.length}
        </span>
        <button type="button" className="ml-auto text-xs text-cyan-glow hover:underline" onClick={() => setOpen((o) => !o)}>
          {open ? "Réduire" : "Voir les " + RANKS.length + " rangs"}
        </button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-7">
        {shown.map((r) => {
          const i = RANKS.indexOf(r);
          return (
            <div
              key={r.id}
              className={cn(
                "hud-cut-sm flex flex-col items-center gap-1 border p-2 text-center",
                i === current ? "border-cyan-glow/50 bg-cyan-glow/10" : "border-white/5 bg-black/20",
                i > current && "opacity-45 grayscale",
              )}
            >
              <img src={assetUrl(r.image)} alt="" className="h-14 w-14 object-contain" loading="lazy" />
              <p className={cn("text-[11px] font-semibold", i === current ? "text-cyan-glow" : "text-slate-200")}>{r.name}</p>
              <p className="tabular-mono text-[10px] text-slate-500">{formatNumber(r.xp)} XP</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function TitlesCard({ titles, active }: { titles: PlayerTitle[]; active: string }) {
  const player = usePlayerStore((s) => s.player);
  const [pending, setPending] = useState(false);
  const owned = new Set(titles.map((t) => t.label));
  // v5.10 : titres du catalogue à débloquer sur une mesure, avec la progression.
  const toUnlock = player ? TITLES.filter((t) => t.enabled && t.unlock && !owned.has(t.label)) : [];
  const choose = async (label: string) => {
    setPending(true);
    try {
      await setActiveTitle(label);
      toast.success(label ? `Titre affiché : ${label}` : "Titre masqué");
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Changement impossible.");
    } finally {
      setPending(false);
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Titres</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {titles.length === 0 ? (
          <p className="text-sm text-slate-500">
            <GameIcon name="trophy" /> Aucun titre pour l'instant : succès, boss, défis, saisons… ou les titres ci-dessous.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {[...titles].reverse().map((t) => (
              <button
                key={t.seasonId}
                type="button"
                disabled={pending}
                onClick={() => void choose(t.label === active ? "" : t.label)}
                className={cn("transition-opacity", t.label === active ? "ring-1 ring-white/60" : "opacity-80 hover:opacity-100")}
                title={t.label === active ? "Affiché : clique pour le masquer" : "Clique pour l'afficher"}
              >
                <TitleBadge label={t.label} />
              </button>
            ))}
            <p className="w-full text-[11px] text-slate-500">Clique pour afficher un titre à côté de ton pseudo (reclique pour le masquer).</p>
          </div>
        )}
        {player && toUnlock.length > 0 && (
          <div className="flex flex-col gap-1.5 border-t border-white/5 pt-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">À débloquer</p>
            {toUnlock.map((t) => {
              const v = titleProgress(t, player);
              const pct = Math.min(100, Math.round((v / t.unlock!.threshold) * 100));
              const color = titleRarity(t.rarity).color;
              return (
                <div key={t.id} className="flex items-center gap-2 text-xs">
                  <span className="w-40 shrink-0 truncate opacity-70" style={{ color }}>
                    {t.icon} {t.label}
                  </span>
                  <span className="hidden min-w-0 flex-1 truncate text-slate-500 sm:block">{t.description}</span>
                  <span className="relative h-1.5 w-24 shrink-0 bg-white/5">
                    <i className="absolute inset-y-0 left-0" style={{ width: `${pct}%`, background: color }} />
                  </span>
                  <span className="w-20 shrink-0 text-right font-mono tabular-nums text-slate-400">
                    {formatCompact(Math.min(v, t.unlock!.threshold))}/{formatCompact(t.unlock!.threshold)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
