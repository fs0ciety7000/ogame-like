import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/layout/PageHeader";
import { usePlayerStore } from "@/store/playerStore";
import { DEFENSIVE_UNITS, OFFENSIVE_UNITS } from "@/game/units";
import { unitStat } from "@/game/combat";
import { MISSIONS } from "@/game/missions";
import { findTech } from "@/game/technologies";
import { getProductionRatesPerSecond } from "@/game/production";
import { RESOURCE_LIST } from "@/game/resources";
import { formatClock, formatNumber } from "@/lib/utils";
import { getRankLabel } from "@/game/ranks";
import { useNowTicker } from "@/hooks/useNowTicker";
import { OnboardingChecklist } from "@/components/game/OnboardingChecklist";

export function DashboardPage() {
  useNowTicker();
  const player = usePlayerStore((s) => s.player);
  const queues = usePlayerStore((s) => s.queues);

  if (!player) return null;

  const attackPower = OFFENSIVE_UNITS.reduce(
    (sum, id) => sum + unitStat(player.units, player.techLevels, id, "attack") * (player.units[id]?.count ?? 0),
    0,
  );
  const defensePower = DEFENSIVE_UNITS.reduce(
    (sum, id) => sum + unitStat(player.units, player.techLevels, id, "attack") * (player.units[id]?.count ?? 0),
    0,
  );

  const rates = getProductionRatesPerSecond(player.buildings, player.techLevels);
  const now = Date.now();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Cosmic Empires / Commandement"
        title={`Bienvenue, ${player.pseudo}`}
        description={`Rang ${getRankLabel(player.xp)} — ${formatNumber(player.xp)} XP`}
      />

      <OnboardingChecklist player={player} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Puissance d'attaque</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-display tabular-nums text-mint-glow">{formatNumber(attackPower)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Puissance défensive</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-display tabular-nums text-cyan-glow">{formatNumber(defensePower)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Victoires</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-display tabular-nums text-slate-100">{player.victories}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Défaites</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-display tabular-nums text-slate-100">{player.defeats}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Production / seconde</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {RESOURCE_LIST.filter((r) => r.rarity === "common").map((r) => (
              <div key={r.id} className="flex items-center gap-2 text-sm">
                <span>{r.emoji}</span>
                <span className="text-slate-300">{r.name}</span>
                <span className="ml-auto text-mint-glow">+{formatNumber(rates[r.id] ?? 0)}/s</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Missions en cours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!queues || queues.activeMissions.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune mission en cours.</p>
            ) : (
              queues.activeMissions.map((m) => {
                const mission = MISSIONS[m.key];
                if (!mission) return null;
                const remaining = Math.max(0, Math.floor((m.endTime - now) / 1000));
                const percent = 100 - (remaining / mission.duration) * 100;
                return (
                  <div key={m.key}>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{mission.name}</span>
                      <span>{formatClock(remaining)}</span>
                    </div>
                    <Progress value={percent} className="mt-1" />
                  </div>
                );
              })
            )}
            <Link to="/game/missions" className="block text-xs text-cyan-glow hover:underline">
              Voir toutes les missions →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recherches en cours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!queues || queues.activeResearches.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune recherche en cours.</p>
            ) : (
              queues.activeResearches.map((r) => {
                const tech = findTech(r.id);
                if (!tech) return null;
                const remaining = Math.max(0, Math.floor((r.endTime - now) / 1000));
                return (
                  <div key={r.id} className="flex items-center justify-between text-xs text-slate-400">
                    <span>{tech.nom}</span>
                    <span>{formatClock(remaining)}</span>
                  </div>
                );
              })
            )}
            <Link to="/game/labo" className="block text-xs text-cyan-glow hover:underline">
              Ouvrir le laboratoire →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
