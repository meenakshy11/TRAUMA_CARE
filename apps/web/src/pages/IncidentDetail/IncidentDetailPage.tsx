/**
 * IncidentDetailPage.tsx
 *
 * Full detail view for a single incident, accessed via /incidents/:incidentId.
 *
 * Layout (3-column on wide screens, stacked on mobile):
 * ┌──────────────────────────────────────────────────────────┐
 * │  Header: Incident number · Status badge · Severity chip  │
 * │  Golden Hour timer · MCI badge · Action buttons          │
 * ├─────────────────────┬──────────────────┬─────────────────┤
 * │  Left col           │  Centre col      │  Right col      │
 * │  IncidentTimeline   │  PatientList     │  DispatchHistory│
 * │  PhotoGallery       │  (TriageCard +   │                 │
 * │                     │   VitalSignsChart│                 │
 * │                     │   per patient)   │                 │
 * └─────────────────────┴──────────────────┴─────────────────┘
 *
 * Data strategy:
 *  • Live mode  → React Query fetches GET /incidents/:id (full nested response)
 *  • Demo mode  → returns DEMO_INCIDENT fixture immediately (no network call)
 */

import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/App';

import IncidentTimeline  from './components/IncidentTimeline';
import PatientList       from './components/PatientList';
import PhotoGallery      from './components/PhotoGallery';
import DispatchHistory   from './components/DispatchHistory';

import styles from './IncidentDetailPage.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export type IncidentStatus =
  | 'REPORTED' | 'DISPATCH_PENDING' | 'DISPATCHED'
  | 'EN_ROUTE' | 'ON_SCENE' | 'PATIENT_LOADED'
  | 'TRANSPORTING' | 'HOSPITAL_ARRIVED' | 'CLOSED' | 'CANCELLED';

export type IncidentSeverity = 'MINOR' | 'MODERATE' | 'SEVERE' | 'CRITICAL' | 'MCI';
export type AccidentType =
  | 'ROAD_ACCIDENT' | 'FALL' | 'ASSAULT' | 'CARDIAC'
  | 'BURNS' | 'DROWNING' | 'INDUSTRIAL' | 'OTHER';

export type TriageColor = 'BLACK' | 'RED' | 'YELLOW' | 'GREEN';
export type Gender = 'MALE' | 'FEMALE' | 'UNKNOWN';

export interface VitalSign {
  id: string;
  created_at: string;
  gcs_score: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  spo2: number | null;
  respiratory_rate: number | null;
  pulse_rate: number | null;
  temperature: number | null;
}

export interface TriageRecord {
  id: string;
  protocol: string;
  triage_color: TriageColor;
  respirations_ok: boolean;
  perfusion_ok: boolean;
  mental_status_ok: boolean;
  triage_score: number;
  assessed_by?: string;
  created_at: string;
}

export interface Patient {
  id: string;
  sequence_no: number;
  age_estimate: number | null;
  gender: Gender;
  triage_color: TriageColor | null;
  is_conscious: boolean | null;
  is_breathing: boolean | null;
  injury_description: string | null;
  vitals: VitalSign[];
  triage: TriageRecord | null;
}

export interface TimelineEntry {
  id: string;
  status: IncidentStatus;
  note: string | null;
  actor_name: string | null;
  created_at: string;
}

export interface IncidentPhoto {
  id: string;
  file_key: string;
  url: string;          // presigned MinIO URL
  uploaded_at: string;
  uploaded_by: string | null;
}

export interface DispatchRecord {
  id: string;
  ambulance_registration: string;
  ambulance_type: string;
  dispatcher_name: string | null;
  was_auto: boolean;
  dispatched_at: string | null;
  scene_arrived_at: string | null;
  transport_started_at: string | null;
  hospital_arrived_at: string | null;
  response_time_sec: number | null;
  transport_time_sec: number | null;
  total_time_sec: number | null;
  receiving_hospital: string | null;
}

export interface IncidentDetail {
  id: string;
  incident_number: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  accident_type: AccidentType;
  latitude: number;
  longitude: number;
  address_text: string;
  district: string;
  patient_count: number;
  description: string | null;
  is_mci: boolean;
  golden_hour_met: boolean | null;
  created_at: string;
  updated_at: string;
  reporter_name: string | null;
  ambulance_registration: string | null;
  receiving_hospital_name: string | null;
  patients: Patient[];
  timeline: TimelineEntry[];
  photos: IncidentPhoto[];
  dispatch: DispatchRecord[];
}

