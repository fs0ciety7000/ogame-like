import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { usePlayerStore } from "@/store/playerStore";
import { DEFENSIVE_UNITS, OFFENSIVE_UNITS } from "@/game/units";
import { unitStat } from "@/game/combat";
import { economySnapshot } from "@/game/economy";
import { RESOURCE_LIST } from "@/game/resources";
import { cn, formatCompact, formatNumber } from "@/lib/utils";
import { Fragment, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { StatTile } from "@/components/ui/hud";
import { QueueStrip } from "@/components/game/QueueStrip";
import { DASHBOARD_SECTIONS, defaultLayout, moveSection, setDashboardLayout, toggleSection, useDashboardLayout, type DashboardSection } from "@/lib/dashboardLayout";
import { getRankLabel } from "@/game/ranks";
import { useNowTicker } from "@/hooks/useNowTicker";
import { OnboardingChecklist } from "@/components/game/OnboardingChecklist";
import { StoryDialog } from "@/components/game/StoryDialog";
import { SystemLogPanel } from "@/components/game/SystemLogPanel";
import { HomePlanet, HomePlanetLegend } from "@/components/game/HomePlanet";
import { UpcomingTimeline } from "@/components/game/UpcomingTimeline";
import { ColoniesCard } from "@/components/game/ColoniesCard";
import { ContractsCard } from "@/components/game/ContractsCard";
import { EventCard } from "@/components/game/EventBanner";
import { LeviathanBanner } from "@/components/game/LeviathanBanner";
import { FleetsPanel } from "@/components/game/FleetsPanel";
import { NextActionsCard } from "@/components/game/NextActionsCard";
import { ChallengeCard } from "@/components/game/ChallengeCard";
import { WeeklyRecapCard } from "@/components/game/WeeklyRecapCard";
import { RunningContestCard } from "@/components/game/RunningContestCard";
import { AgendaCard } from "@/components/game/AgendaCard";
import { BUILDINGS, effectiveBuildingLevel } from "@/game/buildings";
import { GameIcon, ResourceIcon } from "@/components/ui/game-icon";
import { useFleetStore } from "@/store/fleetStore";
import { isHostile } from "@/components/game/FleetsPanel";
import { activeVeil, synthesisState, synthLevel } from "@/game/synthesis";
import { commandersState } from "@/game/commanders";
import { equippedRelics } from "@/game/relics";
import { parisHour } from "@/game/stats";
import { useCockpitView } from "@/lib/cockpitView";
import { CockpitHub } from "@/components/cockpit/CockpitHub";
import { CommanderGuideCard } from "@/components/game/CommanderGuideCard";

export function DashboardPage() {
  useNowTicker();
  const player = usePlayerStore((s) => s.player);
  const queues = usePlayerStore((s) => s.queues);
  const fleets = useFleetStore((s) => s.fleets);
  const layout = useDashboardLayout();
  const [customizing, setCustomizing] = useState(false);
  const cockpit = useCockpitView((s) => s.enabled);

  if (!player) return null;

  // Vue cockpit : poste de commande à la place des cartes de l'accueil.
  if (cockpit) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="sr-only">Poste de commande</h1>
        <OnboardingChecklist player={player} />
        <StoryDialog player={player} />
        <CockpitHub />
        <CommanderGuideCard player={player} />
        <NextActionsCard max={3} />
      </div>
    );
  }

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
  const armor = synthesisState(player).armor;
  // v4.8 : planète plus grande (bureau), adaptée à l'écran sur mobile.
  const planetSize = typeof window !== "undefined" && window.innerWidth >= 640 ? 150 : 116;
  const planetLife = {
    synth: synthLevel(player),
    armor: !!armor && armor.untilMs > now,
    veil: activeVeil(player, now) > 0,
    officers: commandersState(player).active.length,
    legendary: equippedRelics(player).some((r) => r.rarity === "legendary"),
    away: fleets.filter((f) => f.ownerUid === player.uid && f.status !== "done").length,
    incoming: fleets.filter((f) => isHostile(f, player.uid)).length,
    hour: parisHour(now),
    colonies: (player.colonies ?? []).map((c) => c.name),
  };

  const totalBuildingLevels = BUILDINGS.reduce((sum, b) => sum + effectiveBuildingLevel(player.buildings, b.id), 0);
  const maxBuildingLevels = BUILDINGS.reduce((sum, b) => sum + b.maxLevel, 0);
  const developmentPercent = maxBuildingLevels > 0 ? Math.round((totalBuildingLevels / maxBuildingLevels) * 100) : 0;

  const sections: Record<DashboardSection, ReactNode> = {
    next: <NextActionsCard />,
    planet: (
      <Card className="flex flex-wrap items-center justify-center gap-6 p-4 sm:justify-start sm:p-5">
        <div className="mx-auto sm:mx-0">
          <HomePlanet buildings={player.buildings} life={planetLife} size={planetSize} />
        </div>
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
    ),
    colonies: <ColoniesCard />,
    fleets: <FleetsPanel hideWhenEmpty />,
    leviathan: <LeviathanBanner />,
    challenge: (
      <div className="flex flex-col gap-3">
        <WeeklyRecapCard />
        <RunningContestCard />
        <AgendaCard now={now} />
        <ChallengeCard />
      </div>
    ),
    event: <EventCard />,
    contracts: (
      <div id="contrats" className="scroll-mt-24">
        <ContractsCard />
      </div>
    ),
    economy: (
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
    ),
    power: (
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile label="Puissance d'attaque" value={formatCompact(attackPower)} tone="var(--color-mint-glow)" />
        <StatTile label="Puissance défensive" value={formatCompact(defensePower)} tone="var(--color-cyan-glow)" />
        <StatTile label="Victoires" value={player.victories} tone="var(--color-gold-glow)" />
        <StatTile label="Défaites" value={player.defeats} tone="var(--color-danger-glow)" />
      </div>
    ),
    log: <SystemLogPanel />,
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Cosmic Empires / Commandement"
        title={`Bienvenue, ${player.pseudo}`}
        description={`Rang ${getRankLabel(player.xp)} — ${formatNumber(player.xp)} XP`}
      />
      <QueueStrip queues={queues} now={now} />

      <OnboardingChecklist player={player} />
      <CommanderGuideCard player={player} />
      <StoryDialog player={player} />

      {layout.order
        .filter((id) => !layout.hidden.includes(id))
        .map((id) => (
          <Fragment key={id}>{sections[id]}</Fragment>
        ))}

      <div className="flex justify-center">
        <Button variant="ghost" size="sm" onClick={() => setCustomizing(true)}>
          <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" /> Personnaliser l'accueil
        </Button>
      </div>
      <DashboardCustomizer open={customizing} onClose={() => setCustomizing(false)} />
    </div>
  );
}

