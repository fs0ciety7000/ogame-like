import { ShieldAlert } from "lucide-react";
import { HudPanel } from "@/components/ui/panel";
import { HudCallout } from "@/components/ui/hud";
import { ResourceIcon } from "@/components/ui/game-icon";
import { ECONOMY_RULES, exposureView } from "@/game/economy";
import { activeChoice, shelterExtraHours } from "@/game/buildingTiers";
import { RESOURCE_LIST } from "@/game/resources";
import { STORAGE_OVERFLOW_RULES, storageOverflowView } from "@/game/storageOverflow";
import { formatCompact, formatDateTime } from "@/lib/utils";
import type { PlayerState } from "@/types/game";
import { PVP_RULES } from "@/game/pvp";

/* 5.32 (proposals/entrepot-pillage.md, option C) : « ce que tu risques ». Stock à l'abri et stock pillable,
   par ressource commune, en heures de production. Avant l'activation, la future part à l'abri est annoncée.
   Couleurs : mint = à l'abri, ember = pillable. */

const nameOf = (id: string) => RESOURCE_LIST.find((r) => r.id === id)?.name ?? id;

export function StorageRiskCard({ player, now }: { player: PlayerState; now: number }) {
  const view = exposureView(player, now);
  const soonChanges = !view.active && view.lines.some((l) => l.protectedSoon < l.protectedNow);
  const date = formatDateTime(view.activeFromMs, "weekday", "server");
  // 6.14.155 (R8, AE-14) : stock au-delà de l'entrepôt (gardé, production arrêtée), ressource par ressource.
  const overflow = storageOverflowView(player);
  // 6.14.164 (S4, NJ-24) : la protection de débutant, dite au même endroit que le risque (avant : « 3 h » sur la page Joueurs et
  // « chiffres après le mardi 13 » ici, deux dates sans lien apparent).
  const protectedUntil = player.createdAtMs && !(player.lastAttackAtMs ?? 0) ? player.createdAtMs + PVP_RULES.newbieProtectionMs : 0;
  return (
    <HudPanel icon={<ShieldAlert />} title="Ce que tu risques" tone="ember">
      {protectedUntil > now && (
        <HudCallout tone="mint" className="mb-3 text-sm text-slate-300">
          <strong className="text-slate-100">Protégé jusqu'au {formatDateTime(protectedUntil, "long")}</strong> : aucun joueur ne peut
          t'attaquer d'ici là. Attaquer un joueur met fin à cette protection.
        </HudCallout>
      )}
      {soonChanges && (
        <HudCallout tone="ember" className="mb-3 text-sm text-slate-300">
          <strong className="text-slate-100">À partir du {date}</strong> : <span className="font-mono tabular-nums">{ECONOMY_RULES.protectedHours} h</span> de production
          à l'abri au plus. Au-delà, ton stock est pillable : dépense-le ou envoie-le en mission.
        </HudCallout>
      )}
      {overflow.any && STORAGE_OVERFLOW_RULES.cardText && (
        <HudCallout tone="ember" className="mb-3 text-sm text-slate-300">
          {STORAGE_OVERFLOW_RULES.cardText}
        </HudCallout>
      )}
      <ul className="flex flex-col gap-2">
        {view.lines.map((l) => {
          const shown = view.active ? l.protectedNow : l.protectedSoon;
          const exposed = Math.max(0, l.stock - shown);
          return (
            <li key={l.res} className="glass-panel hud-cut-sm flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-sm">
              <span className="flex min-w-[9rem] items-center gap-2 text-slate-100">
                <ResourceIcon id={l.res} /> {nameOf(l.res)}
                {/* 6.14.143 (PB-L2) : ressource prioritaire (entrepôt 5) et entrepôt orbital (entrepôt 20). */}
                {shelterExtraHours(player, l.res) > 0 && (
                  <span className="font-mono text-[11px] tabular-nums text-mint-glow" title={activeChoice(player, "storage.priority") === l.res ? "Ressource prioritaire de l'entrepôt" : "Entrepôt orbital"}>
                    {ECONOMY_RULES.protectedHours + shelterExtraHours(player, l.res)} h
                  </span>
                )}
              </span>
              <span className="text-mint-glow">
                à l'abri <span className="font-mono tabular-nums">{formatCompact(Math.min(l.stock, shown))}</span>
              </span>
              <span className={exposed > 0 ? "text-ember-glow" : "text-slate-500"}>
                pillable <span className="font-mono tabular-nums">{formatCompact(exposed)}</span>
                {l.hourly > 0 && exposed > 0 && <span className="ml-1 font-mono text-[11px] tabular-nums text-slate-500">({Math.round(exposed / l.hourly)} h de production)</span>}
              </span>
              {(overflow.over[l.res] ?? 0) > 0 && (
                <span className="text-ember-glow">
                  au-delà de l'entrepôt <span className="font-mono tabular-nums">{formatCompact(overflow.over[l.res] ?? 0)}</span>
                  <span className="ml-1 text-[11px] text-slate-500">(production arrêtée)</span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[11px] text-slate-500">
        {view.active ? "Chiffres actuels." : `Chiffres de la règle de l'entrepôt en vigueur à partir du ${date}.`} La soute de l'attaquant limite aussi ce qu'il emporte.
      </p>
    </HudPanel>
  );
}
