import { useState } from "react";
import { toast } from "sonner";
import { HudCallout, HudChip } from "@/components/ui/hud";
import { askConfirm } from "@/components/ui/confirm-dialog";
import { BUILDING_TIER_RULES, buildingTierView, choiceCooldownLeftMs, choiceOptions, formatMinutes, TIER_ROLE_LABELS, type BuildingTierView, type ChoiceSlot } from "@/game/buildingTiers";
import { BUILD_PLAN_RULES } from "@/game/buildPlan";
import type { BuildingDef } from "@/game/buildings";
import { chooseBuildingTier, GameActionError } from "@/services/playerService";
import { cn } from "@/lib/utils";
import { assetUrl } from "@/lib/assets";
import type { PlayerState } from "@/types/game";

/* =====================================================
   6.14.142 (PB-L1, proposals/paliers-batiments.md §5.5) : ligne « Paliers »
   d'une carte de bâtiment de système (entrepôt, Atelier, Cale sèche, Fonderie).
   Chaque palier : niveau, rôle et nom ; atteint (vert), prochain (cyan),
   verrouillé (gris). Un choix n'apparaît qu'une fois son palier atteint
   (I30 : rien de plus dans la barre latérale).
===================================================== */

/** Vue des paliers d'un bâtiment (null : bâtiment de courbe, jalons seulement). */
export function tierViewOf(building: BuildingDef, player: PlayerState): BuildingTierView | null {
  return buildingTierView(building, player, BUILD_PLAN_RULES.slotBuilding);
}

/** « Prochain palier : niv. 15 · Spécialisation » (sous le bouton d'amélioration). */
export function NextTierLine({ view }: { view: BuildingTierView | null }) {
  if (!view?.next) return null;
  return (
    <p className="mt-1.5 text-center font-mono text-[11px] text-slate-400">
      Prochain palier : <span className="tabular-nums text-cyan-glow">niv. {view.next.level}</span> · {TIER_ROLE_LABELS[view.next.role]}
    </p>
  );
}

export function BuildingTiers({ view, player, now }: { view: BuildingTierView; player: PlayerState; now: number }) {
  const [open, setOpen] = useState<ChoiceSlot | null>(null);
  const [busy, setBusy] = useState(false);

  const choose = async (slot: ChoiceSlot, value: string, label: string, current: string | null) => {
    if (current) {
      const hours = Math.max(0, BUILDING_TIER_RULES.choiceCooldownHours);
      const ok = await askConfirm({ title: `Choisir « ${label} » ?`, message: hours > 0 ? `Tu pourras changer à nouveau dans ${formatMinutes(hours * 3600)}.` : undefined, confirmLabel: "Choisir" });
      if (!ok) return;
    }
    setBusy(true);
    try {
      const out = await chooseBuildingTier(slot, value);
      toast.success(`Palier : ${out.label} choisi.`);
      setOpen(null);
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Choix impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5" data-testid="building-tiers">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-400">Paliers</p>
      <ul className="flex flex-col gap-1">
        {view.tiers.map((t) => {
          const tone = t.reached ? "mint" : t.next ? "accent" : "neutral";
          const pendingChoice = t.reached && t.slot && !t.choice;
          return (
            <li key={t.index} className="flex flex-col gap-1">
              <div className="flex min-w-0 items-start gap-2" title={t.text}>
                {t.image && <img src={assetUrl(t.image)} alt="" loading="lazy" className={cn("h-6 w-6 shrink-0 object-contain", !t.reached && "opacity-50 grayscale")} />}
                {/* 6.14.148 (AU28) : palier lointain en ton neutre et pointillés, sans opacité sur le texte (DESIGN.md, 6.14.97). */}
                <HudChip size="sm" tone={tone} className={cn("shrink-0", !t.reached && !t.next && "border-dashed")}>
                  <span className="tabular-nums">niv. {t.level}</span>
                </HudChip>
                <span className={cn("min-w-0 flex-1 text-xs leading-snug", t.reached ? "text-slate-200" : "text-slate-400")}>
                  <span className="font-semibold">{t.name}</span>
                  {t.choiceLabel && <span className="text-mint-glow"> · {t.choiceLabel}</span>}
                  {pendingChoice && <span className="text-cyan-glow"> · à choisir</span>}
                  <span className="block text-[11px] text-slate-500">{t.text}</span>
                </span>
                {t.reached && t.slot && (
                  <HudChip asChild size="sm" tone={pendingChoice ? "accent" : "neutral"} className="shrink-0">
                    <button type="button" aria-expanded={open === t.slot} onClick={() => setOpen(open === t.slot ? null : t.slot!)}>
                      {pendingChoice ? "Choisir" : "Changer"}
                    </button>
                  </HudChip>
                )}
              </div>
              {t.slot && open === t.slot && (
                <ChoicePicker slot={t.slot} current={t.choice} cooldownMs={choiceCooldownLeftMs(player, t.slot, now)} busy={busy} onPick={(v, label) => void choose(t.slot!, v, label, t.choice)} />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ChoicePicker({ slot, current, cooldownMs, busy, onPick }: { slot: ChoiceSlot; current: string | null; cooldownMs: number; busy: boolean; onPick: (value: string, label: string) => void }) {
  const locked = cooldownMs > 0;
  return (
    <HudCallout tone={locked ? "neutral" : "accent"} className="flex flex-col gap-2 p-2">
      {locked && <p className="text-xs text-slate-300">Changement possible dans <span className="font-mono tabular-nums">{formatMinutes(Math.ceil(cooldownMs / 1000))}</span>.</p>}
      <div className="flex flex-wrap gap-1.5">
        {choiceOptions(slot).map((o) => (
          <HudChip key={o.id} asChild size="sm" tone={o.id === current ? "mint" : "accent"}>
            <button type="button" title={o.text} aria-pressed={o.id === current} disabled={busy || locked || o.id === current} onClick={() => onPick(o.id, o.label)}>
              {o.label}
            </button>
          </HudChip>
        ))}
      </div>
      {!current && <p className="text-[11px] text-slate-500">Premier choix libre ; ensuite, un changement par {formatMinutes(Math.max(0, BUILDING_TIER_RULES.choiceCooldownHours) * 3600)}.</p>}
    </HudCallout>
  );
}
