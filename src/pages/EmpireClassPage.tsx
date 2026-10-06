import { useState } from "react";
import { Compass } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { HudPanel } from "@/components/ui/panel";
import { HudCallout, HudChip } from "@/components/ui/hud";
import { Button } from "@/components/ui/button";
import { askConfirm } from "@/components/ui/confirm-dialog";
import { EmojiIcon } from "@/components/ui/game-icon";
import { bountyState } from "@/game/bounties";
import { describeEffect } from "@/game/effects";
import { EMPIRE_CLASS_RULES, EMPIRE_CLASSES, empireClassPerkLines, empireClassPrice, empireClassReadyAt, playerEmpireClass, type EmpireClassDef } from "@/game/empireClass";
import { useNowTicker } from "@/hooks/useNowTicker";
import { cn, formatClock } from "@/lib/utils";
import { chooseEmpireClass, GameActionError } from "@/services/playerService";
import { usePlayerStore } from "@/store/playerStore";

/* 6.0 (proposals/classes-empire.md) : choisir son identité d'empire. Premier choix gratuit,
   changement contre de l'Ambre une fois par période. Couleurs : mint = classe actuelle. */

function ClassCard({ def, current, disabled, price, onPick }: { def: EmpireClassDef; current: boolean; disabled: boolean; price: number; onPick: () => void }) {
  return (
    <li className={cn("glass-panel hud-cut-sm flex flex-col gap-3 border p-4", current ? "border-mint-glow/60" : "border-white/10")}>
      <div className="flex items-center gap-3">
        <EmojiIcon emoji={def.emoji} className="h-9 w-9" />
        <div className="min-w-0 flex-1">
          <p className="hud-title text-sm text-slate-100">{def.name}</p>
          {current && (
            <HudChip size="sm" tone="mint" className="mt-1">
              Ta classe
            </HudChip>
          )}
        </div>
      </div>
      <p className="text-sm text-slate-300">{def.tagline}</p>
      <ul className="flex flex-col gap-1 text-xs text-slate-300">
        {def.effects.map((e) => (
          <li key={`${e.stat}-${e.target ?? ""}`} className="font-mono tabular-nums">
            {describeEffect(e.stat, e.value, e.target)}
          </li>
        ))}
        {empireClassPerkLines(def).map((line) => (
          <li key={line} className="text-gold-glow">
            {line}
          </li>
        ))}
      </ul>
      {!current && (
        <Button size="sm" variant="outline" className="mt-auto self-start" disabled={disabled} onClick={onPick}>
          {price > 0 ? (
            <>
              Changer · <span className="ml-1 font-mono tabular-nums">{price}</span>&nbsp;Ambre
            </>
          ) : (
            <>Choisir</>
          )}
        </Button>
      )}
    </li>
  );
}

export function EmpireClassPage() {
  useNowTicker();
  const player = usePlayerStore((s) => s.player);
  const [busy, setBusy] = useState(false);
  if (!player) return null;
  const now = Date.now();
  const current = playerEmpireClass(player);
  const price = empireClassPrice(player);
  const readyAt = empireClassReadyAt(player);
  const locked = !!current && readyAt > now;
  const amber = Math.floor(bountyState(player).amber ?? 0);

  const pick = async (def: EmpireClassDef) => {
    const ok = await askConfirm({
      title: current ? `Devenir ${def.name} ?` : `Choisir ${def.name} ?`,
      message: current
        ? `Coût : ${price} Ambre. Tu perds les bonus ${current.name}. Prochain changement possible dans ${EMPIRE_CLASS_RULES.changeCooldownDays} jours.`
        : `Gratuit. Changer plus tard coûtera ${EMPIRE_CLASS_RULES.changeAmber} Ambre, une fois tous les ${EMPIRE_CLASS_RULES.changeCooldownDays} jours.`,
      confirmLabel: current ? "Changer" : "Choisir",
      tone: current ? "ember" : "accent",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await chooseEmpireClass(def.id);
      toast.success(`Te voilà ${def.name}.`);
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Choix impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="Empire" title="Classe d'empire" description="Ton identité : des bonus permanents et un avantage propre." />
      {!current ? (
        <HudCallout tone="accent" className="text-sm text-slate-300">
          <strong className="text-slate-100">Premier choix gratuit.</strong> Tu pourras changer ensuite contre{" "}
          <span className="font-mono tabular-nums">{EMPIRE_CLASS_RULES.changeAmber}</span> Ambre, une fois tous les{" "}
          <span className="font-mono tabular-nums">{EMPIRE_CLASS_RULES.changeCooldownDays}</span> jours.
        </HudCallout>
      ) : locked ? (
        <HudCallout tone="neutral" className="text-sm text-slate-300">
          Prochain changement possible dans <span className="font-mono tabular-nums">{formatClock(Math.ceil((readyAt - now) / 1000))}</span>.
        </HudCallout>
      ) : (
        <HudCallout tone="neutral" className="text-sm text-slate-300">
          Changer de classe : <span className="font-mono tabular-nums">{price}</span> Ambre (tu en as <span className="font-mono tabular-nums">{amber}</span>).
        </HudCallout>
      )}
      <HudPanel icon={<Compass />} title="Les trois classes" tone="accent">
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {EMPIRE_CLASSES.map((def) => (
            <ClassCard key={def.id} def={def} current={current?.id === def.id} price={price} disabled={busy || locked || (price > 0 && amber < price)} onPick={() => void pick(def)} />
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-slate-500">Les bonus de classe s'ajoutent à ceux des officiers, reliques et talents, dans les mêmes plafonds. Détail dans la fiche d'effets.</p>
      </HudPanel>
    </div>
  );
}
