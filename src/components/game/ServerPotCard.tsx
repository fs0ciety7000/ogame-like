import { Coins } from "lucide-react";
import { ResourceIcon } from "@/components/ui/game-icon";
import { AmberAmount } from "@/components/ui/amber";
import { RESOURCE_LIST } from "@/game/resources";
import { formatCompact } from "@/lib/utils";
import { useServerPot } from "@/services/serverPotService";
import type { ResourceId } from "@/types/game";

/** v5.10 : solde du pot commun « Serveur », visible des joueurs (Commerce). Ambre comprise (5.26). */
export function ServerPotCard() {
  const pot = useServerPot();
  if (!pot) return null;
  const list = RESOURCE_LIST.map((r) => [r.id, pot.resources[r.id] ?? 0] as [ResourceId, number]).filter(([, v]) => v > 0);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border border-gold-glow/25 bg-gold-glow/[0.04] px-3 py-2 text-xs text-slate-300">
      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-gold-glow">
        <Coins className="h-3.5 w-3.5" /> Pot commun du serveur
      </span>
      {list.length === 0 && !(pot.amber > 0) ? (
        <span className="text-slate-500">vide pour l'instant</span>
      ) : (
        list.map(([id, v]) => (
          <span key={id} className="inline-flex items-center gap-1 font-mono tabular-nums">
            <ResourceIcon id={id} /> {formatCompact(v)}
          </span>
        ))
      )}
      {pot.amber > 0 && <AmberAmount value={pot.amber} label={false} className="font-mono tabular-nums" />}
      <span className="basis-full text-[11px] text-slate-500 sm:ml-auto sm:basis-auto">Taxes du marché, des enchères, des cadeaux et du comptoir : réservé aux concours et récompenses collectives.</span>
    </div>
  );
}
