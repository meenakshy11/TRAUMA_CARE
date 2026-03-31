/**
 * AmbulanceRegistryPage.tsx
 *
 * Fleet management and administrative oversight dashboard.
 *
 * Layout:
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  Header: "Fleet Registry" + "Register Vehicle" button           │
 * ├───────────────────────────────────────────────────────────────── │
 * │  KPI Strip: Total | Available | Deployed | Maintenance | Off    │
 * ├──────────────────────────────────────────────────────────────────┤
 * │  Controls: Search | Type filter | Status filter                 │
 * ├──────────────────────────────────────────────────────────────────┤
 * │  DataTable (sortable columns)                                   │
 * │   + Expandable row detail: crew manifest + equipment inventory  │
 * └──────────────────────────────────────────────────────────────────┘
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import DataTable, { type ColumnDef } from '@/components/DataTable';
import { useAmbulanceStore } from '@/store/ambulanceStore';
import type { Ambulance, AmbulanceType, AmbulanceStatus } from '@trauma/shared';

// ─── Config Maps ──────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<AmbulanceType, { label: string; color: string; description: string }> = {
  ALS:  { label: 'ALS',  color: '#ef4444', description: 'Advanced Life Support' },
  BLS:  { label: 'BLS',  color: '#3b82f6', description: 'Basic Life Support' },
  NICU: { label: 'NICU', color: '#a78bfa', description: 'Neonatal ICU Transport' },
  MFR:  { label: 'MFR',  color: '#f59e0b', description: 'Medical First Responder' },
  HEMS: { label: 'HEMS', color: '#06b6d4', description: 'Helicopter EMS' },
};

const STATUS_CONFIG: Record<AmbulanceStatus, { label: string; color: string }> = {
  AVAILABLE:     { label: 'Available',    color: '#22c55e' },
  DISPATCHED:    { label: 'Dispatched',   color: '#3b82f6' },
  ON_SCENE:      { label: 'On Scene',     color: '#ef4444' },
  TRANSPORTING:  { label: 'Transporting', color: '#06b6d4' },
  AT_HOSPITAL:   { label: 'At Hospital',  color: '#a78bfa' },
  RETURNING:     { label: 'Returning',    color: '#f59e0b' },
  MAINTENANCE:   { label: 'Maintenance',  color: '#f97316' },
  OFF_DUTY:      { label: 'Off Duty',     color: '#64748b' },
  DECOMMISSIONED:{ label: 'Decommissioned', color: '#475569' },
};

const ACTIVE_STATUSES = new Set(['DISPATCHED', 'ON_SCENE', 'TRANSPORTING', 'AT_HOSPITAL', 'RETURNING']);

// ─── Cell Renderers ───────────────────────────────────────────────────────────

const TypeBadge: React.FC<{ type: AmbulanceType }> = ({ type }) => {
  const cfg = TYPE_CONFIG[type];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
      background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}33`,
      letterSpacing: '0.04em',
    }}>
      {cfg.label}
    </span>
  );
};

const StatusPill: React.FC<{ status: AmbulanceStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: '#64748b' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
      background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}33`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
};

function LastSeen(iso: string | null): string {
  if (!iso) return '—';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}


// ─── Main Component ───────────────────────────────────────────────────────────

const AmbulanceRegistryPage: React.FC = () => {
  const { ambulances, isLoading, loadFullRegistry, updateAmbulanceStatus } = useAmbulanceStore();
  const [search,        setSearch]        = useState('');
  const [typeFilter,    setTypeFilter]    = useState('ALL');
  const [statusFilter,  setStatusFilter]  = useState('ALL');
  const [expandedId,    setExpandedId]    = useState<string | null>(null);

  useEffect(() => { loadFullRegistry(); }, [loadFullRegistry]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return ambulances.filter((a) => {
      const matchSearch  = a.registration_no.toLowerCase().includes(q) ||
                           a.call_sign.toLowerCase().includes(q) ||
                           a.district.toLowerCase().includes(q);
      const matchType    = typeFilter === 'ALL' || a.ambulance_type === typeFilter;
      const matchStatus  = statusFilter === 'ALL' || a.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [ambulances, search, typeFilter, statusFilter]);

  // KPI counts
  const kpi = useMemo(() => ({
    total:       ambulances.length,
    available:   ambulances.filter((a) => a.status === 'AVAILABLE').length,
    deployed:    ambulances.filter((a) => ACTIVE_STATUSES.has(a.status)).length,
    maintenance: ambulances.filter((a) => a.status === 'MAINTENANCE').length,
    off_duty:    ambulances.filter((a) => a.status === 'OFF_DUTY').length,
  }), [ambulances]);

  const handleRegister = () => {
    toast.success('Vehicle registration form coming soon — backend integration pending.', { duration: 3000 });
  };

  const handleStatusChange = useCallback((id: string, status: string) => {
    updateAmbulanceStatus(id, status as AmbulanceStatus);
    toast.success(`Status updated to ${STATUS_CONFIG[status as AmbulanceStatus]?.label ?? status}`);
  }, [updateAmbulanceStatus]);

  const handleRowClick = (row: Ambulance) => {
    setExpandedId((prev) => (prev === row.id ? null : row.id));
  };

  // Column definitions for DataTable
  const columns: ColumnDef<Ambulance>[] = [
    {
      key: 'call_sign', label: 'Call Sign', sortable: true, minWidth: 100,
      render: (r) => <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#f1f5f9', fontSize: 12 }}>{r.call_sign}</span>,
    },
    {
      key: 'registration_no', label: 'Plate', sortable: true, minWidth: 120,
      render: (r) => <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>{r.registration_no}</span>,
    },
    {
      key: 'ambulance_type', label: 'Type', sortable: true,
      render: (r) => <TypeBadge type={r.ambulance_type} />,
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (r) => <StatusPill status={r.status} />,
    },
    {
      key: 'district', label: 'District', sortable: true,
      render: (r) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{r.district}</span>,
    },
    {
      key: 'staging_station_name', label: 'Station', minWidth: 160,
      render: (r) => <span style={{ color: '#64748b', fontSize: 11 }}>{r.staging_station_name ?? '—'}</span>,
    },
    {
      key: 'last_location_at', label: 'Last Ping', sortable: true,
      render: (r) => <span style={{ color: '#475569', fontSize: 11 }}>{LastSeen(r.last_location_at)}</span>,
    },
    {
      key: 'crew', label: 'Crew', align: 'center',
      render: (r) => (
        <span style={{
          fontFamily: 'monospace', fontWeight: 700, fontSize: 13,
          color: (r.crew?.length ?? 0) === 0 ? '#ef4444' : '#22c55e',
        }}>
          {r.crew?.length ?? 0}
        </span>
      ),
    },
    {
      key: 'id', label: '', align: 'right',
      render: (r) => (
        <span style={{ color: expandedId === r.id ? '#3b82f6' : '#475569', fontSize: 18, lineHeight: 1 }}>
          {expandedId === r.id ? '▲' : '▼'}
        </span>
      ),
    },
  ];

  return (
    <div style={page}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header style={header}>
        <div>
          <h1 style={h1}>🚑 Ambulance Fleet Registry</h1>
          <p style={subtitle}>
            {ambulances.length} vehicles registered across the Kerala Trauma Grid
          </p>
        </div>
        <button style={registerBtn} onClick={handleRegister} aria-label="Register new vehicle">
          + Register Vehicle
        </button>
      </header>

      {/* ── KPI Strip ───────────────────────────────────────────────── */}
      <div style={kpiStrip}>
        <KpiTile icon="🏁" label="Total" value={kpi.total} color="#64748b" />
        <KpiTile icon="✅" label="Available" value={kpi.available} color="#22c55e" onClick={() => setStatusFilter('AVAILABLE')} />
        <KpiTile icon="🔴" label="Deployed" value={kpi.deployed} color="#ef4444" />
        <KpiTile icon="🔧" label="Maintenance" value={kpi.maintenance} color="#f97316" onClick={() => setStatusFilter('MAINTENANCE')} />
        <KpiTile icon="💤" label="Off Duty" value={kpi.off_duty} color="#64748b" onClick={() => setStatusFilter('OFF_DUTY')} />

        {/* Type breakdown */}
        <div style={typeDivider} />
        {(['ALS', 'BLS', 'NICU', 'MFR', 'HEMS'] as AmbulanceType[]).map((t) => {
          const count = ambulances.filter((a) => a.ambulance_type === t).length;
          const cfg   = TYPE_CONFIG[t];
          return (
            <button
              key={t}
              style={{ ...typeChip, background: typeFilter === t ? `${cfg.color}22` : 'transparent', borderColor: typeFilter === t ? cfg.color : '#334155', color: typeFilter === t ? cfg.color : '#64748b' }}
              onClick={() => setTypeFilter(typeFilter === t ? 'ALL' : t)}
              aria-pressed={typeFilter === t}
              title={cfg.description}
            >
              <span style={{ fontWeight: 800 }}>{count}</span> {t}
            </button>
          );
        })}
      </div>

      {/* ── Filter row ───────────────────────────────────────────────── */}
      <div style={controlsRow}>
        <div style={searchBox}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search by plate, call sign, district…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={searchInput}
          />
        </div>

        <select style={filterSelect} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        {(search || typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
          <button
            style={clearBtn}
            onClick={() => { setSearch(''); setTypeFilter('ALL'); setStatusFilter('ALL'); }}
          >
            Clear filters
          </button>
        )}

        <span style={resultCount}>
          {filtered.length} of {ambulances.length} vehicles
        </span>
      </div>

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div style={tableWrapper}>
        <DataTable<Ambulance>
          columns={columns}
          data={filtered}
          loading={isLoading}
          onRowClick={handleRowClick}
          emptyMessage="No vehicles match your search or filter criteria."
          aria-label="Ambulance fleet registry"
          rowHighlight={(r) => r.status === 'MAINTENANCE' ? 'warning' : r.crew?.length === 0 && r.is_active ? 'danger' : null}
          footer={
            <div style={{ fontSize: 11, color: '#475569' }}>
              Click any row to expand crew manifest and equipment inventory ·
              Rows highlighted{' '}
              <span style={{ color: '#f97316' }}>orange</span> = maintenance ·{' '}
              <span style={{ color: '#ef4444' }}>red</span> = active but uncrewed
            </div>
          }
        />
      </div>

      {/* Expanded row rendered separately (outside DataTable) */}
      {/* Note: expansion is handled inline within DataTable via custom render. */}
      {/* For the selected row we render a detail panel below the table */}
      {expandedId && (() => {
        const amb = ambulances.find((a) => a.id === expandedId);
        if (!amb) return null;
        return (
          <div style={expandPanel} role="region" aria-label={`Detail for ${amb.call_sign}`}>
            <div style={expandPanelHeader}>
              <span style={{ fontWeight: 700, color: '#f1f5f9' }}>{amb.call_sign} — {amb.registration_no}</span>
              <button onClick={() => setExpandedId(null)} style={closeBtn} aria-label="Close">✕</button>
            </div>
            <div style={expandGrid}>
              {/* Crew */}
              <div style={expandSection}>
                <div style={expandTitle}>👥 Crew ({amb.crew?.length ?? 0})</div>
                {amb.crew && amb.crew.length > 0 ? amb.crew.map((m) => (
                  <div key={m.id} style={crewRow}>
                    <span style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 12 }}>{m.full_name}</span>
                    <span style={{ fontSize: 10, color: '#64748b' }}>{m.role} · {m.certification_level}</span>
                    <a href={`tel:${m.phone}`} style={{ fontSize: 11, color: '#3b82f6', marginLeft: 'auto', textDecoration: 'none' }}>{m.phone}</a>
                  </div>
                )) : <span style={{ color: '#475569', fontSize: 12 }}>No crew assigned</span>}
              </div>
              {/* Equipment */}
              <div style={expandSection}>
                <div style={expandTitle}>🩺 Equipment — <span style={{ color: '#f59e0b' }}>{amb.equipment?.drug_kit_level ?? 'N/A'}</span> Drug Kit</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {amb.equipment && [
                    { label: 'Defibrillator',       active: amb.equipment.has_defibrillator },
                    { label: 'Ventilator',           active: amb.equipment.has_ventilator },
                    { label: 'ECG Monitor',          active: amb.equipment.has_ecg_monitor },
                    { label: 'Infusion Pump',        active: amb.equipment.has_infusion_pump },
                    { label: 'Neonatal Incubator',   active: amb.equipment.has_neonatal_incubator },
                  ].map((item) => (
                    <span key={item.label} style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 9px', borderRadius: 10,
                      background: item.active ? 'rgba(34,197,94,0.1)' : 'rgba(71,85,105,0.1)',
                      color: item.active ? '#22c55e' : '#475569',
                      border: `1px solid ${item.active ? '#22c55e33' : '#1e293b'}`,
                    }}>
                      {item.active ? '✓' : '✗'} {item.label}
                    </span>
                  ))}
                </div>
              </div>
              {/* Service */}
              <div style={expandSection}>
                <div style={expandTitle}>🔧 Service Record</div>
                {[
                  ['Chassis No', amb.chassis_no ?? '—'],
                  ['Year', String(amb.year_of_manufacture ?? '—')],
                  ['Last Service', amb.last_service_at ? new Date(amb.last_service_at).toDateString() : '—'],
                  ['Next Service', amb.next_service_due ? new Date(amb.next_service_due).toDateString() : '—'],
                ].map(([k, v]) => (
                  <div key={k} style={serviceRow}>
                    <span style={{ color: '#64748b' }}>{k}</span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
              {/* Status controls */}
              <div style={expandSection}>
                <div style={expandTitle}>⚡ Update Status</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(['AVAILABLE', 'OFF_DUTY', 'MAINTENANCE'] as AmbulanceStatus[]).map((s) => (
                    <button key={s} disabled={amb.status === s}
                      onClick={() => handleStatusChange(amb.id, s)}
                      style={{
                        padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        border: `1px solid ${STATUS_CONFIG[s].color}44`,
                        background: amb.status === s ? `${STATUS_CONFIG[s].color}22` : 'transparent',
                        color: amb.status === s ? STATUS_CONFIG[s].color : '#64748b',
                      }}
                    >
                      {STATUS_CONFIG[s].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const KpiTile: React.FC<{ icon: string; label: string; value: number; color: string; onClick?: () => void }> = ({
  icon, label, value, color, onClick,
}) => (
  <button
    style={{ ...kpiTile, cursor: onClick ? 'pointer' : 'default', borderColor: '#334155' }}
    onClick={onClick}
    aria-label={`${label}: ${value}`}
  >
    <span aria-hidden="true">{icon}</span>
    <span style={{ fontSize: 20, fontWeight: 900, color, fontFamily: 'monospace' }}>{value}</span>
    <span style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
  </button>
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
const registerBtn: React.CSSProperties = {
  padding: '9px 18px', background: '#3b82f6', border: 'none', borderRadius: 8,
  color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
};
const kpiStrip: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', flexShrink: 0,
  borderBottom: '1px solid #334155', scrollbarWidth: 'none',
};
const kpiTile: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
  padding: '10px 20px', border: 'none', borderRight: '1px solid',
  background: 'transparent', flexShrink: 0,
};
const typeDivider: React.CSSProperties = {
  width: 1, height: 32, background: '#334155', flexShrink: 0, margin: '0 8px',
};
const typeChip: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5,
  padding: '5px 12px', border: '1px solid', borderRadius: 20,
  fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0, margin: '0 2px',
  background: 'transparent', transition: 'all 0.15s',
};
const controlsRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 24px',
  borderBottom: '1px solid #334155', flexShrink: 0, background: '#1e293b',
};
const searchBox: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '7px 12px', flex: 1, maxWidth: 320,
};
const searchInput: React.CSSProperties = {
  background: 'transparent', border: 'none', outline: 'none',
  color: '#f1f5f9', fontSize: 13, width: '100%', fontFamily: 'inherit',
};
const filterSelect: React.CSSProperties = {
  background: '#0f172a', border: '1px solid #334155', borderRadius: 6,
  color: '#94a3b8', padding: '7px 12px', fontSize: 13, cursor: 'pointer',
};
const clearBtn: React.CSSProperties = {
  background: 'transparent', border: '1px solid #334155', borderRadius: 6,
  color: '#64748b', fontSize: 12, padding: '6px 12px', cursor: 'pointer',
};
const resultCount: React.CSSProperties = {
  fontSize: 11, color: '#475569', marginLeft: 'auto', flexShrink: 0,
};
const tableWrapper: React.CSSProperties = {
  flex: 1, overflow: 'hidden', padding: '0 24px 12px', display: 'flex', flexDirection: 'column',
  minHeight: 0, paddingTop: 12,
};
const expandPanel: React.CSSProperties = {
  background: '#1e293b', borderTop: '2px solid #3b82f6',
  padding: '16px 24px', flexShrink: 0, maxHeight: 300, overflowY: 'auto',
};
const expandPanelHeader: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
};
const closeBtn: React.CSSProperties = {
  background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16,
};
const expandGrid: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16,
};
const expandSection: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 8,
};
const expandTitle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em',
};
const crewRow: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 1,
  padding: '5px 0', borderBottom: '1px solid #334155',
};
const serviceRow: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', fontSize: 12,
  padding: '3px 0', borderBottom: '1px solid #1e293b',
};
export default AmbulanceRegistryPage;
