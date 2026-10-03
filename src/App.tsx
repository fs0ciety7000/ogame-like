import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GuestRoute, ProtectedRoute } from "@/routes/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { MaintenanceGate } from "@/components/layout/MaintenanceGate";

// Chargées à la demande : chaque page du jeu part dans son propre chunk,
// pour ne pas alourdir le bundle initial (écran de connexion) avec des
// écrans que le joueur ne visitera peut-être pas tout de suite.
// Pages publiques chargées à la demande : le formulaire de connexion
// (react-hook-form) ne pèse plus sur le bundle du jeu.
const LoginPage = lazy(() => import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage").then((m) => ({ default: m.ResetPasswordPage })));
const DashboardPage = lazy(() => import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const ResourcesPage = lazy(() => import("@/pages/ResourcesPage").then((m) => ({ default: m.ResourcesPage })));
const BuildingsPage = lazy(() => import("@/pages/BuildingsPage").then((m) => ({ default: m.BuildingsPage })));
const UnitsPage = lazy(() => import("@/pages/UnitsPage").then((m) => ({ default: m.UnitsPage })));
const LabPage = lazy(() => import("@/pages/LabPage").then((m) => ({ default: m.LabPage })));
const MissionsPage = lazy(() => import("@/pages/MissionsPage").then((m) => ({ default: m.MissionsPage })));
const PlayersPage = lazy(() => import("@/pages/PlayersPage").then((m) => ({ default: m.PlayersPage })));
const AlliancePage = lazy(() => import("@/pages/AlliancePage").then((m) => ({ default: m.AlliancePage })));
const GalaxyPage = lazy(() => import("@/pages/GalaxyPage").then((m) => ({ default: m.GalaxyPage })));
const CombatLogPage = lazy(() => import("@/pages/CombatLogPage").then((m) => ({ default: m.CombatLogPage })));
const AchievementsPage = lazy(() => import("@/pages/AchievementsPage").then((m) => ({ default: m.AchievementsPage })));
const ThreatsPage = lazy(() => import("@/pages/ThreatsPage").then((m) => ({ default: m.ThreatsPage })));
const HallOfFamePage = lazy(() => import("@/pages/HallOfFamePage").then((m) => ({ default: m.HallOfFamePage })));
const ProfilePage = lazy(() => import("@/pages/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const BlogEditorPage = lazy(() => import("@/pages/BlogEditorPage").then((m) => ({ default: m.BlogEditorPage })));
const EmpireStatsPage = lazy(() => import("@/pages/EmpireStatsPage").then((m) => ({ default: m.EmpireStatsPage })));
const FormulasPage = lazy(() => import("@/pages/FormulasPage").then((m) => ({ default: m.FormulasPage })));
const PublicFormulasPage = lazy(() => import("@/pages/PublicFormulasPage").then((m) => ({ default: m.PublicFormulasPage })));
const CodexPage = lazy(() => import("@/pages/CodexPage").then((m) => ({ default: m.CodexPage })));
const AnnouncementsPage = lazy(() => import("@/pages/AnnouncementsPage").then((m) => ({ default: m.AnnouncementsPage })));
const ChangelogPage = lazy(() => import("@/pages/ChangelogPage").then((m) => ({ default: m.ChangelogPage })));
const AdminPage = lazy(() => import("@/pages/AdminPage").then((m) => ({ default: m.AdminPage })));
const ReportsPage = lazy(() => import("@/pages/ReportsPage").then((m) => ({ default: m.ReportsPage })));
// Bible visuelle : page statique publique (public/bible), hors de l'application.
function BibleRedirect() {
  window.location.replace("/bible/index.html");
  return null;
}

const SimulatorPage = lazy(() => import("@/pages/SimulatorPage").then((m) => ({ default: m.SimulatorPage })));
const MarketPage = lazy(() => import("@/pages/MarketPage").then((m) => ({ default: m.MarketPage })));
const ColoniesPage = lazy(() => import("@/pages/ColoniesPage").then((m) => ({ default: m.ColoniesPage })));
const LeviathanPage = lazy(() => import("@/pages/LeviathanPage").then((m) => ({ default: m.LeviathanPage })));
const GazettePage = lazy(() => import("@/pages/GazettePage").then((m) => ({ default: m.GazettePage })));
const SeasonBossPage = lazy(() => import("@/pages/SeasonBossPage").then((m) => ({ default: m.SeasonBossPage })));
const WarlordsPage = lazy(() => import("@/pages/WarlordsPage").then((m) => ({ default: m.WarlordsPage })));
const SeasonPassPage = lazy(() => import("@/pages/SeasonPassPage").then((m) => ({ default: m.SeasonPassPage })));
const CommandPage = lazy(() => import("@/pages/CommandPage").then((m) => ({ default: m.CommandPage })));
const BountiesPage = lazy(() => import("@/pages/BountiesPage").then((m) => ({ default: m.BountiesPage })));
const MessagesPage = lazy(() => import("@/pages/MessagesPage").then((m) => ({ default: m.MessagesPage })));
const SharedReportPage = lazy(() => import("@/pages/SharedReportPage").then((m) => ({ default: m.SharedReportPage })));
const JournalPage = lazy(() => import("@/pages/JournalPage").then((m) => ({ default: m.JournalPage })));
const SettingsPage = lazy(() => import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));

export default function App() {
  return (
    <TooltipProvider delayDuration={200}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MaintenanceGate>
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

            <Route element={<ProtectedRoute />}>
              <Route path="/game" element={<AppShell />}>
                <Route index element={<DashboardPage />} />
                <Route path="ressources" element={<ResourcesPage />} />
                <Route path="batiments" element={<BuildingsPage />} />
                <Route path="unites" element={<UnitsPage />} />
                <Route path="labo" element={<LabPage />} />
                <Route path="missions" element={<MissionsPage />} />
                <Route path="joueurs" element={<PlayersPage />} />
                <Route path="galaxie" element={<GalaxyPage />} />
                <Route path="combats" element={<CombatLogPage />} />
                <Route path="simulateur" element={<SimulatorPage />} />
                <Route path="marche" element={<MarketPage />} />
                <Route path="leviathan" element={<LeviathanPage />} />
                <Route path="primes" element={<BountiesPage />} />
                <Route path="etat-major" element={<CommandPage />} />
                <Route path="passe" element={<SeasonPassPage />} />
                <Route path="colonies" element={<ColoniesPage />} />
                <Route path="statistiques" element={<EmpireStatsPage />} />
                <Route path="redaction" element={<BlogEditorPage />} />
                <Route path="palmares" element={<HallOfFamePage />} />
                <Route path="menaces" element={<ThreatsPage />} />
                <Route path="seigneurs" element={<WarlordsPage />} />
                <Route path="boss" element={<SeasonBossPage />} />
                <Route path="gazette" element={<GazettePage />} />
                <Route path="succes" element={<AchievementsPage />} />
                <Route path="alliance" element={<AlliancePage />} />
                <Route path="profil" element={<ProfilePage />} />
                <Route path="reglages" element={<SettingsPage />} />
                <Route path="admin" element={<AdminPage />} />
                <Route path="journal" element={<JournalPage />} />
                <Route path="rapport/:id" element={<SharedReportPage />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="nouveautes" element={<ChangelogPage />} />
                <Route path="annonces" element={<AnnouncementsPage />} />
                <Route path="codex" element={<CodexPage />} />
                <Route path="formules" element={<FormulasPage />} />
                <Route path="signalements" element={<ReportsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </MaintenanceGate>
      </BrowserRouter>

      <Toaster
        theme="dark"
        position="top-right"
        expand
        visibleToasts={4}
        closeButton
        toastOptions={{
          style: {
            background: "rgba(10,14,28,0.92)",
            border: "1px solid rgba(75,232,255,0.2)",
            color: "#e7ecff",
          },
        }}
      />
    </TooltipProvider>
  );
}