function DashboardCustomizer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const layout = useDashboardLayout();
  const label = (id: DashboardSection) => DASHBOARD_SECTIONS.find((s) => s.id === id)?.label ?? id;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogTitle>Personnaliser l'accueil</DialogTitle>
        <DialogDescription>Remonte ce qui compte pour toi, masque le reste. Mémorisé sur cet appareil.</DialogDescription>
        <div className="mt-3 flex flex-col gap-1.5">
          {layout.order.map((id, i) => {
            const hidden = layout.hidden.includes(id);
            return (
              <div key={id} className={cn("flex items-center gap-2 border border-white/10 bg-white/[0.02] px-2 py-1.5 text-sm", hidden && "opacity-50")}>
                <span className="flex-1 text-slate-200">{label(id)}</span>
                <button type="button" title="Monter" disabled={i === 0} className="p-1 text-slate-400 hover:text-cyan-glow disabled:opacity-30" onClick={() => setDashboardLayout(moveSection(layout, id, -1))}>
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button type="button" title="Descendre" disabled={i === layout.order.length - 1} className="p-1 text-slate-400 hover:text-cyan-glow disabled:opacity-30" onClick={() => setDashboardLayout(moveSection(layout, id, 1))}>
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button type="button" title={hidden ? "Afficher" : "Masquer"} className="p-1 text-slate-400 hover:text-cyan-glow" onClick={() => setDashboardLayout(toggleSection(layout, id))}>
                  {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            );
          })}
        </div>
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => setDashboardLayout(defaultLayout())}>
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Disposition par défaut
        </Button>
      </DialogContent>
    </Dialog>
  );
}
