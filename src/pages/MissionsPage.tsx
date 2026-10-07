import { useState } from "react";
import { SortableGrid, SortableGridToggle } from "@/components/ui/sortable-grid";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/layout/PageHeader";
import { BountiesTeaser } from "@/components/game/BountiesTeaser";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { hasPrerequisites, MISSIONS } from "@/game/missions";
import { findUnit } from "@/game/units";
import { missionRewards } from "@/game/economy";
import { ContractsCard } from "@/components/game/ContractsCard";
import { ExpeditionCard } from "@/components/game/ExpeditionCard";
import { XpTiersCard } from "@/components/game/XpTiersCard";
import { cn, formatClock, formatDuration, formatNumber } from "@/lib/utils";
import { GameActionError, startMission } from "@/services/playerService";
import { triggerWarpEffect } from "@/store/warpEffectStore";
import { GameIcon, ResourceIcon } from "@/components/ui/game-icon";
import type { GameIconName } from "@/lib/icons";

export function MissionsPage() {
  useNowTicker();
  const player = usePlayerStore((s) => s.player);
  const queues = usePlayerStore((s) => s.queues);
  const uid = useAuthStore((s) => s.user?.uid);
  const [pending, setPending] = useState<string | null>(null);
  const [editingCards, setEditingCards] = useState(false);

  if (!player || !queues) return null;

  const now = Date.now();

  const handleStart = async (key: string) => {
    if (!uid) return;
    setPending(key);
    try {
      await startMission(uid, key);
      triggerWarpEffect();
      toast.success("Mission lancée !");
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Action impossible.");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Cosmic Empires / Opérations" title="Missions" description="Envoie ta flotte en exploration ou en patrouille." />
      {/* 6.14.67 (UX-6, AD-10) : la grille des missions d'abord ; contrats, primes et expéditions
          dessous, les paliers d'XP repliés en bas. */}
      <div className="flex justify-end">
        <SortableGridToggle page="missions" editing={editingCards} onToggle={() => setEditingCards((e) => !e)} />
      </div>

      <SortableGrid page="missions" editing={editingCards} className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3" items={Object.values(MISSIONS)} getId={(mission) => mission.key} getLabel={(mission) => mission.name} render={(mission, index) => {
          const active = queues.activeMissions.find((m) => m.key === mission.key);
          const hasReq = hasPrerequisites(mission, player.units);
          const prereqEntries = Object.entries(mission.prereq);
          const rewards = missionRewards(mission, player);

          return (
            <Card key={mission.key} className="hud-glitch flex flex-col gap-3 p-3.5 sm:p-4">
              <div className="relative grid grid-cols-[auto_1fr] items-start gap-3.5">
                <div
                  className={cn(
                    "grid h-14 w-12 place-items-center [clip-path:polygon(50%_0,100%_25%,100%_75%,50%_100%,0_75%,0_25%)]",
                    active ? "bg-gradient-to-b from-mint-glow/40 to-mint-glow/5" : hasReq ? "bg-gradient-to-b from-cyan-glow/40 to-cyan-glow/5" : "bg-white/[0.06] grayscale",
                  )}
                >
                  <GameIcon name={missionIcon(mission.key, rewards)} className="h-9 w-9 drop-shadow-[0_2px_4px_color-mix(in_srgb,var(--color-space-950)_60%,transparent)]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="hud-title text-[17px] text-slate-100">{mission.name}</h3>
                    {active ? (
                      <span className="shrink-0 font-mono text-[11px] tracking-[0.1em] text-mint-glow">● {formatClock(Math.max(0, Math.floor((active.endTime - now) / 1000)))}</span>
                    ) : (
                      <span className="shrink-0 font-mono text-[11px] tracking-[0.1em] text-slate-500"><GameIcon name="duration" /> {formatDuration(mission.duration)}</span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {prereqEntries.map(([id, count]) => {
                      const owned = player.units[id]?.count ?? 0;
                      const ok = owned >= count;
                      return (
                        <span
                          key={id}
                          className={cn(
                            "border px-2 py-0.5 text-xs",
                            ok ? "border-mint-glow/35 bg-mint-glow/[0.06] text-mint-glow" : "border-danger-glow/40 bg-danger-glow/[0.06] text-danger-glow",
                          )}
                        >
                          {ok ? "✓" : "✗"} {count} {findUnit(id)?.name ?? id}
                          {!ok && <span className="opacity-70"> ({owned}/{count})</span>}
                        </span>
                      );
                    })}
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    {(Object.entries(rewards) as [string, number][])
                      .filter(([k]) => k !== "xp")
                      .map(([res, amount]) => (
                        <span key={res} className="flex items-baseline gap-1">
                          <b className="hud-title text-xl text-slate-100">+{formatNumber(amount)}</b>
                          <ResourceIcon id={res} className="h-6 w-6 self-center" />
                        </span>
                      ))}
                    {rewards.xp ? <span className="font-mono text-xs text-gold-glow"><GameIcon name="xp" /> +{rewards.xp} XP</span> : null}
                  </div>
                </div>
              </div>

              {/* 6.11.7 (A3) : sur téléphone, pas de bouton désactivé sous une mission verrouillée (les prérequis ✗ le disent). */}
              <div className={cn("relative mt-auto", !active && !hasReq && "max-sm:hidden")}>
                {active ? (
                  <Progress value={100 - ((active.endTime - now) / (mission.duration * 1000)) * 100} />
                ) : (
                  <Button className="w-full" disabled={!hasReq || pending === mission.key} onClick={() => void handleStart(mission.key)}>
                    {hasReq ? "Lancer la mission" : "Prérequis non remplis"}
                  </Button>
                )}
              </div>
            </Card>
          );
        }} />

      <ContractsCard />
      <BountiesTeaser />
      <ExpeditionCard />
      <XpTiersCard player={player} fold />
    </div>
  );
}

/** Icône d'une mission : d'après sa récompense principale. */
function missionIcon(key: string, rewards: Record<string, number>): GameIconName {
  if (/patrouille|perimetr/.test(key)) return "patrol";
  if (/radar|bombard|siege|bastion|interception|suppression/.test(key)) return "shield";
  if (rewards.energy) return "energy";
  if (rewards.data) return "data";
  if (rewards.nano) return "nano";
  if (rewards.aiFragment) return "aiFragment";
  if (rewards.syntheticNanites) return "syntheticNanites";
  if (rewards.cyberModule) return "cyberModule";
  if (rewards.reinforcedSteel) return "reinforcedSteel";
  return "scrap";
}
