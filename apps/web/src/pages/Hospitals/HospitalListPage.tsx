/**
 * HospitalListPage.tsx
 *
 * Grid view of all trauma centres across the Kerala Trauma Network.
 * Each card shows: name, address, trauma level badge, and a mini
 * resource bar strip for ICU, ED, and Ventilator status.
 *
 * Clicking a card navigates to /hospitals/:id for the full detail view.
 */

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useHospitalStore } from '@/store/hospitalStore';
import ResourceBar    from './components/ResourceBar';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<string, { label: string; color: string }> = {
  LEVEL_1: { label: 'Level I Trauma',   color: '#ef4444' },
  LEVEL_2: { label: 'Level II Trauma',  color: '#f59e0b' },
  LEVEL_3: { label: 'Level III Trauma', color: '#22c55e' },
};

function overallStatus(resources: {
  icu_beds_available: number; icu_beds_total: number;
  ventilators_available: number; ventilators_total: number;
}): 'CRITICAL' | 'HIGH' | 'OK' {
  const icuPct  = resources.icu_beds_total
    ? ((resources.icu_beds_total - resources.icu_beds_available) / resources.icu_beds_total) * 100
    : 0;
  const ventPct = resources.ventilators_total
    ? ((resources.ventilators_total - resources.ventilators_available) / resources.ventilators_total) * 100
    : 0;
  if (icuPct >= 90 || ventPct >= 90) return 'CRITICAL';
  if (icuPct >= 70 || ventPct >= 70) return 'HIGH';
  return 'OK';
}

// ─── Component ────────────────────────────────────────────────────────────────

