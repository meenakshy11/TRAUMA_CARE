/**
 * VitalSignsChart.tsx
 *
 * Multi-metric line chart for a patient's vital signs over time.
 * Built with Recharts (assumed installed via the project's package.json).
 *
 * Metrics rendered:
 *  • SpO₂ (%)            — cyan   — warning < 94%, critical < 88%
 *  • Pulse Rate (bpm)    — red    — warning > 100 or < 60
 *  • GCS Score (/15)     — purple — warning < 13, critical < 9
 *  • Systolic BP (mmHg)  — amber  — warning > 140 or < 90
 *  • Respiratory Rate    — green  — warning > 20 or < 12
 *
 * Props:
 *  vitals — VitalSign[] ordered by created_at ascending
 *
 * Features:
 *  • Metric toggle buttons — hide/show each series
 *  • Custom tooltip with formatted values + colour coding
 *  • Reference lines for normal ranges
 *  • Responsive container adapts to column width
 *  • Latest value snapshot bar
 */

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from 'recharts';
import type { VitalSign } from '../IncidentDetailPage';

// ─── Metric config ────────────────────────────────────────────────────────────

interface MetricConfig {
  key: keyof VitalSign;
  label: string;
  unit: string;
  color: string;
  warnLow?: number;
  warnHigh?: number;
  criticalLow?: number;
  criticalHigh?: number;
  yDomain?: [number, number];
}

