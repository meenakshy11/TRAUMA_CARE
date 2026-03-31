/**
 * DistrictPerformanceTable.tsx
 *
 * Heatmap-style comparative table of all districts.
 * Columns: District | Incidents | Avg Response | Golden Hour % | Critical | Closed in Hour
 *
 * Each numeric cell is colour-coded against regional average for at-a-glance
 * hot/cold performance detection.
 */

import React, { useState } from 'react';
import type { DistrictStat } from '@/api/analytics.api';

interface DistrictPerformanceTableProps {
  stats: DistrictStat[];
}

type SortKey = keyof DistrictStat;

function heatColor(value: number, min: number, max: number, invert = false): string {
  const ratio  = max === min ? 0.5 : (value - min) / (max - min);
  const scaled = invert ? 1 - ratio : ratio;
  if (scaled >= 0.75) return '#22c55e';
  if (scaled >= 0.5)  return '#f59e0b';
  if (scaled >= 0.25) return '#f97316';
  return '#ef4444';
}

const DistrictPerformanceTable: React.FC<DistrictPerformanceTableProps> = ({ stats }) => {
  const [sortKey, setSortKey]   = useState<SortKey>('total_incidents');
  const [sortDir, setSortDir]   = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = [...stats].sort((a, b) => {
    const va = a[sortKey] as number;
    const vb = b[sortKey] as number;
    return sortDir === 'asc' ? va - vb : vb - va;
  });

  // Extents for heat-mapping
  const ext = (key: keyof DistrictStat) => ({
    min: Math.min(...stats.map((s) => s[key] as number)),
    max: Math.max(...stats.map((s) => s[key] as number)),
  });

  const responseExt   = ext('avg_response_min');
  const goldenExt     = ext('golden_hour_pct');
  const incidentExt   = ext('total_incidents');
  const criticalExt   = ext('critical_count');
  const closedExt     = ext('closed_in_hour');

  const Th: React.FC<{ col: SortKey; label: string; title?: string }> = ({ col, label, title }) => (
    <th
      style={thStyle}
      onClick={() => handleSort(col)}
      title={title}
      role="columnheader"
      aria-sort={sortKey === col ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      {label}
      <span style={{ opacity: sortKey === col ? 1 : 0.3, fontSize: 9, marginLeft: 3 }}>
        {sortKey === col ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
      </span>
    </th>
  );

  return (
    <div style={wrapper}>
      <div style={header}>
        <span style={title}>District Performance Matrix</span>
        <span style={subtitle}>Click headers to sort · Cells heat-mapped vs regional average</span>
      </div>

      <div style={scrollArea}>
        <table style={tableStyle} role="grid" aria-label="District performance table">
          <thead>
            <tr>
              <Th col="district"         label="District" />
              <Th col="total_incidents"  label="Incidents" title="Total incidents in period" />
              <Th col="avg_response_min" label="Avg Response" title="Average scene arrival time (minutes)" />
              <Th col="golden_hour_pct"  label="Golden Hour %" title="% of cases where hospital arrived within 60 min of incident" />
              <Th col="critical_count"   label="Critical" title="CRITICAL severity incidents" />
              <Th col="closed_in_hour"   label="< 1hr Close" title="Cases closed (transported) within 60 minutes" />
              <th style={thStyle}>Rank</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, rank) => {
              const responseColor = heatColor(s.avg_response_min, responseExt.min, responseExt.max, true);
              const goldenColor   = heatColor(s.golden_hour_pct,  goldenExt.min,   goldenExt.max);
              const closedColor   = heatColor(s.closed_in_hour,   closedExt.min,   closedExt.max);

              return (
                <tr key={s.district} style={rowStyle}>
                  <td style={{ ...tdStyle, fontWeight: 700, color: '#f1f5f9', fontSize: 13 }}>
                    {s.district}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <span style={{
                      ...heatChip,
                      color: heatColor(s.total_incidents, incidentExt.min, incidentExt.max, true),
                    }}>
                      {s.total_incidents}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <span style={{ ...heatChip, color: responseColor }}>
                      {s.avg_response_min.toFixed(1)} min
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <div style={goldenCell}>
                      <div style={{ ...goldenBar, width: `${s.golden_hour_pct}%`, background: goldenColor }} />
                      <span style={{ ...heatChip, color: goldenColor }}>{s.golden_hour_pct}%</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <span style={{
                      ...heatChip,
                      color: heatColor(s.critical_count, criticalExt.min, criticalExt.max, true),
                    }}>
                      {s.critical_count}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <span style={{ ...heatChip, color: closedColor }}>{s.closed_in_hour}</span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span style={{
                      ...rankBadge,
                      background: rank === 0 ? 'rgba(34,197,94,0.15)' : rank <= 2 ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)',
                      color:      rank === 0 ? '#22c55e' : rank <= 2 ? '#f59e0b' : '#64748b',
                    }}>
                      #{rank + 1}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Heat legend */}
      <div style={legendRow} aria-label="Colour scale legend">
        <span style={legendText}>Performance scale:</span>
        {[
          { label: 'Best',     color: '#22c55e' },
          { label: 'Good',     color: '#f59e0b' },
          { label: 'At risk',  color: '#f97316' },
          { label: 'Critical', color: '#ef4444' },
        ].map(({ label, color }) => (
          <span key={label} style={legendItem}>
            <span style={{ ...legendDot, background: color }} />
            <span style={{ fontSize: 10, color: '#64748b' }}>{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const wrapper: React.CSSProperties = { display: 'flex', flexDirection: 'column', height: '100%' };
const header: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 };
const title: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#f1f5f9' };
const subtitle: React.CSSProperties = { fontSize: 10, color: '#475569' };

const scrollArea: React.CSSProperties = {
  flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent',
};
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };

const thStyle: React.CSSProperties = {
  position: 'sticky', top: 0, background: '#0f172a',
  padding: '9px 14px', fontSize: 10, fontWeight: 700, color: '#64748b',
  textTransform: 'uppercase', letterSpacing: '0.08em',
  borderBottom: '1px solid #334155', cursor: 'pointer', userSelect: 'none',
  textAlign: 'right', whiteSpace: 'nowrap', zIndex: 1,
};

const rowStyle: React.CSSProperties = {
  borderBottom: '1px solid #1e293b', transition: 'background 0.1s',
};

const tdStyle: React.CSSProperties = { padding: '11px 14px', verticalAlign: 'middle' };

const heatChip: React.CSSProperties = {
  fontFamily: 'monospace', fontWeight: 700, fontSize: 12,
};

const goldenCell: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3,
};
const goldenBar: React.CSSProperties = {
  height: 3, borderRadius: 2, maxWidth: '100%', transition: 'width 0.3s',
};

const rankBadge: React.CSSProperties = {
  display: 'inline-block', padding: '2px 8px', borderRadius: 20,
  fontSize: 11, fontWeight: 700,
};

const legendRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12,
  borderTop: '1px solid #334155', paddingTop: 8, marginTop: 6,
  flexShrink: 0,
};
const legendText: React.CSSProperties = { fontSize: 10, color: '#475569', marginRight: 4 };
const legendItem: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 5 };
const legendDot: React.CSSProperties = { width: 8, height: 8, borderRadius: '50%' };

export default DistrictPerformanceTable;
