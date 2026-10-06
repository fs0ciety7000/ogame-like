import { Link } from "react-router-dom";
import { Compass, FlaskConical, Globe2, Hammer, Rocket, type LucideIcon } from "lucide-react";
import { upcomingEvents, type TimelineKind } from "@/game/timeline";
import { useFleetStore } from "@/store/fleetStore";
import { usePlayerStore } from "@/store/playerStore";
import { cn, formatDuration } from "@/lib/utils";
import type { QueuesState } from "@/types/game";

/* =====================================================
   v4.5 : file de chantier toujours visible en haut de l'accueil
   (constructions, recherches, unités, missions), avec un rappel quand un
   chantier est à l'arrêt.
===================================================== */

const SLOTS: { kind: TimelineKind; icon: LucideIcon; idle: string; to: string; color: string }[] = [
  { kind: "building", icon: Hammer, idle: "Aucune construction", to: "/game/batiments", color: "text-gold-glow" },
  { kind: "research", icon: FlaskConical, idle: "Aucune recherche", to: "/game/labo", color: "text-cyan-glow" },
  { kind: "units", icon: Rocket, idle: "Chantier naval à l'arrêt", to: "/game/unites", color: "text-slate-200" },
  { kind: "mission", icon: Compass, idle: "Aucune mission", to: "/game/missions", color: "text-mint-glow" },
];

const COLONY_SLOT: (typeof SLOTS)[number] = { kind: "colony", icon: Globe2, idle: "Colonies à l'arrêt", to: "/game/colonies", color: "text-violet-glow" };

export function QueueStrip({ queues, now }: { queues: QueuesState | null; now: number }) {
  const fleets = useFleetStore((s) => s.fleets);
  const player = usePlayerStore((s) => s.player);
  const events = upcomingEvents(queues, now, fleets, undefined, player);
  // v4.9.3 : case « Colonies » dès qu'une colonie existe ou est en route.
  const slots = (player?.colonies?.length ?? 0) > 0 || player?.colonizing ? [...SLOTS, COLONY_SLOT] : SLOTS;
  return (
    <div className="-mx-1 grid grid-cols-2 gap-1.5 border-b border-white/5 bg-space-950/80 px-1 py-1.5 backdrop-blur-md sm:flex">
      {slots.map((slot) => {
        const list = events.filter((e) => e.kind === slot.kind);
        const first = list[0];
        return (
          <Link
            key={slot.kind}
            to={first?.to ?? slot.to}
            className={cn(
              "flex min-w-0 flex-1 items-center gap-2 border px-2 py-1.5 text-xs transition-colors",
              first ? "border-white/10 bg-white/[0.03] hover:border-cyan-glow/40" : "border-dashed border-cyan-glow/30 text-slate-400 hover:border-cyan-glow/60",
            )}
          >
            <slot.icon className={cn("h-4 w-4 shrink-0", first ? slot.color : "text-cyan-glow/70")} />
            {first ? (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-slate-200">
                  {first.label}
                  {list.length > 1 && <span className="text-slate-500"> +{list.length - 1}</span>}
                </span>
                <span className="font-mono text-[11px] text-slate-400">{formatDuration(Math.max(0, (first.endTime - now) / 1000))}</span>
              </span>
            ) : (
              <span className="truncate">{slot.idle}</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
