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
 */

import { DEMO_BLACKSPOTS } from './demo-fixtures';

// ─── Shared Type ──────────────────────────────────────────────────────────────

export interface BlackSpot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  district: string;
  road_name: string;
  incident_count: number;    // Total unique trauma events in the past 12 months
  risk_score: number;        // 0–10 composite score (incident density × severity)
  description: string;
  // Extended fields (populated in live mode from aggregated incident data)
  avg_response_time_sec?: number;
  last_incident_at?: string;
  recommended_action?: string;
  trend?: 'IMPROVING' | 'STABLE' | 'WORSENING';
}

// ─── Demo Fixture Enrichment ──────────────────────────────────────────────────
// Add extended fields that demo-fixtures.ts doesn't carry

const ENRICHED_BLACKSPOTS: BlackSpot[] = [
  {
    ...DEMO_BLACKSPOTS[0],
    avg_response_time_sec: 612,        // 10m 12s — above target
    last_incident_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    recommended_action: 'Install median barriers and deploy a dedicated FAST ambulance post at Ettumanoor.',
    trend: 'STABLE',
  },
  {
    ...DEMO_BLACKSPOTS[1],
    avg_response_time_sec: 488,        // 8m 8s
    last_incident_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    recommended_action: 'Restricted heavy-vehicle window (06:00–22:00) and speed radar installation on NH 544.',
    trend: 'WORSENING',
  },
  {
    ...DEMO_BLACKSPOTS[2],
    avg_response_time_sec: 540,        // 9m
    last_incident_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    recommended_action: 'Street lighting upgrade across 2.4 km Beach Road stretch. Elevated pedestrian crossing.',
    trend: 'IMPROVING',
  },
  // Additional high-fidelity fixtures for a richer heatmap
  {
    id: 'bs-004',
    name: 'Perumbavoor–Moovattupuzha Stretch',
    latitude: 10.1072,
    longitude: 76.4764,
    district: 'Ernakulam',
    road_name: 'SH 43',
    incident_count: 41,
    risk_score: 8.1,
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
    incident_count: 38,
    risk_score: 7.8,
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
    incident_count: 55,
    risk_score: 9.3,
    description: 'Highest-risk corridor in the state. Frequent truck–motorcycle fatalities.',
    avg_response_time_sec: 840,        // 14 min — chronic gap
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
    incident_count: 22,
    risk_score: 5.4,
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
    incident_count: 29,
    risk_score: 6.8,
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
    // Simulate realistic network latency
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
