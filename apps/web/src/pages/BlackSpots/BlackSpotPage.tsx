/**
 * BlackSpotPage.tsx
 *
 * Government Road Safety Intelligence Dashboard —
 * a split-pane view combining a live GIS heatmap on the left
 * with a sortable risk registry table on the right.
 *
 * Layout:
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  Header: KPI strip (total spots, highest risk, critical zones)   │
 * ├───────────────────────────────────┬──────────────────────────────┤
 * │  Heatmap / Marker map             │  Black Spot data table        │
 * │  (Leaflet, full panel height)     │  + Detail drawer for selected │
 * └───────────────────────────────────┴──────────────────────────────┘
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { fetchDemoBlackSpots } from '@/api/blackspots.api';
import type { BlackSpot } from '@/api/blackspots.api';
import BlackSpotHeatmap from './components/BlackSpotHeatmap';
import BlackSpotTable   from './components/BlackSpotTable';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function riskColor(score: number): string {
  if (score >= 8.5) return '#ef4444';
  if (score >= 7.0) return '#f97316';
  if (score >= 5.5) return '#f59e0b';
  return '#22c55e';
}

function formatSeconds(sec?: number): string {
  if (!sec) return '—';
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

const TREND_CONFIG = {
  WORSENING: { icon: '↑', color: '#ef4444' },
  STABLE:    { icon: '→', color: '#f59e0b' },
  IMPROVING: { icon: '↓', color: '#22c55e' },
};

// ─── Component ────────────────────────────────────────────────────────────────

type ViewMode = 'markers' | 'heatmap';

const BlackSpotPage: React.FC = () => {
  const [spots, setSpots]         = useState<BlackSpot[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [selected, setSelected]   = useState<string | null>(null);
  const [viewMode, setViewMode]   = useState<ViewMode>('heatmap');

  // ── Load data ────────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    fetchDemoBlackSpots()
      .then((data) => { if (alive) { setSpots(data); setLoading(false); } })
      .catch((e)   => { if (alive) { setError(e.message); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  const handleSelect = useCallback((id: string) => {
    setSelected((prev) => (prev === id ? null : id));
  }, []);

  // ── KPI strip calculations ────────────────────────────────────────────────
  const kpis = useMemo(() => {
    if (spots.length === 0) return null;
    const critical  = spots.filter((s) => s.risk_score >= 8.5).length;
    const highest   = spots.reduce((a, b) => (a.risk_score > b.risk_score ? a : b));
    const slowest   = spots
      .filter((s) => s.avg_response_time_sec)
      .reduce((a, b) =>
        (a.avg_response_time_sec ?? 0) > (b.avg_response_time_sec ?? 0) ? a : b,
      );
    const worsening = spots.filter((s) => s.trend === 'WORSENING').length;
    return { critical, highest, slowest, worsening };
  }, [spots]);

  const selectedSpot = spots.find((s) => s.id === selected) ?? null;

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={centeredState}>
        <div style={spinner} />
        <p style={{ color: '#64748b', margin: 0 }}>Loading black spot intelligence…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={centeredState}>
        <p style={{ color: '#ef4444' }}>Failed to load: {error}</p>
      </div>
    );
  }

  return (
    <div style={page}>
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <header style={header}>
        <div style={headerLeft}>
          <h1 style={h1}>
            <span style={{ color: '#ef4444' }}>⚠</span>{' '}
            Road Safety Intelligence
          </h1>
          <p style={subtitle}>
            Accident black spot registry for Kerala — {spots.length} high-risk segments identified.
          </p>
        </div>

        <div style={headerRight}>
          {/* View mode toggle */}
          <div style={modeToggle} role="group" aria-label="Map view mode">
            <button
              style={{ ...modeBtn, ...(viewMode === 'heatmap' ? modeBtnActive : {}) }}
              onClick={() => setViewMode('heatmap')}
              aria-pressed={viewMode === 'heatmap'}
            >
              🌡 Heatmap
            </button>
            <button
              style={{ ...modeBtn, ...(viewMode === 'markers' ? modeBtnActive : {}) }}
              onClick={() => setViewMode('markers')}
              aria-pressed={viewMode === 'markers'}
            >
              📍 Markers
            </button>
          </div>
        </div>
      </header>

      {/* ── KPI Strip ───────────────────────────────────────────────────── */}
      {kpis && (
        <div style={kpiStrip} role="region" aria-label="Summary statistics">
          <KpiCard icon="🔴" label="Critical Zones" value={String(kpis.critical)} color="#ef4444" />
          <KpiCard icon="📈" label="Worsening Trend" value={String(kpis.worsening)} color="#f97316" />
          <KpiCard
            icon="⚠"
            label="Highest Risk"
            value={kpis.highest.risk_score.toFixed(1) + '/10'}
            sub={kpis.highest.name}
            color={riskColor(kpis.highest.risk_score)}
          />
          <KpiCard
            icon="🚑"
            label="Slowest Response"
            value={formatSeconds(kpis.slowest.avg_response_time_sec)}
            sub={kpis.slowest.district}
            color={(kpis.slowest.avg_response_time_sec ?? 0) > 600 ? '#ef4444' : '#f59e0b'}
          />
          <KpiCard icon="🗺" label="Total Hotspots" value={String(spots.length)} color="#3b82f6" />
        </div>
      )}

      {/* ── Split body ───────────────────────────────────────────────────── */}
      <div style={body}>
        {/* Left: Map */}
        <div style={mapPanel}>
          <BlackSpotHeatmap
            spots={spots}
            selected={selected}
            onSelect={handleSelect}
            viewMode={viewMode}
          />

          {/* Map legend */}
          <div style={legend} aria-label="Risk level legend">
            {[
              { label: 'Critical ≥8.5', color: '#ef4444' },
              { label: 'High ≥7.0',     color: '#f97316' },
              { label: 'Moderate ≥5.5', color: '#f59e0b' },
              { label: 'Low <5.5',      color: '#22c55e' },
            ].map(({ label, color }) => (
              <div key={label} style={legendItem}>
                <span style={{ ...legendDot, background: color }} />
                <span style={{ fontSize: 10, color: '#94a3b8' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Table + Detail Drawer */}
        <div style={rightPanel}>
          {/* Selected spot detail card */}
          {selectedSpot && (
            <div style={{ ...detailCard, borderColor: `${riskColor(selectedSpot.risk_score)}44` }}>
              <div style={detailHeader}>
                <div>
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                    SELECTED LOCATION
                  </span>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', marginTop: 2 }}>
                    {selectedSpot.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{selectedSpot.road_name}</div>
                </div>
                <button style={clearSelBtn} onClick={() => setSelected(null)} aria-label="Deselect location">
                  ✕
                </button>
              </div>

              {/* Metrics row */}
              <div style={metricRow}>
                <Metric label="Risk Score" value={selectedSpot.risk_score.toFixed(1)} color={riskColor(selectedSpot.risk_score)} />
                <Metric label="Incidents" value={String(selectedSpot.incident_count)} color="#f1f5f9" />
                <Metric label="Avg Response" value={formatSeconds(selectedSpot.avg_response_time_sec)} color={(selectedSpot.avg_response_time_sec ?? 0) > 600 ? '#ef4444' : '#94a3b8'} />
                {selectedSpot.trend && (
                  <Metric
                    label="Trend"
                    value={`${TREND_CONFIG[selectedSpot.trend].icon} ${selectedSpot.trend}`}
                    color={TREND_CONFIG[selectedSpot.trend].color}
                  />
                )}
              </div>

              {/* Description */}
              <p style={detailDesc}>{selectedSpot.description}</p>

              {/* Recommendation */}
              {selectedSpot.recommended_action && (
                <div style={recommendBox}>
                  <div style={recommendLabel}>📋 RECOMMENDED ACTION</div>
                  <p style={recommendText}>{selectedSpot.recommended_action}</p>
                </div>
              )}
            </div>
          )}

          {/* Table */}
          <div style={tablePanel}>
            <BlackSpotTable
              spots={spots}
              selected={selected}
              onSelect={handleSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  color: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, sub, color }) => (
  <div style={kpiCard}>
    <span style={{ fontSize: 18 }} aria-hidden="true">{icon}</span>
    <div>
      <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: 'monospace', lineHeight: 1.2 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: '#64748b', marginTop: 1, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>}
    </div>
  </div>
);

interface MetricProps { label: string; value: string; color: string; }
const Metric: React.FC<MetricProps> = ({ label, value, color }) => (
  <div style={metricBox}>
    <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    <div style={{ fontSize: 14, fontWeight: 800, color, fontFamily: 'monospace' }}>{value}</div>
  </div>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const page: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  background: '#0f172a',
  color: '#f1f5f9',
  overflow: 'hidden',
};

const header: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 24px 12px',
  borderBottom: '1px solid #334155',
  background: '#1e293b',
  flexShrink: 0,
};

const headerLeft: React.CSSProperties = {};

const h1: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  margin: '0 0 2px',
};

const subtitle: React.CSSProperties = {
  fontSize: 13,
  color: '#64748b',
  margin: 0,
};

const headerRight: React.CSSProperties = {
  flexShrink: 0,
};

const modeToggle: React.CSSProperties = {
  display: 'flex',
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: 8,
  overflow: 'hidden',
};

const modeBtn: React.CSSProperties = {
  padding: '7px 16px',
  background: 'transparent',
  border: 'none',
  color: '#64748b',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s',
};

const modeBtnActive: React.CSSProperties = {
  background: '#ef4444',
  color: '#fff',
};

const kpiStrip: React.CSSProperties = {
  display: 'flex',
  gap: 0,
  borderBottom: '1px solid #334155',
  flexShrink: 0,
  overflowX: 'auto',
  scrollbarWidth: 'none',
};

const kpiCard: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 24px',
  borderRight: '1px solid #334155',
  minWidth: 'fit-content',
};

