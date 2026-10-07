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
/* 6.11.9 (H1) : sur téléphone, trois colonnes et la seule description de la posture choisie (290 px quand tout s'empilait). */
export function PosturePicker({ value, onChange, disabled }: { value: PostureId; onChange: (p: PostureId) => void; disabled?: boolean }) {
  const chosen = POSTURES.find((p) => p.id === value);
  return (
    <div className="flex flex-col gap-1.5">
    <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Posture de la base">
      {POSTURES.map((p) => (
        <button
          key={p.id}
          type="button"
          role="radio"
          aria-checked={value === p.id}
          disabled={disabled && value !== p.id}
          onClick={() => onChange(p.id)}
          className={cn(
            "flex flex-col items-start gap-0.5 border px-3 py-2 text-left transition-colors disabled:opacity-40 max-sm:items-center max-sm:px-1.5",
            value === p.id ? "border-cyan-glow/70 bg-cyan-glow/10" : "border-white/10 hover:border-cyan-glow/40",
          )}
        >
          <span className={cn("font-display text-sm font-semibold uppercase tracking-[0.1em] max-sm:text-xs", value === p.id ? "text-cyan-glow" : "text-slate-200")}>{p.name}</span>
          <span className="text-[11px] text-slate-500 max-sm:hidden">{p.description()}</span>
        </button>
      ))}
    </div>
    {chosen && <p className="text-[11px] text-slate-500 sm:hidden">{chosen.description()}</p>}
    </div>
  );
}

/** 5.21 : cible prioritaire de l'attaque (où se concentrent les tirs). */
export type TargetPriorityChoice = "" | "defenses" | "ships";
const PRIORITIES: { id: TargetPriorityChoice; name: string; desc: string }[] = [
  { id: "", name: "Répartie", desc: "Les tirs se répartissent sur toutes les cibles, selon leurs points de vie." },
  { id: "defenses", name: "Défenses", desc: "Les tirs visent d'abord les défenses : utile pour ouvrir une base fortifiée avant un second raid." },
  { id: "ships", name: "Vaisseaux", desc: "Les tirs visent d'abord les vaisseaux à quai et les garnisons : utile pour briser sa flotte." },
];

export function TargetPriorityPicker({ value, onChange, className }: { value: TargetPriorityChoice; onChange: (v: TargetPriorityChoice) => void; className?: string }) {
  const current = PRIORITIES.find((p) => p.id === value) ?? PRIORITIES[0];
  return (
    <div className={className}>
      <p className="hud-eyebrow mb-1.5 text-[10px] text-slate-500">Cible prioritaire</p>
      <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Cible prioritaire">
        {PRIORITIES.map((p) => (
          <button
            key={p.id || "spread"}
            type="button"
            role="radio"
            aria-checked={value === p.id}
            title={p.desc}
            onClick={() => onChange(p.id)}
            className={cn(
              "border px-2 py-1.5 font-display text-xs font-semibold uppercase tracking-[0.1em] transition-colors",
              value === p.id ? "border-cyan-glow/70 bg-cyan-glow/15 text-cyan-glow" : "border-white/10 text-slate-400 hover:border-cyan-glow/40",
            )}
          >
            {p.name}
          </button>
        ))}
      </div>
      <p className="mt-1 text-[11px] text-slate-500">{current.desc}</p>
    </div>
  );
}
