/**
 * GoldenHourChart.tsx
 *
 * Donut chart showing Golden Hour compliance:
 *  - Inner ring: Met vs Missed
 *  - Centre label: compliance %
 *  - Below: severity breakdown as a stacked horizontal bar
 */

import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import type { AnalyticsSummary } from '@/api/analytics.api';

interface GoldenHourChartProps {
  data: AnalyticsSummary;
}

const GoldenHourChart: React.FC<GoldenHourChartProps> = ({ data }) => {
  const donutData = [
    { name: 'Met',    value: data.golden_hour_met,    color: '#22c55e' },
    { name: 'Missed', value: data.golden_hour_missed,  color: '#ef4444' },
  ];

  const total = data.golden_hour_met + data.golden_hour_missed;

  const CustomTooltip: React.FC<{ active?: boolean; payload?: { name: string; value: number; payload: { color: string } }[] }> = ({
    active, payload,
  }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0];
    return (
      <div style={tooltipBox}>
        <span style={{ color: p.payload.color, fontWeight: 700 }}>{p.name}</span>
        <span style={{ color: '#f1f5f9', marginLeft: 8, fontFamily: 'monospace', fontWeight: 700 }}>
          {p.value} cases ({((p.value / total) * 100).toFixed(1)}%)
        </span>
      </div>
    );
  };

  return (
    <div style={wrapper}>
      <div style={header}>
        <span style={title}>Golden Hour Compliance</span>
        <span style={period}>Last 30 days</span>
      </div>

      {/* Donut */}
      <div style={donutWrapper}>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={donutData}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={76}
              paddingAngle={3}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
            >
              {donutData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Centre label */}
        <div style={centreLabel} aria-label={`${data.golden_hour_pct.toFixed(1)}% compliance`}>
          <span style={centrePct}>{data.golden_hour_pct.toFixed(1)}%</span>
          <span style={centreText}>Compliant</span>
        </div>
      </div>

      {/* Legend */}
      <div style={legend}>
        {donutData.map((d) => (
          <div key={d.name} style={legendItem}>
            <span style={{ ...legendDot, background: d.color }} />
            <span style={legendLabel}>{d.name}</span>
            <span style={{ ...legendValue, color: d.color }}>{d.value}</span>
          </div>
        ))}
      </div>

      {/* Stacked bar: severity breakdown */}
      <div style={severitySection}>
        <div style={severityTitle}>By Severity</div>
        <div style={stackBar} role="img" aria-label="Incident severity breakdown">
          {data.severity_breakdown.map((s) => {
            const pct = (s.count / data.total_incidents) * 100;
            return (
              <div
                key={s.severity}
                style={{ ...stackSegment, background: s.color, flexBasis: `${pct}%` }}
                title={`${s.severity}: ${s.count} (${pct.toFixed(1)}%)`}
              />
            );
          })}
        </div>
        <div style={severityLegend}>
          {data.severity_breakdown.map((s) => (
            <div key={s.severity} style={sevItem}>
              <span style={{ ...sevDot, background: s.color }} />
              <span style={sevLabel}>{s.severity}</span>
              <span style={{ ...sevCount, color: s.color }}>{s.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const wrapper: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', height: '100%',
};
const header: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4,
};
const title: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#f1f5f9' };
const period: React.CSSProperties = { fontSize: 11, color: '#64748b' };

const donutWrapper: React.CSSProperties = {
  position: 'relative', flexShrink: 0,
};
const centreLabel: React.CSSProperties = {
  position: 'absolute',
  top: '50%', left: '50%',
  transform: 'translate(-50%, -50%)',
  textAlign: 'center',
  pointerEvents: 'none',
};
const centrePct: React.CSSProperties = {
  display: 'block', fontSize: 22, fontWeight: 900, color: '#22c55e', fontFamily: 'monospace',
};
const centreText: React.CSSProperties = {
  display: 'block', fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
};
const legend: React.CSSProperties = {
  display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 14,
};
const legendItem: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
};
const legendDot: React.CSSProperties = {
  width: 10, height: 10, borderRadius: '50%',
};
const legendLabel: React.CSSProperties = { fontSize: 11, color: '#94a3b8' };
const legendValue: React.CSSProperties = { fontSize: 12, fontWeight: 700, fontFamily: 'monospace' };

const severitySection: React.CSSProperties = {
  borderTop: '1px solid #334155', paddingTop: 12,
};
const severityTitle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
};
const stackBar: React.CSSProperties = {
  display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2, marginBottom: 8,
};
const stackSegment: React.CSSProperties = {
  height: '100%', minWidth: 4, borderRadius: 2, transition: 'flex-basis 0.3s',
};
const severityLegend: React.CSSProperties = {
  display: 'flex', flexWrap: 'wrap', gap: '4px 12px',
};
const sevItem: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5,
};
const sevDot: React.CSSProperties = { width: 7, height: 7, borderRadius: '50%' };
const sevLabel: React.CSSProperties = { fontSize: 10, color: '#64748b' };
const sevCount: React.CSSProperties = { fontSize: 11, fontWeight: 700, fontFamily: 'monospace' };

const tooltipBox: React.CSSProperties = {
  background: '#1e293b', border: '1px solid #334155', borderRadius: 6,
  padding: '6px 12px', fontSize: 11,
};

export default GoldenHourChart;
