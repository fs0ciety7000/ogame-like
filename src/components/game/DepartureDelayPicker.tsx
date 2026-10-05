import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

/* 5.23 : planificateur de flottes : décollage immédiat ou programmé.
   Les unités quittent la base tout de suite ; départ et arrivée sont décalés. */

const CHOICES = [0, 15, 30, 60, 120, 240, 480, 720];

function label(m: number): string {
  if (m === 0) return "Maintenant";
  return m < 60 ? `+${m} min` : `+${m / 60} h`;
}

export function DepartureDelayPicker({ value, onChange, className }: { value: number; onChange: (minutes: number) => void; className?: string }) {
  const departAt = value > 0 ? new Date(Date.now() + value * 60_000) : null;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
        <Clock className="h-3.5 w-3.5" /> Décollage
      </span>
      <div className="flex flex-wrap gap-1">
        {CHOICES.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className={cn(
              "hud-cut-sm border px-2 py-1 font-mono text-xs transition-colors",
              value === m ? "border-cyan-glow/60 bg-cyan-glow/15 text-slate-100" : "border-white/10 text-slate-400 hover:border-cyan-glow/40",
            )}
          >
            {label(m)}
          </button>
        ))}
      </div>
      {departAt && (
        <p className="text-[11px] text-slate-500">
          Départ à <span className="font-mono text-slate-300">{departAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span> : les unités sont engagées dès maintenant, la flotte reste rappelable jusqu'à l'impact.
        </p>
      )}
    </div>
  );
}
