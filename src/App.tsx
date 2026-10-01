import { lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GuestRoute, ProtectedRoute } from "@/routes/ProtectedRoute";
import { LoginPage } from "@/pages/LoginPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { AppShell } from "@/components/layout/AppShell";
import { MaintenanceGate } from "@/components/layout/MaintenanceGate";

// Chargées à la demande : chaque page du jeu part dans son propre chunk,
// pour ne pas alourdir le bundle initial (écran de connexion) avec des
// écrans que le joueur ne visitera peut-être pas tout de suite.
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
const LeviathanPage = lazy(() => import("@/pages/LeviathanPage").then((m) => ({ default: m.LeviathanPage })));
const SettingsPage = lazy(() => import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));

export default function App() {
  return (
    <TooltipProvider delayDuration={200}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MaintenanceGate>
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
                <Route path="palmares" element={<HallOfFamePage />} />
                <Route path="menaces" element={<ThreatsPage />} />
                <Route path="succes" element={<AchievementsPage />} />
                <Route path="alliance" element={<AlliancePage />} />
                <Route path="profil" element={<ProfilePage />} />
                <Route path="reglages" element={<SettingsPage />} />
                <Route path="admin" element={<AdminPage />} />
                <Route path="nouveautes" element={<ChangelogPage />} />
                <Route path="signalements" element={<ReportsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
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
