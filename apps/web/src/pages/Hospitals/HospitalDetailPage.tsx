/**
 * HospitalDetailPage.tsx
 *
 * Full clinical resource snapshot for a single trauma centre.
 *
 * Layout:
 * ┌────────────────────────────────────────────────────────────────┐
 * │  Header: name, trauma level, district, phone, status bar      │
 * ├─────────────────────────────────┬──────────────────────────────┤
 * │  Left: ResourceBar × 3         │  Right: mini Leaflet map     │
 * │  TraumaSlotTable (full detail) │  (hospital location)         │
 * └─────────────────────────────────┴──────────────────────────────┘
 */

import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useHospitalStore } from '@/store/hospitalStore';
import { ROUTES } from '@/App';
import ResourceBar   from './components/ResourceBar';
import TraumaSlotTable from './components/TraumaSlotTable';
import HospitalMap   from './components/HospitalMap';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<string, { label: string; color: string }> = {
  LEVEL_1: { label: 'Level I — Major Trauma Centre',  color: '#ef4444' },
  LEVEL_2: { label: 'Level II — Regional Trauma',     color: '#f59e0b' },
  LEVEL_3: { label: 'Level III — Community Trauma',   color: '#22c55e' },
};

// ─── Component ────────────────────────────────────────────────────────────────

