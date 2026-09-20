import { Outlet } from "react-router-dom";
import { LogOut, Music, Music as MusicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Starfield } from "@/components/layout/Starfield";
import { NavBar } from "@/components/layout/NavBar";
import { ResourceHud } from "@/components/layout/ResourceHud";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { Button } from "@/components/ui/button";
import { logout } from "@/services/authService";
import { useGameSync } from "@/hooks/useGameSync";
import { useAuthStore } from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";
import { CombatResultModal } from "@/components/game/CombatResultModal";

function MusicToggle() {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  return (
    <>
      <audio ref={ref} src="/assets/audio/theme.mp3" loop preload="none" />
      <Button
        variant="ghost"
        size="icon"
        title={playing ? "Couper la musique" : "Jouer la musique"}
        onClick={() => {
          const el = ref.current;
          if (!el) return;
          if (playing) {
            el.pause();
            setPlaying(false);
          } else {
            el.volume = 0.4;
            void el.play();
            setPlaying(true);
          }
        }}
      >
        {playing ? <Music className="h-4 w-4" /> : <MusicOff className="h-4 w-4 opacity-50" />}
      </Button>
    </>
  );
}

export function AppShell() {
  const user = useAuthStore((s) => s.user);
  const player = usePlayerStore((s) => s.player);
  const loading = usePlayerStore((s) => s.loading);

  useGameSync(user?.uid ?? null);

  useEffect(() => {
    document.title = player ? `${player.pseudo} — Cosmic Empires` : "Cosmic Empires";
  }, [player]);

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[1400px] flex-col gap-3 p-3 pb-20 md:flex-row md:pb-3">
      <Starfield count={80} />
      <NavBar />

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <header className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-2xl p-3">
          <div className="flex items-center gap-2">
            <img src="/assets/Logo/logo.png" alt="" className="h-9 w-9 rounded-lg object-cover" />
            <div className="hidden sm:block">
              <p className="font-display text-sm text-white glow-text">Cosmic Empires</p>
              <p className="text-xs text-slate-400">{player?.pseudo ?? "…"}</p>
            </div>
          </div>

          <ResourceHud />

          <div className="flex items-center gap-2">
            <MusicToggle />
            <NotificationBell />
            <Button variant="outline" size="icon" title="Déconnexion" onClick={() => void logout()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="min-w-0 flex-1">
          {loading ? (
            <div className="flex h-64 items-center justify-center text-slate-400">Chargement de l'empire…</div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      <CombatResultModal />
    </div>
  );
}
