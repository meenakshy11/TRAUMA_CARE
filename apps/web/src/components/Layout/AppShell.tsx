/**
 * AppShell.tsx
 *
 * The root authenticated layout that wraps every protected page.
 *
 * Structure:
 * ┌─────────────────────────────────────────────────┐
 * │  <Sidebar />  │  <TopBar />                      │
 * │               │──────────────────────────────────│
 * │  (col. or     │  <main>                          │
 * │   expanded)   │    {children / <Outlet />}       │
 * │               │  </main>                         │
 * └─────────────────────────────────────────────────┘
 *
 * Responsibilities:
 *  • Owns the sidebar collapsed/expanded state (persisted to localStorage)
 *  • Provides the CSS grid that sizes sidebar + content columns
 *  • Passes notification count down to TopBar
 *  • Renders a notification drawer when the bell is clicked
 *  • Exposes a React context so deep children can toggle the sidebar
 *    without prop drilling
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Outlet } from 'react-router-dom';

import Sidebar from './Sidebar';
import TopBar  from './TopBar';
import { DEMO_NOTIFICATIONS } from '@/api/demo-fixtures';

// ─── AppShell Context ─────────────────────────────────────────────────────────

interface AppShellContextValue {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const AppShellContext = createContext<AppShellContextValue>({
  sidebarCollapsed: false,
  toggleSidebar: () => {},
});

/** Custom hook for children that need to read or toggle the sidebar state. */
export const useAppShell = () => useContext(AppShellContext);

// ─── Notification Drawer ──────────────────────────────────────────────────────

interface Notification {
  id: string;
  message: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  is_read: boolean;
  created_at: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  HIGH:   '#ef4444',
  MEDIUM: '#f59e0b',
  LOW:    '#3b82f6',
};

interface NotificationDrawerProps {
  notifications: Notification[];
  open: boolean;
  onClose: () => void;
  onMarkRead: (id: string) => void;
}

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  notifications,
  open,
  onClose,
  onMarkRead,
}) => {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="notif-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer panel */}
      <aside
        className={`notif-drawer ${open ? 'notif-drawer--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
      >
        <div className="notif-drawer__header">
          <h2 className="notif-drawer__title">Notifications</h2>
          <button
            className="notif-drawer__close"
            onClick={onClose}
            aria-label="Close notifications"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <ul className="notif-drawer__list" role="list">
          {notifications.length === 0 && (
            <li className="notif-drawer__empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              <p>No notifications</p>
            </li>
          )}
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`notif-item ${n.is_read ? 'notif-item--read' : 'notif-item--unread'}`}
            >
              <span
                className="notif-item__dot"
                style={{ background: SEVERITY_COLORS[n.severity] ?? '#6b7280' }}
                aria-hidden="true"
              />
              <div className="notif-item__body">
                <p className="notif-item__message">{n.message}</p>
                <time className="notif-item__time" dateTime={n.created_at}>
                  {formatRelativeTime(n.created_at)}
                </time>
              </div>
              {!n.is_read && (
                <button
                  className="notif-item__read-btn"
                  onClick={() => onMarkRead(n.id)}
                  aria-label="Mark as read"
                  title="Mark as read"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </button>
              )}
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
};

function formatRelativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

// ─── AppShell ─────────────────────────────────────────────────────────────────

const SIDEBAR_STORAGE_KEY = 'trauma_sidebar_collapsed';

const AppShell: React.FC = () => {
  // Restore sidebar state from localStorage (default: expanded)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [notifOpen, setNotifOpen] = useState(false);

  // Demo mode: use seeded notifications; live mode: would use notificationStore
  const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';
  const [notifications, setNotifications] = useState<Notification[]>(
    isDemo ? (DEMO_NOTIFICATIONS as Notification[]) : [],
  );

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  const handleMarkRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
  }, []);

  const handleNotificationClick = useCallback(() => {
    setNotifOpen((o) => !o);
  }, []);

  return (
    <AppShellContext.Provider value={{ sidebarCollapsed, toggleSidebar }}>
      <div
        className={`app-shell ${sidebarCollapsed ? 'app-shell--collapsed' : 'app-shell--expanded'}`}
        data-testid="app-shell"
      >
        {/* ── Side Navigation ──────────────────────────────────────────── */}
        <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

        {/* ── Main Column ──────────────────────────────────────────────── */}
        <div className="app-shell__main">
          {/* Top bar */}
          <TopBar
            unreadNotifications={unreadCount}
            onNotificationClick={handleNotificationClick}
          />

          {/* Page content rendered by React Router's <Outlet /> */}
          <main
            className="app-shell__content"
            id="main-content"
            aria-labelledby="page-title"
          >
            <Outlet />
          </main>
        </div>

        {/* ── Notification Drawer ───────────────────────────────────────── */}
        <NotificationDrawer
          notifications={notifications}
          open={notifOpen}
          onClose={() => setNotifOpen(false)}
          onMarkRead={handleMarkRead}
        />
      </div>
    </AppShellContext.Provider>
  );
};

export default AppShell;