const HospitalDetailPage: React.FC = () => {
  const { hospitalId }            = useParams<{ hospitalId: string }>();
  const { hospitals, fetchHospitals } = useHospitalStore();

  React.useEffect(() => {
    if (hospitals.length === 0) fetchHospitals();
  }, [hospitals.length, fetchHospitals]);

  const hospital = useMemo(
    () => hospitals.find((h) => h.id === hospitalId),
    [hospitals, hospitalId],
  );

  // ── Loading / Not Found ───────────────────────────────────────────────────
  if (hospitals.length === 0) {
    return (
      <div style={centred}>
        <div style={spinner} />
        <p style={{ color: '#64748b', margin: 0 }}>Loading hospital data…</p>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div style={centred}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h2 style={{ color: '#f1f5f9', margin: 0, fontSize: 18 }}>Hospital not found</h2>
        <Link to={ROUTES.HOSPITALS} style={backLink}>← Back to Hospital Network</Link>
      </div>
    );
  }

  const lvl = LEVEL_CONFIG[hospital.trauma_level] ?? { label: hospital.trauma_level, color: '#64748b' };
  const r   = hospital.resources;

  const icuPct  = r.icu_beds_total   ? ((r.icu_beds_total - r.icu_beds_available) / r.icu_beds_total) * 100 : 0;
  const ventPct = r.ventilators_total ? ((r.ventilators_total - r.ventilators_available) / r.ventilators_total) * 100 : 0;
  const isAlerted = icuPct >= 80 || ventPct >= 80;

  return (
    <div style={page}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header style={{ ...header, borderTopColor: lvl.color }}>
        <div style={headerLeft}>
          <Link to={ROUTES.HOSPITALS} style={backBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Hospital Network
          </Link>

          <div>
            <h1 style={h1}>{hospital.name}</h1>

            <div style={meta}>
              <span style={{ ...levelBadge, color: lvl.color, borderColor: `${lvl.color}44`, background: `${lvl.color}14` }}>
                {lvl.label}
              </span>
              <span style={metaItem}>📍 {hospital.district}</span>
              <span style={metaItem}>📞 {hospital.phone}</span>
              {!hospital.is_active && (
                <span style={{ ...metaItem, color: '#ef4444', fontWeight: 700 }}>⚠ INACTIVE</span>
              )}
            </div>
          </div>
        </div>

        {/* Alert badge */}
        {isAlerted && (
          <div style={alertBanner}>
            <span style={{ fontSize: 18 }}>⚠</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>CAPACITY ALERT</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                {icuPct >= 80 ? `ICU at ${icuPct.toFixed(0)}% ` : ''}
                {ventPct >= 80 ? `Ventilators at ${ventPct.toFixed(0)}%` : ''}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div style={body}>
        {/* Left: Resources */}
        <div style={leftPanel}>
          {/* Core resource bars */}
          <Section title="Capacity Overview" icon="📊">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <ResourceBar
                label="ICU Beds"
                icon="🛏"
                available={r.icu_beds_available}
                total={r.icu_beds_total}
                critical={icuPct >= 90}
              />
              <ResourceBar
                label="ED Occupancy"
                icon="🚨"
                available={r.ed_capacity_total - r.ed_capacity_current}
                total={r.ed_capacity_total}
              />
              <ResourceBar
                label="Ventilators"
                icon="💨"
                available={r.ventilators_available}
                total={r.ventilators_total}
                critical={ventPct >= 90}
              />
            </div>
          </Section>

          {/* Detailed slot table */}
          <Section title="Full Resource Manifest" icon="📋">
            <TraumaSlotTable resources={r} />
          </Section>
        </div>

        {/* Right: Map + Info */}
        <div style={rightPanel}>
          {/* Map */}
          <Section title="Location" icon="📍" noPad>
            <div style={{ height: 280 }}>
              <HospitalMap
                lat={hospital.latitude}
                lng={hospital.longitude}
                name={hospital.name}
                traumaLevel={hospital.trauma_level}
              />
            </div>
          </Section>

          {/* Address */}
          <Section title="Address" icon="🏢">
            <p style={addressText}>{hospital.address}</p>
          </Section>

          {/* Quick action */}
          <Section title="Quick Actions" icon="⚡">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a
                href={`https://www.google.com/maps?q=${hospital.latitude},${hospital.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                style={actionBtn}
              >
                🗺 Open in Google Maps
              </a>
              <a href={`tel:${hospital.phone}`} style={actionBtn}>
                📞 Call {hospital.phone}
              </a>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

// ─── Section wrapper ──────────────────────────────────────────────────────────

const Section: React.FC<{ title: string; icon?: string; children: React.ReactNode; noPad?: boolean }> = ({
  title, icon, children, noPad,
}) => (
  <section style={section}>
    <h2 style={sectionTitle}>
      {icon && <span aria-hidden="true">{icon} </span>}{title}
    </h2>
    <div style={noPad ? {} : { padding: '0 0 4px' }}>{children}</div>
  </section>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const page: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', height: '100%',
  background: '#0f172a', color: '#f1f5f9', overflow: 'hidden',
};
const header: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '16px 24px', borderBottom: '1px solid #334155',
  background: '#1e293b', flexShrink: 0, borderTop: '3px solid',
  gap: 16,
};
const headerLeft: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 };
const h1: React.CSSProperties = { fontSize: 20, fontWeight: 800, margin: 0 };
const meta: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' };
const metaItem: React.CSSProperties = { fontSize: 12, color: '#64748b' };
const levelBadge: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 10, border: '1px solid',
};
const backBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  fontSize: 12, color: '#64748b', textDecoration: 'none',
  border: '1px solid #334155', borderRadius: 6, padding: '5px 10px',
  transition: 'color 0.15s, border-color 0.15s',
};
const alertBanner: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
  borderRadius: 8, padding: '10px 16px', flexShrink: 0,
};
const body: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 320px',
  flex: 1, overflow: 'hidden', minHeight: 0,
};
const leftPanel: React.CSSProperties = {
  overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent',
  borderRight: '1px solid #334155',
};
const rightPanel: React.CSSProperties = {
  overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent',
};
const section: React.CSSProperties = {
  padding: '18px 20px', borderBottom: '1px solid #334155',
};
const sectionTitle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#64748b',
  textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px',
};
const addressText: React.CSSProperties = {
  fontSize: 13, color: '#94a3b8', lineHeight: 1.6, margin: 0,
};
const actionBtn: React.CSSProperties = {
  display: 'block', padding: '9px 14px', background: 'transparent',
  border: '1px solid #334155', borderRadius: 6, color: '#94a3b8',
  fontSize: 12, fontWeight: 600, textDecoration: 'none',
  transition: 'all 0.15s',
};
const centred: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  justifyContent: 'center', height: '100%', gap: 16,
};
const backLink: React.CSSProperties = {
  color: '#3b82f6', fontSize: 13, textDecoration: 'none',
};
const spinner: React.CSSProperties = {
  width: 36, height: 36, border: '3px solid #334155',
  borderTopColor: '#ef4444', borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
};

export default HospitalDetailPage;
