import { Crown } from "lucide-react";
import { HudPanel } from "@/components/ui/panel";
import { EmptyState, HudChip } from "@/components/ui/hud";
import { AmberAmount } from "@/components/ui/amber";
import { PlayerName } from "@/components/ui/player-name";
import { topPatrons } from "@/game/patrons";
import { usePatrons } from "@/services/comptoirService";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

/* 5.27 : mécènes du mois (Ambre versée au pot commun) et podium du mois précédent. */

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const monthLabel = (key: string) => `${MONTHS[Number(key.slice(5, 7)) - 1] ?? ""} ${key.slice(0, 4)}`;
const RANK_TONE = ["gold", "accent", "violet"] as const;

export function PatronsBoard() {
  const state = usePatrons();
  const me = useAuthStore((s) => s.user?.uid);
  const top = topPatrons(state);
  return (
    <HudPanel icon={<Crown />} title={`Mécènes de ${monthLabel(state.month)}`} tone="gold">
      {top.length === 0 ? (
        <EmptyState icon="🏛️" title="Aucun don ce mois-ci" size="sm" className="p-0">
          Le premier joueur à verser de l'Ambre au pot commun prend la tête du classement.
        </EmptyState>
      ) : (
        <ol className="flex flex-col divide-y divide-white/5">
          {top.map((e, i) => (
            <li key={e.uid} className={cn("flex items-center gap-2 py-1.5 text-sm", e.uid === me && "bg-cyan-glow/[0.04]")}>
              <span className="w-6 text-right font-mono text-xs tabular-nums text-slate-500">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-slate-200">
                <PlayerName uid={e.uid} pseudo={e.pseudo} />
              </span>
              {i < 3 && (
                <HudChip size="sm" tone={RANK_TONE[i]}>
                  {i === 0 ? "Premier mécène" : `${i + 1}e`}
                </HudChip>
              )}
              <AmberAmount value={e.amber} label={false} className="font-mono tabular-nums text-slate-200" />
            </li>
          ))}
        </ol>
      )}
      {state.last && state.last.top.length > 0 && (
        <p className="text-xs text-slate-500">
          Podium de {monthLabel(state.last.month)} : {state.last.top.map((e, i) => `${i + 1}. ${e.pseudo} (${e.amber})`).join(" · ")}
        </p>
      )}
    </HudPanel>
  );
}
