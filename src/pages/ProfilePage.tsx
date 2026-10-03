import { assetUrl } from "@/lib/assets";
import { LevelTicks, StatTile } from "@/components/ui/hud";
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
import { formatNumber, cn } from "@/lib/utils";
import { GameIcon } from "@/components/ui/game-icon";
import { SeasonHistoryCard } from "@/components/game/SeasonHistoryCard";
import { ProfileStyleCard } from "@/components/game/ProfileStyleCard";
import { ReferralCard } from "@/components/game/ReferralCard";
import { RenameCard } from "@/components/game/RenameCard";

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

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Cosmic Empires / Dossier" title="Profil" description="Progression, statistiques et rang." />

      <Card className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
        <RadialGauge value={progress.percent} size={96} strokeWidth={5}>
          <img src={getRankIcon(player.xp)} alt="" className="h-16 w-16 object-contain" />
        </RadialGauge>
        <div className="flex-1">
          <p className="font-display text-xl text-white">{getRankLabel(player.xp)}</p>
          <p className="text-xs text-slate-500">
            {rankIndex > 0 ? `Rang précédent : ${RANKS[rankIndex - 1]?.name}` : "Aucun rang précédent"}
          </p>
          <p className="text-xs text-slate-500">{progress.next ? `Rang suivant : ${progress.next} (${formatNumber(progress.nextXp ?? 0)} XP)` : "Rang maximum atteint"}</p>
          <p className="mt-1 text-sm text-cyan-glow">{formatNumber(player.xp)} XP</p>
        </div>
      </Card>

      <ProfileStyleCard player={player} />

      <RenameCard player={player} />

      <ReferralCard player={player} />

      <RankLadder xp={player.xp} />

      <TitlesCard titles={player.titles ?? []} active={player.activeTitle ?? ""} />

      <SeasonHistoryCard uid={player.uid} currentXp={player.seasonXp ?? 0} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Victoires" value={formatNumber(player.victories)} tone="var(--color-mint-glow)" sub={`${player.victories + player.defeats > 0 ? Math.round((player.victories / (player.victories + player.defeats)) * 100) : 0} % de réussite`} />
        <StatTile label="Défaites" value={formatNumber(player.defeats)} tone="var(--color-danger-glow)" />
        <StatTile label="Temps de jeu" value={`${hours}h ${minutes.toString().padStart(2, "0")}`} tone="var(--color-cyan-glow)" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Bâtiments</CardTitle>
            <span className="text-xs text-slate-400">{buildingsPercent}%</span>
          </CardHeader>
          <CardContent className="space-y-2">
            {BUILDINGS.map((b) => {
              const level = effectiveBuildingLevel(player.buildings, b.id);
              return (
                <div key={b.id}>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{b.name}</span>
                    <span className="tabular-mono">{level} / {b.maxLevel}</span>
                  </div>
                  <LevelTicks level={level} max={b.maxLevel} next={false} className="mt-1" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Unités</CardTitle>
            <span className="text-xs text-slate-400">{unitsPercent}%</span>
          </CardHeader>
          <CardContent className="space-y-2">
            {UNITS.map((u) => {
              const level = player.units[u.id]?.level ?? 0;
              return (
                <div key={u.id}>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{u.name}</span>
                    <span className="tabular-mono">{level} / {u.maxLevel}</span>
                  </div>
                  <LevelTicks level={level} max={u.maxLevel} next={false} className="mt-1" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Succès</CardTitle>
          <Link to="/game/succes" className="text-xs text-cyan-glow hover:underline">
            {ACHIEVEMENTS.filter((a) => a.enabled && (player.unlockedAchievements ?? []).includes(a.id)).length} / {ACHIEVEMENTS.filter((a) => a.enabled).length} · Tout voir →
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
              <p className="text-sm text-slate-500">Aucun succès pour l'instant. Ta première victoire t'en rapportera un !</p>
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
    </div>
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
        <h3 className="font-display text-sm text-white">Échelle des rangs</h3>
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
                "flex flex-col items-center gap-1 rounded-lg border p-2 text-center",
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
  const [pending, setPending] = useState(false);
  if (titles.length === 0) {
    return (
      <Card className="p-4 text-sm text-slate-500">
        <GameIcon name="trophy" /> Aucun titre pour l'instant : finis une saison dans le top 10 pour en gagner un (voir le Palmarès).
      </Card>
    );
  }
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
      <CardContent className="flex flex-wrap gap-2">
        {[...titles].reverse().map((t) => (
          <button
            key={t.seasonId}
            type="button"
            disabled={pending}
            onClick={() => void choose(t.label === active ? "" : t.label)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs transition-colors",
              t.label === active ? "border-gold-glow/70 bg-gold-glow/15 text-gold-glow" : "border-white/10 text-slate-300 hover:border-gold-glow/40",
            )}
          >
            <GameIcon name="trophy" /> {t.label}
          </button>
        ))}
        <p className="w-full text-[11px] text-slate-500">Clique pour afficher un titre à côté de ton pseudo (reclique pour le masquer).</p>
      </CardContent>
    </Card>
  );
}