// ─── Demo Fixture ─────────────────────────────────────────────────────────────

const DEMO_INCIDENT: IncidentDetail = {
  id: 'inc-demo-001',
  incident_number: 'TRK-20241215-0042',
  status: 'ON_SCENE',
  severity: 'CRITICAL',
  accident_type: 'ROAD_ACCIDENT',
  latitude: 9.9312,
  longitude: 76.2673,
  address_text: 'NH-66, Near Edapally Junction, Kochi',
  district: 'Ernakulam',
  patient_count: 3,
  description: 'Multi-vehicle collision involving a truck and two motorcycles. Three casualties reported. One critical with head trauma.',
  is_mci: false,
  golden_hour_met: null,
  created_at: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
  updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  reporter_name: 'Rajan Pillai (Paramedic)',
  ambulance_registration: 'KL-07-X-2341',
  receiving_hospital_name: 'Aster Medcity',
  timeline: [
    { id: 't1', status: 'REPORTED',         note: 'Incident reported via paramedic app',        actor_name: 'Rajan Pillai',    created_at: new Date(Date.now() - 22 * 60 * 1000).toISOString() },
    { id: 't2', status: 'DISPATCH_PENDING', note: 'Dispatch recommendation generated',          actor_name: 'System',          created_at: new Date(Date.now() - 21 * 60 * 1000).toISOString() },
    { id: 't3', status: 'DISPATCHED',       note: 'KL-07-X-2341 dispatched by dispatcher',     actor_name: 'Anitha Nair',     created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
    { id: 't4', status: 'EN_ROUTE',         note: 'Ambulance en route to scene, ETA 8 min',    actor_name: 'System',          created_at: new Date(Date.now() - 19 * 60 * 1000).toISOString() },
    { id: 't5', status: 'ON_SCENE',         note: 'Crew arrived. Triage initiated.',            actor_name: 'Rajan Pillai',    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
  ],
  patients: [
    {
      id: 'pat-001',
      sequence_no: 1,
      age_estimate: 34,
      gender: 'MALE',
      triage_color: 'RED',
      is_conscious: false,
      is_breathing: true,
      injury_description: 'Severe head trauma, suspected intracranial bleed. GCS 7.',
      vitals: [
        { id: 'v1', created_at: new Date(Date.now() - 9 * 60 * 1000).toISOString(),  gcs_score: 7,  systolic_bp: 90, diastolic_bp: 60, spo2: 88, respiratory_rate: 22, pulse_rate: 110, temperature: 36.8 },
        { id: 'v2', created_at: new Date(Date.now() - 6 * 60 * 1000).toISOString(),  gcs_score: 8,  systolic_bp: 95, diastolic_bp: 62, spo2: 91, respiratory_rate: 20, pulse_rate: 105, temperature: 36.9 },
        { id: 'v3', created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),  gcs_score: 8,  systolic_bp: 98, diastolic_bp: 65, spo2: 93, respiratory_rate: 18, pulse_rate: 102, temperature: 37.0 },
      ],
      triage: { id: 'tr1', protocol: 'START', triage_color: 'RED', respirations_ok: true, perfusion_ok: false, mental_status_ok: false, triage_score: 4, assessed_by: 'Rajan Pillai', created_at: new Date(Date.now() - 9 * 60 * 1000).toISOString() },
    },
    {
      id: 'pat-002',
      sequence_no: 2,
      age_estimate: 28,
      gender: 'FEMALE',
      triage_color: 'YELLOW',
      is_conscious: true,
      is_breathing: true,
      injury_description: 'Fractured left arm, lacerations on face. Alert and responsive.',
      vitals: [
        { id: 'v4', created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),  gcs_score: 14, systolic_bp: 118, diastolic_bp: 78, spo2: 97, respiratory_rate: 16, pulse_rate: 88, temperature: 37.1 },
        { id: 'v5', created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),  gcs_score: 15, systolic_bp: 120, diastolic_bp: 80, spo2: 98, respiratory_rate: 15, pulse_rate: 84, temperature: 37.0 },
      ],
      triage: { id: 'tr2', protocol: 'START', triage_color: 'YELLOW', respirations_ok: true, perfusion_ok: true, mental_status_ok: true, triage_score: 7, assessed_by: 'Rajan Pillai', created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString() },
    },
    {
      id: 'pat-003',
      sequence_no: 3,
      age_estimate: 45,
      gender: 'MALE',
      triage_color: 'GREEN',
      is_conscious: true,
      is_breathing: true,
      injury_description: 'Minor abrasions on legs and arms. Ambulatory.',
      vitals: [
        { id: 'v6', created_at: new Date(Date.now() - 7 * 60 * 1000).toISOString(),  gcs_score: 15, systolic_bp: 128, diastolic_bp: 82, spo2: 99, respiratory_rate: 14, pulse_rate: 76, temperature: 36.8 },
      ],
      triage: { id: 'tr3', protocol: 'START', triage_color: 'GREEN', respirations_ok: true, perfusion_ok: true, mental_status_ok: true, triage_score: 10, assessed_by: 'Rajan Pillai', created_at: new Date(Date.now() - 7 * 60 * 1000).toISOString() },
    },
  ],
  photos: [
    { id: 'ph1', file_key: 'demo/scene1.jpg', url: 'https://picsum.photos/seed/trauma1/800/600', uploaded_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(), uploaded_by: 'Rajan Pillai' },
    { id: 'ph2', file_key: 'demo/scene2.jpg', url: 'https://picsum.photos/seed/trauma2/800/600', uploaded_at: new Date(Date.now() - 7 * 60 * 1000).toISOString(), uploaded_by: 'Rajan Pillai' },
    { id: 'ph3', file_key: 'demo/scene3.jpg', url: 'https://picsum.photos/seed/trauma3/800/600', uploaded_at: new Date(Date.now() - 6 * 60 * 1000).toISOString(), uploaded_by: 'Rajan Pillai' },
  ],
  dispatch: [
    {
      id: 'dr1',
      ambulance_registration: 'KL-07-X-2341',
      ambulance_type: 'ALS',
      dispatcher_name: 'Anitha Nair',
      was_auto: false,
      dispatched_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      scene_arrived_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      transport_started_at: null,
      hospital_arrived_at: null,
      response_time_sec: 600,
      transport_time_sec: null,
      total_time_sec: null,
      receiving_hospital: 'Aster Medcity',
    },
  ],
};

