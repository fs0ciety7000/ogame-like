import { FleetReturnFx } from "@/components/game/FleetReturnFx";
import { useDirectorySync } from "@/store/directoryStore";
import { Link, Outlet, useLocation } from "react-router-dom";
import { assetUrl } from "@/lib/assets";
import { MaintenanceBanner } from "@/components/layout/MaintenanceBanner";
import { VacationBanner } from "@/components/layout/VacationBanner";
import { AnnouncementBanners } from "@/components/layout/AnnouncementBanners";
import { PageTip } from "@/components/game/PageTip";
import { useReportBadgeSync } from "@/hooks/useReportBadges";
import { useReportBadges } from "@/services/reportService";
import { LogOut, Music, Music as MusicOff, Search, Settings, Volume2, VolumeX, Wrench } from "lucide-react";
import { useContentStore } from "@/services/contentService";
import { useIsAdmin } from "@/services/adminService";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Starfield } from "@/components/layout/Starfield";
import { Nebula } from "@/components/layout/Nebula";
import { SeasonGlow } from "@/components/layout/SeasonGlow";
import { Snowfall } from "@/components/fx/Snowfall";
import { TierUpOverlay } from "@/components/fx/TierUpOverlay";
import { useAmbience } from "@/hooks/useAmbience";
import { checkTierUps } from "@/store/tierUpStore";
import { SchematicGrid } from "@/components/layout/SchematicGrid";
import { NavBar, ALL_NAV_ITEMS } from "@/components/layout/NavBar";
import { RaidAlert } from "@/components/game/RaidAlert";
import { ResourceHud } from "@/components/layout/ResourceHud";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { PageLoader } from "@/components/layout/PageLoader";
import { BootSequence } from "@/components/layout/BootSequence";
import { PageTransition } from "@/components/layout/PageTransition";
import { logout } from "@/services/authService";
import { useGameSync } from "@/hooks/useGameSync";
import { useRankCelebration } from "@/hooks/useRankCelebration";
import { useAllianceUnread } from "@/hooks/useAllianceUnread";
import { subscribeMyMessages } from "@/services/messageService";
import { claimPendingSponsor, pendingSponsor } from "@/services/referralService";
import { useAuthStore } from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";
import { CombatResultModal } from "@/components/game/CombatResultModal";
import { WarpOverlay } from "@/components/game/WarpOverlay";
import { RankUpCelebration } from "@/components/game/RankUpCelebration";
import { FxLayer } from "@/components/game/FxLayer";
import { AwaySummaryModal } from "@/components/game/AwaySummaryModal";
import { UltimatumDialog } from "@/components/game/PirateUltimatum";
import { AnnouncementDialog } from "@/components/game/Announcement";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { toggleCommandPalette } from "@/store/commandPaletteStore";
import { useSfxStore, toggleSfx } from "@/store/sfxStore";
import { playClick } from "@/lib/sfx";

