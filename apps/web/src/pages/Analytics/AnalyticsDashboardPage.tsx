/**
 * AnalyticsDashboardPage.tsx
 *
 * Clinical Governance & Operational Analytics — Kerala Trauma Network
 *
 * Layout (large screen):
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  Page header + period selector                                  │
 * ├─────────────────────────────────────────────────────────────────┤
 * │  KPI Summary strip (5 cards)                                    │
 * ├──────────────────────────┬──────────────────────────────────────┤
 * │  Incident Trends (60%)   │  Golden Hour Donut (40%)            │
 * ├──────────────────────────┴──────────────────────────────────────┤
 * │  Response Time Histogram (40%)  │  Coverage Gap Map (60%)      │
 * ├─────────────────────────────────────────────────────────────────┤
 * │  District Performance Table (full width)                        │
 * └─────────────────────────────────────────────────────────────────┘
 */

import React, { useEffect, useState } from 'react';
import { fetchAnalytics } from '@/api/analytics.api';
import type { AnalyticsSummary } from '@/api/analytics.api';

import KPISummaryCards        from './components/KPISummaryCards';
import IncidentTrendsLine     from './components/IncidentTrendsLine';
import GoldenHourChart        from './components/GoldenHourChart';
import ResponseTimeHistogram  from './components/ResponseTimeHistogram';
import DistrictPerformanceTable from './components/DistrictPerformanceTable';
import CoverageGapMap         from './components/CoverageGapMap';

// ─── Component ────────────────────────────────────────────────────────────────

const AnalyticsDashboardPage: React.FC = () => {
  const [data, setData]       = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [period, setPeriod]   = useState(30);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchAnalytics(period)
      .then((d) => { if (alive) { setData(d); setLoading(false); } })
      .catch((e) => { if (alive) { setError(e.message); setLoading(false); } });
    return () => { alive = false; };
  }, [period]);

  // ── Loading / Error ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={centeredState}>
        <div style={spinner} />
        <p style={{ color: '#64748b', margin: 0 }}>Loading analytics data…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={centeredState}>
        <p style={{ color: '#ef4444' }}>Failed to load analytics: {error}</p>
      </div>
    );
  }

  return (
    <div style={page}>
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <header style={pageHeader}>
        <div>
          <h1 style={h1}>
            <span style={{ color: '#3b82f6' }}>📊</span> Clinical Governance Analytics
          </h1>
          <p style={headerSub}>
            Kerala Trauma Network · {data.period_label} ·{' '}
            <span style={{ color: '#22c55e' }}>Live in Demo Mode</span>
          </p>
        </div>

        {/* Period selector */}
        <div style={periodSelector} role="group" aria-label="Report period">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              style={{ ...periodBtn, ...(period === d ? periodBtnActive : {}) }}
              onClick={() => setPeriod(d)}
              aria-pressed={period === d}
            >
              {d}D
            </button>
          ))}
        </div>
      </header>

      {/* Scrollable body */}
      <div style={body}>
        {/* ── KPI Cards ───────────────────────────────────────────────── */}
        <KPISummaryCards data={data} />

        {/* ── Row 1: Trends + Golden Hour ─────────────────────────────── */}
        <div style={row2}>
          <div style={{ ...chartCard, flex: '3 1 0' }}>
            <IncidentTrendsLine trends={data.daily_trends} />
          </div>
          <div style={{ ...chartCard, flex: '2 1 0' }}>
            <GoldenHourChart data={data} />
          </div>
        </div>

        {/* ── Row 2: Histogram + Map ───────────────────────────────────── */}
        <div style={row2}>
          <div style={{ ...chartCard, flex: '2 1 0' }}>
            <ResponseTimeHistogram data={data.response_histogram} />
          </div>
          <div style={{ ...chartCard, flex: '3 1 0', padding: 0, overflow: 'hidden', minHeight: 320 }}>
            {/* Section title sits above the map */}
            <div style={{ padding: '14px 18px 0', background: '#1e293b' }}>
              <span style={cardTitle}>Coverage Gap Analysis</span>
              <span style={cardSubtitle}> — District compliance zones</span>
            </div>
            <div style={{ flex: 1, minHeight: 280 }}>
              <CoverageGapMap stats={data.district_stats} />
            </div>
          </div>
        </div>

        {/* ── Row 3: District Table ────────────────────────────────────── */}
        <div style={{ ...chartCard, minHeight: 300 }}>
          <DistrictPerformanceTable stats={data.district_stats} />
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <footer style={pageFooter}>
          Kerala Trauma Registry · Data refreshed every 15 minutes in production ·
          Demo data reflects simulated regional statistics
        </footer>
      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const page: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  background: '#0f172a',
  color: '#f1f5f9',
  overflow: 'hidden',
};

const pageHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 24px 12px',
  borderBottom: '1px solid #334155',
  background: '#1e293b',
  flexShrink: 0,
};

const h1: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  margin: '0 0 2px',
};

const headerSub: React.CSSProperties = {
  fontSize: 12,
  color: '#64748b',
  margin: 0,
};

const periodSelector: React.CSSProperties = {
  display: 'flex',
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: 8,
  overflow: 'hidden',
};

const periodBtn: React.CSSProperties = {
  padding: '6px 18px',
  background: 'transparent',
  border: 'none',
  color: '#64748b',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.15s',
  fontFamily: 'monospace',
};

const periodBtnActive: React.CSSProperties = {
  background: '#3b82f6',
  color: '#fff',
};

const body: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: '#334155 transparent',
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  background: '#334155',
  padding: 0,
};

const row2: React.CSSProperties = {
  display: 'flex',
  gap: 1,
  background: '#334155',
};

const chartCard: React.CSSProperties = {
  background: '#1e293b',
  padding: '18px 20px',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 280,
};

const cardTitle: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, color: '#f1f5f9',
};
const cardSubtitle: React.CSSProperties = {
  fontSize: 11, color: '#64748b',
};

const pageFooter: React.CSSProperties = {
  padding: '12px 24px',
  fontSize: 11,
  color: '#334155',
  background: '#0f172a',
  textAlign: 'center',
  borderTop: '1px solid #1e293b',
};

const centeredState: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  justifyContent: 'center', height: '100%', gap: 16,
};

const spinner: React.CSSProperties = {
  width: 36, height: 36,
  border: '3px solid #334155',
  borderTopColor: '#3b82f6',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
};

export default AnalyticsDashboardPage;
