import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from '@components/ProtectedRoute';
import AppShell       from '@components/Layout/AppShell';
import PageLoader     from '@components/ui/PageLoader';
import NotFoundPage   from '@pages/NotFound/NotFoundPage';
import { useAuthStore } from '@store/authStore';

// ─── Lazy-loaded Pages ────────────────────────────────────────────────────────
// Each page is code-split so only the required bundle is downloaded.

// Public
const LoginPage = lazy(() => import('@pages/Login/LoginPage'));
const PublicReportPage = lazy(
  () => import('@pages/PublicReport/PublicReportPage'),
);

// Protected — Command Center (Dispatcher)
const CommandCenterPage = lazy(
  () => import('@pages/CommandCenter/CommandCenterPage'),
);

// Protected — Incidents
const IncidentListPage = lazy(
  () => import('@pages/Incidents/IncidentListPage'),
);
const IncidentDetailPage = lazy(
  () => import('@pages/IncidentDetail/IncidentDetailPage'),
);

// Protected — Hospitals
const HospitalListPage = lazy(
  () => import('@pages/Hospitals/HospitalListPage'),
);
const HospitalDetailPage = lazy(
  () => import('@pages/Hospitals/HospitalDetailPage'),
);
const HospitalDashboardPage = lazy(
  () => import('@pages/HospitalDashboard/HospitalDashboardPage'),
);

// Protected — Analytics (ADMIN / GOVERNMENT)
const AnalyticsDashboardPage = lazy(
  () => import('@pages/Analytics/AnalyticsDashboardPage'),
);

// Protected — Black Spots
const BlackSpotPage = lazy(() => import('@pages/BlackSpots/BlackSpotPage'));

// Protected — Simulation (ADMIN)
const SimulationPage = lazy(() => import('@pages/Simulation/SimulationPage'));

// Protected — Admin
const AdminPage = lazy(() => import('@pages/Admin/AdminPage'));

// ─── Route Constants ─────────────────────────────────────────────────────────
export const ROUTES = {
  // Public
  LOGIN: '/login',
  PUBLIC_REPORT: '/report',

  // Protected
  COMMAND_CENTER: '/',
  INCIDENTS: '/incidents',
  INCIDENT_DETAIL: '/incidents/:incidentId',
  HOSPITALS: '/hospitals',
  HOSPITAL_DETAIL: '/hospitals/:hospitalId',
  HOSPITAL_DASHBOARD: '/hospital-dashboard',
  ANALYTICS: '/analytics',
  BLACKSPOTS: '/blackspots',
  SIMULATION: '/simulation',
  ADMIN: '/admin',
} as const;

// ProtectedRoute and AppShell are now their own files — see
// @components/ProtectedRoute.tsx and @components/Layout/AppShell.tsx

// ─── Root App Component ───────────────────────────────────────────────────────
/**
 * App is intentionally thin — it only owns the route tree.
 * All real state lives in Zustand stores (authStore, incidentStore, etc.)
 * All data fetching lives in React Query hooks inside the pages.
 */
const App: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Public Routes ─────────────────────────────────────────── */}

        {/*
         * /login — Authentication page.
         * If the user is already authenticated redirect them to the
         * Command Center so they don't see a redundant login form.
         */}
        <Route
          path={ROUTES.LOGIN}
          element={<AuthGuardedLogin />}
        />

        {/*
         * /report — Unauthenticated citizen accident reporting form.
         * Enabled only when VITE_FEATURE_PUBLIC_REPORT=true.
         */}
        {import.meta.env.VITE_FEATURE_PUBLIC_REPORT === 'true' && (
          <Route path={ROUTES.PUBLIC_REPORT} element={<PublicReportPage />} />
        )}

        {/* ── Protected Routes — wrapped in AppShell for sidebar+topbar ── */}
        <Route element={<ProtectedRoute />}>
          {/*
           * AppShell provides the sidebar + topbar layout for all
           * authenticated pages. Its <Outlet /> renders each child route.
           */}
          <Route element={<AppShell />}>
            {/*
             * / — Main Command Center (Dispatcher view).
             * Full-screen map with live ambulance tracking, incident feed,
             * dispatch panel, hospital capacity strip, and alert banner.
             */}
            <Route path={ROUTES.COMMAND_CENTER} element={<CommandCenterPage />} />

            <Route path={ROUTES.INCIDENTS} element={<IncidentListPage />} />

            {/*
             * /incidents/:incidentId — Detailed view of a single incident.
             * Shows timeline, patients, triage, vitals, photos, dispatch history.
             */}
            <Route
              path={ROUTES.INCIDENT_DETAIL}
              element={<IncidentDetailPage />}
            />

            {/* /hospitals — Grid / list of all hospitals + resource summary */}
            <Route path={ROUTES.HOSPITALS} element={<HospitalListPage />} />

            <Route
              path={ROUTES.HOSPITAL_DETAIL}
              element={<HospitalDetailPage />}
            />

            <Route 
              path={ROUTES.HOSPITAL_DASHBOARD} 
              element={<HospitalDashboardPage />} 
            />

            {/*
             * /blackspots — Accident black spot registry + heatmap overlay.
             * Enabled when VITE_FEATURE_BLACKSPOTS=true.
             */}
            {import.meta.env.VITE_FEATURE_BLACKSPOTS !== 'false' && (
              <Route path={ROUTES.BLACKSPOTS} element={<BlackSpotPage />} />
            )}

            {/* ── Role-Restricted Protected Routes ─────────────────── */}

            {/*
             * /analytics — KPI dashboard, golden-hour charts, district
             * performance matrix. Restricted to ADMIN and GOVERNMENT roles.
             */}
            {import.meta.env.VITE_FEATURE_ANALYTICS !== 'false' && (
              <Route
                element={<ProtectedRoute allowedRoles={['ADMIN', 'GOVERNMENT']} />}
              >
                <Route
                  path={ROUTES.ANALYTICS}
                  element={<AnalyticsDashboardPage />}
                />
              </Route>
            )}

            {/*
             * /simulation — Coverage gap analysis and scenario modelling.
             * Restricted to ADMIN only.
             */}
            {import.meta.env.VITE_FEATURE_SIMULATION !== 'false' && (
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path={ROUTES.SIMULATION} element={<SimulationPage />} />
              </Route>
            )}

            {/*
             * /admin — User management, ambulance fleet, alert rule config.
             * Restricted to ADMIN only.
             */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path={ROUTES.ADMIN} element={<AdminPage />} />
            </Route>
          </Route>
        </Route>

        {/* ── 404 Catch-all ─────────────────────────────────────────── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

// ─── AuthGuardedLogin ─────────────────────────────────────────────────────────
/**
 * Wraps the LoginPage: if the user is already authenticated redirect
 * to the command center (or the original destination stored in history state).
 */
const AuthGuardedLogin: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to={ROUTES.COMMAND_CENTER} replace />;
  }

  return <LoginPage />;
};

export default App;
