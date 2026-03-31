/**
 * ambulances.api.ts
 *
 * Data layer for the full fleet registry (admin / oversight view).
 *
 * Unlike ambulanceStore (which tracks only active map coordinates),
 * this API returns the COMPLETE registry — every vehicle including
 * those in maintenance, off-duty, or decommissioned.
 *
 * In DEMO mode → returns FLEET_REGISTRY (extended mock data below).
 * In LIVE mode → GET /api/v1/ambulances (full list with crew & equipment).
 */

import type { Ambulance, FleetSummary } from '@trauma/shared';

// ─── Extended Demo Registry ───────────────────────────────────────────────────
// 10 vehicles representing a realistic district-level fleet in Kerala

const now = () => new Date().toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();
const daysFrom = (d: number) => new Date(Date.now() + d * 86400000).toISOString();

export const FLEET_REGISTRY: Ambulance[] = [
  {
    id: 'amb-001',
    registration_no: 'KL-05-AA-1234',
    call_sign: 'ALPHA-01',
    ambulance_type: 'ALS',
    status: 'DISPATCHED',
    is_active: true,
    district: 'Kottayam',
    staging_station_id: 'st-001',
    staging_station_name: 'Kottayam Central EMS Station',
    current_lat: 9.9612,
    current_lon: 76.2873,
    last_location_at: new Date(Date.now() - 30000).toISOString(),
    device_id: 'GPS-KL-001',
    current_incident_id: 'inc-001',
    crew: [
      { id: 'cr-001', full_name: 'Rajesh Kumar', role: 'PARAMEDIC', certification_level: 'ADVANCED', phone: '+91-9876541001' },
      { id: 'cr-002', full_name: 'Sreedharan P.', role: 'DRIVER', certification_level: 'BASIC', phone: '+91-9876541002' },
    ],
    equipment: { has_defibrillator: true, has_ventilator: true, has_ecg_monitor: true, has_infusion_pump: true, has_neonatal_incubator: false, drug_kit_level: 'ADVANCED' },
    year_of_manufacture: 2021,
    chassis_no: 'SHA001234',
    last_service_at: daysAgo(45),
    next_service_due: daysFrom(15),
    created_at: daysAgo(730),
    updated_at: now(),
  },
  {
    id: 'amb-002',
    registration_no: 'KL-11-BB-5678',
    call_sign: 'BRAVO-02',
    ambulance_type: 'BLS',
    status: 'AT_HOSPITAL',
    is_active: true,
    district: 'Kozhikode',
    staging_station_id: 'st-002',
    staging_station_name: 'Kozhikode North EMS Post',
    current_lat: 11.2500,
    current_lon: 75.7800,
    last_location_at: new Date(Date.now() - 60000).toISOString(),
    device_id: 'GPS-KL-002',
    current_incident_id: 'inc-004',
    crew: [
      { id: 'cr-003', full_name: 'Anand Nair', role: 'EMT', certification_level: 'BASIC', phone: '+91-9876541003' },
      { id: 'cr-004', full_name: 'Vishnu Das', role: 'DRIVER', certification_level: 'BASIC', phone: '+91-9876541004' },
    ],
    equipment: { has_defibrillator: true, has_ventilator: false, has_ecg_monitor: false, has_infusion_pump: false, has_neonatal_incubator: false, drug_kit_level: 'BASIC' },
    year_of_manufacture: 2019,
    chassis_no: 'SHA005678',
    last_service_at: daysAgo(12),
    next_service_due: daysFrom(78),
    created_at: daysAgo(1095),
    updated_at: now(),
  },
  {
    id: 'amb-003',
    registration_no: 'KL-08-CC-9012',
    call_sign: 'CHARLIE-03',
    ambulance_type: 'ALS',
    status: 'ON_SCENE',
    is_active: true,
    district: 'Thrissur',
    staging_station_id: 'st-003',
    staging_station_name: 'Thrissur District Hub',
    current_lat: 10.5280,
    current_lon: 76.2148,
    last_location_at: new Date(Date.now() - 45000).toISOString(),
    device_id: 'GPS-KL-003',
    current_incident_id: 'inc-002',
    crew: [
      { id: 'cr-005', full_name: 'Dr. Meera Pillai', role: 'DOCTOR', certification_level: 'CRITICAL_CARE', phone: '+91-9876541005' },
      { id: 'cr-006', full_name: 'Binu Abraham', role: 'PARAMEDIC', certification_level: 'ADVANCED', phone: '+91-9876541006' },
      { id: 'cr-007', full_name: 'Rajan CK', role: 'DRIVER', certification_level: 'BASIC', phone: '+91-9876541007' },
    ],
    equipment: { has_defibrillator: true, has_ventilator: true, has_ecg_monitor: true, has_infusion_pump: true, has_neonatal_incubator: false, drug_kit_level: 'CRITICAL_CARE' },
    year_of_manufacture: 2022,
    chassis_no: 'SHA009012',
    last_service_at: daysAgo(30),
    next_service_due: daysFrom(30),
    created_at: daysAgo(365),
    updated_at: now(),
  },
  {
    id: 'amb-004',
    registration_no: 'KL-02-DD-3456',
    call_sign: 'DELTA-04',
    ambulance_type: 'BLS',
    status: 'AVAILABLE',
    is_active: true,
    district: 'Thiruvananthapuram',
    staging_station_id: 'st-004',
    staging_station_name: 'TVM South Staging Post',
    current_lat: 8.5000,
    current_lon: 76.9500,
    last_location_at: new Date(Date.now() - 120000).toISOString(),
    device_id: 'GPS-KL-004',
    current_incident_id: null,
    crew: [
      { id: 'cr-008', full_name: 'Subin Mathew', role: 'EMT', certification_level: 'BASIC', phone: '+91-9876541008' },
      { id: 'cr-009', full_name: 'George Kurien', role: 'DRIVER', certification_level: 'BASIC', phone: '+91-9876541009' },
    ],
    equipment: { has_defibrillator: true, has_ventilator: false, has_ecg_monitor: false, has_infusion_pump: false, has_neonatal_incubator: false, drug_kit_level: 'BASIC' },
    year_of_manufacture: 2020,
    chassis_no: 'SHA003456',
    last_service_at: daysAgo(8),
    next_service_due: daysFrom(82),
    created_at: daysAgo(900),
    updated_at: now(),
  },
  {
    id: 'amb-005',
    registration_no: 'KL-14-EE-7890',
    call_sign: 'ECHO-05',
    ambulance_type: 'NICU',
    status: 'AVAILABLE',
    is_active: true,
    district: 'Ernakulam',
    staging_station_id: 'st-005',
    staging_station_name: 'Kochi Medical Hub — NICU Bay',
    current_lat: 10.8505,
    current_lon: 76.2711,
    last_location_at: new Date(Date.now() - 90000).toISOString(),
    device_id: 'GPS-KL-005',
    current_incident_id: null,
    crew: [
      { id: 'cr-010', full_name: 'Dr. Latha Krishnan', role: 'DOCTOR', certification_level: 'CRITICAL_CARE', phone: '+91-9876541010' },
      { id: 'cr-011', full_name: 'Anitha S.', role: 'PARAMEDIC', certification_level: 'CRITICAL_CARE', phone: '+91-9876541011' },
      { id: 'cr-012', full_name: 'Thomas Alex', role: 'DRIVER', certification_level: 'BASIC', phone: '+91-9876541012' },
    ],
    equipment: { has_defibrillator: true, has_ventilator: true, has_ecg_monitor: true, has_infusion_pump: true, has_neonatal_incubator: true, drug_kit_level: 'CRITICAL_CARE' },
    year_of_manufacture: 2023,
    chassis_no: 'SHA007890',
    last_service_at: daysAgo(3),
    next_service_due: daysFrom(87),
    created_at: daysAgo(180),
    updated_at: now(),
  },
  {
    id: 'amb-006',
    registration_no: 'KL-07-FF-2345',
    call_sign: 'FOXTROT-06',
    ambulance_type: 'MFR',
    status: 'MAINTENANCE',
    is_active: false,
    district: 'Alappuzha',
    staging_station_id: null,
    staging_station_name: 'Alappuzha Workshop',
    current_lat: 9.2648,
    current_lon: 76.7870,
    last_location_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    device_id: 'GPS-KL-006',
    current_incident_id: null,
    crew: [],
    equipment: { has_defibrillator: false, has_ventilator: false, has_ecg_monitor: false, has_infusion_pump: false, has_neonatal_incubator: false, drug_kit_level: 'BASIC' },
    year_of_manufacture: 2018,
    chassis_no: 'SHA002345',
    last_service_at: daysAgo(180),
    next_service_due: daysFrom(2),
    created_at: daysAgo(1460),
    updated_at: now(),
  },
  {
    id: 'amb-007',
    registration_no: 'KL-16-GG-6789',
    call_sign: 'GOLF-07',
    ambulance_type: 'ALS',
    status: 'AVAILABLE',
    is_active: true,
    district: 'Palakkad',
    staging_station_id: 'st-007',
    staging_station_name: 'Palakkad NH 544 Emergency Post',
    current_lat: 10.7750,
    current_lon: 76.6500,
    last_location_at: new Date(Date.now() - 300000).toISOString(),
    device_id: 'GPS-KL-007',
    current_incident_id: null,
    crew: [
      { id: 'cr-013', full_name: 'Pradeep KV', role: 'PARAMEDIC', certification_level: 'ADVANCED', phone: '+91-9876541013' },
      { id: 'cr-014', full_name: 'Santhosh R.', role: 'DRIVER', certification_level: 'BASIC', phone: '+91-9876541014' },
    ],
    equipment: { has_defibrillator: true, has_ventilator: true, has_ecg_monitor: true, has_infusion_pump: true, has_neonatal_incubator: false, drug_kit_level: 'ADVANCED' },
    year_of_manufacture: 2022,
    chassis_no: 'SHA006789',
    last_service_at: daysAgo(20),
    next_service_due: daysFrom(70),
    created_at: daysAgo(400),
    updated_at: now(),
  },
  {
    id: 'amb-008',
    registration_no: 'KL-09-HH-1122',
    call_sign: 'HOTEL-08',
    ambulance_type: 'BLS',
    status: 'OFF_DUTY',
    is_active: false,
    district: 'Kannur',
    staging_station_id: 'st-008',
    staging_station_name: 'Kannur Municipal EMS',
    current_lat: 11.8745,
    current_lon: 75.3704,
    last_location_at: daysAgo(1),
    device_id: 'GPS-KL-008',
    current_incident_id: null,
    crew: [],
    equipment: { has_defibrillator: true, has_ventilator: false, has_ecg_monitor: false, has_infusion_pump: false, has_neonatal_incubator: false, drug_kit_level: 'BASIC' },
    year_of_manufacture: 2017,
    chassis_no: 'SHA001122',
    last_service_at: daysAgo(60),
    next_service_due: daysFrom(30),
    created_at: daysAgo(2190),
    updated_at: daysAgo(1),
  },
  {
    id: 'amb-009',
    registration_no: 'KL-03-II-3344',
    call_sign: 'INDIA-09',
    ambulance_type: 'ALS',
    status: 'RETURNING',
    is_active: true,
    district: 'Ernakulam',
    staging_station_id: 'st-005',
    staging_station_name: 'Kochi Medical Hub',
    current_lat: 10.0180,
    current_lon: 76.3280,
    last_location_at: new Date(Date.now() - 60000).toISOString(),
    device_id: 'GPS-KL-009',
    current_incident_id: null,
    crew: [
      { id: 'cr-015', full_name: 'Jijo Paul', role: 'PARAMEDIC', certification_level: 'ADVANCED', phone: '+91-9876541015' },
      { id: 'cr-016', full_name: 'Bibin George', role: 'DRIVER', certification_level: 'BASIC', phone: '+91-9876541016' },
    ],
    equipment: { has_defibrillator: true, has_ventilator: true, has_ecg_monitor: true, has_infusion_pump: false, has_kit: false, has_neonatal_incubator: false, drug_kit_level: 'ADVANCED' } as Ambulance['equipment'],
    year_of_manufacture: 2020,
    chassis_no: 'SHA003344',
    last_service_at: daysAgo(55),
    next_service_due: daysFrom(35),
    created_at: daysAgo(650),
    updated_at: now(),
  },
  {
    id: 'amb-010',
    registration_no: 'KL-21-JJ-5566',
    call_sign: 'JULIET-10',
    ambulance_type: 'HEMS',
    status: 'AVAILABLE',
    is_active: true,
    district: 'Ernakulam',
    staging_station_id: 'st-010',
    staging_station_name: 'Kochi Air Medical Services — CIAL Helipad',
    current_lat: 10.1533,
    current_lon: 76.3911,
    last_location_at: new Date(Date.now() - 600000).toISOString(),
    device_id: 'GPS-KL-010',
    current_incident_id: null,
    crew: [
      { id: 'cr-017', full_name: 'Cpt. Arun Varghese', role: 'DRIVER', certification_level: 'ADVANCED', phone: '+91-9876541017' },
      { id: 'cr-018', full_name: 'Dr. Sheena Rajan', role: 'DOCTOR', certification_level: 'CRITICAL_CARE', phone: '+91-9876541018' },
    ],
    equipment: { has_defibrillator: true, has_ventilator: true, has_ecg_monitor: true, has_infusion_pump: true, has_neonatal_incubator: false, drug_kit_level: 'CRITICAL_CARE' },
    year_of_manufacture: 2023,
    chassis_no: 'HELI-KL-001',
    last_service_at: daysAgo(7),
    next_service_due: daysFrom(83),
    created_at: daysAgo(90),
    updated_at: now(),
  },
];

