import { Link } from "react-router-dom";
import { BookOpen, LogIn } from "lucide-react";
import { FormulasGuide } from "@/components/game/FormulasGuide";
import { useAuthStore } from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";

/* v5.4 : manuel public des formules, dans l'esprit de la Bible visuelle :
   lisible sans compte, avec les valeurs en vigueur. Connecté, on y voit aussi ses chiffres. */
export function PublicFormulasPage() {
  const user = useAuthStore((s) => s.user);
  const player = usePlayerStore((s) => s.player);
  return (
    <div className="min-h-screen bg-space-950 text-slate-200">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(1200px_700px_at_85%_-10%,color-mix(in_srgb,var(--color-violet-glow)_14%,transparent),transparent_60%),radial-gradient(900px_600px_at_-10%_20%,color-mix(in_srgb,var(--color-cyan-glow)_10%,transparent),transparent_60%)]" />
      <div className="relative mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
        <header className="flex flex-wrap items-center gap-3">
          <img src="/assets/logo/favicon-32.png?v=2.4" alt="" className="h-8 w-8" />
          <div className="min-w-0 flex-1">
            <p className="hud-eyebrow text-[10px] text-cyan-glow">Cosmic Empires · Manuel du commandant</p>
            <h1 className="hud-title text-2xl text-slate-100 sm:text-3xl">Les formules du jeu</h1>
          </div>
          <a href="/bible/index.html" className="flex items-center gap-1 border border-white/15 px-2.5 py-1 text-xs text-slate-300 hover:border-white/40">
            <BookOpen className="h-3.5 w-3.5" /> Bible visuelle
          </a>
          <Link to={user ? "/game/formules" : "/"} className="flex items-center gap-1 border border-cyan-glow/40 px-2.5 py-1 text-xs text-cyan-glow hover:border-cyan-glow">
            <LogIn className="h-3.5 w-3.5" /> {user ? "Mes chiffres" : "Jouer"}
          </Link>
        </header>
        <p className="max-w-3xl text-sm text-slate-300">
          Production, stockage, énergie, puissance d'attaque et de défense, combats, butin, raids, missions, bonus et passe de saison : tout ce que le serveur calcule, expliqué. Les chiffres
          affichés sont ceux en vigueur aujourd'hui, réglages de l'équipe compris.
        </p>
        <FormulasGuide player={user ? player : null} />
        <footer className="border-t border-white/10 pt-4 text-xs text-slate-500">Cosmic Empires · les formules suivent automatiquement chaque mise à jour du jeu.</footer>
      </div>
    </div>
  );
}
