import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { FormulasGuide } from "@/components/game/FormulasGuide";
import { usePlayerStore } from "@/store/playerStore";

/* v5.4 : les formules du jeu avec les chiffres du joueur connecté. */
export function FormulasPage() {
  const player = usePlayerStore((s) => s.player);
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Manuel"
        title="Formules"
        description="Comment le jeu calcule ta production, tes gains, ta puissance et l'issue des combats, avec tes propres chiffres. Les valeurs suivent les réglages en vigueur."
        right={
          <Link to="/formules" target="_blank" className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-100">
            Version publique <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        }
      />
      <FormulasGuide player={player} />
    </div>
  );
}
