import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GuestRoute, ProtectedRoute } from "@/routes/ProtectedRoute";
import { LoginPage } from "@/pages/LoginPage";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardPage } from "@/pages/DashboardPage";
import { ResourcesPage } from "@/pages/ResourcesPage";
import { BuildingsPage } from "@/pages/BuildingsPage";
import { UnitsPage } from "@/pages/UnitsPage";
import { LabPage } from "@/pages/LabPage";
import { MissionsPage } from "@/pages/MissionsPage";
import { PlayersPage } from "@/pages/PlayersPage";
import { ProfilePage } from "@/pages/ProfilePage";

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
              <Route path="profil" element={<ProfilePage />} />
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
