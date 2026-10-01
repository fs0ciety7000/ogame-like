import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { CornerBrackets } from "@/components/ui/corner-brackets";
import { usePlayerStore } from "@/store/playerStore";
import { DEFENSIVE_UNITS, OFFENSIVE_UNITS } from "@/game/units";
import { unitStat } from "@/game/combat";
import { economySnapshot } from "@/game/economy";
import { RESOURCE_LIST } from "@/game/resources";
import { formatNumber } from "@/lib/utils";
import { getRankLabel } from "@/game/ranks";
import { useNowTicker } from "@/hooks/useNowTicker";
import { OnboardingChecklist } from "@/components/game/OnboardingChecklist";
import { SystemLogPanel } from "@/components/game/SystemLogPanel";
import { HomePlanet, HomePlanetLegend } from "@/components/game/HomePlanet";
import { UpcomingTimeline } from "@/components/game/UpcomingTimeline";
import { ContractsCard } from "@/components/game/ContractsCard";
import { EventCard } from "@/components/game/EventBanner";
import { LeviathanBanner } from "@/components/game/LeviathanBanner";
import { FleetsPanel } from "@/components/game/FleetsPanel";
import { BUILDINGS, effectiveBuildingLevel } from "@/game/buildings";
import { GameIcon, ResourceIcon } from "@/components/ui/game-icon";

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

  const economy = economySnapshot(player, Date.now());
  const now = Date.now();

  const totalBuildingLevels = BUILDINGS.reduce((sum, b) => sum + effectiveBuildingLevel(player.buildings, b.id), 0);
  const maxBuildingLevels = BUILDINGS.reduce((sum, b) => sum + b.maxLevel, 0);
  const developmentPercent = maxBuildingLevels > 0 ? Math.round((totalBuildingLevels / maxBuildingLevels) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Cosmic Empires / Commandement"
        title={`Bienvenue, ${player.pseudo}`}
        description={`Rang ${getRankLabel(player.xp)} — ${formatNumber(player.xp)} XP`}
      />

      <OnboardingChecklist player={player} />

      <Card className="flex flex-wrap items-center gap-6 p-6">
        <HomePlanet buildings={player.buildings} />
        <div>
          <p className="hud-eyebrow text-slate-500">Développement de l'empire</p>
          <p className="font-display text-3xl text-white">{developmentPercent}%</p>
          <p className="mt-1 text-xs text-slate-500">
            {totalBuildingLevels} / {maxBuildingLevels} niveaux de bâtiments cumulés
          </p>
          <div className="mt-4">
            <HomePlanetLegend buildings={player.buildings} />
          </div>
        </div>
      </Card>

      <FleetsPanel hideWhenEmpty />

      <LeviathanBanner />
      <EventCard />
      <ContractsCard />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Production / seconde</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {RESOURCE_LIST.filter((r) => r.rarity === "common").map((r) => {
              const net = economy.net[r.id] ?? 0;
              const full = economy.full.includes(r.id);
              return (
                <div key={r.id} className="flex items-center gap-2 text-sm">
                  <ResourceIcon id={r.id} className="h-6 w-6" />
                  <span className="text-slate-300">{r.name}</span>
                  <span className={full ? "ml-auto text-xs font-semibold uppercase text-ember-glow" : net < 0 ? "ml-auto text-danger-glow" : "ml-auto text-mint-glow"}>
                    {full ? "entrepôt plein" : `${net >= 0 ? "+" : ""}${formatNumber(Math.round(net))}/s`}
                  </span>
                </div>
              );
            })}
            <div className="mt-1 space-y-0.5 border-t border-white/5 pt-2 text-[11px] text-slate-500">
              {economy.upkeep > 0 && <p><GameIcon name="repair" /> Entretien de la flotte : −{formatNumber(Math.round(economy.upkeep))} énergie/s</p>}
              {Number.isFinite(economy.capacity) && <p><GameIcon name="storage" /> Entrepôt : {formatNumber(economy.capacity)} par ressource</p>}
              {economy.outage && <p className="font-semibold text-danger-glow"><GameIcon name="energy" /> Panne d'énergie : production à 50 %</p>}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <UpcomingTimeline queues={queues} now={now} />
        </div>
      </div>

      <div className="relative -m-2 grid gap-4 p-2 sm:grid-cols-2 xl:grid-cols-4">
        <CornerBrackets />
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

      <SystemLogPanel />
    </div>
  );
}
