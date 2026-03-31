/**
 * AdminPage.tsx
 *
 * Administration hub — landing page for the /admin route.
 * Acts as a navigation gateway to all administrative sub-sections.
 *
 * Sub-sections:
 *  1. Fleet Registry       — Ambulance management
 *  2. User Management      — Staff accounts and role assignments
 *  3. Hospital Registry    — Facility onboarding and configuration
 *  4. Alert Rules          — SLA thresholds and notification config
 *  5. Staging Stations     — EMS post management
 */

import React from 'react';
import { Link } from 'react-router-dom';

// ─── Nav card config ──────────────────────────────────────────────────────────

interface AdminCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  href: string;
  color: string;
  badge?: string;
}

const ADMIN_CARDS: AdminCard[] = [
  {
    id: 'fleet',
    icon: '🚑',
    title: 'Fleet Registry',
    description: 'View and manage the complete ambulance fleet — vehicle types, crew assignments, equipment, and service schedules.',
    href: '/admin/ambulances',
    color: '#ef4444',
    badge: 'Live',
  },
  {
    id: 'users',
    icon: '👤',
    title: 'User Management',
    description: 'Manage dispatcher, hospital staff, paramedic, and government accounts. Assign roles and reset credentials.',
    href: '/admin/users',
    color: '#3b82f6',
  },
  {
    id: 'hospitals',
    icon: '🏥',
    title: 'Hospital Registry',
    description: 'Onboard trauma centres, configure capacity thresholds, and manage facility profiles in the Kerala Trauma Grid.',
    href: '/admin/hospitals',
    color: '#22c55e',
  },
  {
    id: 'alerts',
    icon: '🔔',
    title: 'Alert Rules',
    description: 'Configure SLA breach thresholds (response time, ICU capacity), escalation paths, and notification channels.',
    href: '/admin/alerts',
    color: '#f59e0b',
    badge: 'Beta',
  },
  {
    id: 'stations',
    icon: '📍',
    title: 'Staging Stations',
    description: 'Manage EMS staging post locations, coverage zones, and vehicle assignment to stations across Kerala.',
    href: '/admin/stations',
    color: '#a78bfa',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

const AdminPage: React.FC = () => (
  <div style={page}>
    {/* Header */}
    <header style={header}>
      <div>
        <h1 style={h1}>🛡 Platform Administration</h1>
        <p style={subtitle}>
          System configuration, fleet governance, and user management for the Kerala Trauma Network.
        </p>
      </div>
      <div style={roleChip}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
        ADMIN ACCESS
      </div>
    </header>

    {/* Cards grid */}
    <div style={grid}>
      {ADMIN_CARDS.map((card) => (
        <Link key={card.id} to={card.href} style={navCard} aria-label={card.title}>
          {/* Colour accent bar */}
          <div style={{ ...accentBar, background: card.color }} />

          <div style={cardTop}>
            <span style={{ fontSize: 28 }} aria-hidden="true">{card.icon}</span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {card.badge && (
                <span style={{
                  fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 10,
                  background: `${card.color}22`, color: card.color, border: `1px solid ${card.color}44`,
                  letterSpacing: '0.06em',
                }}>
                  {card.badge}
                </span>
              )}
              <span style={{ fontSize: 18, color: '#334155' }}>→</span>
            </div>
          </div>

          <h2 style={{ ...cardTitle, color: card.color }}>{card.title}</h2>
          <p style={cardDesc}>{card.description}</p>
        </Link>
      ))}
    </div>

    {/* System status footer */}
    <div style={statusFooter}>
      <div style={statusItem}>
        <span style={{ ...statusDot, background: '#22c55e' }} />
        <span>Backend API — Demo Mode</span>
      </div>
      <div style={statusItem}>
        <span style={{ ...statusDot, background: '#22c55e' }} />
        <span>WebSocket — Simulated</span>
      </div>
      <div style={statusItem}>
        <span style={{ ...statusDot, background: '#f59e0b' }} />
        <span>Mobile App — Pending Integration</span>
      </div>
      <div style={{ marginLeft: 'auto', fontSize: 11, color: '#334155' }}>
        Kerala Trauma Network v1.0 · KSUM MVP
      </div>
    </div>
  </div>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const page: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', height: '100%',
  background: '#0f172a', color: '#f1f5f9', overflow: 'hidden',
};
const header: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '20px 28px 16px', borderBottom: '1px solid #334155',
  background: '#1e293b', flexShrink: 0,
};
const h1: React.CSSProperties = { fontSize: 22, fontWeight: 800, margin: '0 0 3px' };
const subtitle: React.CSSProperties = { fontSize: 13, color: '#64748b', margin: 0 };
const roleChip: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 7,
  padding: '6px 14px', background: 'rgba(34,197,94,0.08)',
  border: '1px solid rgba(34,197,94,0.25)', borderRadius: 20,
  fontSize: 11, fontWeight: 700, color: '#22c55e', flexShrink: 0,
};
const grid: React.CSSProperties = {
  flex: 1, overflow: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent',
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 20, padding: 28, alignContent: 'start',
};
const navCard: React.CSSProperties = {
  position: 'relative', background: '#1e293b', border: '1px solid #334155',
  borderRadius: 14, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10,
  textDecoration: 'none', overflow: 'hidden',
  transition: 'border-color 0.15s, transform 0.15s',
};
const accentBar: React.CSSProperties = {
  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
};
const cardTop: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
};
const cardTitle: React.CSSProperties = {
  fontSize: 16, fontWeight: 800, margin: 0,
};
const cardDesc: React.CSSProperties = {
  fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.6,
};
const statusFooter: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 20, padding: '10px 28px',
  borderTop: '1px solid #1e293b', flexShrink: 0,
};
const statusItem: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: '#475569',
};
const statusDot: React.CSSProperties = {
  width: 7, height: 7, borderRadius: '50%',
};

export default AdminPage;
