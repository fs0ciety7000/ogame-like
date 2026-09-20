import { Component, type ReactNode } from "react";

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
    console.error("Erreur non interceptée :", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-space-950 p-6 text-center text-slate-200">
          <h1 className="font-display text-xl text-danger-glow">Une erreur est survenue</h1>
          <p className="max-w-md text-sm text-slate-400">{this.state.error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 rounded-lg bg-cyan-glow px-4 py-2 text-sm font-medium text-space-950"
          >
            Recharger la page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
