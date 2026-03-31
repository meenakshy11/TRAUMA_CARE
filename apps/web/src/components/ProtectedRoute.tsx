/**
 * ProtectedRoute.tsx
 *
 * A standalone route-guard component consumed by React Router v6's nested
 * <Route element={...}> pattern. It:
 *
 *  1. Waits for Zustand's persist middleware to finish rehydrating from
 *     localStorage (isHydrated). Without this guard, the app would flash
 *     the login page for ~1 frame even when a valid session exists.
 *
 *  2. Redirects unauthenticated users to /login, preserving the originally
 *     requested path in router state so Login can redirect back on success.
 *
 *  3. Optionally enforces role-based access. If allowedRoles is provided and
 *     the user's role is not in the list the component renders a full-screen
 *     403 Forbidden page instead of a redirect, so the URL doesn't change and
 *     the user understands why they can't access the page.
 *
 *  4. Renders <Outlet /> to pass through to child routes on success.
 *
 * Usage in App.tsx:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/" element={<CommandCenterPage />} />
 *   </Route>
 *
 *   <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
 *     <Route path="/admin" element={<AdminPage />} />
 *   </Route>
 */

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types/user.types';
import { ROUTES } from '@/App';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProtectedRouteProps {
  /**
   * If provided, only users whose `role` is in this list are allowed through.
   * All other authenticated users see the <ForbiddenScreen />.
   */
  allowedRoles?: UserRole[];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Shown while Zustand is still reading from localStorage on first paint. */
const HydrationLoader: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'var(--color-bg-primary, #0f172a)',
    }}
    aria-label="Loading session"
  >
    <div className="hydration-spinner" />
  </div>
);

/** Shown when the user is authenticated but lacks the required role. */
const ForbiddenScreen: React.FC<{ role: UserRole | undefined }> = ({ role }) => (
  <div className="forbidden-screen">
    <div className="forbidden-screen__icon" aria-hidden="true">🔒</div>
    <h1 className="forbidden-screen__title">Access Restricted</h1>
    <p className="forbidden-screen__message">
      Your account role{role ? ` (${role})` : ''} does not have permission to
      view this page. Contact your administrator if you believe this is an error.
    </p>
    <a href={ROUTES.COMMAND_CENTER} className="forbidden-screen__link">
      ← Return to Dashboard
    </a>
  </div>
);

// ─── ProtectedRoute ───────────────────────────────────────────────────────────

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const location = useLocation();

  // Subscribe to only the three slices we need to minimise re-renders
  const isHydrated      = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user            = useAuthStore((s) => s.user);

  // ── 1. Wait for session rehydration ────────────────────────────────────────
  // The persist middleware sets isHydrated via onRehydrateStorage once it has
  // finished reading from localStorage. Without this guard the first render
  // would always see isAuthenticated=false and redirect to /login.
  if (!isHydrated) {
    return <HydrationLoader />;
  }

  // ── 2. Unauthenticated → redirect to login ─────────────────────────────────
  if (!isAuthenticated) {
    return (
      <Navigate
        to={ROUTES.LOGIN}
        replace
        // Preserve the intended destination so LoginPage can redirect back
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  // ── 3. Role check ──────────────────────────────────────────────────────────
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return <ForbiddenScreen role={userRole} />;
    }
  }

  // ── 4. All checks passed — render children ─────────────────────────────────
  return <Outlet />;
};

export default ProtectedRoute;
