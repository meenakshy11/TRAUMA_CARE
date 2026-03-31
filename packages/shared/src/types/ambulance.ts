/**
 * packages/shared/src/types/ambulance.ts
 *
 * Canonical type definitions for the Ambulance Fleet.
 *
 * Shared across:
 *  - apps/web  — Admin registry, Command Center map, dispatch panel
 *  - apps/mobile — Paramedic app status reporting
 *  - backend/  — FastAPI Pydantic model validation (mirrored here for TS)
 *
 * This is the single source of truth for fleet capability classification.
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

/**
 * Ambulance capability classification.
 *
 * BLS  — Basic Life Support: first-aid, oxygen, AED. No paramedic required.
 * ALS  — Advanced Life Support: IV drugs, cardiac monitoring, intubation capable.
 * NICU — Neonatal Intensive Care Unit transport: incubator, neonatal ventilator.
 * MFR  — Medical First Responder: rapid motorcycle/bike unit for urban areas.
 * HEMS — Helicopter Emergency Medical Service: air transport for remote areas.
 */
export type AmbulanceType = 'BLS' | 'ALS' | 'NICU' | 'MFR' | 'HEMS';

/**
 * Operational status of the vehicle at any given moment.
 *
 * AVAILABLE    — Staged, crew on standby, ready for immediate dispatch.
 * DISPATCHED   — En route to incident location.
 * ON_SCENE     — At the accident site, treating patients.
 * TRANSPORTING — Patient loaded, en route to hospital.
 * AT_HOSPITAL  — At receiving facility, handing over patient.
 * RETURNING    — Returning to staging station after task.
 * MAINTENANCE  — Out of service for scheduled or unscheduled repairs.
 * OFF_DUTY     — Crew not on shift; vehicle inactive.
 * DECOMMISSIONED — Permanently removed from active fleet.
 */
export type AmbulanceStatus =
  | 'AVAILABLE'
  | 'DISPATCHED'
  | 'ON_SCENE'
  | 'TRANSPORTING'
  | 'AT_HOSPITAL'
  | 'RETURNING'
  | 'MAINTENANCE'
  | 'OFF_DUTY'
  | 'DECOMMISSIONED';

// ─── Interfaces ───────────────────────────────────────────────────────────────

/** Core crew member record attached to a vehicle shift */
export interface CrewMember {
  id: string;
  full_name: string;
  role: 'PARAMEDIC' | 'EMT' | 'DRIVER' | 'DOCTOR';
  certification_level: 'BASIC' | 'ADVANCED' | 'CRITICAL_CARE';
  phone: string;
}

/** Equipment inventory snapshot for an ALS/NICU unit */
export interface AmbulanceEquipment {
  has_defibrillator: boolean;
  has_ventilator: boolean;
  has_ecg_monitor: boolean;
  has_infusion_pump: boolean;
  has_neonatal_incubator: boolean;
  drug_kit_level: 'BASIC' | 'ADVANCED' | 'CRITICAL_CARE';
}

/** Full ambulance record as it appears in the fleet registry */
export interface Ambulance {
  // Identity
  id: string;
  registration_no: string;         // e.g. "KL-05-AA-1234"
  call_sign: string;               // Radio call sign e.g. "ALPHA-07"
  ambulance_type: AmbulanceType;

  // Operational state
  status: AmbulanceStatus;
  is_active: boolean;

  // Location
  district: string;
  staging_station_id: string | null;
  staging_station_name?: string;
  current_lat: number | null;
  current_lon: number | null;
  last_location_at: string | null; // ISO timestamp

  // Assignment
  device_id: string | null;        // GPS tracker device ID
  current_incident_id?: string | null;

  // Crew (populated on active shifts)
  crew?: CrewMember[];

  // Equipment (especially relevant for ALS/NICU dispatch decisions)
  equipment?: AmbulanceEquipment;

  // Metadata
  year_of_manufacture?: number;
  chassis_no?: string;
  last_service_at?: string;        // ISO date
  next_service_due?: string;       // ISO date
  created_at: string;
  updated_at: string;
}

// ─── Derived utility types ────────────────────────────────────────────────────

/** Lightweight version for the live map — only location-critical fields */
export type AmbulanceMapMarker = Pick<
  Ambulance,
  'id' | 'registration_no' | 'call_sign' | 'ambulance_type' | 'status' | 'current_lat' | 'current_lon' | 'district'
>;

/** Status summary counts for the fleet dashboard KPI strip */
export interface FleetSummary {
  total: number;
  available: number;
  deployed: number;   // DISPATCHED + ON_SCENE + TRANSPORTING + AT_HOSPITAL + RETURNING
  maintenance: number;
  off_duty: number;
}