// ─── API Functions ────────────────────────────────────────────────────────────

const IS_DEMO  = import.meta.env.VITE_DEMO_MODE === 'true';
const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

/** Fetch the complete fleet registry (all statuses, all vehicles) */
export async function fetchFleetRegistry(): Promise<Ambulance[]> {
  if (IS_DEMO) {
    await new Promise((r) => setTimeout(r, 250));
    return FLEET_REGISTRY;
  }
  const res = await fetch(`${API_BASE}/ambulances`);
  if (!res.ok) throw new Error('Failed to fetch fleet registry');
  return res.json();
}

/** Compute summary counts from the fleet array */
export function computeFleetSummary(fleet: Ambulance[]): FleetSummary {
  const DEPLOYED = new Set(['DISPATCHED', 'ON_SCENE', 'TRANSPORTING', 'AT_HOSPITAL', 'RETURNING']);
  return {
    total:       fleet.length,
    available:   fleet.filter((a) => a.status === 'AVAILABLE').length,
    deployed:    fleet.filter((a) => DEPLOYED.has(a.status)).length,
    maintenance: fleet.filter((a) => a.status === 'MAINTENANCE').length,
    off_duty:    fleet.filter((a) => a.status === 'OFF_DUTY' || a.status === 'DECOMMISSIONED').length,
  };
}
