/**
 * IncidentTrendsLine.tsx
 *
 * Dual-axis line chart: incident volume (bars) overlaid with
 * avg response time (line) across the last 30 days.
 *
 * Secondary line for golden hour compliance (dashed, purple).
 */

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import type { DailyTrend } from '@/api/analytics.api';

interface IncidentTrendsLineProps {
  trends: DailyTrend[];
}

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
  unit?: string;
}

const CustomTooltip: React.FC<{ active?: boolean; payload?: TooltipPayload[]; label?: string }> = ({
  active, payload, label,
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipBox}>
      <div style={tooltipDate}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={tooltipRow}>
          <span style={{ ...tooltipDot, background: p.color }} />
          <span style={tooltipLabel}>{p.name}</span>
          <span style={{ ...tooltipValue, color: p.color }}>
            {typeof p.value === 'number' ? p.value.toFixed(p.name.includes('min') || p.name.includes('Response') ? 1 : 0) : p.value}
            {p.name.includes('Compliance') ? '%' : p.name.includes('Response') ? ' min' : ''}
          </span>
        </div>
      ))}
    </div>
  );
};

const IncidentTrendsLine: React.FC<IncidentTrendsLineProps> = ({ trends }) => {
  const [showGolden, setShowGolden] = useState(true);
  const [showResponse, setShowResponse] = useState(true);

  // Format date labels: "Mar 15"
  const chartData = trends.map((t) => ({
    ...t,
    dateLabel: new Date(t.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
  }));

  // Show every 5th tick to avoid crowding
  const tickFormatter = (_: string, idx: number) => idx % 5 === 0 ? chartData[idx]?.dateLabel : '';

  return (
    <div style={wrapper}>
      <div style={header}>
        <div>
          <span style={title}>Incident Volume & Response Trends</span>
          <span style={subtitle}> — Last 30 days</span>
        </div>
        <div style={toggles}>
          <ToggleBtn
            label="Response Time"
            color="#f59e0b"
            active={showResponse}
            onClick={() => setShowResponse((v) => !v)}
          />
          <ToggleBtn
            label="Golden Hour %"
            color="#a78bfa"
            active={showGolden}
            onClick={() => setShowGolden((v) => !v)}
          />
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="dateLabel"
            tickFormatter={tickFormatter}
            tick={{ fill: '#475569', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          {/* Left Y: incident count */}
          <YAxis
            yAxisId="left"
            tick={{ fill: '#475569', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={24}
          />
          {/* Right Y: response time (min) */}
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 20]}
            tick={{ fill: '#475569', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* 8-minute SLA reference line */}
          <ReferenceLine
            yAxisId="right"
            y={8}
            stroke="#f59e0b"
            strokeDasharray="6 3"
            strokeOpacity={0.5}
            label={{ value: '8m SLA', fill: '#f59e0b', fontSize: 10, position: 'right' }}
          />

          {/* Incident volume bars */}
          <Bar
            yAxisId="left"
            dataKey="incidents"
            name="Incidents"
            fill="#3b82f6"
            fillOpacity={0.6}
            radius={[3, 3, 0, 0]}
            maxBarSize={18}
          />

          {/* Avg response time line */}
          {showResponse && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avg_response_min"
              name="Response (min)"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          )}

          {/* Golden hour compliance */}
          {showGolden && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="golden_hour_pct"
              name="Compliance %"
              stroke="#a78bfa"
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={false}
              activeDot={{ r: 4 }}
            />
          )}

          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            iconType="circle"
            iconSize={8}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// ── Toggle button ─────────────────────────────────────────────────────────────

const ToggleBtn: React.FC<{ label: string; color: string; active: boolean; onClick: () => void }> = ({
  label, color, active, onClick,
}) => (
  <button
    onClick={onClick}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      border: `1px solid ${active ? color : '#334155'}`,
      borderRadius: 20,
      background: active ? `${color}22` : 'transparent',
      color: active ? color : '#64748b',
      fontSize: 11,
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.15s',
    }}
    aria-pressed={active}
  >
    <span style={{ width: 8, height: 8, borderRadius: '50%', background: active ? color : '#334155', flexShrink: 0 }} />
    {label}
  </button>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const wrapper: React.CSSProperties = { display: 'flex', flexDirection: 'column', height: '100%' };
const header: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
};
const title: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#f1f5f9' };
const subtitle: React.CSSProperties = { fontSize: 11, color: '#64748b' };
const toggles: React.CSSProperties = { display: 'flex', gap: 8 };

const tooltipBox: React.CSSProperties = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 8,
  padding: '10px 14px',
  minWidth: 180,
};
const tooltipDate: React.CSSProperties = {
  fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 8,
};
const tooltipRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4,
};
const tooltipDot: React.CSSProperties = {
  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
};
const tooltipLabel: React.CSSProperties = {
  fontSize: 11, color: '#94a3b8', flex: 1,
};
const tooltipValue: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, fontFamily: 'monospace',
};

export default IncidentTrendsLine;
