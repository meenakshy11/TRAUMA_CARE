/**
 * BlackSpotTable.tsx
 *
 * Sortable, filterable data table of high-risk road segments.
 * Clicking a row highlights it on the map (via onSelect callback).
 */

import React, { useState, useMemo } from 'react';
import type { BlackSpot } from '@/api/blackspots.api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function riskColor(score: number): string {
  if (score >= 8.5) return '#ef4444';
  if (score >= 7.0) return '#f97316';
  if (score >= 5.5) return '#f59e0b';
  return '#22c55e';
}

function riskLabel(score: number): string {
  if (score >= 8.5) return 'CRITICAL';
  if (score >= 7.0) return 'HIGH';
  if (score >= 5.5) return 'MODERATE';
  return 'LOW';
}

const TREND_CONFIG = {
  WORSENING: { icon: '↑', color: '#ef4444', label: 'Worsening' },
  STABLE:    { icon: '→', color: '#f59e0b', label: 'Stable' },
  IMPROVING: { icon: '↓', color: '#22c55e', label: 'Improving' },
};

function formatSeconds(sec?: number): string {
  if (!sec) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

function formatLastSeen(iso?: string): string {
  if (!iso) return '—';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface BlackSpotTableProps {
  spots: BlackSpot[];
  selected: string | null;
  onSelect: (id: string) => void;
}

type SortKey = 'risk_score' | 'incident_count' | 'name' | 'district' | 'avg_response_time_sec';
type SortDir = 'asc' | 'desc';

const BlackSpotTable: React.FC<BlackSpotTableProps> = ({ spots, selected, onSelect }) => {
  const [search, setSearch]     = useState('');
  const [sortKey, setSortKey]   = useState<SortKey>('risk_score');
  const [sortDir, setSortDir]   = useState<SortDir>('desc');

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return spots
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.district.toLowerCase().includes(q) ||
          s.road_name.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        const va = (a[sortKey] ?? 0) as number | string;
        const vb = (b[sortKey] ?? 0) as number | string;
        if (typeof va === 'string') {
          return sortDir === 'asc'
            ? (va as string).localeCompare(vb as string)
            : (vb as string).localeCompare(va as string);
        }
        return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
      });
  }, [spots, search, sortKey, sortDir]);

  const SortHeader: React.FC<{ col: SortKey; label: string }> = ({ col, label }) => (
    <th
      style={thStyle}
      onClick={() => handleSort(col)}
      role="columnheader"
      aria-sort={sortKey === col ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <span style={thInner}>
        {label}
        <span style={{ opacity: sortKey === col ? 1 : 0.3, fontSize: 10 }}>
          {sortKey === col ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ⇅'}
        </span>
      </span>
    </th>
  );

  return (
    <div style={wrapper}>
      {/* Search bar */}
      <div style={searchWrapper}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Search by location, district, or road name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={searchInput}
          aria-label="Search black spots"
        />
        {search && (
          <button onClick={() => setSearch('')} style={clearBtn} aria-label="Clear search">✕</button>
        )}
      </div>

      {/* Table */}
      <div style={scrollArea}>
        <table style={table} role="grid" aria-label="Accident black spot registry">
          <thead>
            <tr>
              <SortHeader col="name"                  label="Location" />
              <SortHeader col="district"              label="District" />
              <SortHeader col="risk_score"            label="Risk Score" />
              <SortHeader col="incident_count"        label="Incidents" />
              <SortHeader col="avg_response_time_sec" label="Avg Response" />
              <th style={thStyle}><span style={thInner}>Trend</span></th>
              <th style={thStyle}><span style={thInner}>Last Incident</span></th>
              <th style={thStyle}><span style={thInner}>Action</span></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={emptyCell}>
                  No black spots match your search.
                </td>
              </tr>
            ) : (
              filtered.map((spot) => {
                const color    = riskColor(spot.risk_score);
                const isActive = spot.id === selected;
                const trend    = spot.trend ? TREND_CONFIG[spot.trend] : null;

                return (
                  <tr
                    key={spot.id}
                    style={{
                      ...rowStyle,
                      background: isActive ? 'rgba(239,68,68,0.08)' : undefined,
                      borderLeft: isActive ? `3px solid ${color}` : '3px solid transparent',
                    }}
                    onClick={() => onSelect(spot.id)}
                    role="row"
                    aria-selected={isActive}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && onSelect(spot.id)}
                  >
                    <td style={tdStyle}>
                      <div style={locationCell}>
                        <span style={locationName}>{spot.name}</span>
                        <span style={roadName}>{spot.road_name}</span>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color: '#94a3b8', fontSize: 12 }}>
                      {spot.district}
                    </td>
                    <td style={tdStyle}>
                      <div style={scoreCell}>
                        <span style={{ ...scoreBadge, background: `${color}22`, color, borderColor: `${color}44` }}>
                          {riskLabel(spot.risk_score)}
                        </span>
                        <span style={{ ...scoreNum, color }}>{spot.risk_score.toFixed(1)}</span>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 700, fontFamily: 'monospace', color: '#f1f5f9' }}>
                      {spot.incident_count}
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12 }}>
                      <span style={{ color: (spot.avg_response_time_sec ?? 0) > 600 ? '#ef4444' : '#f1f5f9' }}>
                        {formatSeconds(spot.avg_response_time_sec)}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {trend ? (
                        <span style={{ color: trend.color, fontSize: 12, fontWeight: 700 }}>
                          {trend.icon} {trend.label}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ ...tdStyle, color: '#64748b', fontSize: 12 }}>
                      {formatLastSeen(spot.last_incident_at)}
                    </td>
                    <td style={tdStyle}>
                      <button
                        style={focusBtn}
                        onClick={(e) => { e.stopPropagation(); onSelect(spot.id); }}
                        aria-label={`Focus map on ${spot.name}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        Focus
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Row count */}
      <div style={footer}>
        Showing {filtered.length} of {spots.length} high-risk segments
        {search && ` matching "${search}"`}
      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const wrapper: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
};

const searchWrapper: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '12px 16px',
  borderBottom: '1px solid #334155',
  flexShrink: 0,
};

const searchInput: React.CSSProperties = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: '#f1f5f9',
  fontSize: 13,
  fontFamily: 'inherit',
};

const clearBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#64748b',
  cursor: 'pointer',
  fontSize: 12,
  padding: '2px 4px',
};

const scrollArea: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: '#334155 transparent',
};

const table: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const thStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  background: '#0f172a',
  padding: '10px 16px',
  fontSize: 10,
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  borderBottom: '1px solid #334155',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  userSelect: 'none',
  zIndex: 1,
};

const thInner: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 2,
};

const rowStyle: React.CSSProperties = {
  cursor: 'pointer',
  transition: 'background 0.12s',
  borderBottom: '1px solid #1e293b',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  verticalAlign: 'middle',
};

const locationCell: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const locationName: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#f1f5f9',
};

const roadName: React.CSSProperties = {
  fontSize: 11,
  color: '#64748b',
};

const scoreCell: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const scoreBadge: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  padding: '2px 6px',
  borderRadius: 4,
  border: '1px solid',
  letterSpacing: '0.06em',
};

const scoreNum: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  fontFamily: 'monospace',
};

const focusBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '5px 10px',
  background: 'transparent',
  border: '1px solid #334155',
  borderRadius: 5,
  color: '#94a3b8',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s',
};

const emptyCell: React.CSSProperties = {
  padding: '48px 24px',
  textAlign: 'center',
  color: '#475569',
  fontSize: 13,
};

const footer: React.CSSProperties = {
  padding: '10px 16px',
  borderTop: '1px solid #334155',
  fontSize: 11,
  color: '#475569',
  flexShrink: 0,
};

export default BlackSpotTable;