/** Bouton de la barre d'outils du haut. */
function HeaderButton({ title, onClick, asLink, danger, children }: { title: string; onClick?: () => void; asLink?: string; danger?: boolean; children: ReactNode }) {
  const cls = cn(
    "relative grid h-9 w-9 place-items-center text-slate-400 transition-colors hover:bg-cyan-glow/10 hover:text-cyan-glow",
    danger && "hover:bg-danger-glow/10 hover:text-danger-glow",
  );
  return asLink ? (
    <Link to={asLink} title={title} className={cls}>
      {children}
    </Link>
  ) : (
    <button type="button" title={title} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

function MusicToggle() {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  return (
    <>
      <audio ref={ref} src="/assets/audio/theme.mp3" loop preload="none" />
      <HeaderButton
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
        {playing ? <Music className="h-4 w-4 text-cyan-glow" /> : <MusicOff className="h-4 w-4 opacity-50" />}
      </HeaderButton>
    </>
  );
}

function SfxToggle() {
  const enabled = useSfxStore((s) => s.enabled);
  return (
    <HeaderButton title={enabled ? "Couper les sons" : "Activer les sons"} onClick={() => toggleSfx()}>
      {enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 opacity-50" />}
    </HeaderButton>
  );
}

/** Pages hors navigation principale (barre d'outils). */
const EXTRA_LABELS: Record<string, string> = { "/game/admin": "Administration", "/game/reglages": "Réglages", "/game/rapport": "Rapport partagé" };

export function AppShell() {
  const user = useAuthStore((s) => s.user);
  const player = usePlayerStore((s) => s.player);
  const loading = usePlayerStore((s) => s.loading);
  const contentLoaded = useContentStore((s) => s.loaded);
  const contentVersion = useContentStore((s) => s.version);
  const isAdmin = useIsAdmin();
  const location = useLocation();

  useGameSync(user?.uid ?? null);
  useDirectorySync(!!user);
  useRankCelebration(player);
  useAmbience();
  const tierUid = user?.uid;
  const tierBuildings = player?.buildings;
  useEffect(() => {
    if (tierUid && tierBuildings) checkTierUps(tierUid, tierBuildings);
  }, [tierUid, tierBuildings]);
  useAllianceUnread(user?.uid ?? null, player);
  const uidForMessages = user?.uid ?? null;
  useEffect(() => (uidForMessages ? subscribeMyMessages(uidForMessages) : undefined), [uidForMessages]);
  // v4.7.1 : lien de parrainage pas encore déclaré (inscription interrompue, autre onglet…).
  useEffect(() => {
    if (uidForMessages && pendingSponsor()) void claimPendingSponsor().then((s) => s && toast.success(`Parrain enregistré : ${s}.`));
  }, [uidForMessages]);
  useReportBadgeSync(user?.uid ?? null, isAdmin);
  const pendingReports = useReportBadges((s) => s.pendingNew);

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

  // Code de secteur (décoratif, stable par joueur).
  const sectorCode = (user?.uid ?? "000000").slice(-6).toUpperCase().replace(/(.{3})/, "$1-");
  const currentLabel =
    Object.entries(EXTRA_LABELS).find(([path]) => location.pathname.startsWith(path))?.[1] ??
    ALL_NAV_ITEMS.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
  )?.label;

  return (
    <div className="relative flex min-h-screen w-full flex-col pb-20 md:h-screen md:flex-row md:overflow-hidden md:pb-0">
      <SchematicGrid />
      <Nebula />
      <SeasonGlow />
      <Snowfall />
      <TierUpOverlay />
      <Starfield count={80} />
      <NavBar />

      <div className="flex min-w-0 flex-1 flex-col md:h-screen md:overflow-hidden">
        <MaintenanceBanner />
        <VacationBanner />
        <AnnouncementBanners />
        <header className="relative z-20 shrink-0 border-b border-cyan-glow/10 bg-space-950/70 backdrop-blur-xl">
          <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-cyan-glow/50 via-cyan-glow/5 to-violet-glow/30" />
          <div className="flex items-center gap-3 px-4 pt-3 sm:px-6 md:pt-3">
            {/* Mobile : logo ; bureau : titre de la page en cours. */}
            <Link to="/game" className="md:hidden">
              <img src={assetUrl("/assets/logo/logo.webp")} alt="" className="h-9 w-9 object-contain drop-shadow-[0_0_8px_rgba(75,232,255,0.35)]" />
            </Link>
            <div className="min-w-0">
              <p className="hud-eyebrow truncate text-[10px] text-cyan-glow/70">
                {player?.pseudo ?? "…"} <span className="text-slate-600">//</span> Secteur {sectorCode}
              </p>
              <p className="hud-title truncate text-lg text-white md:hidden">{currentLabel ?? "Cosmic Empires"}</p>
              <p className="hud-title hidden truncate text-lg text-white md:block">
                <span className="text-slate-500">Poste de commandement · </span>
                {currentLabel ?? "Accueil"}
              </p>
            </div>

            <div className="ml-auto flex items-center divide-x divide-cyan-glow/10 border border-cyan-glow/15 bg-space-900/60 hud-cut-sm">
              <HeaderButton
                title="Palette de commandes (Ctrl/Cmd+K)"
                onClick={() => {
                  playClick();
                  toggleCommandPalette();
                }}
              >
                <Search className="h-4 w-4" />
              </HeaderButton>
              <span className="hidden sm:contents">
                <SfxToggle />
                <MusicToggle />
              </span>
              <NotificationBell />
              {isAdmin && (
                <HeaderButton title="Administration" asLink={pendingReports > 0 ? "/game/admin?onglet=reports" : "/game/admin"}>
                  <Wrench className="h-4 w-4" />
                  {pendingReports > 0 && (
                    <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center bg-danger-glow px-0.5 font-mono text-[9px] font-bold text-space-950">
                      {pendingReports > 9 ? "9+" : pendingReports}
                    </span>
                  )}
                </HeaderButton>
              )}
              <HeaderButton title="Réglages" asLink="/game/reglages">
                <Settings className="h-4 w-4" />
              </HeaderButton>
              <HeaderButton title="Déconnexion" onClick={() => void logout()} danger>
                <LogOut className="h-4 w-4" />
              </HeaderButton>
            </div>
          </div>
          <div className="px-4 pb-3 pt-2.5 sm:px-6">
            <ResourceHud />
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 md:overflow-y-auto">
          {loading || !contentLoaded ? (
            <BootSequence />
          ) : (
            // Remonté quand l'administration modifie le contenu du jeu, pour
            // que chaque écran relise les nouvelles définitions.
            <Suspense key={contentVersion} fallback={<PageLoader />}>
              <PageTip />
              <PageTransition>
                <Outlet />
              </PageTransition>
            </Suspense>
          )}
        </main>
      </div>

      <CombatResultModal />
      <WarpOverlay />
      <RaidAlert />
      <RankUpCelebration />
      <AwaySummaryModal />
      <UltimatumDialog />
      <AnnouncementDialog />
      <CommandPalette />
      <FxLayer />
      <FleetReturnFx />
    </div>
  );
}
