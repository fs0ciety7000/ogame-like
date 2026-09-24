import { Link, Outlet, useLocation } from "react-router-dom";
import { LogOut, Music, Music as MusicOff, Search, Settings, Volume2, VolumeX } from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import { Starfield } from "@/components/layout/Starfield";
import { Nebula } from "@/components/layout/Nebula";
import { SchematicGrid } from "@/components/layout/SchematicGrid";
import { NavBar, ALL_NAV_ITEMS } from "@/components/layout/NavBar";
import { ResourceHud } from "@/components/layout/ResourceHud";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { PageLoader } from "@/components/layout/PageLoader";
import { BootSequence } from "@/components/layout/BootSequence";
import { PageTransition } from "@/components/layout/PageTransition";
import { LiveClock } from "@/components/layout/LiveClock";
import { Button } from "@/components/ui/button";
import { SignalIndicator } from "@/components/layout/SignalIndicator";
import { logout } from "@/services/authService";
import { useGameSync } from "@/hooks/useGameSync";
import { useRankCelebration } from "@/hooks/useRankCelebration";
import { useAllianceUnread } from "@/hooks/useAllianceUnread";
import { useAuthStore } from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";
import { CombatResultModal } from "@/components/game/CombatResultModal";
import { WarpOverlay } from "@/components/game/WarpOverlay";
import { RankUpCelebration } from "@/components/game/RankUpCelebration";
import { AwaySummaryModal } from "@/components/game/AwaySummaryModal";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { toggleCommandPalette } from "@/store/commandPaletteStore";
import { useSfxStore, toggleSfx } from "@/store/sfxStore";
import { playClick } from "@/lib/sfx";

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

function SfxToggle() {
  const enabled = useSfxStore((s) => s.enabled);
  return (
    <Button
      variant="ghost"
      size="icon"
      title={enabled ? "Couper les bips" : "Activer les bips"}
      onClick={() => toggleSfx()}
    >
      {enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 opacity-50" />}
    </Button>
  );
}

export function AppShell() {
  const user = useAuthStore((s) => s.user);
  const player = usePlayerStore((s) => s.player);
  const loading = usePlayerStore((s) => s.loading);
  const location = useLocation();

  useGameSync(user?.uid ?? null);
  useRankCelebration(player);
  useAllianceUnread(user?.uid ?? null, player);

  useEffect(() => {
    document.title = player ? `${player.pseudo} — Cosmic Empires` : "Cosmic Empires";
  }, [player]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        playClick();
        toggleCommandPalette();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const currentLabel = ALL_NAV_ITEMS.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
  )?.label;

  return (
    <div className="relative flex min-h-screen w-full flex-col pb-16 md:h-screen md:flex-row md:overflow-hidden md:pb-0">
      <SchematicGrid />
      <Nebula />
      <Starfield count={80} />
      <NavBar />

      <div className="flex min-w-0 flex-1 flex-col md:h-screen md:overflow-hidden">
        <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-white/5 bg-space-900/60 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="order-1 flex items-center gap-2">
            <img src="/assets/Logo/logo.png" alt="" className="h-9 w-9 rounded-lg object-cover" />
            <div className="hidden sm:block">
              <p className="hud-eyebrow text-slate-500">
                Cosmic Empires{currentLabel ? ` / ${currentLabel}` : ""}
              </p>
              <p className="text-xs text-slate-400">{player?.pseudo ?? "…"}</p>
            </div>
          </div>

          <div className="order-3 w-full basis-full md:order-2 md:w-auto md:flex-1 md:basis-auto md:px-4">
            <ResourceHud />
          </div>

          <div className="order-2 ml-auto flex items-center gap-3 md:order-3 md:ml-0">
            <div className="hidden items-center gap-3 border-r border-white/10 pr-3 lg:flex">
              <SignalIndicator />
              <LiveClock />
            </div>
            <Button
              variant="outline"
              size="icon"
              title="Palette de commandes (Ctrl/Cmd+K)"
              onClick={() => {
                playClick();
                toggleCommandPalette();
              }}
            >
              <Search className="h-4 w-4" />
            </Button>
            <SfxToggle />
            <MusicToggle />
            <NotificationBell />
            <Button variant="outline" size="icon" title="Réglages" asChild>
              <Link to="/game/reglages">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="icon" title="Déconnexion" onClick={() => void logout()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-4 sm:px-6 md:overflow-y-auto">
          {loading ? (
            <BootSequence />
          ) : (
            <Suspense fallback={<PageLoader />}>
              <PageTransition>
                <Outlet />
              </PageTransition>
            </Suspense>
          )}
        </main>
      </div>

      <CombatResultModal />
      <WarpOverlay />
      <RankUpCelebration />
      <AwaySummaryModal />
      <CommandPalette />
    </div>
  );
}
