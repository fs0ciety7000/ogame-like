import { FlaskConical } from "lucide-react";
import { HudChip } from "@/components/ui/hud";

/** 6.14.8 : serveur de test (pré-prod, copie de la production). Affiché seulement si le build porte VITE_SERVER_LABEL. */
export const SERVER_LABEL = (import.meta.env.VITE_SERVER_LABEL ?? "").trim();

/** Bandeau du bureau. 6.14.62 (AD-2) : sur téléphone, il laisse la place à `PreprodTag`, posé dans l'en-tête. */
export function PreprodBanner() {
  if (!SERVER_LABEL) return null;
  return (
    <div className="relative z-30 hidden items-center gap-3 border-b border-ember-glow/40 bg-space-950 px-4 py-1.5 text-xs sm:px-6 md:flex">
      <FlaskConical className="h-3.5 w-3.5 text-ember-glow" />
      <span className="font-mono font-bold uppercase tracking-[0.16em] text-ember-glow">{SERVER_LABEL}</span>
      <span className="hidden text-slate-400 sm:inline">Copie de la production pour les essais : rien de ce que tu fais ici ne compte sur le vrai serveur.</span>
    </div>
  );
}

/** Pastille « serveur de test » de l'en-tête mobile (même sens que le bandeau : ember = attention). */
export function PreprodTag() {
  if (!SERVER_LABEL) return null;
  return (
    <HudChip size="sm" tone="ember" title="Copie de la production pour les essais : rien de ce que tu fais ici ne compte sur le vrai serveur." className="mt-0.5 max-w-full overflow-hidden md:hidden">
      <FlaskConical className="h-3 w-3 shrink-0" aria-hidden /> <span className="truncate">{SERVER_LABEL}</span>
    </HudChip>
  );
}
