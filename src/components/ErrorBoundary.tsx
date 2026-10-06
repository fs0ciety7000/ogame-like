import { Component, type ReactNode } from "react";
import { reportClientError } from "@/services/errorReporter";
import { hardReload, isStaleChunkError, reloadForUpdate } from "@/lib/updateReload";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Fichier d'une ancienne version : on recharge plutôt que d'afficher l'erreur.
    // 5.26.2 : rechargement déjà tenté (mise en ligne en cours) : écran « nouvelle
    // version », pas de signalement automatique (ce n'est pas un bug du jeu).
    if (isStaleChunkError(error)) {
      reloadForUpdate();
      return;
    }
    console.error("Erreur non interceptée :", error, info.componentStack);
    reportClientError(error, "", info.componentStack);
  }

  render() {
    if (this.state.error && isStaleChunkError(this.state.error)) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-space-950 p-6 text-center text-slate-200">
          <h1 className="font-display text-xl text-cyan-glow">Nouvelle version disponible</h1>
          <p className="max-w-md text-sm text-slate-400">Le jeu vient d'être mis à jour. Recharge la page pour récupérer la nouvelle version (si l'erreur revient, patiente quelques secondes : la mise en ligne se termine).</p>
          <button type="button" onClick={() => hardReload()} className="mt-2 bg-cyan-glow px-4 py-2 font-mono text-sm font-semibold uppercase tracking-wider text-space-950">
            Recharger
          </button>
        </div>
      );
    }
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-space-950 p-6 text-center text-slate-200">
          <h1 className="font-display text-xl text-danger-glow">Une erreur est survenue</h1>
          <p className="max-w-md text-sm text-slate-400">{this.state.error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 bg-cyan-glow px-4 py-2 font-mono text-sm font-semibold uppercase tracking-wider text-space-950"
          >
            Recharger la page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
