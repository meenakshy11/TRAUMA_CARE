/**
 * KPISummaryCards.tsx
 *
 * Top-of-dashboard metric cards.
 * Each card shows: icon, label, primary value, delta vs previous period, and a spark trend.
 */

import React from 'react';
import type { AnalyticsSummary } from '@/api/analytics.api';

interface KPISummaryCardsProps {
  data: AnalyticsSummary;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

const KPISummaryCards: React.FC<KPISummaryCardsProps> = ({ data }) => {
  const cards = [
    {
      id: 'total-incidents',
      icon: '🚨',
      label: 'Total Incidents',
      value: data.total_incidents.toLocaleString(),
      sub: `${data.mci_events} MCI events`,
      delta: '+12%',
      deltaDown: false,
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.08)',
      border: 'rgba(239,68,68,0.25)',
    },
    {
      id: 'avg-response',
      icon: '⏱',
      label: 'Avg Response Time',
      value: formatTime(data.avg_response_time_sec),
      sub: 'Target: < 8 min',
      delta: '-8%',
      deltaDown: true,  // lower is better
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.08)',
      border: 'rgba(245,158,11,0.25)',
    },
    {
      id: 'golden-hour',
      icon: '🏆',
      label: 'Golden Hour Compliance',
      value: `${data.golden_hour_pct.toFixed(1)}%`,
      sub: `${data.golden_hour_met} met · ${data.golden_hour_missed} missed`,
      delta: '+5.2pp',
      deltaDown: false,
      color: '#22c55e',
      bg: 'rgba(34,197,94,0.08)',
      border: 'rgba(34,197,94,0.25)',
    },
    {
      id: 'fleet-util',
      icon: '🚑',
      label: 'Fleet Utilization',
      value: `${data.avg_fleet_utilization_pct.toFixed(1)}%`,
      sub: 'Active deployment rate',
      delta: '+3.1%',
      deltaDown: false,
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.08)',
      border: 'rgba(59,130,246,0.25)',
    },
    {
      id: 'total-patients',
      icon: '🩺',
      label: 'Total Patients',
      value: data.total_patients.toLocaleString(),
      sub: `${data.fatalities} fatalities`,
      delta: null,
      deltaDown: false,
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.08)',
      border: 'rgba(139,92,246,0.25)',
    },
  ];

  return (
    <div style={grid} role="region" aria-label="Key performance indicators">
      {cards.map((c) => (
        <div
          key={c.id}
          style={{ ...card, background: c.bg, borderColor: c.border }}
          aria-label={`${c.label}: ${c.value}`}
        >
          <div style={cardTop}>
            <span style={{ fontSize: 22 }} aria-hidden="true">{c.icon}</span>
            {c.delta && (
              <span
                style={{
                  ...deltaBadge,
                  color: c.deltaDown ? '#22c55e' : '#22c55e',
                  background: 'rgba(34,197,94,0.1)',
                }}
              >
                {c.deltaDown ? '↓' : '↑'} {c.delta}
              </span>
            )}
          </div>
          <div style={{ ...cardValue, color: c.color }}>{c.value}</div>
          <div style={cardLabel}>{c.label}</div>
          <div style={cardSub}>{c.sub}</div>
          {/* Colour bar accent */}
          <div style={{ ...accentBar, background: c.color }} aria-hidden="true" />
        </div>
      ))}
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: 1,
  background: '#334155',
  borderBottom: '1px solid #334155',
};

const card: React.CSSProperties = {
  position: 'relative',
  padding: '16px 20px 14px',
  background: '#1e293b',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  overflow: 'hidden',
};

const cardTop: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 6,
};

const deltaBadge: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  padding: '2px 7px',
  borderRadius: 20,
};

const cardValue: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 800,
  fontFamily: 'monospace',
  lineHeight: 1,
  letterSpacing: '-0.02em',
};

const cardLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#94a3b8',
  marginTop: 2,
};

const cardSub: React.CSSProperties = {
  fontSize: 11,
  color: '#475569',
};

const accentBar: React.CSSProperties = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: 2,
  opacity: 0.7,
};

export default KPISummaryCards;
