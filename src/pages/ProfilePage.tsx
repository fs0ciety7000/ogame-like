import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadialGauge } from "@/components/ui/radial-gauge";
import { PageHeader } from "@/components/layout/PageHeader";
import { usePlayerStore } from "@/store/playerStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { getRankIcon, getRankIndex, getRankLabel, getRankProgress, RANK_NAMES } from "@/game/ranks";
import { BUILDINGS, effectiveBuildingLevel } from "@/game/buildings";
import { UNITS } from "@/game/units";
import { ACHIEVEMENTS } from "@/game/achievements";
import { formatNumber, cn } from "@/lib/utils";

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
  const buildingsPercent = Math.floor((buildingsTotal / (BUILDINGS.length * 10)) * 100);

  const unitsTotal = UNITS.reduce((sum, u) => sum + (player.units[u.id]?.level ?? 0), 0);
  const unitsPercent = Math.floor((unitsTotal / (UNITS.length * 10)) * 100);

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
            {rankIndex > 0 ? `Rang précédent : ${RANK_NAMES[rankIndex - 1]}` : "Aucun rang précédent"}
          </p>
          <p className="text-xs text-slate-500">{progress.next ? `Rang suivant : ${progress.next}` : "Rang maximum atteint"}</p>
          <p className="mt-1 text-sm text-cyan-glow">{formatNumber(player.xp)} XP</p>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Victoires</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-display text-mint-glow">{player.victories}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Défaites</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-display text-danger-glow">{player.defeats}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Temps de jeu</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-display text-slate-100">
            {hours}h {minutes.toString().padStart(2, "0")}m
          </CardContent>
        </Card>
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
                    <span>{level} / 10</span>
                  </div>
                  <Progress value={(level / 10) * 100} className="mt-0.5 h-1.5" />
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
                    <span>{level} / 10</span>
                  </div>
                  <Progress value={(level / 10) * 100} className="mt-0.5 h-1.5" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Succès</CardTitle>
          <span className="tabular-mono text-xs text-slate-400">
            {(player.unlockedAchievements ?? []).length} / {ACHIEVEMENTS.length}
          </span>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ACHIEVEMENTS.map((a) => {
              const unlocked = (player.unlockedAchievements ?? []).includes(a.id);
              return (
                <div
                  key={a.id}
                  title={a.description}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition",
                    unlocked ? "border-gold-glow/40 bg-gold-glow/5 shadow-[0_0_16px_-8px_var(--color-gold-glow)]" : "border-white/5 opacity-40 grayscale",
                  )}
                >
                  <span className="text-2xl">{a.emoji}</span>
                  <span className="text-[11px] text-slate-300">{a.name}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
