import { FleetReturnFx } from "@/components/game/FleetReturnFx";
import { useDirectorySync } from "@/store/directoryStore";
import { useRemindersWatcher } from "@/lib/reminders";
import { Link, Outlet, useLocation } from "react-router-dom";
import { assetUrl } from "@/lib/assets";
import { MaintenanceBanner } from "@/components/layout/MaintenanceBanner";
import { VacationBanner } from "@/components/layout/VacationBanner";
import { PreprodBanner, PreprodTag } from "@/components/layout/PreprodBanner";
import { StripStack } from "@/components/layout/StripStack";
import { ServerDownBanner } from "@/components/layout/ServerDownBanner";
import { usePageHeaderStore } from "@/store/pageHeaderStore";
import { AnnouncementBanners } from "@/components/layout/AnnouncementBanners";
import { useReportBadgeSync } from "@/hooks/useReportBadges";
import { useReportBadges } from "@/services/reportService";
import { LogOut, Maximize, Minimize, Music, Music as MusicOff, PenSquare, Search, Settings, Volume2, VolumeX, Wrench } from "lucide-react";
import { useContentStore } from "@/services/contentService";
import { useIsAdmin } from "@/services/adminService";
import { useBlogAccess } from "@/services/blogService";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Starfield } from "@/components/layout/Starfield";
import { Nebula } from "@/components/layout/Nebula";
import { BossLiveStrip, SeasonGlow } from "@/components/layout/SeasonGlow";
import { Snowfall } from "@/components/fx/Snowfall";
import { useAmbience } from "@/hooks/useAmbience";
import { checkTierUps } from "@/store/tierUpStore";
import { SchematicGrid } from "@/components/layout/SchematicGrid";
import { NavBar, ALL_NAV_ITEMS } from "@/components/layout/NavBar";
import { ResourceHud } from "@/components/layout/ResourceHud";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { fullscreenSupported, isFullscreen, toggleFullscreen } from "@/lib/fullscreen";
import { PageLoader } from "@/components/layout/PageLoader";
import { BootSequence } from "@/components/layout/BootSequence";
import { bootSequence } from "@/lib/fx/uiFx";
import { PageTransition } from "@/components/layout/PageTransition";
import { logout } from "@/services/authService";
import { useGameSync } from "@/hooks/useGameSync";
import { useRankCelebration } from "@/hooks/useRankCelebration";
import { useAllianceUnread } from "@/hooks/useAllianceUnread";
import { subscribeMyMessages } from "@/services/messageService";
import { claimPendingSponsor, pendingSponsor } from "@/services/referralService";
import { useAuthStore } from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";
import { useCombatModalStore } from "@/store/combatModalStore";
import { lazyPage } from "@/lib/lazyPage";
import { WarpOverlay } from "@/components/game/WarpOverlay";
import { FxLayer } from "@/components/game/FxLayer";
import { UltimatumDialog } from "@/components/game/PirateUltimatum";
import { toggleCommandPalette, useCommandPaletteStore } from "@/store/commandPaletteStore";
import { useSfxStore, toggleSfx } from "@/store/sfxStore";
import { playClick } from "@/lib/sfx";

