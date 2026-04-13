import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "react-hot-toast"
import { AppShell } from "./components/Layout/AppShell"
import { LoginPage } from "./pages/Login/LoginPage"
import { CommandCenterPage } from "./pages/CommandCenter/CommandCenterPage"
import { HospitalListPage } from "./pages/Hospitals/HospitalListPage"
import HospitalDetailPage from "./pages/Hospitals/HospitalDetailPage"
import { IncidentListPage } from "./pages/Incidents/IncidentListPage"
import { IncidentDetailPage } from "./pages/IncidentDetail/IncidentDetailPage"
import { AnalyticsDashboardPage } from "./pages/Analytics/AnalyticsDashboardPage"
import { BlackSpotPage } from "./pages/BlackSpots/BlackSpotPage"
import { SimulationPage } from "./pages/Simulation/SimulationPage"
import { HospitalDashboardPage } from "./pages/HospitalDashboard/HospitalDashboardPage"
import { HospitalStaffPortal } from "./pages/HospitalStaffPortal/HospitalStaffPortal"
import { AdminPage } from "./pages/Admin/AdminPage"
import { PublicReportPage } from "./pages/PublicReport/PublicReportPage"
import { NotFoundPage } from "./pages/NotFound/NotFoundPage"
import { useAuthStore } from "./store/authStore"

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } }
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "var(--color-bg-tertiary)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border-strong)",
              boxShadow: "var(--shadow-elevated)",
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
            },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/public-report" element={<PublicReportPage />} />

          {/* Protected shell */}
          <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<Navigate to="/command-center" replace />} />
            <Route path="command-center" element={<CommandCenterPage />} />

            {/* Incident routes */}
            <Route path="incidents" element={<IncidentListPage />} />
            <Route path="incidents/:id" element={<IncidentDetailPage />} />

            {/* Hospital routes */}
            <Route path="hospitals" element={<HospitalListPage />} />
            <Route path="hospitals/:id" element={<HospitalDetailPage />} />
            <Route path="hospital-dashboard" element={<HospitalDashboardPage />} />
            <Route path="hospital-staff" element={<HospitalStaffPortal />} />

            {/* Other pages */}
            <Route path="analytics" element={<AnalyticsDashboardPage />} />
            <Route path="blackspots" element={<BlackSpotPage />} />
            <Route path="simulation" element={<SimulationPage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
