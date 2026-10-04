import { playerResearchTimeFactor } from "@/game/bonuses";
import { CancelJobButton } from "@/components/game/CancelJobButton";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/layout/PageHeader";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { buildingsUnlockedByTech, checkPrereqs, describeTechEffect, findTech, getTechCost, getTechTime, MAX_CONCURRENT_RESEARCH, TECHNOLOGIES, techEffects, type TechDef } from "@/game/technologies";
import { cn, formatDuration } from "@/lib/utils";
import { GameActionError, startResearch } from "@/services/playerService";
import { TechTree } from "@/components/game/TechTree";
import { affordText, BlockedReason, CostPills, secondsToAfford } from "@/components/ui/afford";
import { LevelTicks } from "@/components/ui/hud";
import { useProductionRates } from "@/hooks/useLiveResources";
import type { ResourceId } from "@/types/game";
import { BUILDINGS, findBuilding } from "@/game/buildings";
import { findUnit, ownedBlueprints } from "@/game/units";
import { RESOURCE_LIST } from "@/game/resources";

export function LabPage() {
  useNowTicker();
  const player = usePlayerStore((s) => s.player);
  const queues = usePlayerStore((s) => s.queues);
  const uid = useAuthStore((s) => s.user?.uid);
  const [selectedId, setSelectedId] = useState<string>(TECHNOLOGIES[0].id);
  const [pending, setPending] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
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
  const activeEntry = queues.activeResearches.find((r) => r.id === selectedId);
  const currentLevel = levels[selectedId] ?? 0;

  const handleLaunch = async () => {
    if (!uid) return;
    setPending(true);
    try {
      await startResearch(uid, selectedId);
      toast.success(`Recherche lancée : ${selected.nom}`);
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Action impossible.");
    } finally {
      setPending(false);
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
            File {queues.activeResearches.length} / {MAX_CONCURRENT_RESEARCH}
          </span>
        }
      />

      {/* L'arbre prend toute la largeur ; sur grand écran, le panneau de
          détails flotte en haut à droite, sur la zone laissée vide par
          l'agencement (Économie/Logistique n'occupent que les premiers paliers). */}
      <div className={cn("relative flex flex-col gap-4", fullscreen && "fixed inset-0 z-50 bg-space-950/95 p-4 backdrop-blur")}>
        <TechTree
          // Remonté à chaque bascule pour recadrer l'arbre (fitView) sur la nouvelle taille.
          key={fullscreen ? "full" : "inline"}
          levels={levels}
          ownedPlans={plans}
          selectedId={selectedId}
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
          <h2 className="font-display text-base text-white">{selected.nom}</h2>
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
                    Niveau {currentLevel} → <b className="text-white">{currentLevel + 1}</b>
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
                />
              </div>

              {(() => {
                const check = checkPrereqs(selected, levels, plans);
                if (check.list.length > 0) {
                  return (
                    <div className="mt-3 rounded-lg border-l-2 border-cyan-glow/40 bg-black/20 p-3 text-xs">
                      <p className="mb-1 font-semibold uppercase tracking-wide text-cyan-glow">Prérequis</p>
                      {check.list.map((r) => (
                        <p key={r.id} className={r.valide ? "text-mint-glow" : "text-danger-glow"}>
                          {r.valide ? "✅" : "❌"} {r.nom}{" "}
                          {r.kind === "plan" ? (r.valide ? "(acquis)" : "(à acheter au Comptoir Kesh'Vaar)") : `(Niv. ${r.actuel} / ${r.requis})`}
                        </p>
                      ))}
                    </div>
                  );
                }
                return <p className="mt-3 text-xs text-mint-glow">✅ Aucun prérequis</p>;
              })()}

              {(() => {
                const prereqOk = checkPrereqs(selected, levels, plans).valid;
                const queueFull = queues.activeResearches.length >= MAX_CONCURRENT_RESEARCH && !activeEntry;
                const wait = secondsToAfford(getTechCost(selected, currentLevel + 1) as Partial<Record<ResourceId, number>>, player.resources, rates);
                return (
                  <>
                    <Button className="mt-4 w-full" disabled={pending || !prereqOk || queueFull || wait > 0} onClick={() => void handleLaunch()}>
                      {queueFull ? "File de recherche pleine" : "Lancer la recherche"}
                    </Button>
                    {!prereqOk ? (
                      <BlockedReason tone="block">Prérequis manquants (voir ci-dessus).</BlockedReason>
                    ) : queueFull ? (
                      <BlockedReason tone="block">
                        {MAX_CONCURRENT_RESEARCH} recherches en cours au plus : attends la fin de l'une d'elles.
                      </BlockedReason>
                    ) : wait > 0 ? (
                      <BlockedReason>{affordText(wait)}</BlockedReason>
                    ) : null}
                  </>
                );
              })()}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

/** Effets de la techno : valeur actuelle et au niveau suivant (v2.6). */
function TechEffectsSummary({ tech, level }: { tech: TechDef; level: number }) {
  const effects = techEffects(tech)
    .filter((e) => e.type !== "unlock_defense_units" && e.type !== "unlock_attack_units")
    .map((e) => (e.type === "unlock_buildings" || e.type === "unlock_hangars" ? { ...e, targets: buildingsUnlockedByTech(tech.id, BUILDINGS) } : e));
  if (effects.length === 0) return null;
  const names = {
    resource: (id: string) => RESOURCE_LIST.find((r) => r.id === id)?.name.toLowerCase() ?? id,
    unit: (id: string) => findUnit(id)?.name ?? id,
    building: (id: string) => findBuilding(id)?.name ?? id,
  };
  const next = Math.min(tech.maxLevel, level + 1);
  return (
    <ul className="mt-3 space-y-1.5 border-l-2 border-cyan-glow/40 bg-cyan-glow/[0.04] px-3 py-2 text-xs">
      {effects.map((e, i) => (
        <li key={i}>
          {level > 0 && <p className="text-slate-200">{describeTechEffect(e, level, names)}</p>}
          {level < tech.maxLevel && (
            <p className="text-mint-glow">
              <span className="text-slate-500">Niv. {next} :</span> {describeTechEffect(e, next, names)}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
