import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Starfield } from "@/components/layout/Starfield";

export function ProtectedRoute() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="relative flex min-h-screen items-center justify-center text-slate-400">
        <Starfield />
        Chargement…
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  return <Outlet />;
}

export function GuestRoute({ children }: { children: ReactNode }) {
  const { user, initializing } = useAuth();

  if (!initializing && user) return <Navigate to="/game" replace />;

  return <>{children}</>;
}
