import { CircleCheck, CircleX, List, Network } from "lucide-react";
import { playerResearchTimeFactor, researchTimeBreakdown } from "@/game/bonuses";
import { AmberAmount } from "@/components/ui/amber";
import { CancelJobButton } from "@/components/game/CancelJobButton";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/layout/PageHeader";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { checkPrereqs, findTech, getTechAmberCost, getTechCost, getTechTime, RESEARCH_RULES, TECHNOLOGIES } from "@/game/technologies";
import { cn, formatDuration, formatNumber } from "@/lib/utils";
import { bountyState } from "@/game/bounties";
import { GameActionError, startResearch } from "@/services/playerService";
import { TechTree } from "@/components/game/TechTree";
import { TechEffectsSummary, TechList } from "@/components/game/TechList";
import { AffordReason, BlockedReason, CostPills, secondsToAfford } from "@/components/ui/afford";
import { CostPill, HudChip, LevelTicks } from "@/components/ui/hud";
import { useProductionRates } from "@/hooks/useLiveResources";
import type { ResourceId } from "@/types/game";
import { ownedBlueprints } from "@/game/units";

/* 6.14.162 (NJ-3, lot S2) : vue liste par défaut sous 768 px (l'arbre y est illisible), arbre au-delà ; le choix est gardé par appareil. */
const VIEW_KEY = "cosmic-empires:labo-vue";
type LabView = "list" | "tree";
function readLabView(): LabView {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    if (v === "list" || v === "tree") return v;
  } catch {
    /* stockage indisponible : vue par défaut */
  }
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(max-width: 767px)").matches ? "list" : "tree";
}