const HospitalListPage: React.FC = () => {
  const { hospitals, fetchHospitals } = useHospitalStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  React.useEffect(() => {
    if (hospitals.length === 0) fetchHospitals();
  }, [hospitals.length, fetchHospitals]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return hospitals.filter((h) => {
      const matchSearch = h.name.toLowerCase().includes(q) || h.district.toLowerCase().includes(q);
      const status = overallStatus(h.resources);
      const matchFilter = filter === 'ALL' || filter === status;
      return matchSearch && matchFilter;
    });
  }, [hospitals, search, filter]);

  return (
    <div style={page}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header style={header}>
        <div>
          <h1 style={h1}>🏥 Hospital Network</h1>
          <p style={subtitle}>
            {hospitals.length} trauma centres across the Kerala grid · Real-time capacity
          </p>
        </div>

        <div style={controls}>
          <div style={searchBox}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search hospitals, districts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={searchInput}
            />
          </div>

          <select
            style={filterSelect}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High Usage</option>
            <option value="OK">Available</option>
          </select>
        </div>
      </header>

      {/* ── Summary strip ───────────────────────────────────────────── */}
      <div style={summaryStrip}>
        {['CRITICAL', 'HIGH', 'OK'].map((s) => {
          const count  = hospitals.filter((h) => overallStatus(h.resources) === s).length;
          const colors = { CRITICAL: '#ef4444', HIGH: '#f97316', OK: '#22c55e' };
          const color  = colors[s as keyof typeof colors];
          return (
            <button
              key={s}
              style={{
                ...summaryPill,
                background: filter === s ? `${color}22` : 'transparent',
                borderColor: filter === s ? color : '#334155',
                color: filter === s ? color : '#64748b',
              }}
              onClick={() => setFilter(filter === s ? 'ALL' : s)}
              aria-pressed={filter === s}
            >
              <span style={{ fontSize: 14, fontWeight: 900 }}>{count}</span>
              <span style={{ fontSize: 10 }}>{s}</span>
            </button>
          );
        })}
      </div>

      {/* ── Hospital Grid ───────────────────────────────────────────── */}
      <div style={grid}>
        {filtered.length === 0 ? (
          <div style={empty}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <p>No hospitals match your search.</p>
          </div>
        ) : (
          filtered.map((h) => {
            const lvl    = LEVEL_CONFIG[h.trauma_level] ?? { label: h.trauma_level, color: '#64748b' };
            const status = overallStatus(h.resources);
            const statusColors = { CRITICAL: '#ef4444', HIGH: '#f97316', OK: '#22c55e' };
            const statusColor  = statusColors[status];

            return (
              <Link to={`/hospitals/${h.id}`} key={h.id} style={card}>
                {/* Status glow bar */}
                <div style={{ ...glowBar, background: statusColor }} />

                {/* Card header */}
                <div style={cardHeader}>
                  <div>
                    <div style={hospitalName}>{h.name}</div>
                    <div style={hospitalAddr}>{h.district} · {h.phone}</div>
                  </div>
                  <div style={badges}>
                    <span style={{ ...levelBadge, background: `${lvl.color}18`, color: lvl.color, borderColor: `${lvl.color}33` }}>
                      {lvl.label}
                    </span>
                    <span style={{ ...overallBadge, background: `${statusColor}18`, color: statusColor, borderColor: `${statusColor}33` }}>
                      {status}
                    </span>
                  </div>
                </div>

                {/* Resource bars */}
                <div style={resourceBars}>
                  <ResourceBar
                    label="ICU Beds"
                    icon="🛏"
                    available={h.resources.icu_beds_available}
                    total={h.resources.icu_beds_total}
                    compact
                  />
                  <ResourceBar
                    label="Ventilators"
                    icon="💨"
                    available={h.resources.ventilators_available}
                    total={h.resources.ventilators_total}
                    compact
                  />
                </div>

                {/* Quick boolean flags */}
                <div style={flagsRow}>
                  <Flag label="OT"          active={h.resources.ot_available} />
                  <Flag label="Blood Bank"  active={h.resources.blood_bank_available} />
                  <Flag label="Specialist"  active={h.resources.specialist_on_duty} />
                </div>

                {/* View detail link */}
                <div style={viewDetail}>
                  View Full Capacity →
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

const Flag: React.FC<{ label: string; active: boolean }> = ({ label, active }) => (
  <span style={{ ...flag, color: active ? '#22c55e' : '#475569', borderColor: active ? '#22c55e33' : '#1e293b' }}>
    {active ? '✓' : '✗'} {label}
  </span>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const page: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', height: '100%',
  background: '#0f172a', color: '#f1f5f9', overflow: 'hidden',
};
const header: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '16px 24px 12px', borderBottom: '1px solid #334155',
  background: '#1e293b', flexShrink: 0,
};
const h1: React.CSSProperties = { fontSize: 20, fontWeight: 800, margin: '0 0 2px' };
const subtitle: React.CSSProperties = { fontSize: 12, color: '#64748b', margin: 0 };
const controls: React.CSSProperties = { display: 'flex', gap: 10 };
const searchBox: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '7px 12px',
};
const searchInput: React.CSSProperties = {
  background: 'transparent', border: 'none', outline: 'none',
  color: '#f1f5f9', fontSize: 13, width: 200, fontFamily: 'inherit',
};
const filterSelect: React.CSSProperties = {
  background: '#0f172a', border: '1px solid #334155', borderRadius: 6,
  color: '#94a3b8', padding: '7px 12px', fontSize: 13, cursor: 'pointer',
};
const summaryStrip: React.CSSProperties = {
  display: 'flex', gap: 0, padding: '8px 24px', borderBottom: '1px solid #334155',
  flexShrink: 0, gap: 10,
} as React.CSSProperties;
const summaryPill: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
  padding: '6px 20px', borderRadius: 8, border: '1px solid',
  cursor: 'pointer', transition: 'all 0.15s', fontWeight: 700,
};
const grid: React.CSSProperties = {
  flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent',
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
  gap: 16, padding: 24, alignContent: 'start',
};
const card: React.CSSProperties = {
  position: 'relative', background: '#1e293b', border: '1px solid #334155',
  borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 14,
  textDecoration: 'none', color: 'inherit', overflow: 'hidden',
  transition: 'border-color 0.15s, transform 0.15s',
  cursor: 'pointer',
};
const glowBar: React.CSSProperties = {
  position: 'absolute', top: 0, left: 0, right: 0, height: 3, opacity: 0.7,
};
const cardHeader: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
};
const hospitalName: React.CSSProperties = {
  fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 3,
};
const hospitalAddr: React.CSSProperties = { fontSize: 11, color: '#64748b' };
const badges: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0,
};
const levelBadge: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10, border: '1px solid',
  letterSpacing: '0.04em', whiteSpace: 'nowrap',
};
const overallBadge: React.CSSProperties = {
  fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 10, border: '1px solid',
  letterSpacing: '0.06em', whiteSpace: 'nowrap',
};
const resourceBars: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 8,
};
const flagsRow: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' };
const flag: React.CSSProperties = {
  fontSize: 10, fontWeight: 600, padding: '2px 8px',
  border: '1px solid', borderRadius: 10,
};
const viewDetail: React.CSSProperties = {
  fontSize: 11, color: '#3b82f6', marginTop: 2,
  display: 'flex', justifyContent: 'flex-end',
};
const empty: React.CSSProperties = {
  gridColumn: '1/-1', display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center', gap: 12,
  padding: 64, color: '#64748b',
};

export default HospitalListPage;
