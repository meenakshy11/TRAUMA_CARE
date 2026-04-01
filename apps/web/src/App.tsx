import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "react-hot-toast"
import { AppShell } from "./components/Layout/AppShell"
import { LoginPage } from "./pages/Login/LoginPage"
import { CommandCenterPage } from "./pages/CommandCenter/CommandCenterPage"
import { HospitalListPage } from "./pages/Hospitals/HospitalListPage"
import { IncidentListPage } from "./pages/Incidents/IncidentListPage"
import { AnalyticsDashboardPage } from "./pages/Analytics/AnalyticsDashboardPage"
import { BlackSpotPage } from "./pages/BlackSpots/BlackSpotPage"
import { SimulationPage } from "./pages/Simulation/SimulationPage"
import { HospitalDashboardPage } from "./pages/HospitalDashboard/HospitalDashboardPage"
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
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/public-report" element={<PublicReportPage />} />
          <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<Navigate to="/command-center" replace />} />
            <Route path="command-center" element={<CommandCenterPage />} />
            <Route path="incidents" element={<IncidentListPage />} />
            <Route path="hospitals" element={<HospitalListPage />} />
            <Route path="hospital-dashboard" element={<HospitalDashboardPage />} />
            <Route path="analytics" element={<AnalyticsDashboardPage />} />
            <Route path="blackspots" element={<BlackSpotPage />} />
            <Route path="simulation" element={<SimulationPage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
