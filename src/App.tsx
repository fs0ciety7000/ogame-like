import { BanGate } from "@/components/layout/BanGate";
import { Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { installUiFx } from "@/lib/fx/installUiFx";
import { HudToaster } from "@/components/ui/hud-toast";
import { ConfirmHost } from "@/components/ui/confirm-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GuestRoute, ProtectedRoute } from "@/routes/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { MaintenanceGate } from "@/components/layout/MaintenanceGate";
import { lazyPage } from "@/lib/lazyPage";

// Chargées à la demande : chaque page du jeu part dans son propre chunk,
// pour ne pas alourdir le bundle initial (écran de connexion) avec des
// écrans que le joueur ne visitera peut-être pas tout de suite.
// Pages publiques chargées à la demande : le formulaire de connexion
// (react-hook-form) ne pèse plus sur le bundle du jeu.
const LoginPage = lazyPage(() => import("@/pages/LoginPage"), "LoginPage");
const ResetPasswordPage = lazyPage(() => import("@/pages/ResetPasswordPage"), "ResetPasswordPage");
const HallOfFamePage = lazyPage(() => import("@/pages/HallOfFamePage"), "HallOfFamePage");
const DashboardPage = lazyPage(() => import("@/pages/DashboardPage"), "DashboardPage");
const OrdersPage = lazyPage(() => import("@/pages/OrdersPage"), "OrdersPage");
const WalletPage = lazyPage(() => import("@/pages/WalletPage"), "WalletPage");
const ResourcesPage = lazyPage(() => import("@/pages/ResourcesPage"), "ResourcesPage");
const BuildingsPage = lazyPage(() => import("@/pages/BuildingsPage"), "BuildingsPage");
const UnitsPage = lazyPage(() => import("@/pages/UnitsPage"), "UnitsPage");
const LabPage = lazyPage(() => import("@/pages/LabPage"), "LabPage");
const MissionsPage = lazyPage(() => import("@/pages/MissionsPage"), "MissionsPage");
const PlayersPage = lazyPage(() => import("@/pages/PlayersPage"), "PlayersPage");
const AlliancePage = lazyPage(() => import("@/pages/AlliancePage"), "AlliancePage");
const TerritoryWarPage = lazyPage(() => import("@/pages/TerritoryWarPage"), "TerritoryWarPage");
const GalaxyPage = lazyPage(() => import("@/pages/GalaxyPage"), "GalaxyPage");
const CombatLogPage = lazyPage(() => import("@/pages/CombatLogPage"), "CombatLogPage");
const AchievementsPage = lazyPage(() => import("@/pages/AchievementsPage"), "AchievementsPage");
const ThreatsPage = lazyPage(() => import("@/pages/ThreatsPage"), "ThreatsPage");
const ProfilePage = lazyPage(() => import("@/pages/ProfilePage"), "ProfilePage");
const BlogEditorPage = lazyPage(() => import("@/pages/BlogEditorPage"), "BlogEditorPage");
const AscensionPage = lazyPage(() => import("@/pages/AscensionPage"), "AscensionPage");
const EmpireStatsPage = lazyPage(() => import("@/pages/EmpireStatsPage"), "EmpireStatsPage");
const FormulasPage = lazyPage(() => import("@/pages/FormulasPage"), "FormulasPage");
const PublicFormulasPage = lazyPage(() => import("@/pages/PublicFormulasPage"), "PublicFormulasPage");
const StatusPage = lazyPage(() => import("@/pages/StatusPage"), "StatusPage");
const CodexPage = lazyPage(() => import("@/pages/CodexPage"), "CodexPage");
const ChroniclesPage = lazyPage(() => import("@/pages/ChroniclesPage"), "ChroniclesPage");
const AnnouncementsPage = lazyPage(() => import("@/pages/AnnouncementsPage"), "AnnouncementsPage");
const ChangelogPage = lazyPage(() => import("@/pages/ChangelogPage"), "ChangelogPage");
const AdminPage = lazyPage(() => import("@/pages/AdminPage"), "AdminPage");
const ReportsPage = lazyPage(() => import("@/pages/ReportsPage"), "ReportsPage");
// Bible visuelle : page statique publique (public/bible), hors de l'application.
function BibleRedirect() {
  window.location.replace("/bible/index.html");
  return null;
}

const SimulatorPage = lazyPage(() => import("@/pages/SimulatorPage"), "SimulatorPage");
const PlannerPage = lazyPage(() => import("@/pages/PlannerPage"), "PlannerPage");
const CommercePage = lazyPage(() => import("@/pages/CommercePage"), "CommercePage");
const ColoniesPage = lazyPage(() => import("@/pages/ColoniesPage"), "ColoniesPage");
const LeviathanPage = lazyPage(() => import("@/pages/LeviathanPage"), "LeviathanPage");
const GazettePage = lazyPage(() => import("@/pages/GazettePage"), "GazettePage");
const SeasonBossPage = lazyPage(() => import("@/pages/SeasonBossPage"), "SeasonBossPage");
const BossHallPage = lazyPage(() => import("@/pages/BossHallPage"), "BossHallPage");
const AlliancePublicPage = lazyPage(() => import("@/pages/AlliancePublicPage"), "AlliancePublicPage");
const CasinoPage = lazyPage(() => import("@/pages/CasinoPage"), "CasinoPage");
const ContestsPage = lazyPage(() => import("@/pages/ContestsPage"), "ContestsPage");
const WarlordsPage = lazyPage(() => import("@/pages/WarlordsPage"), "WarlordsPage");
const SeasonPassPage = lazyPage(() => import("@/pages/SeasonPassPage"), "SeasonPassPage");
const CommandPage = lazyPage(() => import("@/pages/CommandPage"), "CommandPage");
const BountiesPage = lazyPage(() => import("@/pages/BountiesPage"), "BountiesPage");
const MessagesPage = lazyPage(() => import("@/pages/MessagesPage"), "MessagesPage");
const SharedReportPage = lazyPage(() => import("@/pages/SharedReportPage"), "SharedReportPage");
const JournalPage = lazyPage(() => import("@/pages/JournalPage"), "JournalPage");
const SettingsPage = lazyPage(() => import("@/pages/SettingsPage"), "SettingsPage");

/** 5.25 : retour visuel global (clics, survols, panneaux) installé une fois. */
function UiFx() {
  useEffect(() => {
    const uninstall = installUiFx();
    return uninstall;
  }, []);
  return null;
}

export default function App() {
  return (
    // 5.15 : « réduire les animations » du système respecté partout (Framer Motion).
    <MotionConfig reducedMotion="user">
    <TooltipProvider delayDuration={200}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MaintenanceGate>
          <BanGate>
          <Suspense fallback={null}>
          <Routes>
            <Route
              path="/"
              element={
                <GuestRoute>
                  <LoginPage />
                </GuestRoute>
              }
            />
            {/* Lien de l'email « mot de passe oublié » : accessible connecté ou non. */}
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/bible" element={<BibleRedirect />} />
            <Route path="/formules" element={<PublicFormulasPage />} />
            <Route path="/statut" element={<StatusPage />} />
            {/* v5.9 : page statique publique (vérification OAuth Google). */}
            <Route path="/confidentialite" element={<StaticPageRedirect to="/confidentialite.html" />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/game" element={<AppShell />}>
                <Route index element={<DashboardPage />} />
                <Route path="ordres" element={<OrdersPage />} />
                <Route path="portefeuille" element={<WalletPage />} />
                <Route path="ressources" element={<ResourcesPage />} />
                <Route path="batiments" element={<BuildingsPage />} />
                <Route path="unites" element={<UnitsPage />} />
                <Route path="labo" element={<LabPage />} />
                <Route path="missions" element={<MissionsPage />} />
                <Route path="joueurs" element={<PlayersPage />} />
                <Route path="galaxie" element={<GalaxyPage />} />
                <Route path="combats" element={<CombatLogPage />} />
                <Route path="simulateur" element={<SimulatorPage />} />
                <Route path="planificateur" element={<PlannerPage />} />
                <Route path="commerce" element={<CommercePage />} />
                {/* 5.26 : Marché et Hôtel des enchères réunis dans Commerce (anciens liens gardés). */}
                <Route path="marche" element={<CommerceRedirect tab="marche" />} />
                <Route path="encheres" element={<CommerceRedirect tab="encheres" />} />
                <Route path="uber" element={<LeviathanPage />} />
                {/* 5.15 : ancienne adresse du boss mondial (liens des notifications passées). */}
                <Route path="leviathan" element={<Navigate to="/game/uber" replace />} />
                <Route path="primes" element={<BountiesPage />} />
                <Route path="etat-major" element={<CommandPage />} />
                <Route path="passe" element={<SeasonPassPage />} />
                <Route path="colonies" element={<ColoniesPage />} />
                <Route path="statistiques" element={<EmpireStatsPage />} />
                <Route path="ascension" element={<AscensionPage />} />
                <Route path="redaction" element={<BlogEditorPage />} />
                <Route path="palmares" element={<HallOfFamePage />} />
                <Route path="menaces" element={<ThreatsPage />} />
                <Route path="seigneurs" element={<WarlordsPage />} />
                <Route path="boss" element={<SeasonBossPage />} />
                <Route path="hall-of-fame" element={<BossHallPage />} />
                <Route path="concours" element={<ContestsPage />} />
                <Route path="casino" element={<CasinoPage />} />
                <Route path="gazette" element={<GazettePage />} />
                <Route path="succes" element={<AchievementsPage />} />
                <Route path="alliance" element={<AlliancePage />} />
                <Route path="alliance/fiche/:id" element={<AlliancePublicPage />} />
                <Route path="guerre-territoire" element={<TerritoryWarPage />} />
                <Route path="profil" element={<ProfilePage />} />
                <Route path="reglages" element={<SettingsPage />} />
                <Route path="admin" element={<AdminPage />} />
                <Route path="journal" element={<JournalPage />} />
                <Route path="rapport/:id" element={<SharedReportPage />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="nouveautes" element={<ChangelogPage />} />
                <Route path="annonces" element={<AnnouncementsPage />} />
                <Route path="codex" element={<CodexPage />} />
                <Route path="chroniques" element={<ChroniclesPage />} />
                <Route path="formules" element={<FormulasPage />} />
                <Route path="signalements" element={<ReportsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
          </BanGate>
        </MaintenanceGate>
      </BrowserRouter>

      <HudToaster />
      <ConfirmHost />
      <UiFx />
    </TooltipProvider>
    </MotionConfig>
  );
}

/** Adresse sans extension d'une page statique de public/ : on recharge la vraie page. */
function StaticPageRedirect({ to }: { to: string }) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);
  return null;
}

/** 5.26 : anciennes adresses du Marché et de l'Hôtel des enchères → onglet de Commerce. */
function CommerceRedirect({ tab }: { tab: "marche" | "encheres" }) {
  const [params] = useSearchParams();
  const onglet = tab === "marche" && params.get("onglet") === "contrats" ? "contrats" : tab;
  return <Navigate to={`/game/commerce?onglet=${onglet}`} replace />;
}
