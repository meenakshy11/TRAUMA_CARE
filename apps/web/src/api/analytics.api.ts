/**
 * analytics.api.ts
 *
 * Data layer for the KPI & Clinical Governance dashboard.
 *
 * In DEMO mode  → returns hardcoded Kerala regional statistics.
 * In LIVE mode  → fetches GET /analytics from the FastAPI backend
 *                 (aggregated from incident, dispatch, and patient tables).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DailyTrend {
  date: string;        // ISO date "YYYY-MM-DD"
  incidents: number;
  avg_response_min: number;
  golden_hour_pct: number;
}

export interface ResponseBucket {
  label: string;       // e.g. "0–5 min"
  count: number;
  pct: number;
}

export interface DistrictStat {
  district: string;
  total_incidents: number;
  avg_response_min: number;
  golden_hour_pct: number;
  critical_count: number;
  closed_in_hour: number;
}

export interface SeverityBreakdown {
  severity: string;
  count: number;
  color: string;
}

export interface AccidentTypeBreakdown {
  type: string;
  label: string;
  count: number;
}

export interface AnalyticsSummary {
  period_label: string;        // e.g. "Last 30 Days"
  total_incidents: number;
  avg_response_time_sec: number;
  golden_hour_met: number;
  golden_hour_missed: number;
  golden_hour_pct: number;
  avg_fleet_utilization_pct: number;
  total_patients: number;
  fatalities: number;
  mci_events: number;
  daily_trends: DailyTrend[];
  response_histogram: ResponseBucket[];
  district_stats: DistrictStat[];
  severity_breakdown: SeverityBreakdown[];
  accident_type_breakdown: AccidentTypeBreakdown[];
}

// ─── Demo Fixture ──────────────────────────────────────────────────────────────

function mockTrends(): DailyTrend[] {
  const data: DailyTrend[] = [];
  const base = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const incidentBase = [4,7,5,8,6,9,11,8,7,6,10,13,9,8,7,5,8,10,12,9,11,8,6,7,9,10,8,7,6,5];
  const responseBase = [9.2,8.8,10.1,8.5,9.4,7.9,8.2,9.8,10.5,8.7,7.6,9.1,8.3,8.0,9.6,10.2,8.5,7.8,8.1,9.3,7.5,8.8,9.0,8.4,7.7,8.2,9.5,10.0,8.6,7.9];
  const goldenBase  = [78,82,74,85,79,88,84,77,72,80,87,76,83,85,79,74,81,89,86,80,88,83,79,82,85,87,84,78,80,83];

  for (let i = 0; i < 30; i++) {
    const d = new Date(base + i * 24 * 60 * 60 * 1000);
    data.push({
      date: d.toISOString().slice(0, 10),
      incidents: incidentBase[i],
      avg_response_min: responseBase[i],
      golden_hour_pct: goldenBase[i],
    });
  }
  return data;
}

const DEMO_ANALYTICS: AnalyticsSummary = {
  period_label: 'Last 30 Days',
  total_incidents: 248,
  avg_response_time_sec: 487,
  golden_hour_met: 183,
  golden_hour_missed: 41,
  golden_hour_pct: 81.7,
  avg_fleet_utilization_pct: 63.4,
  total_patients: 312,
  fatalities: 9,
  mci_events: 2,
  daily_trends: mockTrends(),

  response_histogram: [
    { label: '0–5 min',   count: 31,  pct: 12.5 },
    { label: '5–8 min',   count: 68,  pct: 27.4 },
    { label: '8–10 min',  count: 74,  pct: 29.8 },
    { label: '10–12 min', count: 42,  pct: 16.9 },
    { label: '12–15 min', count: 22,  pct: 8.9  },
    { label: '>15 min',   count: 11,  pct: 4.4  },
  ],

  district_stats: [
    { district: 'Ernakulam',         total_incidents: 58, avg_response_min: 7.2,  golden_hour_pct: 88, critical_count: 12, closed_in_hour: 51 },
    { district: 'Thiruvananthapuram',total_incidents: 44, avg_response_min: 8.1,  golden_hour_pct: 84, critical_count: 9,  closed_in_hour: 37 },
    { district: 'Kozhikode',         total_incidents: 39, avg_response_min: 9.4,  golden_hour_pct: 76, critical_count: 11, closed_in_hour: 30 },
    { district: 'Thrissur',          total_incidents: 35, avg_response_min: 8.8,  golden_hour_pct: 80, critical_count: 8,  closed_in_hour: 28 },
    { district: 'Kottayam',          total_incidents: 31, avg_response_min: 10.5, golden_hour_pct: 71, critical_count: 9,  closed_in_hour: 22 },
    { district: 'Palakkad',          total_incidents: 24, avg_response_min: 13.8, golden_hour_pct: 58, critical_count: 8,  closed_in_hour: 14 },
    { district: 'Kollam',            total_incidents: 17, avg_response_min: 9.1,  golden_hour_pct: 82, critical_count: 4,  closed_in_hour: 14 },
  ],

  severity_breakdown: [
    { severity: 'CRITICAL', count: 48,  color: '#ef4444' },
    { severity: 'SEVERE',   count: 71,  color: '#f97316' },
    { severity: 'MODERATE', count: 89,  color: '#f59e0b' },
    { severity: 'MINOR',    count: 34,  color: '#22c55e' },
    { severity: 'MCI',      count: 6,   color: '#dc2626' },
  ],

  accident_type_breakdown: [
    { type: 'ROAD_ACCIDENT', label: 'Road Accident', count: 148 },
    { type: 'FALL',          label: 'Fall',          count: 34  },
    { type: 'CARDIAC',       label: 'Cardiac',       count: 28  },
    { type: 'ASSAULT',       label: 'Assault',       count: 14  },
    { type: 'BURNS',         label: 'Burns',         count: 11  },
    { type: 'DROWNING',      label: 'Drowning',      count: 7   },
    { type: 'INDUSTRIAL',    label: 'Industrial',    count: 6   },
  ],
};

// ─── API ──────────────────────────────────────────────────────────────────────

const IS_DEMO  = import.meta.env.VITE_DEMO_MODE === 'true';
const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

export async function fetchAnalytics(period = 30): Promise<AnalyticsSummary> {
  if (IS_DEMO) {
    await new Promise((r) => setTimeout(r, 220));
    return DEMO_ANALYTICS;
  }
  const res = await fetch(`${API_BASE}/analytics/summary?days=${period}`);
  if (!res.ok) throw new Error('Failed to load analytics');
  return res.json();
}
