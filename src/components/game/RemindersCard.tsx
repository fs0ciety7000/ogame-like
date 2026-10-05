import { useState } from "react";
import { BellRing, Trash2, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, HudChip } from "@/components/ui/hud";
import { HudPanel } from "@/components/ui/panel";
import { addReminder, fullestStorage, removeReminder, REMINDERS_MAX, useRemindersStore } from "@/lib/reminders";
import { usePlayerStore } from "@/store/playerStore";
import { cn } from "@/lib/utils";

/* 5.16 : réglage des rappels personnels (entrepôt, joueurs suivis). */

const THRESHOLDS = [75, 90, 100];

export function RemindersCard() {
  const list = useRemindersStore((s) => s.list);
  const player = usePlayerStore((s) => s.player);
  const [pct, setPct] = useState(90);
  const top = player ? fullestStorage(player) : null;
  return (
    <HudPanel icon={<BellRing />} title="Rappels" aside={<span className="font-mono text-[11px] tabular-nums text-slate-500">{list.length} / {REMINDERS_MAX}</span>}>
      <p className="text-xs text-slate-400">Sur cet appareil : une alerte (et une notification du navigateur si elle est autorisée) quand la condition devient vraie, une seule fois tant qu'elle le reste.</p>
      <div className="flex flex-wrap items-center gap-2">
        <Warehouse className="h-4 w-4 text-gold-glow" />
        <span className="text-sm text-slate-300">Entrepôt rempli à</span>
        {THRESHOLDS.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={pct === t}
            onClick={() => setPct(t)}
            className={cn("hud-cut-sm border px-2 py-1 font-mono text-xs tabular-nums", pct === t ? "border-gold-glow/60 bg-gold-glow/10 text-gold-glow" : "border-white/10 text-slate-400 hover:text-slate-100")}
          >
            {t} %
          </button>
        ))}
        <Button size="sm" variant="secondary" disabled={list.length >= REMINDERS_MAX} onClick={() => addReminder({ kind: "storage", pct })}>
          Ajouter
        </Button>
        {top && <span className="font-mono text-[11px] tabular-nums text-slate-500">actuellement {Math.floor(top.pct * 100)} %</span>}
      </div>
      {list.length === 0 ? (
        <EmptyState size="sm" icon={<BellRing />} title="Aucun rappel">
          Ajoute un seuil d'entrepôt ici, ou suis un joueur depuis sa fiche (« Me prévenir quand il se connecte »).
        </EmptyState>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {list.map((r) => (
            <li key={r.id}>
              <HudChip size="sm" tone={r.kind === "storage" ? "gold" : "mint"} className="normal-case tracking-normal">
                {r.kind === "storage" ? `Entrepôt ≥ ${r.pct} %` : `${r.pseudo} se connecte`}
                <button type="button" aria-label="Supprimer le rappel" onClick={() => removeReminder(r.id)} className="ml-1 opacity-70 hover:opacity-100">
                  <Trash2 className="h-3 w-3" />
                </button>
              </HudChip>
            </li>
          ))}
        </ul>
      )}
    </HudPanel>
  );
}

/** Bouton « Me prévenir quand il se connecte » (fiche joueur). */
export function FollowOnlineButton({ uid, pseudo }: { uid: string; pseudo: string }) {
  const followed = useRemindersStore((s) => s.list.some((r) => r.kind === "online" && r.uid === uid));
  return (
    <Button size="sm" variant={followed ? "secondary" : "ghost"} onClick={() => (followed ? removeReminder(`online-${uid}`) : addReminder({ kind: "online", uid, pseudo }))}>
      <BellRing className="h-3.5 w-3.5" /> {followed ? "Suivi : ne plus prévenir" : "Me prévenir quand il se connecte"}
    </Button>
  );
}
