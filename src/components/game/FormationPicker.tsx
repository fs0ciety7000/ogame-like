import { FORMATIONS, POSTURES, type FormationId, type PostureId } from "@/game/formations";
import { cn } from "@/lib/utils";

/** Formation d'attaque (v3.0), choisie avant d'envoyer une flotte. */
export function FormationPicker({ value, onChange, className }: { value: FormationId; onChange: (f: FormationId) => void; className?: string }) {
  const current = FORMATIONS.find((f) => f.id === value) ?? FORMATIONS[0];
  return (
    <div className={className}>
      <p className="hud-eyebrow mb-1.5 text-[10px] text-slate-500">Formation</p>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4" role="radiogroup" aria-label="Formation">
        {FORMATIONS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={value === f.id}
            title={f.description()}
            onClick={() => onChange(f.id)}
            className={cn(
              "border px-2 py-1.5 font-display text-xs font-semibold uppercase tracking-[0.1em] transition-colors",
              value === f.id ? "border-cyan-glow/70 bg-cyan-glow/15 text-cyan-glow" : "border-white/10 text-slate-400 hover:border-cyan-glow/40",
            )}
          >
            {f.name}
          </button>
        ))}
      </div>
      <p className="mt-1 text-[11px] text-slate-500">{current.description()}</p>
    </div>
  );
}

/** Posture de la base (v3.0). */
export function PosturePicker({ value, onChange, disabled }: { value: PostureId; onChange: (p: PostureId) => void; disabled?: boolean }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-3" role="radiogroup" aria-label="Posture de la base">
      {POSTURES.map((p) => (
        <button
          key={p.id}
          type="button"
          role="radio"
          aria-checked={value === p.id}
          disabled={disabled && value !== p.id}
          onClick={() => onChange(p.id)}
          className={cn(
            "flex flex-col items-start gap-0.5 border px-3 py-2 text-left transition-colors disabled:opacity-40",
            value === p.id ? "border-cyan-glow/70 bg-cyan-glow/10" : "border-white/10 hover:border-cyan-glow/40",
          )}
        >
          <span className={cn("font-display text-sm font-semibold uppercase tracking-[0.1em]", value === p.id ? "text-cyan-glow" : "text-slate-200")}>{p.name}</span>
          <span className="text-[11px] text-slate-500">{p.description()}</span>
        </button>
      ))}
    </div>
  );
}
