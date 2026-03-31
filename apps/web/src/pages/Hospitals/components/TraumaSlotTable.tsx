/**
 * TraumaSlotTable.tsx
 *
 * Concise resource summary table used inside the Hospital Detail page.
 * Shows all critical resources in a scannable grid with status pills.
 *
 * Props:
 *  resources — HospitalResources (from hospitalStore / hospitals.api.ts)
 */

import React from 'react';

// Match the shape from demo-fixtures / hospitalStore
export interface HospitalResources {
  icu_beds_total: number;
  icu_beds_available: number;
  ed_capacity_total: number;
  ed_capacity_current: number;
  ventilators_total: number;
  ventilators_available: number;
  ot_available: boolean;
  blood_bank_available: boolean;
  specialist_on_duty: boolean;
}

interface TraumaSlotTableProps {
  resources: HospitalResources;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(available: number, total: number): number {
  if (total === 0) return 0;
  return ((total - available) / total) * 100;
}

function usageColor(usedPct: number): string {
  if (usedPct >= 90) return '#ef4444';
  if (usedPct >= 70) return '#f97316';
  if (usedPct >= 50) return '#f59e0b';
  return '#22c55e';
}

function boolColor(val: boolean): string {
  return val ? '#22c55e' : '#ef4444';
}

// ─── Component ────────────────────────────────────────────────────────────────

const TraumaSlotTable: React.FC<TraumaSlotTableProps> = ({ resources: r }) => {
  const icuPct = pct(r.icu_beds_available, r.icu_beds_total);
  const edPct  = pct(r.ed_capacity_total - r.ed_capacity_current, r.ed_capacity_total);

  const numericRows: {
    label: string;
    icon: string;
    available: number;
    total: number;
    usedPct: number;
    key: string;
  }[] = [
    { key: 'icu',  icon: '🛏',  label: 'ICU Beds',       available: r.icu_beds_available,    total: r.icu_beds_total,      usedPct: icuPct },
    { key: 'ed',   icon: '🚨',  label: 'ED Occupancy',   available: r.ed_capacity_total - r.ed_capacity_current, total: r.ed_capacity_total, usedPct: edPct },
    { key: 'vent', icon: '💨',  label: 'Ventilators',    available: r.ventilators_available, total: r.ventilators_total,   usedPct: pct(r.ventilators_available, r.ventilators_total) },
  ];

  const boolRows: { key: string; icon: string; label: string; value: boolean }[] = [
    { key: 'ot',       icon: '🔦', label: 'Operating Theatre',   value: r.ot_available },
    { key: 'blood',    icon: '🩸', label: 'Blood Bank',          value: r.blood_bank_available },
    { key: 'spec',     icon: '👨‍⚕️', label: 'Specialist On Duty', value: r.specialist_on_duty },
  ];

  return (
    <div style={table}>
      {/* ── Numeric resources ─────────────────────────────────────── */}
      {numericRows.map((row) => {
        const color = usageColor(row.usedPct);
        return (
          <div key={row.key} style={numRow}>
            <div style={rowLeft}>
              <span style={rowIcon}>{row.icon}</span>
              <span style={rowLabel}>{row.label}</span>
            </div>
            <div style={rowRight}>
              {/* Mini bar */}
              <div style={miniTrack} aria-hidden="true">
                <div style={{ ...miniFill, width: `${row.usedPct}%`, background: color }} />
              </div>
              <span style={{ ...numValue, color }}>
                {row.available}
                <span style={{ color: '#475569', fontWeight: 400 }}>/{row.total}</span>
              </span>
              <span style={{ ...statusPill, background: `${color}18`, color, borderColor: `${color}33` }}>
                {row.usedPct >= 90 ? 'CRITICAL' : row.usedPct >= 70 ? 'HIGH' : row.usedPct >= 50 ? 'MED' : 'OK'}
              </span>
            </div>
          </div>
        );
      })}

      {/* ── Divider ───────────────────────────────────────────────── */}
      <div style={divider} aria-hidden="true" />

      {/* ── Boolean resources ─────────────────────────────────────── */}
      {boolRows.map((row) => (
        <div key={row.key} style={numRow}>
          <div style={rowLeft}>
            <span style={rowIcon}>{row.icon}</span>
            <span style={rowLabel}>{row.label}</span>
          </div>
          <span
            style={{
              ...boolPill,
              background: `${boolColor(row.value)}18`,
              color: boolColor(row.value),
              borderColor: `${boolColor(row.value)}33`,
            }}
          >
            {row.value ? '✓ Available' : '✗ Unavailable'}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const table: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
};

const numRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '10px 0',
  borderBottom: '1px solid #1e293b',
};

const rowLeft: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 0,
};

const rowIcon: React.CSSProperties = {
  fontSize: 14,
  flexShrink: 0,
};

const rowLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#94a3b8',
};

const rowRight: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexShrink: 0,
};

const miniTrack: React.CSSProperties = {
  width: 60,
  height: 5,
  background: '#0f172a',
  borderRadius: 3,
  overflow: 'hidden',
  border: '1px solid #334155',
};

const miniFill: React.CSSProperties = {
  height: '100%',
  borderRadius: 3,
  transition: 'width 0.4s ease',
};

const numValue: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  fontFamily: 'monospace',
  minWidth: 36,
  textAlign: 'right',
};

const statusPill: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 800,
  padding: '2px 7px',
  borderRadius: 10,
  border: '1px solid',
  letterSpacing: '0.06em',
  minWidth: 52,
  textAlign: 'center',
};

const boolPill: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  padding: '3px 10px',
  borderRadius: 10,
  border: '1px solid',
};

const divider: React.CSSProperties = {
  height: 1,
  background: '#334155',
  margin: '4px 0',
};

export default TraumaSlotTable;
