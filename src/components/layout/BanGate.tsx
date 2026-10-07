import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Ban, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pb } from "@/lib/pocketbase";
import { logout } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import { clearBanned, useBanStore } from "@/store/banStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { formatDuration, formatDateTime } from "@/lib/utils";

/* 5.26 : un compte suspendu ou banni ne voit plus le jeu : motif, échéance
   (compte à rebours) et déconnexion. Le serveur refuse de toute façon tout. */

interface BanInfo {
  untilMs: number | null;
  reason: string;
}

export function BanGate({ children }: { children: ReactNode }) {
  const message = useBanStore((s) => s.message);
  const user = useAuthStore((s) => s.user);
  const { pathname } = useLocation();
  useEffect(() => {
    if (!user) clearBanned();
  }, [user]);
  if (!message || !user || pathname === "/statut") return <>{children}</>;
  return <BanScreen message={message} />;
}

function BanScreen({ message }: { message: string }) {
  useNowTicker();
  const [info, setInfo] = useState<BanInfo | null>(null);
  useEffect(() => {
    pb.send<{ ban: BanInfo | null }>("/api/cosmic/ban/me", { requestKey: null })
      .then((r) => {
        setInfo(r.ban);
        // Bannissement levé ou échu entre-temps : retour au jeu.
        if (!r.ban) {
          clearBanned();
          window.location.reload();
        }
      })
      .catch(() => undefined);
  }, []);
  const left = info?.untilMs ? info.untilMs - Date.now() : null;
  useEffect(() => {
    if (left !== null && left <= 0) window.location.reload();
  }, [left]);
  const permanent = info ? info.untilMs === null : /définitivement/.test(message);

  return (
    <div className="flex min-h-screen items-center justify-center bg-space-950 px-4 text-slate-200">
      <div className="hud-panel glass-panel flex w-full max-w-lg flex-col gap-4 border border-danger-glow/40 p-6">
        <div className="flex items-center gap-3">
          <span className="hud-cut grid h-12 w-12 shrink-0 place-items-center border border-danger-glow/50 bg-danger-glow/10 text-danger-glow">
            <Ban className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <p className="hud-eyebrow text-[11px] text-danger-glow">Cosmic Empires · Modération</p>
            <h1 className="hud-title text-xl text-slate-100">{permanent ? "Compte banni" : "Compte suspendu"}</h1>
          </div>
        </div>
        <p className="text-sm text-slate-300">
          Motif : <span className="text-slate-100">{info?.reason ?? message.replace(/^.*Motif : /, "")}</span>
        </p>
        {!permanent && left !== null && (
          <p className="font-mono text-sm text-ember-glow">
            Fin de la suspension dans {formatDuration(Math.max(0, left) / 1000)}
            <span className="block text-[11px] text-slate-500">{formatDateTime(info!.untilMs!, "long")}</span>
          </p>
        )}
        <p className="text-xs text-slate-500">Une erreur ? Écris à l'équipe depuis le devblog ou la page de statut. Ton empire reste intact pendant une suspension.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => (logout(), clearBanned())}>
            <LogOut className="h-4 w-4" /> Se déconnecter
          </Button>
          <Button asChild variant="ghost">
            <Link to="/statut">Statut du serveur</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
