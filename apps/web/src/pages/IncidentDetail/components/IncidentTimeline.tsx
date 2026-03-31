/**
 * IncidentTimeline.tsx
 *
 * Vertical timeline of all status changes for an incident.
 * Each entry shows: status icon, status label, actor, relative time, and optional note.
 *
 * Props:
 *  entries — ordered array of TimelineEntry (newest last)
 */

import React from 'react';
import type { TimelineEntry, IncidentStatus } from '../IncidentDetailPage';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<IncidentStatus, string> = {
  REPORTED:         'Reported',
  DISPATCH_PENDING: 'Dispatch Pending',
  DISPATCHED:       'Dispatched',
  EN_ROUTE:         'En Route',
  ON_SCENE:         'On Scene',
  PATIENT_LOADED:   'Patient Loaded',
  TRANSPORTING:     'Transporting',
  HOSPITAL_ARRIVED: 'Hospital Arrived',
  CLOSED:           'Closed',
  CANCELLED:        'Cancelled',
};

const STATUS_COLORS: Record<IncidentStatus, string> = {
  REPORTED:         '#6b7280',
  DISPATCH_PENDING: '#f59e0b',
  DISPATCHED:       '#3b82f6',
  EN_ROUTE:         '#8b5cf6',
  ON_SCENE:         '#ef4444',
  PATIENT_LOADED:   '#f97316',
  TRANSPORTING:     '#06b6d4',
  HOSPITAL_ARRIVED: '#22c55e',
  CLOSED:           '#4b5563',
  CANCELLED:        '#dc2626',
};

const STATUS_ICONS: Record<IncidentStatus, React.ReactNode> = {
  REPORTED:         <ReportedIcon />,
  DISPATCH_PENDING: <PendingIcon />,
  DISPATCHED:       <DispatchedIcon />,
  EN_ROUTE:         <EnRouteIcon />,
  ON_SCENE:         <OnSceneIcon />,
  PATIENT_LOADED:   <PatientLoadedIcon />,
  TRANSPORTING:     <TransportingIcon />,
  HOSPITAL_ARRIVED: <HospitalIcon />,
  CLOSED:           <ClosedIcon />,
  CANCELLED:        <CancelledIcon />,
};

function formatRelativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function formatAbsoluteTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface IncidentTimelineProps {
  entries: TimelineEntry[];
}

const IncidentTimeline: React.FC<IncidentTimelineProps> = ({ entries }) => {
  if (entries.length === 0) {
    return <p style={empty}>No timeline entries yet.</p>;
  }

  return (
    <ol style={listStyle} role="list" aria-label="Incident timeline">
      {entries.map((entry, idx) => {
        const color   = STATUS_COLORS[entry.status] ?? '#6b7280';
        const isLast  = idx === entries.length - 1;
        const elapsed = elapsedBetween(entries, idx);

        return (
          <li key={entry.id} style={itemStyle}>
            {/* ── Track line ─────────────────────────────────────────── */}
            <div style={trackCol}>
              <div
                style={{
                  ...dot,
                  background: color,
                  boxShadow: isLast ? `0 0 0 3px ${color}33` : 'none',
                }}
                aria-hidden="true"
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  {STATUS_ICONS[entry.status]}
                </span>
              </div>
              {!isLast && <div style={connector} />}
            </div>

            {/* ── Content ────────────────────────────────────────────── */}
            <div style={contentCol}>
              <div style={entryHeader}>
                <span style={{ ...statusLabel, color }}>{STATUS_LABELS[entry.status]}</span>
                <time
                  dateTime={entry.created_at}
                  title={new Date(entry.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  style={timeStyle}
                >
                  {formatAbsoluteTime(entry.created_at)}
                  <span style={relativeTime}>{formatRelativeTime(entry.created_at)}</span>
                </time>
              </div>

              {entry.actor_name && (
                <span style={actorStyle}>{entry.actor_name}</span>
              )}

              {entry.note && (
                <p style={noteStyle}>{entry.note}</p>
              )}

              {elapsed !== null && !isLast && (
                <span style={elapsedStyle}>+{elapsed} from previous</span>
              )}

              <div style={{ marginBottom: 16 }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
};

function elapsedBetween(entries: TimelineEntry[], idx: number): string | null {
  if (idx === 0) return null;
  const curr = new Date(entries[idx].created_at).getTime();
  const prev = new Date(entries[idx - 1].created_at).getTime();
  const diff = Math.floor((curr - prev) / 1000);
  if (diff < 0) return null;
  if (diff < 60)   return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`;
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
}

// ─── Inline styles ────────────────────────────────────────────────────────────

const listStyle: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
};

const itemStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
};

const trackCol: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flexShrink: 0,
};

const dot: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'box-shadow 0.3s',
};

const connector: React.CSSProperties = {
  width: 2,
  flex: 1,
  minHeight: 16,
  background: '#334155',
  margin: '2px 0',
};

const contentCol: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  paddingTop: 2,
};

const entryHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 8,
  marginBottom: 2,
};

const statusLabel: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
};

const timeStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  fontSize: 10,
  color: '#64748b',
  fontFamily: 'monospace',
  flexShrink: 0,
};

const relativeTime: React.CSSProperties = {
  fontSize: 10,
  color: '#475569',
};

const actorStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#64748b',
  display: 'block',
  marginBottom: 2,
};

const noteStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#94a3b8',
  margin: '4px 0 0',
  lineHeight: 1.5,
};

const elapsedStyle: React.CSSProperties = {
  fontSize: 10,
  color: '#475569',
  fontStyle: 'italic',
  display: 'block',
  marginTop: 3,
};

const empty: React.CSSProperties = {
  fontSize: 13,
  color: '#64748b',
  margin: 0,
};

// ─── SVG Icon helpers ─────────────────────────────────────────────────────────

function ReportedIcon()         { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="4"/></svg>; }
function PendingIcon()          { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function DispatchedIcon()       { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="22 2 11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>; }
function EnRouteIcon()          { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>; }
function OnSceneIcon()          { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
function PatientLoadedIcon()    { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M16 3.13a4 4 0 010 7.75"/><path d="M21 21v-2a4 4 0 00-3-3.87"/><path d="M12 12a4 4 0 100-8 4 4 0 000 8z"/><path d="M3 21v-2a4 4 0 014-4h4"/></svg>; }
function TransportingIcon()     { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>; }
function HospitalIcon()         { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function ClosedIcon()           { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function CancelledIcon()        { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }

export default IncidentTimeline;