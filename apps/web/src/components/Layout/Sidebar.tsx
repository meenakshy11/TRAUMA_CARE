/**
 * Sidebar.tsx
 *
 * Collapsible left navigation rail for the authenticated shell.
 *
 * Features:
 *  • Expanded (240 px) / collapsed (64 px) modes with smooth CSS transition
 *  • Role-aware nav items — items with allowedRoles are hidden if the user
 *    doesn't have the right role (avoids confusing users with inaccessible links)
 *  • Active route highlighting via NavLink
 *  • Notification badge on the bell icon fed from notificationStore
 *  • Demo mode banner with current role pill
 *  • Keyboard accessible toggle button (Ctrl+B shortcut)
 */

import React, { useCallback, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ROUTES } from '@/App';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types/user.types';

// ─── Navigation Config ────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  allowedRoles?: UserRole[];
  badge?: number;
}

const CrosshairIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/>
    <line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/>
  </svg>
);
const AlertTriangleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const TruckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);
const HospitalIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const BarChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);
const MapPinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const FlaskIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3h6M9 3v7L5.5 16.5A2 2 0 007.26 19.5h9.48a2 2 0 001.76-2.95L15 10V3"/>
  </svg>
);
const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const getNavItems = (): NavItem[] => [
  {
    label: 'Command Center',
    path: ROUTES.COMMAND_CENTER,
    icon: <CrosshairIcon />,
    allowedRoles: ['DISPATCHER', 'ADMIN'],
  },
  {
    label: 'Hospital Hub',
    path: ROUTES.HOSPITAL_DASHBOARD,
    icon: <HospitalIcon />,
    allowedRoles: ['HOSPITAL_STAFF', 'ADMIN'],
  },
  {
    label: 'Incidents',
    path: ROUTES.INCIDENTS,
    icon: <AlertTriangleIcon />,
  },
  {
    label: 'Fleet',
    path: '#', // Temporarily disabled until List view is built
    icon: <TruckIcon />,
  },
  {
    label: 'Hospitals',
    path: ROUTES.HOSPITALS,
    icon: <HospitalIcon />,
  },
  {
    label: 'Analytics',
    path: ROUTES.ANALYTICS,
    icon: <BarChartIcon />,
    allowedRoles: ['ADMIN', 'GOVERNMENT'],
  },
  {
    label: 'Black Spots',
    path: ROUTES.BLACKSPOTS,
    icon: <MapPinIcon />,
    allowedRoles: ['ADMIN', 'DISPATCHER', 'GOVERNMENT'],
  },
  {
    label: 'Simulation',
    path: ROUTES.SIMULATION,
    icon: <FlaskIcon />,
    allowedRoles: ['ADMIN'],
  },
  {
    label: 'Admin',
    path: ROUTES.ADMIN,
    icon: <ShieldIcon />,
    allowedRoles: ['ADMIN'],
  },
];

const ROLE_COLORS: Record<UserRole, string> = {
  DISPATCHER:     '#3b82f6',
  ADMIN:          '#8b5cf6',
  HOSPITAL_STAFF: '#10b981',
  GOVERNMENT:     '#f59e0b',
  PARAMEDIC:      '#ef4444',
  DRIVER:         '#6b7280',
  PUBLIC:         '#6b7280',
};

// ─── Component ─────────────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location  = useLocation();
  const user      = useAuthStore((s) => s.user);
  const logout    = useAuthStore((s) => s.logout);
  const isDemo    = import.meta.env.VITE_DEMO_MODE === 'true';

  // Ctrl+B keyboard shortcut to toggle sidebar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        onToggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onToggle]);

  const isNavItemVisible = useCallback(
    (item: NavItem) => {
      if (!item.allowedRoles) return true;
      if (!user?.role) return false;
      return item.allowedRoles.includes(user.role as UserRole);
    },
    [user?.role],
  );

  const roleColor = user?.role ? (ROLE_COLORS[user.role as UserRole] ?? '#6b7280') : '#6b7280';

  return (
    <aside
      className={`sidebar ${collapsed ? 'sidebar--collapsed' : 'sidebar--expanded'}`}
      aria-label="Main navigation"
    >
      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="url(#logo-grad)"/>
            <path d="M16 6v20M6 16h20" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
            <path d="M10 10l12 12M22 10L10 22" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
            <defs>
              <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ef4444"/>
                <stop offset="1" stopColor="#b91c1c"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        {!collapsed && (
          <span className="sidebar__logo-text">
            Trauma<span className="sidebar__logo-accent">Care</span>
          </span>
        )}
        <button
          className="sidebar__toggle"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
          title={collapsed ? 'Expand (Ctrl+B)' : 'Collapse (Ctrl+B)'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {collapsed
              ? <><polyline points="9 18 15 12 9 6"/></>
              : <><polyline points="15 18 9 12 15 6"/></>
            }
          </svg>
        </button>
      </div>

      {/* ── Demo Banner ───────────────────────────────────────────────────── */}
      {isDemo && !collapsed && (
        <div className="sidebar__demo-banner">
          <span className="sidebar__demo-dot" aria-hidden="true" />
          DEMO MODE
        </div>
      )}

      {/* ── Nav Items ─────────────────────────────────────────────────────── */}
      <nav className="sidebar__nav" aria-label="Primary navigation">
        <ul className="sidebar__nav-list" role="list">
          {getNavItems().filter(isNavItemVisible).map((item) => {
            // Exact match for root, prefix match for everything else
            const isActive =
              item.path === ROUTES.COMMAND_CENTER
                ? location.pathname === ROUTES.COMMAND_CENTER
                : location.pathname.startsWith(item.path);

            return (
              <li key={item.path} className="sidebar__nav-item">
                <NavLink
                  to={item.path}
                  className={`sidebar__nav-link ${isActive ? 'sidebar__nav-link--active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="sidebar__nav-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className="sidebar__nav-label">{item.label}</span>
                  )}
                  {!collapsed && item.badge != null && item.badge > 0 && (
                    <span className="sidebar__nav-badge" aria-label={`${item.badge} unread`}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── User Profile Footer ───────────────────────────────────────────── */}
      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div
            className="sidebar__avatar"
            style={{ background: `linear-gradient(135deg, ${roleColor}33, ${roleColor}66)`, borderColor: roleColor }}
            aria-hidden="true"
          >
            <span style={{ color: roleColor }}>
              {user?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
            </span>
          </div>
          {!collapsed && (
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">{user?.full_name ?? 'Unknown'}</span>
              <span className="sidebar__user-role" style={{ color: roleColor }}>
                {user?.role?.replace('_', ' ') ?? ''}
              </span>
            </div>
          )}
        </div>

        <button
          className="sidebar__logout"
          onClick={logout}
          aria-label="Sign out"
          title="Sign out"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