export function LabPage() {
  useNowTicker();
  const player = usePlayerStore((s) => s.player);
  const queues = usePlayerStore((s) => s.queues);
  const uid = useAuthStore((s) => s.user?.uid);
  // 6.14.161 (NJ-8) : `?tech=<id>` (lien « Lancer la recherche → » d'une unité verrouillée) sélectionne et centre cette techno.
  const [params] = useSearchParams();
  const asked = params.get("tech");
  const focusTech = asked && findTech(asked) ? asked : null;
  const [selectedId, setSelectedId] = useState<string>(() => focusTech ?? TECHNOLOGIES[0].id);
  useEffect(() => {
    if (focusTech) setSelectedId(focusTech);
  }, [focusTech]);
  const [pending, setPending] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [view, setView] = useState<LabView>(readLabView);
  const chooseView = (v: LabView) => {
    setView(v);
    setFullscreen(false);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* stockage indisponible : choix gardé pour la session */
    }
  };
  const rates = useProductionRates(player);

  // Plein écran de l'arbre : Échap pour sortir, et la page derrière ne
  // défile plus tant que la surcouche est ouverte.
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFullscreen(false);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [fullscreen]);

  if (!player || !queues) return null;

  const now = Date.now();
  const levels = player.techLevels;
  const plans = ownedBlueprints(player);
  const selected = findTech(selectedId)!;
  // v5.9 : ambre demandé par niveau (en plus des ressources).
  const amberCost = selected ? getTechAmberCost(selected) : 0;
  const amberLack = amberCost - bountyState(player).amber;
  const activeEntry = queues.activeResearches.find((r) => r.id === selectedId);
  const currentLevel = levels[selectedId] ?? 0;

  const launch = async (id: string) => {
    if (!uid) return;
    setPending(id);
    try {
      await startResearch(uid, id);
      toast.success(`Recherche lancée : ${findTech(id)?.nom ?? id}`);
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Action impossible.");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Cosmic Empires / R&D"
        title="Laboratoire"
        description="Fais progresser tes technologies."
        right={
          <span className="tabular-mono text-xs text-slate-400">
            File {queues.activeResearches.length} / {RESEARCH_RULES.maxConcurrent}
          </span>
        }
      />

      <div className="flex justify-end gap-1" role="group" aria-label="Affichage du Labo">
        <HudChip asChild size="sm" tone={view === "list" ? "accent" : "neutral"}>
          <button type="button" aria-pressed={view === "list"} onClick={() => chooseView("list")}>
            <List className="h-3.5 w-3.5" aria-hidden /> Liste
          </button>
        </HudChip>
        <HudChip asChild size="sm" tone={view === "tree" ? "accent" : "neutral"}>
          <button type="button" aria-pressed={view === "tree"} onClick={() => chooseView("tree")}>
            <Network className="h-3.5 w-3.5" aria-hidden /> Arbre
          </button>
        </HudChip>
      </div>

      {view === "list" ? (
        <TechList
          player={player}
          levels={levels}
          plans={plans}
          activeResearches={queues.activeResearches}
          rates={rates}
          focusId={focusTech}
          pendingId={pending}
          onLaunch={(id) => void launch(id)}
          onOpen={setSelectedId}
        />
      ) : (
      // L'arbre prend toute la largeur ; sur grand écran, le panneau de détails flotte en haut à droite, sur la zone laissée
      // vide par l'agencement (Économie/Logistique n'occupent que les premiers paliers).
      <div className={cn("relative flex flex-col gap-4", fullscreen && "fixed inset-0 z-50 bg-space-950/95 p-4 backdrop-blur")}>
        <TechTree
          // Remonté à chaque bascule pour recadrer l'arbre (fitView) sur la nouvelle taille.
          key={fullscreen ? "full" : "inline"}
          levels={levels}
          ownedPlans={plans}
          selectedId={selectedId}
          initialFocus={focusTech}
          activeIds={new Set(queues.activeResearches.map((r) => r.id))}
          onSelect={setSelectedId}
          fullscreen={fullscreen}
          onToggleFullscreen={() => setFullscreen((v) => !v)}
        />

        <Card
          className={cn(
            "h-fit p-4 lg:!absolute lg:right-4 lg:top-4 lg:z-10 lg:w-[340px] lg:bg-space-800/90 lg:backdrop-blur",
            fullscreen && "max-h-[40vh] shrink-0 overflow-auto lg:right-8 lg:top-8 lg:max-h-[calc(100vh-4rem)]",
          )}
        >
          <h2 className="font-display text-base text-slate-100">{selected.nom}</h2>
          <p className="mt-1 text-sm text-slate-400">{selected.desc}</p>
          <TechEffectsSummary tech={selected} level={currentLevel} />

          {currentLevel >= selected.maxLevel ? (
            <p className="mt-4 text-sm text-mint-glow">Niveau maximum atteint.</p>
          ) : activeEntry ? (
            <div className="mt-4">
              {(() => {
                const nextLevel = currentLevel + 1;
                const totalTime = getTechTime(selected, nextLevel);
                const remaining = Math.max(0, Math.floor((activeEntry.endTime - now) / 1000));
                const percent = ((totalTime - remaining) / totalTime) * 100;
                return (
                  <>
                    <Progress value={percent} />
                    <p className="mt-2 text-center text-xs text-slate-400">
                      Temps restant : {formatDuration(remaining)}
                    </p>
                    <div className="mt-2 flex justify-center">
                      <CancelJobButton target={{ kind: "research", id: selected.id }} />
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <>
              <div className="mt-4 space-y-2 text-sm">
                <p className="flex items-baseline justify-between text-slate-400">
                  <span>
                    Niveau {currentLevel} → <b className="text-slate-100">{currentLevel + 1}</b>
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {currentLevel} / {selected.maxLevel}
                  </span>
                </p>
                <LevelTicks level={currentLevel} max={selected.maxLevel} />
                <CostPills
                  cost={getTechCost(selected, currentLevel + 1) as Partial<Record<ResourceId, number>>}
                  stock={player.resources}
                  seconds={Math.round(getTechTime(selected, currentLevel + 1) * playerResearchTimeFactor(player, Date.now()))}
                  timeFactors={researchTimeBreakdown(player, Date.now())}
                />
                {amberCost > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <CostPill ok={amberLack <= 0} missing={amberLack > 0 ? `manque ${formatNumber(amberLack)}` : undefined}>
                      <AmberAmount value={amberCost} />
                    </CostPill>
                  </div>
                )}
              </div>

              {(() => {
                const check = checkPrereqs(selected, levels, plans);
                if (check.list.length > 0) {
                  return (
                    <div className="hud-callout hud-tone-accent mt-3 p-3 text-xs">
                      <p className="mb-1 font-semibold font-mono uppercase tracking-wide text-cyan-glow">Prérequis</p>
                      {check.list.map((r) => (
                        <p key={r.id} className={r.valide ? "text-mint-glow" : "text-danger-glow"}>
                          {r.valide ? <CircleCheck aria-label="acquis" className="mr-1 inline h-3.5 w-3.5" /> : <CircleX aria-label="manquant" className="mr-1 inline h-3.5 w-3.5" />}
                          {r.nom}{" "}
                          {r.kind === "plan" ? (r.valide ? "(acquis)" : "(à acheter au Comptoir Kesh'Vaar)") : `(Niv. ${r.actuel} / ${r.requis})`}
                        </p>
                      ))}
                    </div>
                  );
                }
                return (
                  <p className="mt-3 flex items-center gap-1 text-xs text-mint-glow">
                    <CircleCheck aria-hidden className="h-3.5 w-3.5" /> Aucun prérequis
                  </p>
                );
              })()}

              {(() => {
                const prereqOk = checkPrereqs(selected, levels, plans).valid;
                const queueFull = queues.activeResearches.length >= RESEARCH_RULES.maxConcurrent && !activeEntry;
                const wait = secondsToAfford(getTechCost(selected, currentLevel + 1) as Partial<Record<ResourceId, number>>, player.resources, rates);
                return (
                  <>
                    <Button className="mt-4 w-full" disabled={pending !== null || !prereqOk || queueFull || wait > 0 || amberLack > 0} onClick={() => void launch(selectedId)}>
                      {queueFull ? "File de recherche pleine" : "Lancer la recherche"}
                    </Button>
                    {!prereqOk ? (
                      <BlockedReason tone="block">Prérequis manquants (voir ci-dessus).</BlockedReason>
                    ) : queueFull ? (
                      <BlockedReason tone="block">
                        {RESEARCH_RULES.maxConcurrent} recherches en cours au plus : attends la fin de l'une d'elles.
                      </BlockedReason>
                    ) : amberLack > 0 ? (
                      <BlockedReason tone="block">Il te manque <AmberAmount value={amberLack} /> : gagne-le en remplissant des primes Kesh'Vaar.</BlockedReason>
                    ) : wait > 0 ? (
                      <AffordReason seconds={wait} />
                    ) : null}
                  </>
                );
              })()}
            </>
          )}
        </Card>
      </div>
      )}
    </div>
  );
}
