/**
 * TopBar.tsx
 *
 * The horizontal top navigation bar rendered above the main content area.
 *
 * Contains:
 *  • Breadcrumb / page title (derived from the current route)
 *  • Live clock in IST (India Standard Time — platform context)
 *  • Demo mode chip (prominent, yellow) so users always know they're in demo mode
 *  • Notification bell with unread count badge
 *  • Connection status indicator (WebSocket connected / polling / offline)
 *  • User context pill (role + name)
 *  • Escape hatch: direct link to docs / support
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/App';

// ─── Route → Title map ────────────────────────────────────────────────────────

function getRouteTitles(): Record<string, string> {
  return {
    [ROUTES.COMMAND_CENTER]: 'Command Center',
    [ROUTES.HOSPITALS]:      'Hospitals',
    [ROUTES.ANALYTICS]:      'Analytics Dashboard',
    [ROUTES.BLACKSPOTS]:     'Accident Black Spots',
    [ROUTES.SIMULATION]:     'Simulation',
    [ROUTES.ADMIN]:          'Administration',
    '/incidents':            'Incidents',
    '/ambulances':           'Fleet Management',
  };
}

function usePageTitle(): string {
  const { pathname } = useLocation();
  const titles = getRouteTitles();

  // exact match first
  if (titles[pathname]) return titles[pathname];

  // prefix match (e.g. /incidents/inc-001 → 'Incidents')
  const prefix = Object.keys(titles).find(
    (k) => k !== '/' && pathname.startsWith(k),
  );
  if (prefix) return titles[prefix];

  return 'Integrated Trauma Care';
}

// ─── Live Clock ───────────────────────────────────────────────────────────────

function useLiveClock() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Format in IST (UTC+5:30)
  const formatted = time.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const date = time.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return { time: formatted, date };
}

// ─── Notification Bell ────────────────────────────────────────────────────────

interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ unreadCount, onClick }) => (
  <button
    className="topbar__icon-btn"
    onClick={onClick}
    aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
    id="notification-bell-btn"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
    {unreadCount > 0 && (
      <span className="topbar__badge" aria-hidden="true">
        {unreadCount > 9 ? '9+' : unreadCount}
      </span>
    )}
  </button>
);

// ─── Connection Status ────────────────────────────────────────────────────────

type ConnectionStatus = 'connected' | 'polling' | 'offline';

const STATUS_CONFIG: Record<ConnectionStatus, { label: string; color: string; pulse: boolean }> = {
  connected: { label: 'Live',    color: '#22c55e', pulse: true  },
  polling:   { label: 'Polling', color: '#f59e0b', pulse: false },
  offline:   { label: 'Offline', color: '#ef4444', pulse: false },
};

const ConnectionIndicator: React.FC<{ status: ConnectionStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <div className="topbar__connection" title={`Data feed: ${cfg.label}`} aria-label={`Status: ${cfg.label}`}>
      <span
        className={`topbar__connection-dot ${cfg.pulse ? 'topbar__connection-dot--pulse' : ''}`}
        style={{ background: cfg.color, boxShadow: cfg.pulse ? `0 0 6px ${cfg.color}` : 'none' }}
        aria-hidden="true"
      />
      <span className="topbar__connection-label">{cfg.label}</span>
    </div>
  );
};

// ─── TopBar Component ─────────────────────────────────────────────────────────

interface TopBarProps {
  /** Unread notification count — passed from AppShell which owns the store access */
  unreadNotifications?: number;
  /** Called when the notification bell is clicked */
  onNotificationClick?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  unreadNotifications = 0,
  onNotificationClick = () => {},
}) => {
  const user   = useAuthStore((s) => s.user);
  const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';
  const wsEnabled = import.meta.env.VITE_FEATURE_WEBSOCKET !== 'false';

  const title = usePageTitle();
  const { time, date } = useLiveClock();

  // In demo mode there's no real WS; in live mode we'd subscribe to a WS status
  // feed. For now default to polling in demo, "connected" in live (mocked).
  const connectionStatus: ConnectionStatus = isDemo ? 'polling' : 'connected';

  return (
    <header className="topbar" role="banner">
      {/* ── Left: Page title ──────────────────────────────────────────── */}
      <div className="topbar__left">
        <h1 className="topbar__title" id="page-title">
          {title}
        </h1>
        {isDemo && (
          <span className="topbar__demo-chip" role="status" aria-label="Demo mode active">
            <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true">
              <circle cx="6" cy="6" r="5" fill="currentColor" opacity="0.3"/>
              <circle cx="6" cy="6" r="3" fill="currentColor"/>
            </svg>
            DEMO
          </span>
        )}
      </div>

      {/* ── Right: Controls cluster ───────────────────────────────────── */}
      <div className="topbar__right">
        {/* Live IST clock */}
        <div className="topbar__clock" aria-label={`Current time: ${time} IST`} title={date}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <time dateTime={new Date().toISOString()} className="topbar__clock-time">
            {time}
          </time>
          <span className="topbar__clock-zone">IST</span>
        </div>

        {/* WebSocket / connection status */}
        <ConnectionIndicator status={connectionStatus} />

        {/* Divider */}
        <div className="topbar__divider" aria-hidden="true" />

        {/* Notification bell */}
        <NotificationBell
          unreadCount={unreadNotifications}
          onClick={onNotificationClick}
        />

        {/* User pill */}
        {user && (
          <div className="topbar__user-pill" aria-label={`Signed in as ${user.full_name}`}>
            <span className="topbar__user-avatar" aria-hidden="true">
              {user.full_name.charAt(0).toUpperCase()}
            </span>
            <span className="topbar__user-name">
              {user.full_name.split(' ')[0]}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;
