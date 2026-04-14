/**
 * blackspots.api.ts
 *
 * Data layer for Accident Black Spot records.
 *
 * In DEMO mode  → returns the static DEMO_BLACKSPOTS fixture.
 * In LIVE mode  → fetches GET /blackspots from the FastAPI backend.
 *
 * Each BlackSpot represents a road segment or junction that has recorded
 * a statistically significant cluster of trauma events over time.
 *
 * Schema matches the `black_spots` PostgreSQL table (updated 2026-04).
 */

import { DEMO_BLACKSPOTS } from './demo-fixtures';

// ─── Shared Type ──────────────────────────────────────────────────────────────

export interface BlackSpot {
  id: string;

  // Administrative
  district: string;
  police_station?: string | null;
  location?: string | null;       // human-readable stretch, e.g. "Thiruvallam to Kovalam"
  priority?: string | null;       // "1st" … "5th"

  // Road metadata
  road_name?: string | null;
  road_number?: string | null;    // NH-66, SH-1, MDR …
  road_type?: string | null;      // "NH" | "SH" | "OR"
  road_length?: string | null;    // "500M", "5 KM" …

  // Midpoint (heatmap pin)
  latitude: number;
  longitude: number;

  // Segment endpoints
  start_latitude?: number | null;
  start_longitude?: number | null;
  end_latitude?: number | null;
  end_longitude?: number | null;

  // Legacy / analytics
  name?: string | null;
  incident_count: number;
  fatality_rate?: number | null;
  accidents_per_year: number;
  risk_score: number;
  severity?: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  description?: string | null;

  // Timestamps
  created_at?: string | null;

  // Extended live-mode fields
  avg_response_time_sec?: number;
  last_incident_at?: string;
  recommended_action?: string;
  trend?: 'IMPROVING' | 'STABLE' | 'WORSENING';
}

// ─── Demo Fixture Enrichment ──────────────────────────────────────────────────
// DEMO_BLACKSPOTS from demo-fixtures.ts carries basic fields; enrich with
// extended analytics so the UI has something to display.

const ENRICHED_BLACKSPOTS: BlackSpot[] = [
  {
    ...DEMO_BLACKSPOTS[0],
    avg_response_time_sec: 612,
    last_incident_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    recommended_action: 'Install median barriers and deploy a dedicated FAST ambulance post at Ettumanoor.',
    trend: 'STABLE',
  },
  {
    ...DEMO_BLACKSPOTS[1],
    avg_response_time_sec: 488,
    last_incident_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    recommended_action: 'Restricted heavy-vehicle window (06:00–22:00) and speed radar installation on NH 544.',
    trend: 'WORSENING',
  },
  {
    ...DEMO_BLACKSPOTS[2],
    avg_response_time_sec: 540,
    last_incident_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    recommended_action: 'Street lighting upgrade across 2.4 km Beach Road stretch. Elevated pedestrian crossing.',
    trend: 'IMPROVING',
  },
  {
    id: 'bs-004',
    name: 'Perumbavoor–Moovattupuzha Stretch',
    latitude: 10.1072,
    longitude: 76.4764,
    district: 'Ernakulam',
    road_name: 'SH 43',
    road_number: 'SH-43',
    road_type: 'SH',
    incident_count: 41,
    accidents_per_year: 0,
    risk_score: 8.1,
    severity: 'HIGH',
    description: 'Narrow two-lane highway with sharp bends; frequent head-on collisions at night.',
    avg_response_time_sec: 720,
    last_incident_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    recommended_action: 'Road widening project scheduled Q3 2025. Temporary speed calming required immediately.',
    trend: 'WORSENING',
  },
  {
    id: 'bs-005',
    name: 'Vyttila Mobility Hub Interchange',
    latitude: 9.9697,
    longitude: 76.3219,
    district: 'Ernakulam',
    road_name: 'KINFRA Bypass / NH 66',
    road_number: 'NH-66',
    road_type: 'NH',
    incident_count: 38,
    accidents_per_year: 0,
    risk_score: 7.8,
    severity: 'HIGH',
    description: 'Complex multi-lane interchange with high pedestrian footfall from bus terminus.',
    avg_response_time_sec: 360,
    last_incident_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    recommended_action: 'Dedicated pedestrian overpass and CCTV-linked speed enforcement.',
    trend: 'STABLE',
  },
  {
    id: 'bs-006',
    name: 'Palakkad–Coimbatore NH 544 Entry',
    latitude: 10.7867,
    longitude: 76.6548,
    district: 'Palakkad',
    road_name: 'NH 544',
    road_number: 'NH-544',
    road_type: 'NH',
    incident_count: 55,
    accidents_per_year: 0,
    risk_score: 9.3,
    severity: 'HIGH',
    description: 'Highest-risk corridor in the state. Frequent truck–motorcycle fatalities.',
    avg_response_time_sec: 840,
    last_incident_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    recommended_action: 'Emergency ambulance sub-station at Walayar Check Post. Ministry escalation filed.',
    trend: 'WORSENING',
  },
  {
    id: 'bs-007',
    name: 'Thiruvananthapuram–Kollam Highway (Kazhakuttom)',
    latitude: 8.5730,
    longitude: 76.8762,
    district: 'Thiruvananthapuram',
    road_name: 'NH 66',
    road_number: 'NH-66',
    road_type: 'NH',
    incident_count: 22,
    accidents_per_year: 0,
    risk_score: 5.4,
    severity: 'MEDIUM',
    description: 'Urban stretch — pedestrian accidents at unmarked crossings near Technopark.',
    avg_response_time_sec: 390,
    last_incident_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    recommended_action: 'Zebra crossing installation and 40 km/h speed zone enforcement.',
    trend: 'IMPROVING',
  },
  {
    id: 'bs-008',
    name: 'Thrissur–Shoranur NH66 Overpass',
    latitude: 10.5953,
    longitude: 76.1860,
    district: 'Thrissur',
    road_name: 'NH 66',
    road_number: 'NH-66',
    road_type: 'NH',
    incident_count: 29,
    accidents_per_year: 0,
    risk_score: 6.8,
    severity: 'MEDIUM',
    description: 'Overpass entry ramp with poor sight-lines; high incidence of merge conflicts.',
    avg_response_time_sec: 510,
    last_incident_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    recommended_action: 'Ramp metering system and rumble strip installation.',
    trend: 'STABLE',
  },
];

// ─── API Functions ────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';
const IS_DEMO  = import.meta.env.VITE_DEMO_MODE === 'true';

/** Fetch all recorded black spots */
export async function fetchDemoBlackSpots(): Promise<BlackSpot[]> {
  if (IS_DEMO) {
    await new Promise((r) => setTimeout(r, 180));
    return ENRICHED_BLACKSPOTS;
  }

  const res = await fetch(`${API_BASE}/blackspots`);
  if (!res.ok) throw new Error('Failed to fetch black spots');
  return res.json();
}

/** Fetch a single black spot by ID */
export async function fetchBlackSpotById(id: string): Promise<BlackSpot> {
  if (IS_DEMO) {
    await new Promise((r) => setTimeout(r, 80));
    const spot = ENRICHED_BLACKSPOTS.find((b) => b.id === id);
    if (!spot) throw Object.assign(new Error('Not found'), { status: 404 });
    return spot;
  }

  const res = await fetch(`${API_BASE}/blackspots/${id}`);
  if (!res.ok) throw new Error('Failed to fetch black spot');
  return res.json();
}
