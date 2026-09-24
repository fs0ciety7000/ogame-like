import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/layout/PageHeader";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { checkPrereqs, findTech, getTechCost, getTechTime, MAX_CONCURRENT_RESEARCH, TECHNOLOGIES } from "@/game/technologies";
import { cn, formatDuration } from "@/lib/utils";
import { resourceEmoji } from "@/game/resources";
import { GameActionError, startResearch } from "@/services/playerService";
import { TechTree } from "@/components/game/TechTree";

export function LabPage() {
  useNowTicker();
  const player = usePlayerStore((s) => s.player);
  const queues = usePlayerStore((s) => s.queues);
  const uid = useAuthStore((s) => s.user?.uid);
  const [selectedId, setSelectedId] = useState<string>(TECHNOLOGIES[0].id);
  const [pending, setPending] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

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
                  </>
                );
              })()}
            </div>
          ) : (
            <>
              <div className="mt-4 space-y-1 text-sm">
                <p className="text-slate-400">
                  Niveau actuel : {currentLevel} → {currentLevel + 1}
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(getTechCost(selected, currentLevel + 1)).map(([res, val]) => (
                    <span key={res} className="rounded bg-space-800 px-2 py-1 text-xs text-slate-300">
                      {resourceEmoji(res)} {val}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-500">Temps : {formatDuration(getTechTime(selected, currentLevel + 1))}</p>
              </div>

              {(() => {
                const check = checkPrereqs(selected, levels);
                if (check.list.length > 0) {
                  return (
                    <div className="mt-3 rounded-lg border-l-2 border-cyan-glow/40 bg-black/20 p-3 text-xs">
                      <p className="mb-1 font-semibold uppercase tracking-wide text-cyan-glow">Prérequis</p>
                      {check.list.map((r) => (
                        <p key={r.id} className={r.valide ? "text-mint-glow" : "text-danger-glow"}>
                          {r.valide ? "✅" : "❌"} {r.nom} (Niv. {r.actuel} / {r.requis})
                        </p>
                      ))}
                    </div>
                  );
                }
                return <p className="mt-3 text-xs text-mint-glow">✅ Aucun prérequis</p>;
              })()}

              <Button
                className="mt-4 w-full"
                disabled={
                  pending ||
                  !checkPrereqs(selected, levels).valid ||
                  (queues.activeResearches.length >= MAX_CONCURRENT_RESEARCH && !activeEntry)
                }
                onClick={() => void handleLaunch()}
              >
                {queues.activeResearches.length >= MAX_CONCURRENT_RESEARCH
                  ? "File de recherche pleine"
                  : "Lancer la recherche"}
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
