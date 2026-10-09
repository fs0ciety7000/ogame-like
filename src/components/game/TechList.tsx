import { useEffect, useMemo, useState } from "react";
import { BookOpen, CircleCheck, CircleX, FlaskConical, Hourglass, Lock, Trophy } from "lucide-react";
import { playerResearchTimeFactor, researchTimeBreakdown } from "@/game/bonuses";
import { bountyState } from "@/game/bounties";
import { BUILDINGS, findBuilding } from "@/game/buildings";
import { RESOURCE_LIST } from "@/game/resources";
import {
  buildingsUnlockedByTech,
  checkPrereqs,
  describeTechEffect,
  getTechAmberCost,
  getTechCost,
  getTechTime,
  RESEARCH_RULES,
  TECHNOLOGIES,
  techEffects,
  type TechDef,
} from "@/game/technologies";
import { findUnit } from "@/game/units";
import type { ActiveResearch, PlayerState, ResourceId } from "@/types/game";
import { AmberAmount } from "@/components/ui/amber";
import { AffordReason, BlockedReason, CostPills, secondsToAfford } from "@/components/ui/afford";
import { Button } from "@/components/ui/button";
import { CostPill, EmptyState, HudChip, HudTag, LevelTicks, StatTile } from "@/components/ui/hud";
import { FoldSection } from "@/components/ui/panel";
import { Progress } from "@/components/ui/progress";
import { CancelJobButton } from "@/components/game/CancelJobButton";
import { techCells, techFamily } from "@/components/game/techTreeLayout";
import { cn, formatDuration, formatNumber } from "@/lib/utils";

/* 6.14.162 (NJ-3, lot S2) : vue liste du Labo, par défaut sur téléphone. L'arbre est illisible à 375 px (nœuds de 5 px,
   colonne de départ coupée) : ici, une ligne par techno, rangées par état (ce qu'on peut lancer d'abord), avec coût, durée,
   effet en une phrase et le bouton « Rechercher » ou la raison du blocage. « Fiche » déplie la description, tous les effets
   et les prérequis. */

type RowState = "available" | "active" | "locked" | "maxed";

const EFFECT_NAMES = {
  resource: (id: string) => RESOURCE_LIST.find((r) => r.id === id)?.name.toLowerCase() ?? id,
  unit: (id: string) => findUnit(id)?.name ?? id,
  building: (id: string) => findBuilding(id)?.name ?? id,
};

/** Effets affichables d'une techno (les déblocages d'unités passent par les prérequis des unités, pas par la techno). */
function shownEffects(tech: TechDef) {
  return techEffects(tech)
    .filter((e) => e.type !== "unlock_defense_units" && e.type !== "unlock_attack_units")
    .map((e) => (e.type === "unlock_buildings" || e.type === "unlock_hangars" ? { ...e, targets: buildingsUnlockedByTech(tech.id, BUILDINGS) } : e));
}

/** Effet en une phrase : le premier effet chiffré au niveau visé (« +5 % de cargaison ») ; pour un déblocage (« Unité liée niveau 1 »,
 *  « 1 recette(s) débloquée(s) »), la description de la techno, plus parlante. */
function effectSentence(tech: TechDef, level: number): string {
  const effects = shownEffects(tech);
  if (effects.length === 0 || effects[0].type.startsWith("unlock_")) return tech.desc;
  const at = Math.max(1, Math.min(tech.maxLevel, level));
  const first = describeTechEffect(effects[0], at, EFFECT_NAMES);
  return effects.length > 1 ? `${first} (+${effects.length - 1} effet${effects.length > 2 ? "s" : ""})` : first;
}

