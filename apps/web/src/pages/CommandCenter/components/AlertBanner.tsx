/**
 * AlertBanner.tsx
 * Full-width dismissible alert banner shown at the top of the command center
 * for HIGH severity notifications that need immediate attention.
 */
import React, { useState } from 'react';
import { DEMO_NOTIFICATIONS } from '@/api/demo-fixtures';

interface Alert {
  id: string;
  message: string;
  severity: string;
  is_read: boolean;
}

const AlertBanner: React.FC = () => {
  const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';
  const rawAlerts: Alert[] = isDemo ? (DEMO_NOTIFICATIONS as Alert[]) : [];
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const active = rawAlerts.filter(
    (a) => a.severity === 'HIGH' && !a.is_read && !dismissed.has(a.id),
  );

  if (active.length === 0) return null;

  const top = active[0]!;

  return (
    <div className="alert-banner" role="alert" aria-live="assertive">
      <span className="alert-banner__pulse" aria-hidden="true" />
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <span className="alert-banner__message">{top.message}</span>
      {active.length > 1 && (
        <span className="alert-banner__count">+{active.length - 1} more</span>
      )}
      <button
        className="alert-banner__dismiss"
        onClick={() => setDismissed((s) => new Set([...s, top.id]))}
        aria-label="Dismiss alert"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
};

export default AlertBanner;