const METRICS: MetricConfig[] = [
  {
    key: 'spo2',
    label: 'SpO₂',
    unit: '%',
    color: '#06b6d4',
    warnLow: 94,
    criticalLow: 88,
    yDomain: [70, 100],
  },
  {
    key: 'pulse_rate',
    label: 'HR',
    unit: 'bpm',
    color: '#ef4444',
    warnLow: 60,
    warnHigh: 100,
    criticalHigh: 130,
    criticalLow: 50,
    yDomain: [30, 160],
  },
  {
    key: 'gcs_score',
    label: 'GCS',
    unit: '/15',
    color: '#a78bfa',
    warnLow: 13,
    criticalLow: 8,
    yDomain: [0, 15],
  },
  {
    key: 'systolic_bp',
    label: 'SBP',
    unit: 'mmHg',
    color: '#f59e0b',
    warnLow: 90,
    warnHigh: 140,
    criticalLow: 80,
    criticalHigh: 180,
    yDomain: [50, 200],
  },
  {
    key: 'respiratory_rate',
    label: 'RR',
    unit: 'brpm',
    color: '#22c55e',
    warnLow: 12,
    warnHigh: 20,
    criticalHigh: 30,
    yDomain: [0, 40],
  },
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipBox}>
      <div style={tooltipTime}>{label}</div>
      {payload.map((p) => {
        const metric = METRICS.find((m) => m.label === p.name);
        const val    = p.value;
        let valColor = p.color;
        if (metric) {
          if (metric.criticalLow !== undefined && val < metric.criticalLow)  valColor = '#ef4444';
          else if (metric.criticalHigh !== undefined && val > metric.criticalHigh) valColor = '#ef4444';
          else if (metric.warnLow !== undefined && val < metric.warnLow)    valColor = '#f59e0b';
          else if (metric.warnHigh !== undefined && val > metric.warnHigh)  valColor = '#f59e0b';
        }
        return (
          <div key={p.name} style={tooltipRow}>
            <span style={{ ...tooltipDot, background: p.color }} />
            <span style={tooltipLabel}>{p.name}</span>
            <span style={{ ...tooltipValue, color: valColor }}>
              {val}{metric?.unit ?? ''}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

interface VitalSignsChartProps {
  vitals: VitalSign[];
}

const VitalSignsChart: React.FC<VitalSignsChartProps> = ({ vitals }) => {
  const [activeMetrics, setActiveMetrics] = useState<Set<string>>(
    new Set(['spo2', 'pulse_rate', 'gcs_score']),
  );

  const [selectedMetric, setSelectedMetric] = useState<string>('spo2');

  const toggleMetric = (key: string) => {
    setActiveMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        // Keep at least 1 active
        if (next.size === 1) return prev;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Transform vitals array into chart data points
  const chartData = useMemo(() => vitals.map((v) => ({
    time: new Date(v.created_at).toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }),
    spo2:             v.spo2,
    pulse_rate:       v.pulse_rate,
    gcs_score:        v.gcs_score,
    systolic_bp:      v.systolic_bp,
    respiratory_rate: v.respiratory_rate,
  })), [vitals]);

  // Pick Y domain for primary selected metric
  const primaryCfg = METRICS.find((m) => m.key === selectedMetric);
  const latestVital = vitals[vitals.length - 1];

  if (vitals.length === 0) {
    return <p style={emptyStyle}>No vitals recorded.</p>;
  }

  return (
    <div style={wrapper}>
      <div style={chartHeader}>
        <span style={chartTitle}>Vitals Over Time</span>
        <span style={recordCountStyle}>{vitals.length} reading{vitals.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Latest values snapshot ───────────────────────────────── */}
      <div style={snapshotBar}>
        {METRICS.map((m) => {
          const val = latestVital[m.key] as number | null;
          if (val == null) return null;
          const isWarnLow  = m.warnLow  !== undefined && val < m.warnLow;
          const isWarnHigh = m.warnHigh !== undefined && val > m.warnHigh;
          const isCritLow  = m.criticalLow  !== undefined && val < m.criticalLow;
          const isCritHigh = m.criticalHigh !== undefined && val > m.criticalHigh;
          const valColor = isCritLow || isCritHigh ? '#ef4444'
            : isWarnLow || isWarnHigh ? '#f59e0b'
            : m.color;
          return (
            <div
              key={m.key}
              style={{
                ...snapshotChip,
                borderColor: activeMetrics.has(m.key) ? m.color : '#334155',
                opacity: activeMetrics.has(m.key) ? 1 : 0.5,
                cursor: 'pointer',
              }}
              onClick={() => { toggleMetric(String(m.key)); setSelectedMetric(String(m.key)); }}
              role="button"
              tabIndex={0}
              aria-pressed={activeMetrics.has(String(m.key))}
              aria-label={`${m.label}: ${val}${m.unit}`}
              onKeyDown={(e) => e.key === 'Enter' && toggleMetric(String(m.key))}
            >
              <span style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                {m.label}
              </span>
              <span style={{ fontSize: 14, fontWeight: 800, color: valColor, fontFamily: 'monospace' }}>
                {val}{m.unit}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Chart ───────────────────────────────────────────────── */}
      {vitals.length > 1 ? (
        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fill: '#475569', fontSize: 9 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={primaryCfg?.yDomain ?? ['auto', 'auto']}
                tick={{ fill: '#475569', fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Reference lines for normal ranges */}
              {primaryCfg?.warnLow && (
                <ReferenceLine
                  y={primaryCfg.warnLow}
                  stroke={primaryCfg.color}
                  strokeDasharray="4 4"
                  strokeOpacity={0.4}
                />
              )}
              {primaryCfg?.warnHigh && (
                <ReferenceLine
                  y={primaryCfg.warnHigh}
                  stroke={primaryCfg.color}
                  strokeDasharray="4 4"
                  strokeOpacity={0.4}
                />
              )}

              {METRICS.filter((m) => activeMetrics.has(String(m.key))).map((m) => (
                <Line
                  key={m.key}
                  type="monotone"
                  dataKey={m.key}
                  name={m.label}
                  stroke={m.color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: m.color, strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: '#0f172a' }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p style={{ fontSize: 11, color: '#64748b', textAlign: 'center', padding: '12px 0' }}>
          Single reading — chart needs 2+ data points.
        </p>
      )}
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const wrapper: React.CSSProperties = {
  background: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: 8,
  padding: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const chartHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const chartTitle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const recordCountStyle: React.CSSProperties = {
  fontSize: 10,
  color: '#475569',
};

const snapshotBar: React.CSSProperties = {
  display: 'flex',
  gap: 6,
  flexWrap: 'wrap',
};

const snapshotChip: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '5px 10px',
  border: '1px solid',
  borderRadius: 6,
  gap: 1,
  transition: 'opacity 0.15s, border-color 0.15s',
  userSelect: 'none',
};

const emptyStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#64748b',
  margin: 0,
};

const tooltipBox: React.CSSProperties = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 8,
  padding: '10px 12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
  minWidth: 140,
};

const tooltipTime: React.CSSProperties = {
  fontSize: 10,
  color: '#64748b',
  fontFamily: 'monospace',
  marginBottom: 6,
  fontWeight: 600,
};

const tooltipRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  marginBottom: 3,
};

const tooltipDot: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  flexShrink: 0,
};

const tooltipLabel: React.CSSProperties = {
  fontSize: 11,
  color: '#94a3b8',
  flex: 1,
};

const tooltipValue: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  fontFamily: 'monospace',
};

export default VitalSignsChart;