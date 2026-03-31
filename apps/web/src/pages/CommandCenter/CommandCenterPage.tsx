/**
 * CommandCenterPage.tsx
 *
 * The primary dispatcher dashboard — the first page seen after login.
 *
 * Layout (CSS grid):
 * ┌──────────────┬─────────────────────────────────────┬──────────────┐
 * │ IncidentPanel│         LiveMap (full height)        │AmbulancePanel│
 * │  (scrollable)│                                     │  (scrollable)│
 * ├──────────────┴─────────────────────────────────────┴──────────────┤
 * │                    HospitalPanel (capacity strip)                  │
 * └────────────────────────────────────────────────────────────────────┘
 *
 * In demo mode the page reads from DEMO_* fixtures and displays everything
 * without a live backend. Selecting an incident highlights it on the map
 * and opens the DispatchPanel slide-over.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useIncidentStore } from '@/store/incidentStore';
import { useAmbulanceStore } from '@/store/ambulanceStore';
import { useMapStore } from '@/store/mapStore';
import { DEMO_KPI } from '@/api/demo-fixtures';

import AlertBanner    from './components/AlertBanner';
import IncidentPanel  from './components/IncidentPanel';
import AmbulancePanel from './components/AmbulancePanel';
import HospitalPanel  from './components/HospitalPanel';
import LiveMap       from './components/LiveMap';
import MapLayerControl from './components/MapLayerControl';
import DispatchPanel  from './components/DispatchPanel';

import styles from './CommandCenterPage.module.css';

// ─── KPI Strip ────────────────────────────────────────────────────────────────

interface KPICardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  color?: string;
  pulse?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({ label, value, subLabel, color, pulse }) => (
  <div className={styles.kpiCard}>
    <span
      className={styles.kpiValue}
      style={{ color: color ?? 'var(--color-text-primary)' }}
    >
      {pulse && <span className={styles.kpiPulse} aria-hidden="true" />}
      {value}
    </span>
    <span className={styles.kpiLabel}>{label}</span>
    {subLabel && <span className={styles.kpiSub}>{subLabel}</span>}
  </div>
);

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

// ─── Page Component ───────────────────────────────────────────────────────────

const CommandCenterPage: React.FC = () => {
  const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';

  const loadIncidents = useIncidentStore((s) => s.loadIncidents);
  const loadAmbulances = useAmbulanceStore((s) => s.loadAmbulances);

  useEffect(() => {
    loadIncidents();
    loadAmbulances();
  }, [loadIncidents, loadAmbulances]);

  const { layers } = useMapStore();
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [dispatchOpen, setDispatchOpen]             = useState(false);

  const handleIncidentSelect = useCallback((id: string) => {
    setSelectedIncidentId((prev) => (prev === id ? null : id));
  }, []);

  const handleDispatchOpen = useCallback(() => {
    if (selectedIncidentId) setDispatchOpen(true);
  }, [selectedIncidentId]);

  const kpi = isDemo ? DEMO_KPI : null;

  return (
    <div className={styles.page}>
      {/* ── Alert Banner ───────────────────────────────────────────── */}
      <AlertBanner />

      {/* ── KPI Strip ──────────────────────────────────────────────── */}
      <div className={styles.kpiStrip} role="region" aria-label="Key performance indicators">
        {kpi ? (
          <>
            <KPICard
              label="Active Incidents"
              value={kpi.active_incidents}
              color="#ef4444"
              pulse
            />
            <KPICard
              label="Avg. Response"
              value={fmtTime(kpi.avg_response_time_sec)}
              subLabel="target < 8 min"
            />
            <KPICard
              label="Golden Hour"
              value={`${kpi.golden_hour_compliance_pct}%`}
              subLabel="compliance today"
              color={kpi.golden_hour_compliance_pct >= 80 ? '#22c55e' : '#f59e0b'}
            />
            <KPICard
              label="Fleet Available"
              value={`${kpi.ambulances_available} / ${kpi.ambulances_available + kpi.ambulances_deployed}`}
              color="#22c55e"
            />
            <KPICard
              label="Avg. Dispatch"
              value={fmtTime(kpi.average_dispatch_time_sec)}
              subLabel="target < 2 min"
            />
            <KPICard
              label="Today's Incidents"
              value={kpi.total_incidents_today}
            />
          </>
        ) : (
          <p className={styles.kpiLoading}>Loading KPIs…</p>
        )}

        {/* Dispatch shortcut */}
        {selectedIncidentId && (
          <button
            className={styles.dispatchBtn}
            onClick={handleDispatchOpen}
            id="open-dispatch-btn"
            aria-label="Open dispatch panel for selected incident"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              strokeLinejoin="round" aria-hidden="true">
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
            Dispatch
          </button>
        )}
      </div>

      {/* ── Main 3-column grid ─────────────────────────────────────── */}
      <div className={styles.mainGrid}>
        {/* Incident panel (left) */}
        <IncidentPanel
          selectedId={selectedIncidentId}
          onSelect={handleIncidentSelect}
        />

        {/* Map (centre) */}
        <div className={styles.mapArea} role="region" aria-label="Live operational map">
          {/* Layer controls overlay */}
          <div className={styles.mapControls}>
            <MapLayerControl />
          </div>

          <LiveMap
            layers={layers}
            selectedIncidentId={selectedIncidentId}
            onIncidentClick={handleIncidentSelect}
          />

          {/* Selected incident action FAB */}
          {selectedIncidentId && !dispatchOpen && (
            <button
              className={styles.mapFab}
              onClick={handleDispatchOpen}
              aria-label="Open dispatch panel"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                strokeLinejoin="round" aria-hidden="true">
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
              </svg>
              Dispatch Selected
            </button>
          )}
        </div>

        {/* Ambulance panel (right) */}
        <AmbulancePanel />
      </div>

      {/* ── Hospital capacity strip ─────────────────────────────────── */}
      <HospitalPanel />

      {/* ── Dispatch modal ──────────────────────────────────────────── */}
      {dispatchOpen && (
        <DispatchPanel
          incidentId={selectedIncidentId}
          onClose={() => setDispatchOpen(false)}
        />
      )}
    </div>
  );
};

export default CommandCenterPage;
