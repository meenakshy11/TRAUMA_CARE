/**
 * PatientList.tsx
 *
 * Renders all patients for an incident.
 * Each patient entry is expandable to show the full TriageCard + VitalSignsChart.
 *
 * Props:
 *  patients — Patient[] from IncidentDetail
 */

import React, { useState } from 'react';
import type { Patient } from '../IncidentDetailPage';
import TriageCard       from './TriageCard';
import VitalSignsChart  from './VitalSignsChart';

// ─── Triage colour config ─────────────────────────────────────────────────────

export const TRIAGE_CONFIG = {
  RED:    { label: 'IMMEDIATE',  bg: '#7f1d1d', fg: '#fca5a5', border: '#dc2626' },
  YELLOW: { label: 'DELAYED',   bg: '#78350f', fg: '#fcd34d', border: '#d97706' },
  GREEN:  { label: 'MINOR',     bg: '#14532d', fg: '#86efac', border: '#16a34a' },
  BLACK:  { label: 'EXPECTANT', bg: '#111827', fg: '#9ca3af', border: '#374151' },
} as const;

const GENDER_LABELS = { MALE: 'M', FEMALE: 'F', UNKNOWN: '?' };

// ─── Component ────────────────────────────────────────────────────────────────

interface PatientListProps {
  patients: Patient[];
}

const PatientList: React.FC<PatientListProps> = ({ patients }) => {
  const [expanded, setExpanded] = useState<string | null>(
    patients.length > 0 ? patients[0].id : null,
  );

  if (patients.length === 0) {
    return <p style={emptyStyle}>No patients recorded yet.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {patients.map((patient) => {
        const triage  = patient.triage_color ? TRIAGE_CONFIG[patient.triage_color] : null;
        const isOpen  = expanded === patient.id;
        const latestVital = patient.vitals[patient.vitals.length - 1];

        return (
          <div
            key={patient.id}
            style={{
              ...cardStyle,
              borderColor: triage?.border ?? '#334155',
            }}
          >
            {/* ── Patient header (always visible) ─────────────────────── */}
            <button
              style={headerBtn}
              onClick={() => setExpanded(isOpen ? null : patient.id)}
              aria-expanded={isOpen}
              aria-controls={`patient-detail-${patient.id}`}
            >
              {/* Triage colour swatch */}
              <div
                style={{
                  ...triageSwatch,
                  background: triage?.bg ?? '#1e293b',
                  borderColor: triage?.border ?? '#334155',
                }}
                title={triage?.label ?? 'Unassigned'}
                aria-label={`Triage: ${triage?.label ?? 'Unassigned'}`}
              >
                {patient.triage_color?.charAt(0) ?? '?'}
              </div>

              <div style={headerInfo}>
                <div style={patientTitle}>
                  <span style={patientNumStyle}>Patient #{patient.sequence_no}</span>
                  {triage && (
                    <span style={{ ...triageBadge, background: triage.bg, color: triage.fg, borderColor: triage.border }}>
                      {triage.label}
                    </span>
                  )}
                </div>
                <div style={patientMeta}>
                  {patient.age_estimate != null && (
                    <span>{patient.age_estimate}y</span>
                  )}
                  <span>{GENDER_LABELS[patient.gender]}</span>
                  {patient.is_conscious !== null && (
                    <span style={{ color: patient.is_conscious ? '#22c55e' : '#ef4444' }}>
                      {patient.is_conscious ? '👁 Conscious' : '😵 Unconscious'}
                    </span>
                  )}
                  {patient.is_breathing !== null && (
                    <span style={{ color: patient.is_breathing ? '#22c55e' : '#ef4444' }}>
                      {patient.is_breathing ? '🫁 Breathing' : '⚠️ Apnoeic'}
                    </span>
                  )}
                </div>
              </div>

              {/* Latest vitals snapshot */}
              {latestVital && (
                <div style={vitalsSnapshot}>
                  {latestVital.spo2 != null && (
                    <VitalChip
                      label="SpO₂"
                      value={`${latestVital.spo2}%`}
                      warn={latestVital.spo2 < 94}
                      critical={latestVital.spo2 < 88}
                    />
                  )}
                  {latestVital.pulse_rate != null && (
                    <VitalChip
                      label="HR"
                      value={`${latestVital.pulse_rate}`}
                      warn={latestVital.pulse_rate > 100 || latestVital.pulse_rate < 60}
                      critical={latestVital.pulse_rate > 130 || latestVital.pulse_rate < 50}
                    />
                  )}
                  {latestVital.gcs_score != null && (
                    <VitalChip
                      label="GCS"
                      value={`${latestVital.gcs_score}/15`}
                      warn={latestVital.gcs_score < 13}
                      critical={latestVital.gcs_score < 9}
                    />
                  )}
                </div>
              )}

              <svg
                width="16" height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#64748b"
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {/* ── Expanded detail ──────────────────────────────────────── */}
            {isOpen && (
              <div id={`patient-detail-${patient.id}`} style={detailArea}>
                {/* Injury description */}
                {patient.injury_description && (
                  <div style={injuryBlock}>
                    <span style={injuryLabel}>Injury</span>
                    <p style={injuryText}>{patient.injury_description}</p>
                  </div>
                )}

                {/* Triage card */}
                {patient.triage && (
                  <TriageCard triage={patient.triage} />
                )}

                {/* Vitals chart */}
                {patient.vitals.length > 0 && (
                  <VitalSignsChart vitals={patient.vitals} />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── VitalChip ────────────────────────────────────────────────────────────────

interface VitalChipProps {
  label: string;
  value: string;
  warn?: boolean;
  critical?: boolean;
}

const VitalChip: React.FC<VitalChipProps> = ({ label, value, warn, critical }) => {
  const color = critical ? '#ef4444' : warn ? '#f59e0b' : '#22c55e';
  return (
    <div style={{ ...vitalChipStyle, borderColor: `${color}44`, background: `${color}11` }}>
      <span style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
};

// ─── Inline styles ────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: '#1e293b',
  border: '1px solid',
  borderRadius: 8,
  overflow: 'hidden',
};

const headerBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  padding: '12px 14px',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'left',
};

const triageSwatch: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 6,
  border: '1px solid',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 14,
  fontWeight: 900,
  color: '#fff',
  flexShrink: 0,
};

const headerInfo: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const patientTitle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 3,
};

const patientNumStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: '#f1f5f9',
};

const triageBadge: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  padding: '1px 6px',
  borderRadius: 4,
  border: '1px solid',
  letterSpacing: '0.06em',
};

const patientMeta: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontSize: 11,
  color: '#94a3b8',
};

const vitalsSnapshot: React.CSSProperties = {
  display: 'flex',
  gap: 6,
  flexShrink: 0,
};

const vitalChipStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '4px 8px',
  border: '1px solid',
  borderRadius: 6,
  gap: 1,
};

const detailArea: React.CSSProperties = {
  padding: '0 14px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  borderTop: '1px solid #334155',
  paddingTop: 14,
};

const injuryBlock: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const injuryLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const injuryText: React.CSSProperties = {
  fontSize: 13,
  color: '#cbd5e1',
  margin: 0,
  lineHeight: 1.5,
};

const emptyStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#64748b',
  margin: 0,
};

export default PatientList;