/**
 * ResponseTimeHistogram.tsx
 *
 * Bar chart showing the distribution of ambulance scene-arrival times
 * across response-time buckets (0–5 min, 5–8 min, etc.).
 *
 * Bars are colour-coded:
 *  ≤5 min  → green  (excellent)
 *  5–8     → teal   (good)
 *  8–10    → amber  (acceptable)
 *  10–12   → orange (at risk)
 *  >12     → red    (SLA breach)
 */

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
  LabelList,
} from 'recharts';
import type { ResponseBucket } from '@/api/analytics.api';

interface ResponseTimeHistogramProps {
  data: ResponseBucket[];
}

const BUCKET_COLORS = ['#22c55e', '#06b6d4', '#f59e0b', '#f97316', '#ef4444', '#dc2626'];

const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: { value: number; payload: ResponseBucket }[];
  label?: string;
}> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={tooltipBox}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12, color: '#94a3b8' }}>
        <span style={{ color: '#f1f5f9', fontWeight: 700, fontFamily: 'monospace' }}>{d.count}</span> incidents
      </div>
      <div style={{ fontSize: 11, color: '#64748b' }}>{d.pct.toFixed(1)}% of total</div>
    </div>
  );
};

const ResponseTimeHistogram: React.FC<ResponseTimeHistogramProps> = ({ data }) => {
  const slaBreachTotal = data
    .filter((_, i) => i >= 3)
    .reduce((sum, b) => sum + b.count, 0);
  const totalCases = data.reduce((sum, b) => sum + b.count, 0);
  const breachPct = ((slaBreachTotal / totalCases) * 100).toFixed(1);

  return (
    <div style={wrapper}>
      <div style={header}>
        <div>
          <span style={title}>Response Time Distribution</span>
          <span style={subtitle}> — Scene arrival latency</span>
        </div>
        <div style={slaChip}>
          <span style={{ color: '#ef4444', fontWeight: 700 }}>{breachPct}%</span>
          <span style={{ color: '#64748b' }}> SLA breach (&gt;10 min)</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={190}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 8, bottom: 0, left: -16 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#475569', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: '#475569', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={24}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />

          {/* 10-minute SLA reference line between bucket index 2 and 3 */}
          <ReferenceLine
            x="10–12 min"
            stroke="#ef4444"
            strokeDasharray="5 3"
            strokeOpacity={0.5}
            label={{ value: 'SLA limit', fill: '#ef4444', fontSize: 9, position: 'top' }}
          />

          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((_, i) => (
              <Cell key={i} fill={BUCKET_COLORS[Math.min(i, BUCKET_COLORS.length - 1)]} fillOpacity={0.85} />
            ))}
            <LabelList
              dataKey="pct"
              position="top"
              formatter={(v: number) => `${v.toFixed(0)}%`}
              style={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary chips */}
      <div style={summaryRow}>
        <SummaryChip color="#22c55e" label="< 8 min (SLA met)" value={`${data.slice(0, 2).reduce((s, b) => s + b.count, 0)}`} />
        <SummaryChip color="#f59e0b" label="8–10 min (marginal)" value={`${data[2].count}`} />
        <SummaryChip color="#ef4444" label="> 10 min (breach)" value={`${slaBreachTotal}`} />
      </div>
    </div>
  );
};

const SummaryChip: React.FC<{ color: string; label: string; value: string }> = ({ color, label, value }) => (
  <div style={{ ...chip, borderColor: `${color}33` }}>
    <span style={{ fontSize: 15, fontWeight: 800, color, fontFamily: 'monospace' }}>{value}</span>
    <span style={{ fontSize: 10, color: '#64748b' }}>{label}</span>
  </div>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const wrapper: React.CSSProperties = { display: 'flex', flexDirection: 'column', height: '100%' };
const header: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8,
};
const title: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#f1f5f9' };
const subtitle: React.CSSProperties = { fontSize: 11, color: '#64748b' };
const slaChip: React.CSSProperties = {
  fontSize: 11, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
  padding: '3px 10px', borderRadius: 20,
};
const summaryRow: React.CSSProperties = {
  display: 'flex', gap: 8, marginTop: 10,
};
const chip: React.CSSProperties = {
  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
  padding: '6px 8px', border: '1px solid', borderRadius: 6,
  background: 'rgba(255,255,255,0.02)',
};
const tooltipBox: React.CSSProperties = {
  background: '#1e293b', border: '1px solid #334155', borderRadius: 8,
  padding: '10px 14px',
};

export default ResponseTimeHistogram;
