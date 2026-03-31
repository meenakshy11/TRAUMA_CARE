/**
 * TriageCard.tsx
 *
 * Displays the START triage protocol assessment for a single patient.
 * Shows: triage colour, protocol, individual criteria checks, score,
 * assessed-by, and timestamp.
 *
 * Props:
 *  triage — TriageRecord from IncidentDetailPage
 */

import React from 'react';
import type { TriageRecord, TriageColor } from '../IncidentDetailPage';

// ─── Config ───────────────────────────────────────────────────────────────────

const TRIAGE_CONFIG: Record<TriageColor, { label: string; description: string; bg: string; fg: string; border: string }> = {
  RED: {
    label: 'IMMEDIATE',
    description: 'Life-threatening injury requiring immediate intervention.',
    bg: '#7f1d1d', fg: '#fca5a5', border: '#dc2626',
  },
  YELLOW: {
    label: 'DELAYED',
    description: 'Serious injury but can safely delay treatment.',
    bg: '#78350f', fg: '#fcd34d', border: '#d97706',
  },
  GREEN: {
    label: 'MINOR',
    description: 'Ambulatory. Minor injuries, can wait.',
    bg: '#14532d', fg: '#86efac', border: '#16a34a',
  },
  BLACK: {
    label: 'EXPECTANT',
    description: 'Deceased or unsurvivable injury. Expectant care only.',
    bg: '#111827', fg: '#9ca3af', border: '#374151',
  },
};

// START criteria display config
const CRITERIA = [
  { key: 'respirations_ok',   label: 'Respirations',    okText: 'Present / < 30 bpm',      failText: 'Absent / ≥ 30 bpm' },
  { key: 'perfusion_ok',      label: 'Perfusion',       okText: 'Radial pulse present',     failText: 'No radial pulse' },
  { key: 'mental_status_ok',  label: 'Mental Status',   okText: 'Follows simple commands',  failText: 'Cannot follow commands' },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

interface TriageCardProps {
  triage: TriageRecord;
}

const TriageCard: React.FC<TriageCardProps> = ({ triage }) => {
  const cfg = TRIAGE_CONFIG[triage.triage_color];

  return (
    <div
      style={{
        ...cardStyle,
        borderColor: cfg.border,
      }}
      role="region"
      aria-label={`Triage assessment: ${cfg.label}`}
    >
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ ...headerStyle, background: cfg.bg, borderBottomColor: cfg.border }}>
        <div style={headerLeft}>
          <span
            style={{
              ...colorSwatch,
              background: cfg.fg,
              color: cfg.bg,
            }}
            aria-hidden="true"
          >
            {triage.triage_color.charAt(0)}
          </span>
          <div>
            <div style={{ ...colorLabel, color: cfg.fg }}>{cfg.label}</div>
            <div style={protocolBadge}>{triage.protocol} Protocol</div>
          </div>
        </div>
        <div style={scoreBlock}>
          <span style={scoreLabel}>Score</span>
          <span style={{ ...scoreValue, color: cfg.fg }}>{triage.triage_score}/12</span>
        </div>
      </div>

      {/* ── Description ─────────────────────────────────────────────── */}
      <p style={descStyle}>{cfg.description}</p>

      {/* ── START Criteria ──────────────────────────────────────────── */}
      <div style={criteriaGrid}>
        {CRITERIA.map(({ key, label, okText, failText }) => {
          const ok = triage[key];
          return (
            <div key={key} style={{ ...criterionRow, borderColor: ok ? '#16a34a22' : '#dc262622' }}>
              <div
                style={{
                  ...criterionIcon,
                  background: ok ? '#14532d' : '#7f1d1d',
                  color:      ok ? '#86efac' : '#fca5a5',
                }}
                aria-hidden="true"
              >
                {ok
                  ? <CheckIcon />
                  : <XIcon />
                }
              </div>
              <div style={criterionBody}>
                <span style={criterionLabel}>{label}</span>
                <span style={{ ...criterionValue, color: ok ? '#86efac' : '#fca5a5' }}>
                  {ok ? okText : failText}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <div style={footerStyle}>
        {triage.assessed_by && (
          <span style={footerMeta}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            {triage.assessed_by}
          </span>
        )}
        <time
          dateTime={triage.created_at}
          style={footerMeta}
          title={new Date(triage.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {new Date(triage.created_at).toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })} IST
        </time>
      </div>
    </div>
  );
};

// ─── SVG helpers ──────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: '#0f172a',
  border: '1px solid',
  borderRadius: 8,
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 14px',
  borderBottom: '1px solid',
};

const headerLeft: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const colorSwatch: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 15,
  fontWeight: 900,
  flexShrink: 0,
};

const colorLabel: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: '0.06em',
  lineHeight: 1.2,
};

const protocolBadge: React.CSSProperties = {
  fontSize: 10,
  color: '#94a3b8',
  marginTop: 2,
};

const scoreBlock: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: 1,
};

const scoreLabel: React.CSSProperties = {
  fontSize: 9,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const scoreValue: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  fontFamily: 'monospace',
  lineHeight: 1,
};

const descStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#64748b',
  margin: '8px 14px 0',
  fontStyle: 'italic',
};

const criteriaGrid: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: '10px 14px 0',
};

const criterionRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '6px 8px',
  border: '1px solid',
  borderRadius: 6,
  background: 'rgba(255,255,255,0.02)',
};

const criterionIcon: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: 4,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const criterionBody: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flex: 1,
  gap: 8,
};

const criterionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: '#94a3b8',
};

const criterionValue: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textAlign: 'right',
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '8px 14px',
  borderTop: '1px solid #1e293b',
  marginTop: 10,
};

const footerMeta: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  fontSize: 10,
  color: '#475569',
};

export default TriageCard;