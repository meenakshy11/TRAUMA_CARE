/**
 * hospitals.api.ts
 *
 * Simulates fetching external hospital capacity data either from 
 * the mocked demo fixtures or a future `GET /api/v1/hospitals` endpoint.
 */
import { apiClient } from './client';
import { DEMO_HOSPITALS } from './demo-fixtures';

// Reusing the fixture type as the domain model for MVP.
export type Hospital = typeof DEMO_HOSPITALS[number];

const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

const demoDelay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

export const hospitalApi = {
  /**
   * Fetches all registered hospitals and their current resource capacities.
   */
  async getHospitals(): Promise<Hospital[]> {
    if (IS_DEMO_MODE) {
      await demoDelay();
      return DEMO_HOSPITALS;
    }
    
    // Future live backend integration:
    const { data } = await apiClient.get<Hospital[]>('/hospitals');
    return data;
  },

  /**
   * Fetches a single hospital by ID.
   */
  async getHospitalById(id: string): Promise<Hospital | undefined> {
    if (IS_DEMO_MODE) {
      await demoDelay();
      return DEMO_HOSPITALS.find(h => h.id === id);
    }

    const { data } = await apiClient.get<Hospital>(`/hospitals/${id}`);
    return data;
  }
};
