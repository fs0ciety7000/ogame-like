import { lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GuestRoute, ProtectedRoute } from "@/routes/ProtectedRoute";
import { LoginPage } from "@/pages/LoginPage";
import { AppShell } from "@/components/layout/AppShell";

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
const CombatLogPage = lazy(() => import("@/pages/CombatLogPage").then((m) => ({ default: m.CombatLogPage })));
const ProfilePage = lazy(() => import("@/pages/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));

export default function App() {
  return (
    <TooltipProvider delayDuration={200}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route
            path="/"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />

          <Route element={<ProtectedRoute />}>
            <Route path="/game" element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="ressources" element={<ResourcesPage />} />
              <Route path="batiments" element={<BuildingsPage />} />
              <Route path="unites" element={<UnitsPage />} />
              <Route path="labo" element={<LabPage />} />
              <Route path="missions" element={<MissionsPage />} />
              <Route path="joueurs" element={<PlayersPage />} />
              <Route path="combats" element={<CombatLogPage />} />
              <Route path="alliance" element={<AlliancePage />} />
              <Route path="profil" element={<ProfilePage />} />
              <Route path="reglages" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        theme="dark"
        position="top-right"
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
