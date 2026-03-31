/**
 * DispatchHistory.tsx
 *
 * Renders the full dispatch record(s) for an incident.
 * Shows each DispatchRecord as a timeline of operational milestones:
 *   Dispatched → Scene Arrived → Transport Started → Hospital Arrived
 * with computed durations between each milestone.
 *
 * Also shows: ambulance details, dispatcher, auto/manual flag,
 * receiving hospital, and total time breakdown.
 *
 * Props:
 *  records — DispatchRecord[] from IncidentDetail
 */

import React from 'react';
import type { DispatchRecord } from '../IncidentDetailPage';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatDuration(seconds: number | null): string {
  if (seconds == null) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function diffSeconds(from: string | null, to: string | null): number | null {
  if (!from || !to) return null;
  return Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 1000);
}

// ─── Milestone Row ────────────────────────────────────────────────────────────

interface MilestoneProps {
  label: string;
  time: string | null;
  icon: React.ReactNode;
  color: string;
  isReached: boolean;
  duration?: string | null;  // elapsed since previous milestone
}

const Milestone: React.FC<MilestoneProps> = ({ label, time, icon, color, isReached, duration }) => (
  <div style={milestoneRow}>
    <div
      style={{
        ...milestoneDot,
        background: isReached ? color : '#1e293b',
        border: `1px solid ${isReached ? color : '#334155'}`,
        color: isReached ? '#fff' : '#475569',
      }}
      aria-hidden="true"
    >
      {icon}
    </div>
    <div style={milestoneBody}>
      <div style={milestoneHeader}>
        <span style={{ ...milestoneLabel, color: isReached ? '#f1f5f9' : '#475569' }}>
          {label}
        </span>
        {isReached && (
          <span style={milestoneTime}>
            {formatTime(time)}
          </span>
        )}
      </div>
      {duration && isReached && (
        <span style={milestoneDuration}>+{duration}</span>
      )}
      {!isReached && (
        <span style={milestonePending}>Pending…</span>
      )}
    </div>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

interface DispatchHistoryProps {
  records: DispatchRecord[];
}

const DispatchHistory: React.FC<DispatchHistoryProps> = ({ records }) => {
  if (records.length === 0) {
    return (
      <div style={emptyBox}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" aria-hidden="true">
          <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
          <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
        <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>No dispatch assigned yet.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {records.map((rec, i) => {
        const responseTime  = rec.response_time_sec ?? diffSeconds(rec.dispatched_at, rec.scene_arrived_at);
        const transportTime = rec.transport_time_sec ?? diffSeconds(rec.transport_started_at, rec.hospital_arrived_at);
        const loadTime      = diffSeconds(rec.scene_arrived_at, rec.transport_started_at);
        const totalTime     = rec.total_time_sec;

        return (
          <div key={rec.id} style={recordCard}>
            {/* ── Header ──────────────────────────────────────────── */}
            <div style={recordHeader}>
              <div style={ambLabel}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" aria-hidden="true">
                  <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
                <span style={ambReg}>{rec.ambulance_registration}</span>
                <span style={ambType}>{rec.ambulance_type}</span>
              </div>
              <div style={dispatchMode}>
                {rec.was_auto ? (
                  <span style={{ ...modeBadge, background: '#1e3a5f', color: '#60a5fa', borderColor: '#1d4ed8' }}>
                    ⚡ Auto
                  </span>
                ) : (
                  <span style={{ ...modeBadge, background: '#3b1f6e', color: '#c4b5fd', borderColor: '#7c3aed' }}>
                    👤 Manual
                  </span>
                )}
              </div>
            </div>

            {/* ── Dispatcher & Hospital ────────────────────────────── */}
            <div style={metaRow}>
              {rec.dispatcher_name && (
                <span style={metaChip}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  {rec.dispatcher_name}
                </span>
              )}
              {rec.receiving_hospital && (
                <span style={metaChip}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  {rec.receiving_hospital}
                </span>
              )}
            </div>

            {/* ── Milestone timeline ───────────────────────────────── */}
            <div style={milestoneList}>
              <Milestone
                label="Dispatched"
                time={rec.dispatched_at}
                isReached={!!rec.dispatched_at}
                color="#3b82f6"
                icon={<DispatchIcon />}
              />
              <MilestoneDivider />
              <Milestone
                label="Scene Arrived"
                time={rec.scene_arrived_at}
                isReached={!!rec.scene_arrived_at}
                color="#ef4444"
                icon={<SceneIcon />}
                duration={responseTime != null ? formatDuration(responseTime) : null}
              />
              <MilestoneDivider />
              <Milestone
                label="Transport Started"
                time={rec.transport_started_at}
                isReached={!!rec.transport_started_at}
                color="#f97316"
                icon={<TransportIcon />}
                duration={loadTime != null ? formatDuration(loadTime) : null}
              />
              <MilestoneDivider />
              <Milestone
                label="Hospital Arrived"
                time={rec.hospital_arrived_at}
                isReached={!!rec.hospital_arrived_at}
                color="#22c55e"
                icon={<HospitalIcon />}
                duration={transportTime != null ? formatDuration(transportTime) : null}
              />
            </div>

            {/* ── KPI summary ──────────────────────────────────────── */}
            <div style={kpiRow}>
              <KpiBox label="Response" value={formatDuration(responseTime)} color="#3b82f6" />
              <KpiBox label="On Scene"  value={formatDuration(loadTime)}     color="#ef4444" />
              <KpiBox label="Transport" value={formatDuration(transportTime)} color="#f97316" />
              {totalTime != null && (
                <KpiBox label="Total" value={formatDuration(totalTime)} color="#22c55e" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const MilestoneDivider: React.FC = () => (
  <div style={{ width: 1, height: 12, background: '#334155', margin: '0 14px' }} aria-hidden="true" />
);

interface KpiBoxProps {
  label: string;
  value: string;
  color: string;
}

const KpiBox: React.FC<KpiBoxProps> = ({ label, value, color }) => (
  <div style={{ ...kpiBox, borderColor: `${color}33` }}>
    <span style={kpiLabel}>{label}</span>
    <span style={{ ...kpiValue, color }}>{value}</span>
  </div>
);

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function DispatchIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="22 2 11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}

function SceneIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    </svg>
  );
}

function TransportIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    </svg>
  );
}

function HospitalIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const emptyBox: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 10,
  padding: '24px 0',
};

const recordCard: React.CSSProperties = {
  background: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: 8,
  padding: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const recordHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const ambLabel: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const ambReg: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: '#f1f5f9',
  fontFamily: 'monospace',
};

const ambType: React.CSSProperties = {
  fontSize: 10,
  color: '#64748b',
  padding: '1px 6px',
  border: '1px solid #334155',
  borderRadius: 4,
  fontWeight: 600,
};

const dispatchMode: React.CSSProperties = {};

const modeBadge: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: 4,
  border: '1px solid',
};

const metaRow: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
};

const metaChip: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 10,
  color: '#64748b',
  padding: '2px 8px',
  border: '1px solid #1e293b',
  borderRadius: 4,
};

const milestoneList: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
  padding: '4px 0',
};

const milestoneRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
};

const milestoneDot: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const milestoneBody: React.CSSProperties = {
  flex: 1,
  paddingTop: 4,
};

const milestoneHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
};

const milestoneLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
};

const milestoneTime: React.CSSProperties = {
  fontSize: 11,
  color: '#94a3b8',
  fontFamily: 'monospace',
};

const milestoneDuration: React.CSSProperties = {
  fontSize: 10,
  color: '#64748b',
  fontStyle: 'italic',
};

const milestonePending: React.CSSProperties = {
  fontSize: 10,
  color: '#334155',
  fontStyle: 'italic',
};

const kpiRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))',
  gap: 6,
  marginTop: 4,
};

const kpiBox: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
  padding: '6px 4px',
  border: '1px solid',
  borderRadius: 6,
  background: 'rgba(255,255,255,0.02)',
};

const kpiLabel: React.CSSProperties = {
  fontSize: 9,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  fontWeight: 600,
};

const kpiValue: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  fontFamily: 'monospace',
};

export default DispatchHistory;