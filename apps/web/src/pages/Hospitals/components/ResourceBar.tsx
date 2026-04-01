/**
 * ResourceBar.tsx
 *
 * Reusable horizontal progress bar that visually represents
 * resource availability vs total capacity.
 *
 * Colour rules:
 *  ≥ 75% full → red    (critical — overloaded)
 *  ≥ 50% full → orange (high usage)
 *  ≥ 25% full → amber  (moderate)
 *  < 25% full → green  (plenty available)
 *
 * Usage:
 *  <ResourceBar label="ICU Beds" available={6} total={40} />
 *  <ResourceBar label="Ventilators" available={1} total={30} critical />
 */

import React from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResourceBarProps {
  label: string;
  available: number;
  total: number;
  /** Force the bar into critical colour regardless of threshold */
  critical?: boolean;
  /** Show an icon before the label */
  icon?: string;
  /** Compact mode hides the fraction text */
  compact?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function barColor(usedPct: number, forceCritical: boolean): string {
  if (forceCritical || usedPct >= 75) return '#ef4444';
  if (usedPct >= 50) return '#f97316';
  if (usedPct >= 25) return '#f59e0b';
  return '#22c55e';
}

function statusLabel(usedPct: number): string {
  if (usedPct >= 90) return 'CRITICAL';
  if (usedPct >= 75) return 'HIGH';
  if (usedPct >= 50) return 'MODERATE';
  return 'OK';
}

// ─── Component ────────────────────────────────────────────────────────────────

const ResourceBar: React.FC<ResourceBarProps> = ({
  label,
  available,
  total,
  critical = false,
  icon,
  compact = false,
}) => {
  const used    = total - available;
  const usedPct = total === 0 ? 0 : Math.min((used / total) * 100, 100);
  const color   = barColor(usedPct, critical);
  const status  = statusLabel(usedPct);
  const isAlert = usedPct >= 75 || critical;

  return (
    <div style={wrapper} role="meter" aria-valuenow={available} aria-valuemin={0} aria-valuemax={total} aria-label={`${label}: ${available} of ${total} available`}>
      {/* Row 1: label + fraction */}
      <div style={labelRow}>
        <span style={labelText}>
          {icon && <span aria-hidden="true" style={{ marginRight: 5 }}>{icon}</span>}
          {label}
        </span>
        <div style={rightSide}>
          {!compact && (
            <span style={{ ...fraction, color: isAlert ? color : '#94a3b8' }}>
              {available}/{total}
            </span>
          )}
          <span
            style={{
              ...statusBadge,
              background: `${color}18`,
              color,
              borderColor: `${color}33`,
            }}
          >
            {status}
          </span>
        </div>
      </div>

      {/* Row 2: progress track */}
      <div style={track} aria-hidden="true">
        {/* Filled portion */}
        <div
          style={{
            ...fill,
            width: `${usedPct}%`,
            background: color,
            boxShadow: isAlert ? `0 0 6px ${color}88` : 'none',
          }}
        />
        {/* Available portion */}
        <div
          style={{
            ...availableMarker,
            width: `${100 - usedPct}%`,
            opacity: usedPct >= 95 ? 0 : 1,
          }}
        />
      </div>

      {/* Row 3: sub-label (available count emphasis) */}
      {!compact && (
        <div style={subLabel}>
          <span style={{ color }}>
            {available === 0
              ? '⚠ No capacity remaining'
              : `${available} ${label.toLowerCase()} available`}
          </span>
          {total > 0 && (
            <span style={{ color: '#475569' }}>
              {usedPct.toFixed(0)}% utilised
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const wrapper: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 5,
};

const labelRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
};

const labelText: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#94a3b8',
  display: 'flex',
  alignItems: 'center',
};

const rightSide: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const fraction: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  fontFamily: 'monospace',
};

const statusBadge: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 800,
  padding: '1px 6px',
  borderRadius: 10,
  border: '1px solid',
  letterSpacing: '0.06em',
  whiteSpace: 'nowrap',
};

const track: React.CSSProperties = {
  display: 'flex',
  height: 8,
  borderRadius: 4,
  overflow: 'hidden',
  background: '#0f172a',
  border: '1px solid #334155',
};

const fill: React.CSSProperties = {
  height: '100%',
  borderRadius: '4px 0 0 4px',
  transition: 'width 0.4s ease, background 0.3s ease',
  flexShrink: 0,
};

const availableMarker: React.CSSProperties = {
  height: '100%',
  background: 'rgba(255,255,255,0.04)',
  transition: 'width 0.4s ease',
  borderRadius: '0 4px 4px 0',
};

const subLabel: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 10,
  fontWeight: 500,
};

export default ResourceBar;
