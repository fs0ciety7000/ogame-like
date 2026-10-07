import { useState } from "react";
import { toast } from "sonner";
import { Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CostPill } from "@/components/ui/hud";
import { askConfirm } from "@/components/ui/confirm-dialog";
import { MOON_RULES, moonLevel, moonShield, moonUpgradeCost, type MoonState } from "@/game/moon";
import { RESOURCE_LIST } from "@/game/resources";
import { formatCompact } from "@/lib/utils";
import { GameActionError, upgradeMoon } from "@/services/playerService";
import type { PlayerState, ResourceId } from "@/types/game";

/* 6.13.0 : la lune dans la carte Planète mère ; 6.14.0 : son amélioration (proposals/lunes.md §8). */

const resName = (id: string) => RESOURCE_LIST.find((r) => r.id === id)?.name ?? id;

export function MoonLine({ moon, player }: { moon: MoonState; player: PlayerState }) {
  const [busy, setBusy] = useState(false);
  const level = moonLevel(moon);
  const atMax = level >= MOON_RULES.maxLevel;
  const cost = moonUpgradeCost(level);
  const affordable = Object.entries(cost).every(([r, n]) => (player.resources[r as ResourceId] ?? 0) >= n);
  const pct = (v: number) => `${Math.round(v * 100)} %`;

  const upgrade = async () => {
    const ok = await askConfirm({
      title: `Améliorer ${moon.name} ?`,
      message: `Niveau ${level + 1} : bouclier ${pct(moonShield({ level: level + 1 }))} au lieu de ${pct(moonShield(moon))}.`,
      details: (
        <span className="flex flex-wrap gap-1.5">
          {Object.entries(cost).map(([r, n]) => (
            <CostPill key={r}>
              {formatCompact(n)} {resName(r)}
            </CostPill>
          ))}
        </span>
      ),
      confirmLabel: "Améliorer",
      tone: "gold",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await upgradeMoon();
      toast.success(`${moon.name} passe au niveau ${level + 1}.`);
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Amélioration impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400" title={`Née d'un combat de ${formatCompact(moon.fromDebris)} débris.`}>
      <span>
        <Moon className="mr-1 inline h-3 w-3 align-[-2px] text-violet-glow" />
        Lune <span className="text-violet-glow">{moon.name}</span> <span className="font-mono tabular-nums">niv. {level}</span> : bouclier{" "}
        <span className="font-mono tabular-nums">+{pct(moonShield(moon))}</span>, entrepôt à l'abri <span className="font-mono tabular-nums">+{pct(MOON_RULES.protectedStorageBonus)}</span>
      </span>
      {/* 6.14.68 (UX-7) : raison visible (le title ne s'affiche pas au toucher). */}
      {!atMax && !affordable && <span className="text-[11px] text-ember-glow">ressources insuffisantes</span>}
      {!atMax && (
        <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" disabled={busy || !affordable} onClick={() => void upgrade()} title={affordable ? undefined : "Ressources insuffisantes"}>
          Améliorer
        </Button>
      )}
    </div>
  );
}