// ─── API ──────────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

async function fetchIncident(id: string): Promise<IncidentDetail> {
  const token = useAuthStore.getState().token;
  const res = await fetch(`${API_BASE}/incidents/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw Object.assign(new Error('Failed to load incident'), { status: res.status });
  return res.json();
}

async function patchIncidentStatus(
  id: string,
  payload: { status: IncidentStatus; note?: string },
): Promise<void> {
  const token = useAuthStore.getState().token;
  const res = await fetch(`${API_BASE}/incidents/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Status update failed');
}

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

const SEVERITY_COLORS: Record<IncidentSeverity, string> = {
  MINOR:    '#22c55e',
  MODERATE: '#f59e0b',
  SEVERE:   '#f97316',
  CRITICAL: '#ef4444',
  MCI:      '#dc2626',
};

const ACCIDENT_TYPE_LABELS: Record<AccidentType, string> = {
  ROAD_ACCIDENT: '🚗 Road Accident',
  FALL:          '🪜 Fall',
  ASSAULT:       '⚠️ Assault',
  CARDIAC:       '❤️ Cardiac',
  BURNS:         '🔥 Burns',
  DROWNING:      '💧 Drowning',
  INDUSTRIAL:    '🏭 Industrial',
  OTHER:         '📋 Other',
};

/** Allowed next statuses for manual status progression */
const NEXT_STATUSES: Partial<Record<IncidentStatus, IncidentStatus[]>> = {
  ON_SCENE:       ['PATIENT_LOADED'],
  PATIENT_LOADED: ['TRANSPORTING'],
  TRANSPORTING:   ['HOSPITAL_ARRIVED'],
  HOSPITAL_ARRIVED: ['CLOSED'],
};

function useGoldenHourTimer(createdAt: string, status: IncidentStatus) {
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => {
    if (status === 'CLOSED' || status === 'CANCELLED' || status === 'HOSPITAL_ARRIVED') return;
    const tick = () => {
      setElapsed(Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [createdAt, status]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  let color = '#22c55e';    // GREEN  0–20 min
  if (minutes >= 45) color = '#ef4444';      // RED
  else if (minutes >= 20) color = '#f97316'; // ORANGE
  else if (minutes >= 15) color = '#f59e0b'; // AMBER

  const isActive = !['CLOSED', 'CANCELLED', 'HOSPITAL_ARRIVED'].includes(status);
  return { formatted, color, minutes, isActive };
}

// ─── Component ────────────────────────────────────────────────────────────────

const IncidentDetailPage: React.FC = () => {
  const { incidentId } = useParams<{ incidentId: string }>();
  const navigate        = useNavigate();
  const queryClient     = useQueryClient();
  const user            = useAuthStore((s) => s.user);
  const isDemo          = import.meta.env.VITE_DEMO_MODE === 'true';

  const [statusNote, setStatusNote] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<IncidentStatus | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const { data: incident, isLoading, isError, error } = useQuery<IncidentDetail, Error>({
    queryKey: ['incident', incidentId],
    queryFn: isDemo
      ? () => Promise.resolve(DEMO_INCIDENT)
      : () => fetchIncident(incidentId!),
    enabled: !!incidentId,
    refetchInterval: isDemo ? false : 15_000,
    staleTime: 10_000,
  });

  // ── Status Mutation ────────────────────────────────────────────────────────
  const statusMutation = useMutation({
    mutationFn: ({ status, note }: { status: IncidentStatus; note: string }) =>
      isDemo
        ? Promise.resolve()
        : patchIncidentStatus(incidentId!, { status, note }),
    onSuccess: (_, { status }) => {
      toast.success(`Incident updated to ${STATUS_LABELS[status]}`);
      queryClient.invalidateQueries({ queryKey: ['incident', incidentId] });
      setShowStatusModal(false);
      setStatusNote('');
      setPendingStatus(null);
    },
    onError: () => toast.error('Failed to update status'),
  });

  const goldenHour = useGoldenHourTimer(
    incident?.created_at ?? new Date().toISOString(),
    incident?.status ?? 'REPORTED',
  );

  const canEditStatus = user?.role === 'DISPATCHER' || user?.role === 'ADMIN';
  const nextStatuses  = incident ? (NEXT_STATUSES[incident.status] ?? []) : [];

  const mapUrl = useMemo(() => {
    if (!incident) return null;
    return `https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`;
  }, [incident]);

  // ── Loading / Error states ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} aria-label="Loading incident…" />
        <p>Loading incident details…</p>
      </div>
    );
  }

  if (isError || !incident) {
    const status = (error as any)?.status;
    return (
      <div className={styles.errorState}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h2>{status === 404 ? 'Incident not found' : 'Failed to load incident'}</h2>
        <p>{status === 404 ? `No incident with ID ${incidentId} exists.` : 'There was a problem fetching this incident.'}</p>
        <Link to={ROUTES.COMMAND_CENTER} className={styles.backBtn}>
          ← Back to Command Center
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Go back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back
          </button>

          <div className={styles.titleGroup}>
            <div className={styles.incidentMeta}>
              {incident.is_mci && (
                <span className={styles.mciBadge}>⚠ MCI</span>
              )}
              <h1 className={styles.incidentNumber}>{incident.incident_number}</h1>
              <span
                className={styles.statusBadge}
                style={{
                  background: `${STATUS_COLORS[incident.status]}22`,
                  color: STATUS_COLORS[incident.status],
                  borderColor: `${STATUS_COLORS[incident.status]}44`,
                }}
              >
                {STATUS_LABELS[incident.status]}
              </span>
              <span
                className={styles.severityChip}
                style={{ background: SEVERITY_COLORS[incident.severity] }}
              >
                {incident.severity}
              </span>
            </div>
            <div className={styles.incidentSubMeta}>
              <span title={incident.address_text}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                {incident.address_text}
              </span>
              <span>{ACCIDENT_TYPE_LABELS[incident.accident_type]}</span>
              <span title="Reported by">{incident.reporter_name && `📋 ${incident.reporter_name}`}</span>
            </div>
          </div>
        </div>

        <div className={styles.headerRight}>
          {/* Golden Hour Timer */}
          {goldenHour.isActive && (
            <div
              className={styles.goldenHour}
              style={{ borderColor: goldenHour.color, color: goldenHour.color }}
              title="Time since incident was reported (Golden Hour)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span className={styles.timerValue}>{goldenHour.formatted}</span>
              <span className={styles.timerLabel}>Golden Hour</span>
            </div>
          )}

          {incident.golden_hour_met !== null && (
            <span
              className={styles.goldenHourResult}
              style={{ color: incident.golden_hour_met ? '#22c55e' : '#ef4444' }}
            >
              {incident.golden_hour_met ? '✓ Golden Hour Met' : '✗ Golden Hour Missed'}
            </span>
          )}

          {/* Map link */}
          {mapUrl && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.mapLink}
              aria-label="View location on Google Maps"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              View on Map
            </a>
          )}

          {/* Status action buttons */}
          {canEditStatus && nextStatuses.length > 0 && (
            <div className={styles.actionBtns}>
              {nextStatuses.map((s) => (
                <button
                  key={s}
                  className={styles.advanceBtn}
                  style={{ borderColor: STATUS_COLORS[s], color: STATUS_COLORS[s] }}
                  onClick={() => { setPendingStatus(s); setShowStatusModal(true); }}
                >
                  → {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ── Info strip ──────────────────────────────────────────────────── */}
      <div className={styles.infoStrip}>
        <InfoPill label="Patients" value={String(incident.patient_count)} icon="👤" />
        <InfoPill label="District" value={incident.district} icon="📍" />
        {incident.ambulance_registration && (
          <InfoPill label="Ambulance" value={incident.ambulance_registration} icon="🚑" />
        )}
        {incident.receiving_hospital_name && (
          <InfoPill label="Destination" value={incident.receiving_hospital_name} icon="🏥" />
        )}
        <InfoPill
          label="Reported"
          value={new Date(incident.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false, day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          icon="🕐"
        />
      </div>

      {/* ── 3-column body ────────────────────────────────────────────────── */}
      <div className={styles.body}>
        {/* Left column: Timeline + Photos */}
        <aside className={styles.colLeft}>
          <Section title="Incident Timeline" icon="⏱">
            <IncidentTimeline entries={incident.timeline} />
          </Section>

          {incident.photos.length > 0 && (
            <Section title={`Scene Photos (${incident.photos.length})`} icon="📷">
              <PhotoGallery photos={incident.photos} />
            </Section>
          )}
        </aside>

        {/* Centre column: Patients */}
        <main className={styles.colCentre}>
          <Section title={`Patients (${incident.patients.length})`} icon="🩺">
            <PatientList patients={incident.patients} />
          </Section>
        </main>

        {/* Right column: Dispatch history */}
        <aside className={styles.colRight}>
          <Section title="Dispatch History" icon="📡">
            <DispatchHistory records={incident.dispatch} />
          </Section>

          {/* Description */}
          {incident.description && (
            <Section title="Description" icon="📋">
              <p className={styles.descriptionText}>{incident.description}</p>
            </Section>
          )}
        </aside>
      </div>

      {/* ── Status Update Modal ─────────────────────────────────────────── */}
      {showStatusModal && pendingStatus && (
        <div className={styles.modalBackdrop} onClick={() => setShowStatusModal(false)}>
          <div className={styles.modal} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>
              Update Status to{' '}
              <span style={{ color: STATUS_COLORS[pendingStatus] }}>
                {STATUS_LABELS[pendingStatus]}
              </span>
            </h3>
            <label className={styles.noteLabel} htmlFor="status-note">
              Note (optional)
            </label>
            <textarea
              id="status-note"
              className={styles.noteInput}
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Add a note about this status change…"
              rows={3}
            />
            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => { setShowStatusModal(false); setStatusNote(''); }}
              >
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                style={{ background: STATUS_COLORS[pendingStatus] }}
                disabled={statusMutation.isPending}
                onClick={() => statusMutation.mutate({ status: pendingStatus, note: statusNote })}
              >
                {statusMutation.isPending ? 'Updating…' : `Confirm → ${STATUS_LABELS[pendingStatus]}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, icon, children }) => (
  <section className={styles.section}>
    <h2 className={styles.sectionTitle}>
      {icon && <span aria-hidden="true">{icon}</span>}
      {title}
    </h2>
    {children}
  </section>
);

interface InfoPillProps {
  label: string;
  value: string;
  icon?: string;
}

const InfoPill: React.FC<InfoPillProps> = ({ label, value, icon }) => (
  <div className={styles.infoPill}>
    {icon && <span aria-hidden="true" className={styles.pillIcon}>{icon}</span>}
    <div>
      <span className={styles.pillLabel}>{label}</span>
      <span className={styles.pillValue}>{value}</span>
    </div>
  </div>
);

export default IncidentDetailPage;