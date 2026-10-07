import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, Compass, FlaskConical, Globe2, Hammer, Landmark, Moon, Rocket, Send, type LucideIcon, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { timelineHorizon, timelinePosition, upcomingEvents, type TimelineKind } from "@/game/timeline";
import { formatClock } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { QueuesState } from "@/types/game";
import { useFleetStore } from "@/store/fleetStore";
import { useAuthStore } from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";

const KIND_STYLE: Record<TimelineKind, { icon: LucideIcon; color: string; dot: string; label: string }> = {
  building: { icon: Hammer, color: "text-gold-glow", dot: "bg-gold-glow", label: "Construction" },
  research: { icon: FlaskConical, color: "text-cyan-glow", dot: "bg-cyan-glow", label: "Recherche" },
  mission: { icon: Compass, color: "text-mint-glow", dot: "bg-mint-glow", label: "Mission" },
  units: { icon: Rocket, color: "text-slate-300", dot: "bg-slate-300", label: "Unités" },
  fleet: { icon: Send, color: "text-cyan-glow", dot: "bg-cyan-glow", label: "Flotte" },
  hostile: { icon: AlertTriangle, color: "text-danger-glow", dot: "bg-danger-glow", label: "Flotte hostile" },
  colony: { icon: Globe2, color: "text-violet-glow", dot: "bg-violet-glow", label: "Colonie" },
  repair: { icon: Wrench, color: "text-ember-glow", dot: "bg-ember-glow", label: "Atelier" },
  moon: { icon: Moon, color: "text-violet-glow", dot: "bg-violet-glow", label: "Lune" },
  prestige: { icon: Landmark, color: "text-gold-glow", dot: "bg-gold-glow", label: "Prestige" },
};

function horizonLabel(ms: number) {
  return `${Math.round(ms / 3600_000)} h`;
}

/** Tout ce qui se termine bientôt, sur une frise (échelle compressée pour
 *  que les échéances proches restent lisibles) puis en liste. */
export function UpcomingTimeline({ queues, now }: { queues: QueuesState | null; now: number }) {
  const fleets = useFleetStore((s) => s.fleets);
  const uid = useAuthStore((s) => s.user?.uid);
  const player = usePlayerStore((s) => s.player);
  const events = upcomingEvents(queues, now, fleets, uid, player);
  const horizon = timelineHorizon(events, now);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Prochaines fins</CardTitle>
        <span className="text-[11px] text-slate-500">{events.length > 0 ? `sur ${horizonLabel(horizon)}` : ""}</span>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-slate-500">
            Rien en cours. Lance une <Link to="/game/batiments" className="text-cyan-glow hover:underline">construction</Link>,
            une <Link to="/game/labo" className="text-cyan-glow hover:underline">recherche</Link> ou une{" "}
            <Link to="/game/missions" className="text-cyan-glow hover:underline">mission</Link> !
          </p>
        ) : (
          <>
            {/* Frise */}
            <div className="relative mx-3 mb-5 mt-6 h-1 bg-white/10">
              <span className="absolute -left-3 top-3 text-[11px] text-slate-500">maint.</span>
              <span className="absolute -right-2 top-3 text-[11px] text-slate-500">{horizonLabel(horizon)}</span>
              <motion.span
                className="absolute -top-1 left-0 h-3 w-0.5 rounded bg-cyan-glow shadow-[0_0_6px_var(--color-cyan-glow)]"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
              {events.map((e, i) => {
                const style = KIND_STYLE[e.kind];
                const left = timelinePosition(e.endTime, now, horizon) * 100;
                return (
                  <Tooltip key={e.id}>
                    <TooltipTrigger asChild>
                      <Link
                        to={e.to}
                        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${left}%` }}
                        aria-label={`${e.label} — ${formatClock(Math.max(0, Math.floor((e.endTime - now) / 1000)))}`}
                      >
                        <motion.span
                          className={cn("block h-3 w-3 rounded-full ring-2 ring-space-900", style.dot)}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.05, type: "spring", stiffness: 400, damping: 18 }}
                        />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      {style.label} : {e.label} — {formatClock(Math.max(0, Math.floor((e.endTime - now) / 1000)))}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>

            {/* Liste */}
            <ul className="space-y-1.5">
              {events.slice(0, 6).map((e) => {
                const style = KIND_STYLE[e.kind];
                const Icon = style.icon;
                const remaining = Math.max(0, Math.floor((e.endTime - now) / 1000));
                return (
                  <li key={e.id}>
                    <Link to={e.to} className="flex items-center gap-2 px-1 py-0.5 text-sm hover:bg-white/5">
                      <Icon className={cn("h-3.5 w-3.5 shrink-0", style.color)} />
                      <span className="truncate text-slate-300">{e.label}</span>
                      <span className={cn("ml-auto tabular-mono text-xs", remaining < 60 ? "text-mint-glow" : "text-slate-400")}>
                        {remaining === 0 ? "terminé" : formatClock(remaining)}
                      </span>
                    </Link>
                  </li>
                );
              })}
              {events.length > 6 && <li className="px-1 text-xs text-slate-500">+ {events.length - 6} autre(s)</li>}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
