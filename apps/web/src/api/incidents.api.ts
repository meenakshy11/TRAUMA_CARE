/**
 * incidents.api.ts
 *
 * Mocked API client functions for incident management.
 * In a production deployment, these will be replaced with real
 * axios calls to the FastAPI backend.
 */
import apiClient from './client';
import { DEMO_INCIDENTS } from './demo-fixtures';

// We extract the base type from the demo fixtures to ensure consistency
export type Incident = typeof DEMO_INCIDENTS[number];

/**
 * Fetch all active incidents for the dashboard.
 */
export const fetchIncidents = async (): Promise<Incident[]> => {
  const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';
  
  if (isDemo) {
    // Simulate real-world network latency
    await new Promise((resolve) => setTimeout(resolve, 800));
    return DEMO_INCIDENTS;
  }

  // Live Mode: Fetches from FastAPI Endpoint
  const response = await apiClient.get<Incident[]>('/api/v1/incidents/active');
  return response.data;
};

/**
 * Update the status of an existing incident.
 */
export const updateIncidentStatus = async (
  id: string,
  newStatus: string
): Promise<Incident> => {
  const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';

  if (isDemo) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const incident = DEMO_INCIDENTS.find((i) => i.id === id);
    if (!incident) {
      throw new Error(`Incident ${id} not found in demo fixtures`);
    }
    // Return a mocked updated object
    return {
      ...incident,
      status: newStatus,
      updated_at: new Date().toISOString(),
    } as Incident;
  }

  // Live Mode: PATCH back to FastAPI
  const response = await apiClient.patch<Incident>(
    `/api/v1/incidents/${id}/status`,
    { status: newStatus }
  );
  return response.data;
};
