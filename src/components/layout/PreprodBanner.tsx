import { FlaskConical } from "lucide-react";

/** 6.14.8 : serveur de test (pré-prod, copie de la production). Affiché seulement si le build porte VITE_SERVER_LABEL. */
const LABEL = (import.meta.env.VITE_SERVER_LABEL ?? "").trim();

export function PreprodBanner() {
  if (!LABEL) return null;
  return (
    <div className="relative z-30 flex items-center gap-3 border-b border-ember-glow/40 bg-space-950 px-4 py-1.5 text-xs sm:px-6">
      <FlaskConical className="h-3.5 w-3.5 text-ember-glow" />
      <span className="font-mono font-bold uppercase tracking-[0.16em] text-ember-glow">{LABEL}</span>
      <span className="hidden text-slate-400 sm:inline">Copie de la production pour les essais : rien de ce que tu fais ici ne compte sur le vrai serveur.</span>
    </div>
  );
}