/** Bouton de la barre d'outils du haut. */
function HeaderButton({ title, onClick, asLink, danger, children }: { title: string; onClick?: () => void; asLink?: string; danger?: boolean; children: ReactNode }) {
  const cls = cn(
    // 6.14.68 (UX-7) : 44 px sur écran tactile.
    "relative grid h-9 w-9 place-items-center text-slate-400 transition-colors hover:bg-cyan-glow/10 hover:text-cyan-glow pointer-coarse:h-11 pointer-coarse:w-11",
    danger && "hover:bg-danger-glow/10 hover:text-danger-glow",
  );
  return asLink ? (
    <Link to={asLink} title={title} aria-label={title} className={cls}>
      {children}
    </Link>
  ) : (
    <button type="button" title={title} aria-label={title} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

/** 5.21.1 : plein écran (bouton de l'en-tête, touche F). */
function FullscreenToggle() {
  const [on, setOn] = useState(isFullscreen());
  useEffect(() => {
    const sync = () => setOn(isFullscreen());
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  if (!fullscreenSupported()) return null;
  return (
    <HeaderButton title={on ? "Quitter le plein écran (F)" : "Plein écran (F)"} onClick={() => void toggleFullscreen()}>
      {on ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
    </HeaderButton>
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
const EXTRA_LABELS: Record<string, string> = { "/game/admin": "Administration", "/game/reglages": "Réglages", "/game/rapport": "Rapport partagé", "/game/redaction": "Rédaction du devblog" };

/* 5.23 : rapport de combat (et fenêtre d'attaque qu'il ouvre) chargés au premier combat affiché. */
const CombatResultModal = lazyPage(() => import("@/components/game/CombatResultModal"), "CombatResultModal");
// 5.29 (P1) : fenêtres rares chargées après le premier rendu, hors du bundle principal.
const RankUpCelebration = lazyPage(() => import("@/components/game/RankUpCelebration"), "RankUpCelebration");
const AwaySummaryModal = lazyPage(() => import("@/components/game/AwaySummaryModal"), "AwaySummaryModal");
const SeasonReport = lazyPage(() => import("@/components/game/SeasonReport"), "SeasonReport");
const AnnouncementDialog = lazyPage(() => import("@/components/game/Announcement"), "AnnouncementDialog");
const CommandPalette = lazyPage(() => import("@/components/layout/CommandPalette"), "CommandPalette");
const ShortcutsDialog = lazyPage(() => import("@/components/layout/ShortcutsDialog"), "ShortcutsDialog");
// 6.14.157 (R4b) : alerte de raid (avec la fenêtre « Fuir ») et passage de palier, dans le même groupe différé : leur code ne
// retarde plus la page ouverte. Ils lisent leur état dans leur magasin (flottes, paliers) : rien n'est perdu.
const RaidAlert = lazyPage(() => import("@/components/game/RaidAlert"), "RaidAlert");
const TierUpOverlay = lazyPage(() => import("@/components/fx/TierUpOverlay"), "TierUpOverlay");

/** 6.14.152 (R4) : fenêtres rares (rang, retour d'absence, bilan, annonce, Ctrl+K, raccourcis) montées après le premier rendu
 *  de la page, au premier moment libre (2 s au plus) : leur code (≈ 25 Ko) ne dispute plus le réseau à la page ouverte au
 *  démarrage. Elles lisent leur état dans leur magasin : rien n'est perdu (Ctrl+K pressé avant les monte aussitôt). */
function useDeferredExtras(pageReady: boolean): boolean {
  const [on, setOn] = useState(false);
  const paletteOpen = useCommandPaletteStore((s) => s.open);
  useEffect(() => {
    if (on) return;
    if (paletteOpen) {
      setOn(true);
      return;
    }
    if (!pageReady) return;
    const go = () => setOn(true);
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(go, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(go, 600);
    return () => clearTimeout(t);
  }, [on, pageReady, paletteOpen]);
  return on;
}

function LazyCombatResult() {
  const shown = useCombatModalStore((s) => s.current !== null);
  const [wanted, setWanted] = useState(false);
  useEffect(() => {
    if (shown) setWanted(true);
  }, [shown]);
  if (!wanted && !shown) return null;
  return (
    <Suspense fallback={null}>
      <CombatResultModal />
    </Suspense>
  );
}

export function AppShell() {
  const user = useAuthStore((s) => s.user);
  const player = usePlayerStore((s) => s.player);
  const loading = usePlayerStore((s) => s.loading);
  const contentLoaded = useContentStore((s) => s.loaded);
  const contentVersion = useContentStore((s) => s.version);
  const isAdmin = useIsAdmin();
  // 5.25 : séquence d'amorçage du poste de commandement (une fois par session).
  useEffect(() => {
    void bootSequence();
  }, []);
  const blog = useBlogAccess();
  const location = useLocation();

  useGameSync(user?.uid ?? null);
  useDirectorySync(!!user);
  useRemindersWatcher(!!user);
  useRankCelebration(player);
  useAmbience();
  const tierUid = user?.uid;
  const tierBuildings = player?.buildings;
  useEffect(() => {
    if (tierUid && tierBuildings) checkTierUps(tierUid, tierBuildings);
  }, [tierUid, tierBuildings]);
  useAllianceUnread(user?.uid ?? null, player);
  const uidForMessages = user?.uid ?? null;
  useEffect(() => {
    return uidForMessages ? subscribeMyMessages(uidForMessages) : undefined;
  }, [uidForMessages]);
  // v4.7.1 : lien de parrainage pas encore déclaré (inscription interrompue, autre onglet…).
  useEffect(() => {
    if (uidForMessages && pendingSponsor()) void claimPendingSponsor().then((s) => s && toast.success(`Parrain enregistré : ${s}.`));
  }, [uidForMessages]);
  useReportBadgeSync(user?.uid ?? null, isAdmin);
  const pendingReports = useReportBadges((s) => s.pendingNew);
  const extrasOn = useDeferredExtras(!loading && contentLoaded);
  // 6.14.62 (AD-2) : sur téléphone, le titre de l'en-tête s'efface tant que la page affiche le sien (PageHeader).
  const pageHasHeader = usePageHeaderStore((s) => s.mounted > 0);

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
    <div className="relative flex min-h-screen w-full flex-col overflow-x-clip pb-[calc(5rem+env(safe-area-inset-bottom))] md:h-screen md:flex-row md:overflow-hidden md:pb-0">
      <SchematicGrid />
      <Nebula />
      <SeasonGlow />
      <Snowfall />
      <Starfield count={80} />
      <NavBar />

      <div className="flex min-w-0 flex-1 flex-col md:h-screen md:overflow-hidden">
        <PreprodBanner />
        {/* 6.14.62 (AD-2) : bandeaux fusionnés sur téléphone (le premier, puis « +N »). */}
        <StripStack>
          <MaintenanceBanner />
          <VacationBanner />
          <AnnouncementBanners flat />
          <BossLiveStrip />
        </StripStack>
        <header className="relative z-20 shrink-0 border-b border-cyan-glow/10 bg-space-950/70 backdrop-blur-xl">
          <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-cyan-glow/50 via-cyan-glow/5 to-violet-glow/30" />
          <div className="flex items-center gap-3 px-4 pt-2.5 sm:px-6 md:pt-3">
            {/* Mobile : logo ; bureau : titre de la page en cours. */}
            <Link to="/game" aria-label="Accueil" className="hud-hit shrink-0 md:hidden">
              <img src={assetUrl("/assets/logo/logo.webp")} alt="" className="h-9 w-9 object-contain drop-shadow-[0_0_8px_color-mix(in_srgb,var(--color-cyan-glow)_35%,transparent)]" />
            </Link>
            <div className="min-w-0">
              <p className="hud-eyebrow truncate text-[11px] text-cyan-glow/70">
                {player?.pseudo ?? "…"} <span className="text-slate-600">//</span> Secteur {sectorCode}
              </p>
              <PreprodTag />
              {!pageHasHeader && <p className="hud-title truncate text-lg text-slate-100 md:hidden">{currentLabel ?? "Cosmic Empires"}</p>}
              <p className="hud-title hidden truncate text-lg text-slate-100 md:block">
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
              {/* 6.14.62 (AD-2) : plein écran, sons et musique au bureau seulement (place du nom et du serveur sur téléphone). */}
              <span className="hidden sm:contents">
                <FullscreenToggle />
                <SfxToggle />
                <MusicToggle />
              </span>
              <NotificationBell />
              {(blog.author || blog.admin) && (
                <HeaderButton title="Rédaction du devblog" asLink="/game/redaction">
                  <PenSquare className="h-4 w-4" />
                </HeaderButton>
              )}
              {isAdmin && (
                <HeaderButton title="Administration" asLink={pendingReports > 0 ? "/game/admin?onglet=reports" : "/game/admin"}>
                  <Wrench className="h-4 w-4" />
                  {pendingReports > 0 && (
                    // 6.14.86 : signalements à traiter = attention (orange), pas une menace.
                    <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center bg-ember-glow px-0.5 font-mono text-[11px] font-bold leading-none tabular-nums text-space-950">
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
          <div className="px-4 pb-2.5 pt-2 sm:px-6 md:pb-3 md:pt-2.5">
            <ResourceHud />
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-4 sm:px-6 md:overflow-y-auto md:py-5">
          {loading || !contentLoaded ? (
            <BootSequence />
          ) : (
            // Remonté quand l'administration modifie le contenu du jeu, pour
            // que chaque écran relise les nouvelles définitions.
            <Suspense key={contentVersion} fallback={<PageLoader />}>
              <PageTransition>
                <Outlet />
              </PageTransition>
            </Suspense>
          )}
        </main>
      </div>

      <LazyCombatResult />
      <WarpOverlay />
      <UltimatumDialog />
      {extrasOn && (
        <Suspense fallback={null}>
          <RankUpCelebration />
          <AwaySummaryModal />
          <SeasonReport />
          <AnnouncementDialog />
          <CommandPalette />
          <ShortcutsDialog />
          <TierUpOverlay />
          <RaidAlert />
        </Suspense>
      )}
      <FxLayer />
      <FleetReturnFx />
      <ServerDownBanner />
    </div>
  );
}