/** Effets de la techno : valeur actuelle et au niveau suivant (v2.6). Partagé avec le panneau de l'arbre. */
export function TechEffectsSummary({ tech, level }: { tech: TechDef; level: number }) {
  const effects = shownEffects(tech);
  if (effects.length === 0) return null;
  const next = Math.min(tech.maxLevel, level + 1);
  return (
    <ul className="mt-3 space-y-1.5 border-l-2 border-cyan-glow/40 bg-cyan-glow/[0.04] px-3 py-2 text-xs">
      {effects.map((e, i) => (
        <li key={i}>
          {level > 0 && <p className="text-slate-200">{describeTechEffect(e, level, EFFECT_NAMES)}</p>}
          {level < tech.maxLevel && (
            <p className="text-mint-glow">
              <span className="text-slate-500">Niv. {next} :</span> {describeTechEffect(e, next, EFFECT_NAMES)}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Prérequis manquants en clair : « Analyse de matériaux niv. 2 (tu as 1) ». */
function missingPrereqs(tech: TechDef, levels: Record<string, number>, plans: readonly string[]): string {
  return checkPrereqs(tech, levels, plans)
    .list.filter((r) => !r.valide)
    .map((r) => (r.kind === "plan" ? `${r.nom} (Comptoir Kesh'Vaar)` : `${r.nom} niv. ${r.requis} (tu as ${r.actuel})`))
    .join(", ");
}

const STATE_EDGE: Record<RowState, string> = {
  available: "border-l-cyan-glow",
  active: "border-l-mint-glow",
  locked: "border-l-space-500 border-dashed",
  maxed: "border-l-mint-glow/60",
};

export function TechList({
  player,
  levels,
  plans,
  activeResearches,
  rates,
  focusId,
  pendingId,
  onLaunch,
  onOpen,
}: {
  player: PlayerState;
  levels: Record<string, number>;
  plans: readonly string[];
  activeResearches: ActiveResearch[];
  rates: Partial<Record<ResourceId, number>>;
  /** `?tech=<id>` : ligne ouverte et mise en avant à l'arrivée. */
  focusId: string | null;
  pendingId: string | null;
  onLaunch: (id: string) => void;
  /** Ligne dépliée : garde la même techno choisie si le joueur passe à l'arbre. */
  onOpen: (id: string) => void;
}) {
  const [openIds, setOpenIds] = useState<string[]>(() => (focusId ? [focusId] : []));
  const activeIds = new Set(activeResearches.map((r) => r.id));
  const queueFull = activeResearches.length >= RESEARCH_RULES.maxConcurrent;

  // Ordre de lecture de l'arbre : famille (Fondations, Économie…), puis palier, puis ligne.
  const sorted = useMemo(() => {
    const cells = techCells();
    return TECHNOLOGIES.map((tech) => ({ tech, family: techFamily(tech.id, cells) })).sort(
      (a, b) => a.family.order - b.family.order || a.family.col - b.family.col || a.family.row - b.family.row,
    );
    // TECHNOLOGIES change avec le contenu de l'admin : la longueur suffit à recalculer après un chargement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [TECHNOLOGIES.length]);

  const rows = sorted.map(({ tech, family }) => {
    const level = levels[tech.id] ?? 0;
    const state: RowState = level >= tech.maxLevel ? "maxed" : activeIds.has(tech.id) ? "active" : checkPrereqs(tech, levels, plans).valid ? "available" : "locked";
    return { tech, family: family.label, level, state };
  });
  const groups: Record<RowState, typeof rows> = { available: [], active: [], locked: [], maxed: [] };
  for (const r of rows) groups[r.state].push(r);
  // Verrouillées « à ta portée » : chaque prérequis manquant est une techno qu'on peut déjà lancer (ou en cours). Les autres, plus loin,
  // restent repliées (page de moins de 5 000 px sur téléphone, DESIGN.md) ; la techno demandée par `?tech=` déplie son groupe.
  const stateOf = new Map(rows.map((r) => [r.tech.id, r.state]));
  const isNear = (tech: TechDef) =>
    checkPrereqs(tech, levels, plans).list.every((p) => p.valide || (p.kind === "tech" && (stateOf.get(p.id) === "available" || stateOf.get(p.id) === "active")));
  const near = groups.locked.filter((r) => isNear(r.tech));
  const far = groups.locked.filter((r) => !isNear(r.tech));

  useEffect(() => {
    if (!focusId) return;
    // Après le rendu : la ligne demandée vient au centre de l'écran.
    const id = window.setTimeout(() => document.getElementById(`tech-row-${focusId}`)?.scrollIntoView({ block: "center" }), 60);
    return () => window.clearTimeout(id);
  }, [focusId]);

  const toggle = (id: string) => {
    setOpenIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
    onOpen(id);
  };

  const renderRow = (r: (typeof rows)[number]) => (
    <TechRow
      key={r.tech.id}
      tech={r.tech}
      family={r.family}
      level={r.level}
      state={r.state}
      player={player}
      levels={levels}
      plans={plans}
      active={activeResearches.find((a) => a.id === r.tech.id)}
      queueFull={queueFull}
      rates={rates}
      open={openIds.includes(r.tech.id)}
      focused={r.tech.id === focusId}
      pending={pendingId === r.tech.id}
      onToggle={() => toggle(r.tech.id)}
      onLaunch={() => onLaunch(r.tech.id)}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        <StatTile size="sm" tone="accent" label="À lancer" value={groups.available.length} />
        <StatTile size="sm" tone="mint" label="En cours" value={`${activeResearches.length}/${RESEARCH_RULES.maxConcurrent}`} />
        <StatTile size="sm" tone="neutral" label="Terminées" value={groups.maxed.length} />
      </div>

      {groups.active.length > 0 && (
        <FoldSection tone="mint" title={<><Hourglass aria-hidden /> En cours</>}>
          <ul className="flex flex-col gap-2">{groups.active.map(renderRow)}</ul>
        </FoldSection>
      )}

      <FoldSection tone="accent" title={<><FlaskConical aria-hidden /> Disponibles maintenant</>} aside={<span className="font-mono text-[11px] tabular-nums text-slate-500">{groups.available.length}</span>}>
        {groups.available.length > 0 ? (
          <ul className="flex flex-col gap-2">{groups.available.map(renderRow)}</ul>
        ) : (
          <EmptyState size="sm" icon={<FlaskConical />} title="Rien à lancer pour l'instant">
            {groups.locked.length > 0 ? "Termine les recherches en cours : elles ouvrent les suivantes." : "Toutes tes technologies sont au maximum."}
          </EmptyState>
        )}
      </FoldSection>

      {near.length > 0 && (
        <FoldSection tone="muted" title={<><Lock aria-hidden /> Verrouillées, à portée</>} aside={<span className="font-mono text-[11px] tabular-nums text-slate-500">{near.length}</span>}>
          <ul className="flex flex-col gap-2">{near.map(renderRow)}</ul>
        </FoldSection>
      )}

      {far.length > 0 && (
        <FoldSection
          tone="muted"
          defaultOpen={far.some((r) => r.tech.id === focusId)}
          title={<><Lock aria-hidden /> Plus loin</>}
          aside={<span className="font-mono text-[11px] tabular-nums text-slate-500">{far.length}</span>}
        >
          <ul className="flex flex-col gap-2">{far.map(renderRow)}</ul>
        </FoldSection>
      )}

      {groups.maxed.length > 0 && (
        <FoldSection
          tone="muted"
          defaultOpen={groups.maxed.some((r) => r.tech.id === focusId)}
          title={<><Trophy aria-hidden /> Terminées</>}
          aside={<span className="font-mono text-[11px] tabular-nums text-slate-500">{groups.maxed.length}</span>}
        >
          <ul className="flex flex-col gap-2">{groups.maxed.map(renderRow)}</ul>
        </FoldSection>
      )}
    </div>
  );
}

function TechRow({
  tech,
  family,
  level,
  state,
  player,
  levels,
  plans,
  active,
  queueFull,
  rates,
  open,
  focused,
  pending,
  onToggle,
  onLaunch,
}: {
  tech: TechDef;
  family: string;
  level: number;
  state: RowState;
  player: PlayerState;
  levels: Record<string, number>;
  plans: readonly string[];
  active: ActiveResearch | undefined;
  queueFull: boolean;
  rates: Partial<Record<ResourceId, number>>;
  open: boolean;
  focused: boolean;
  pending: boolean;
  onToggle: () => void;
  onLaunch: () => void;
}) {
  const next = level + 1;
  const cost = state === "maxed" ? {} : (getTechCost(tech, next) as Partial<Record<ResourceId, number>>);
  const amberCost = state === "maxed" ? 0 : getTechAmberCost(tech);
  const amberLack = amberCost - bountyState(player).amber;
  const wait = state === "available" ? secondsToAfford(cost, player.resources, rates) : 0;
  const now = Date.now();

  return (
    <li
      id={`tech-row-${tech.id}`}
      className={cn("glass-panel hud-cut-sm scroll-mt-24 border-l-2 p-3", STATE_EDGE[state], focused && "border-cyan-glow/70 bg-cyan-glow/[0.06]")}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={cn("flex min-w-0 items-center gap-1.5 font-display text-sm", state === "locked" ? "text-slate-300" : "text-slate-100")}>
          {state === "locked" && <Lock className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-label="Verrouillée" />}
          {tech.nom}
        </p>
        <span className="shrink-0 font-mono text-xs tabular-nums text-slate-400">
          Niv. <b className="text-slate-100">{level}</b> / {tech.maxLevel}
        </span>
      </div>

      <p className="mt-2 text-xs text-slate-300">
        {state !== "maxed" && <span className="text-slate-500">Niv. <span className="font-mono tabular-nums">{next}</span> : </span>}
        {effectSentence(tech, state === "maxed" ? level : next)}
      </p>

      {state === "active" && active ? (
        (() => {
          const total = getTechTime(tech, next);
          const remaining = Math.max(0, Math.floor((active.endTime - now) / 1000));
          return (
            <div className="mt-2">
              <Progress value={((total - remaining) / total) * 100} />
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs tabular-nums text-slate-400">{remaining > 0 ? `Reste ${formatDuration(remaining)}` : "Finalisation…"}</span>
                <CancelJobButton target={{ kind: "research", id: tech.id }} />
              </div>
            </div>
          );
        })()
      ) : state === "available" ? (
        <>
          <CostPills
            className="mt-2"
            cost={cost}
            stock={player.resources}
            seconds={Math.round(getTechTime(tech, next) * playerResearchTimeFactor(player, now))}
            timeFactors={researchTimeBreakdown(player, now)}
          />
          {amberCost > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <CostPill ok={amberLack <= 0} missing={amberLack > 0 ? `manque ${formatNumber(amberLack)}` : undefined}>
                <AmberAmount value={amberCost} />
              </CostPill>
            </div>
          )}
        </>
      ) : null}

      {/* Famille et état à gauche, actions à droite : une seule rangée. */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <HudTag>{family}</HudTag>
        {focused && (
          <HudChip size="sm" tone="accent">
            Demandée
          </HudChip>
        )}
        {state === "maxed" && (
          <HudChip size="sm" tone="mint">
            Max
          </HudChip>
        )}
        {state === "active" && (
          <HudChip size="sm" tone="mint" alert>
            En cours
          </HudChip>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <Button size="sm" variant="ghost" aria-expanded={open} aria-controls={`tech-sheet-${tech.id}`} aria-label={`Fiche : ${tech.nom}`} onClick={onToggle}>
            <BookOpen className="h-3.5 w-3.5" aria-hidden /> {open ? "Fermer" : "Fiche"}
          </Button>
          {state === "available" && (
            <Button size="sm" disabled={pending || queueFull || wait > 0 || amberLack > 0} onClick={onLaunch}>
              {queueFull ? "File pleine" : "Rechercher"}
            </Button>
          )}
        </div>
      </div>

      {state === "locked" ? (
        <BlockedReason tone="block">Il manque : {missingPrereqs(tech, levels, plans)}.</BlockedReason>
      ) : state === "available" ? (
        queueFull ? (
          <BlockedReason tone="block">{RESEARCH_RULES.maxConcurrent} recherches en cours au plus : attends la fin de l'une d'elles.</BlockedReason>
        ) : amberLack > 0 ? (
          <BlockedReason tone="block">
            Il te manque <AmberAmount value={amberLack} /> : gagne-le en remplissant des primes Kesh'Vaar.
          </BlockedReason>
        ) : (
          <AffordReason seconds={wait} />
        )
      ) : null}

      {open && (
        <div id={`tech-sheet-${tech.id}`} className="mt-3 border-t border-white/5 pt-3">
          {effectSentence(tech, state === "maxed" ? level : next) !== tech.desc && <p className="text-sm text-slate-400">{tech.desc}</p>}
          <LevelTicks className="mt-2" level={level} max={tech.maxLevel} next={state !== "maxed"} />
          {state === "locked" && (
            <CostPills
              className="mt-2"
              cost={cost}
              stock={player.resources}
              seconds={Math.round(getTechTime(tech, next) * playerResearchTimeFactor(player, now))}
              timeFactors={researchTimeBreakdown(player, now)}
            />
          )}
          <TechEffectsSummary tech={tech} level={level} />
          <PrereqList tech={tech} levels={levels} plans={plans} />
        </div>
      )}
    </li>
  );
}

function PrereqList({ tech, levels, plans }: { tech: TechDef; levels: Record<string, number>; plans: readonly string[] }) {
  const check = checkPrereqs(tech, levels, plans);
  if (check.list.length === 0)
    return (
      <p className="mt-3 flex items-center gap-1 text-xs text-mint-glow">
        <CircleCheck aria-hidden className="h-3.5 w-3.5" /> Aucun prérequis
      </p>
    );
  return (
    <div className="hud-callout hud-tone-accent mt-3 p-3 text-xs">
      <p className="mb-1 font-mono font-semibold uppercase tracking-wide text-cyan-glow">Prérequis</p>
      {check.list.map((r) => (
        <p key={r.id} className={r.valide ? "text-mint-glow" : "text-danger-glow"}>
          {r.valide ? <CircleCheck aria-label="acquis" className="mr-1 inline h-3.5 w-3.5" /> : <CircleX aria-label="manquant" className="mr-1 inline h-3.5 w-3.5" />}
          {r.nom} {r.kind === "plan" ? (r.valide ? "(acquis)" : "(à acheter au Comptoir Kesh'Vaar)") : <span className="font-mono tabular-nums">(Niv. {r.actuel} / {r.requis})</span>}
        </p>
      ))}
    </div>
  );
}
