import { profileStyle } from "@/game/profile";
import { Card } from "@/components/ui/card";
import { HudPanel } from "@/components/ui/panel";
import { PageHeader } from "@/components/layout/PageHeader";
import { usePlayerStore } from "@/store/playerStore";
import { DEFENSIVE_UNITS, OFFENSIVE_UNITS } from "@/game/units";
import { unitStat } from "@/game/combat";
import { economySnapshot } from "@/game/economy";
import { RESOURCE_LIST } from "@/game/resources";
import { cn, formatCompact, formatNumber } from "@/lib/utils";
import { Fragment, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { closestCorners, DndContext, KeyboardSensor, PointerSensor, TouchSensor, useDroppable, useSensor, useSensors, type DragEndEvent, type DragOverEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, Check, Columns2, Eye, EyeOff, Factory, GripVertical, RotateCcw, SlidersHorizontal, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HudCallout, StatTile } from "@/components/ui/hud";
import { QueueStrip } from "@/components/game/QueueStrip";
import { columnOf, DASHBOARD_SECTIONS, defaultLayout, dropSection, moveSection, setDashboardLayout, switchColumn, toggleSection, useDashboardLayout, type DashboardColumn, type DashboardLayout, type DashboardSection } from "@/lib/dashboardLayout";
import { ProgressHub } from "@/components/game/ProgressHub";
import { getRankLabel } from "@/game/ranks";
import { useNowTicker } from "@/hooks/useNowTicker";
import { OnboardingChecklist } from "@/components/game/OnboardingChecklist";
import { StoryDialog } from "@/components/game/StoryDialog";
import { SystemLogPanel } from "@/components/game/SystemLogPanel";
import { HomePlanet } from "@/components/game/HomePlanet";
import { PlanetPhotoMode } from "@/components/game/PlanetPhotoMode";
import { UpcomingTimeline } from "@/components/game/UpcomingTimeline";
import { ColoniesCard } from "@/components/game/ColoniesCard";
import { WorkshopHomeCard } from "@/components/game/WorkshopHomeCard";
import { EventCard } from "@/components/game/EventBanner";
import { LeviathanBanner } from "@/components/game/LeviathanBanner";
import { BossReturnCard } from "@/components/game/BossReturnCard";
import { CasinoBanner } from "@/components/casino/CasinoBanner";
import { FleetsPanel } from "@/components/game/FleetsPanel";
import { NextActionsCard } from "@/components/game/NextActionsCard";
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
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<DashboardLayout | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
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
  const planetSize = typeof window !== "undefined" && window.innerWidth >= 640 ? 130 : 116;
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
    fleets: <FleetsPanel hideWhenEmpty />,
    progress: <ProgressHub now={now} />,
    economy: (
      <div className="grid gap-4 md:grid-cols-[16rem_minmax(0,1fr)]">
        <HudPanel icon={<Factory />} title="Production / s" tone="mint">
          <div className="grid gap-2">
            {RESOURCE_LIST.filter((r) => r.rarity === "common").map((r) => {
              const net = economy.net[r.id] ?? 0;
              const full = economy.full.includes(r.id);
              return (
                <div key={r.id} className="flex items-center gap-2 text-sm">
                  <ResourceIcon id={r.id} className="h-6 w-6" />
                  <span className="text-slate-300">{r.name}</span>
                  <span className={cn("ml-auto font-mono", full ? "text-xs font-semibold uppercase text-ember-glow" : net < 0 ? "text-danger-glow" : "text-mint-glow")}>
                    {full ? "plein" : `${net >= 0 ? "+" : ""}${formatNumber(Math.round(net))}`}
                  </span>
                </div>
              );
            })}
            <div className="mt-1 space-y-0.5 border-t border-white/5 pt-2 text-[11px] text-slate-500">
              {economy.upkeep > 0 && <p><GameIcon name="repair" /> Entretien : −<span className="font-mono">{formatNumber(Math.round(economy.upkeep))}</span> énergie/s</p>}
              {Number.isFinite(economy.capacity) && <p><GameIcon name="storage" /> Entrepôt : <span className="font-mono">{formatNumber(economy.capacity)}</span></p>}
              {economy.outage && <p className="font-semibold text-danger-glow"><GameIcon name="energy" /> Panne d'énergie : production à 50 %</p>}
            </div>
          </div>
        </HudPanel>
        <UpcomingTimeline queues={queues} now={now} />
      </div>
    ),
    log: <SystemLogPanel />,
    empire: (
      <Card className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <HomePlanet buildings={player.buildings} life={planetLife} size={planetSize} look={profileStyle(player).planet} />
          <div>
            <p className="hud-eyebrow text-[10px] text-slate-500">Développement de l'empire</p>
            <p className="font-display text-3xl text-slate-100">
              <span className="font-mono">{developmentPercent}</span> %
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              <span className="font-mono">{totalBuildingLevels}</span> / <span className="font-mono">{maxBuildingLevels}</span> niveaux de bâtiments
            </p>
          </div>
          <PlanetPhotoMode buildings={player.buildings} life={planetLife} look={profileStyle(player).planet} caption={player.pseudo} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <StatTile size="sm" label="Attaque" value={<span className="font-mono">{formatCompact(attackPower)}</span>} tone="accent" />
          <StatTile size="sm" label="Défense" value={<span className="font-mono">{formatCompact(defensePower)}</span>} tone="accent" />
          <StatTile size="sm" label="Victoires" value={<span className="font-mono">{formatNumber(player.victories ?? 0)}</span>} tone="mint" />
          <StatTile size="sm" label="Défaites" value={<span className="font-mono">{formatNumber(player.defeats ?? 0)}</span>} tone="danger" />
        </div>
        {/* 5.21.1 : raccourcis vers le détail (la légende des bâtiments a quitté l'accueil). */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <Link to="/game/batiments" className="text-cyan-glow hover:underline">Bâtiments</Link>
          <Link to="/game/statistiques" className="text-cyan-glow hover:underline">Statistiques de l'empire</Link>
          <Link to="/game/combats" className="text-cyan-glow hover:underline">Journal de combat</Link>
        </div>
      </Card>
    ),
    workshop: <WorkshopHomeCard />,
    colonies: <ColoniesCard />,
    leviathan: (
      <div className="flex flex-col gap-4">
        <LeviathanBanner />
        <BossReturnCard />
      </div>
    ),
    events: (
      <div className="flex flex-col gap-4">
        <EventCard />
        <CasinoBanner player={player} />
        <RunningContestCard />
        <AgendaCard now={now} />
      </div>
    ),
  };

  const visible = (col: DashboardColumn) => (draft ?? layout)[col].filter((id) => !layout.hidden.includes(id));
  const column = (col: DashboardColumn) =>
    editing ? (
      <SortableColumn col={col} ids={visible(col)}>
        {visible(col).map((id) => (
          <EditableSlot key={id} id={id} layout={layout}>
            {sections[id]}
          </EditableSlot>
        ))}
      </SortableColumn>
    ) : (
      <div className="flex min-w-0 flex-col gap-6">
        {visible(col).map((id) => (
          <Fragment key={id}>{sections[id]}</Fragment>
        ))}
      </div>
    );

  // 5.21.1 : glisser-déposer (dnd-kit : souris, tactile après un appui long, clavier).
  const findCol = (l: DashboardLayout, id: string): DashboardColumn | null => (l.main.includes(id as DashboardSection) ? "main" : l.side.includes(id as DashboardSection) ? "side" : id === "col-main" ? "main" : id === "col-side" ? "side" : null);
  const onDragOver = (e: DragOverEvent) => {
    if (!e.over) return;
    const cur = draft ?? layout;
    const from = findCol(cur, String(e.active.id));
    const to = findCol(cur, String(e.over.id));
    if (!from || !to || from === to) return;
    const overId = String(e.over.id).startsWith("col-") ? null : (e.over.id as DashboardSection);
    setDraft(dropSection(cur, e.active.id as DashboardSection, to, overId));
  };
  const onDragEnd = (e: DragEndEvent) => {
    const cur = draft ?? layout;
    setDraft(null);
    if (!e.over) return;
    const col = findCol(cur, String(e.active.id));
    if (!col) return;
    const list = cur[col];
    const from = list.indexOf(e.active.id as DashboardSection);
    const to = String(e.over.id).startsWith("col-") ? list.length - 1 : list.indexOf(e.over.id as DashboardSection);
    setDashboardLayout(from >= 0 && to >= 0 && from !== to ? { ...cur, [col]: arrayMove(list, from, to) } : cur);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Cosmic Empires / Commandement"
        title={`Bienvenue, ${player.pseudo}`}
        description={`Rang ${getRankLabel(player.xp)} — ${formatNumber(player.xp)} XP`}
        right={
          <Button variant={editing ? "primary" : "ghost"} size="sm" onClick={() => setEditing((e) => !e)}>
            {editing ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />}
            {editing ? "Terminer" : "Personnaliser"}
          </Button>
        }
      />
      <QueueStrip queues={queues} now={now} />

      <OnboardingChecklist player={player} />
      <CommanderGuideCard player={player} />
      <StoryDialog player={player} />
      {/* 6.0 : rappel tant qu'aucune classe d'empire n'est choisie (premier choix gratuit). */}
      {!player.empireClass && !player.npc && (
        <HudCallout tone="gold" className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <Compass className="h-4 w-4 shrink-0 text-gold-glow" />
          <span className="min-w-0 flex-1">
            <strong className="text-slate-100">Choisis ta classe d'empire</strong> : Industriel, Seigneur de guerre ou Explorateur. Premier choix gratuit.
          </span>
          <Button asChild size="sm" variant="outline">
            <Link to="/game/classe">Choisir</Link>
          </Button>
        </HudCallout>
      )}

      {editing && (
        <HudCallout tone="accent" className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
          <span className="flex-1">
            Glisse une carte par sa poignée pour la déplacer, dans sa colonne ou dans l'autre (appui long sur écran tactile, ou Espace puis flèches au clavier). Mémorisé sur cet appareil.
          </span>
          <Button variant="ghost" size="sm" onClick={() => setDashboardLayout(defaultLayout())}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Disposition par défaut
          </Button>
        </HudCallout>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={() => setDraft(layout)} onDragOver={onDragOver} onDragEnd={onDragEnd} onDragCancel={() => setDraft(null)}>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          {column("main")}
          {column("side")}
        </div>
      </DndContext>

      {editing && layout.hidden.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="hud-eyebrow text-[10px] text-slate-500">Cartes masquées</span>
          {layout.hidden.map((id) => (
            <Button key={id} variant="outline" size="sm" onClick={() => setDashboardLayout(toggleSection(layout, id))}>
              <Eye className="mr-1.5 h-3.5 w-3.5" /> {sectionLabel(id)}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

const sectionLabel = (id: DashboardSection) => DASHBOARD_SECTIONS.find((s) => s.id === id)?.label ?? id;

/** Colonne déposable (accepte une carte même vide). */
function SortableColumn({ col, ids, children }: { col: DashboardColumn; ids: DashboardSection[]; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${col}` });
  return (
    <SortableContext id={`col-${col}`} items={ids} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} className={cn("flex min-h-32 min-w-0 flex-col gap-6 border border-dashed p-2 transition-colors", isOver ? "border-cyan-glow/50" : "border-white/10")}>
        {children}
      </div>
    </SortableContext>
  );
}

/** Carte en mode personnalisation : poignée glissable, flèches, changement de colonne, masquer. */
function EditableSlot({ id, layout, children }: { id: DashboardSection; layout: DashboardLayout; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const col = columnOf(layout, id);
  const list = layout[col];
  const i = list.indexOf(id);
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative border border-cyan-glow/20 bg-space-900/60", isDragging && "z-20 border-cyan-glow/70 shadow-[0_0_24px_var(--color-cyan-glow)] opacity-90")}
    >
      <div className="flex items-center gap-2 border-b border-cyan-glow/15 px-2 py-1.5">
        <button ref={setActivatorNodeRef} type="button" {...attributes} {...listeners} title="Glisser pour déplacer" className="cursor-grab touch-none p-1 text-cyan-glow active:cursor-grabbing">
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>
        <span className="flex-1 truncate font-display text-xs font-semibold uppercase tracking-[0.1em] text-slate-200">{sectionLabel(id)}</span>
        <button type="button" title="Monter" disabled={i <= 0} className="p-1 text-slate-400 hover:text-cyan-glow disabled:opacity-30" onClick={() => setDashboardLayout(moveSection(layout, id, -1))}>
          <ArrowUp className="h-4 w-4" />
        </button>
        <button type="button" title="Descendre" disabled={i >= list.length - 1} className="p-1 text-slate-400 hover:text-cyan-glow disabled:opacity-30" onClick={() => setDashboardLayout(moveSection(layout, id, 1))}>
          <ArrowDown className="h-4 w-4" />
        </button>
        <button type="button" title={col === "main" ? "Passer dans la colonne latérale" : "Passer dans la colonne principale"} className="p-1 text-slate-400 hover:text-cyan-glow" onClick={() => setDashboardLayout(switchColumn(layout, id))}>
          <Columns2 className="h-4 w-4" />
        </button>
        <button type="button" title="Masquer" className="p-1 text-slate-400 hover:text-cyan-glow" onClick={() => setDashboardLayout(toggleSection(layout, id))}>
          <EyeOff className="h-4 w-4" />
        </button>
      </div>
      {/* Aperçu réduit et inerte : la carte se déplace d'un bloc. */}
      <div className="pointer-events-none max-h-56 overflow-hidden p-2 opacity-70 empty:p-3 empty:before:text-xs empty:before:text-slate-500 empty:before:content-['Rien_à_afficher_pour_le_moment']">{children}</div>
    </div>
  );
}
