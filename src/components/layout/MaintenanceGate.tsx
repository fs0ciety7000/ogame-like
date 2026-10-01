import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { MaintenanceOver, MaintenancePage } from "@/pages/MaintenancePage";
import { useAdminStatus, useMaintenanceStore } from "@/services/maintenanceService";
import { useAuthStore } from "@/store/authStore";
import { logout } from "@/services/authService";

/** Ferme le jeu aux joueurs pendant la maintenance (v2.5). Les
 *  administrateurs passent ; les autres voient la page de maintenance,
 *  qui se recharge d'elle-même à la réouverture (nouvelle version du jeu). */
export function MaintenanceGate({ children }: { children: ReactNode }) {
  const { state, loaded } = useMaintenanceStore();
  const user = useAuthStore((s) => s.user);
  const admin = useAdminStatus();
  const { pathname } = useLocation();
  const [adminLogin, setAdminLogin] = useState(false);
  const [reopening, setReopening] = useState(false);
  const blockedOnce = useRef(false);

  const blocked = loaded && state.enabled && admin !== true && pathname !== "/reset-password" && !(adminLogin && !user);
  if (blocked) blockedOnce.current = true;

  // Réouverture vue depuis la page de maintenance : rechargement complet,
  // pour récupérer la version du jeu tout juste déployée.
  useEffect(() => {
    if (!loaded || state.enabled || !blockedOnce.current) return;
    blockedOnce.current = false;
    setReopening(true);
    const t = setTimeout(() => window.location.reload(), 2500);
    return () => clearTimeout(t);
  }, [loaded, state.enabled]);

  if (reopening) return <MaintenanceOver />;
  // Vérification du statut administrateur en cours : rien plutôt qu'un flash.
  if (loaded && state.enabled && user && admin === null) return null;
  if (blocked) {
    return (
      <MaintenancePage
        state={state}
        account={user ? user.displayName || user.email : null}
        onLogout={() => void logout()}
        onAdminAccess={() => setAdminLogin(true)}
      />
    );
  }
  return (
    <>
      {loaded && state.enabled && adminLogin && !user && (
        <div className="fixed inset-x-0 top-0 z-[120] flex items-center justify-center gap-3 border-b border-gold-glow/40 bg-space-950/95 px-4 py-2 text-xs text-gold-glow backdrop-blur">
          <span className="mt-hazard absolute inset-y-0 left-0 w-2" aria-hidden />
          Maintenance en cours : connexion réservée aux administrateurs.
          <button type="button" onClick={() => setAdminLogin(false)} className="font-semibold underline underline-offset-4">
            Retour
          </button>
        </div>
      )}
      {children}
    </>
  );
}
