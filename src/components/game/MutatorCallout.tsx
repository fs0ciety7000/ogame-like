import { HudCallout } from "@/components/ui/hud";
import { activeMutator, mutatorFor, mutatorMonthId } from "@/game/mutators";
import { useContentStore } from "@/services/contentService";
import { cn } from "@/lib/utils";

/* 5.16 : mutateur de saison du mois (règle spéciale pour tout le serveur),
   et aperçu du suivant. Sur l'accueil et la page Chroniques. */

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

export function MutatorCallout({ className, compact }: { className?: string; compact?: boolean }) {
  useContentStore((s) => s.version);
  const now = Date.now();
  const m = activeMutator(now);
  if (!m) return null;
  const [y, mo] = mutatorMonthId(now).split("-").map(Number);
  const nextId = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, "0")}`;
  const next = mutatorFor(nextId);
  return (
    <HudCallout tone="violet" className={cn("flex items-start gap-3", className)}>
      <span className="text-2xl leading-none" aria-hidden>
        {m.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-violet-glow">Mutateur de {MONTHS[mo - 1]}</p>
        <p className="hud-title text-sm normal-case text-white">{m.name}</p>
        <p className="text-xs text-slate-300">{m.description}</p>
        {!compact && next && (
          <p className="mt-1 text-[11px] text-slate-500">
            En {MONTHS[mo % 12]} : {next.emoji} {next.name}.
          </p>
        )}
      </div>
    </HudCallout>
  );
}