const body: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 380px',
  flex: 1,
  overflow: 'hidden',
  minHeight: 0,
};

const mapPanel: React.CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  borderRight: '1px solid #334155',
};

const legend: React.CSSProperties = {
  position: 'absolute',
  bottom: 16,
  left: 16,
  background: 'rgba(15,23,42,0.88)',
  border: '1px solid #334155',
  borderRadius: 8,
  padding: '10px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  backdropFilter: 'blur(4px)',
  zIndex: 1000,
};

const legendItem: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const legendDot: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: '50%',
  flexShrink: 0,
};

const rightPanel: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const detailCard: React.CSSProperties = {
  background: '#1e293b',
  border: '1px solid',
  borderLeft: 'none',
  borderRight: 'none',
  borderTop: 'none',
  padding: '14px 16px',
  flexShrink: 0,
  animation: 'fadeIn 0.2s ease',
};

const detailHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 10,
};

const clearSelBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#64748b',
  fontSize: 14,
  cursor: 'pointer',
  padding: 4,
};

const metricRow: React.CSSProperties = {
  display: 'flex',
  gap: 0,
  border: '1px solid #334155',
  borderRadius: 8,
  overflow: 'hidden',
  marginBottom: 10,
};

const metricBox: React.CSSProperties = {
  flex: 1,
  padding: '8px 10px',
  borderRight: '1px solid #334155',
  textAlign: 'center',
};

const detailDesc: React.CSSProperties = {
  fontSize: 12,
  color: '#94a3b8',
  margin: '0 0 8px',
  lineHeight: 1.6,
};

const recommendBox: React.CSSProperties = {
  background: 'rgba(59,130,246,0.08)',
  border: '1px solid rgba(59,130,246,0.2)',
  borderRadius: 6,
  padding: '8px 12px',
};

const recommendLabel: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  color: '#3b82f6',
  letterSpacing: '0.08em',
  marginBottom: 4,
};

const recommendText: React.CSSProperties = {
  fontSize: 12,
  color: '#93c5fd',
  margin: 0,
  lineHeight: 1.5,
};

const tablePanel: React.CSSProperties = {
  flex: 1,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
};

const centeredState: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  gap: 16,
};

const spinner: React.CSSProperties = {
  width: 36,
  height: 36,
  border: '3px solid #334155',
  borderTopColor: '#ef4444',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
};

export default BlackSpotPage;
