/**
 * client.ts
 *
 * Central Axios instance for the Integrated Trauma Care Platform web app.
 *
 * Architecture
 * ────────────
 * The client has two operating modes controlled by VITE_DEMO_MODE:
 *
 * 1. LIVE MODE (VITE_DEMO_MODE=false, default)
 *    ─ All requests hit the FastAPI backend at VITE_API_BASE_URL/api/v1/
 *    ─ Request interceptor attaches the Bearer JWT from authStore
 *    ─ Response interceptor transparently refreshes expired access tokens
 *      (silent refresh) and retries the original request once
 *    ─ On 401 after refresh fails → calls authStore.logout()
 *
 * 2. DEMO MODE (VITE_DEMO_MODE=true)
 *    ─ Request interceptor intercepts every outbound call
 *    ─ Returns a matching static JSON fixture from demo-fixtures.ts
 *      wrapped in a fake Axios-compatible AxiosResponse
 *    ─ No actual network requests are made; the real backend is never called
 *    ─ Simulates a short configurable delay so UI loading states are visible
 *
 * Interceptor chain (live mode):
 *   outgoing request → attach Authorization header
 *   incoming 2xx     → pass through
 *   incoming 401     → attempt silent token refresh → retry once → logout
 *   incoming other 4xx/5xx → reject with error (callers handle via react-query)
 */

import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import {
  DEMO_INCIDENTS,
  DEMO_AMBULANCES,
  DEMO_HOSPITALS,
  DEMO_NOTIFICATIONS,
  DEMO_KPI,
  DEMO_BLACKSPOTS,
} from './demo-fixtures';

// ─── Environment ──────────────────────────────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
const API_VERSION  = import.meta.env.VITE_API_VERSION  ?? 'v1';
const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// Full REST base: e.g. http://localhost:8000/api/v1
export const API_ROOT = `${API_BASE_URL}/api/${API_VERSION}`;

// ─── Demo Mode Delay ─────────────────────────────────────────────────────────
const DEMO_DELAY_MS = 400; // milliseconds — makes loading spinners visible

// ─── Axios Instance ───────────────────────────────────────────────────────────
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_ROOT,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: false, // JWT is in Authorization header, not a cookie
});

// ─── Token Store Accessors ────────────────────────────────────────────────────
// We access the Zustand store directly instead of via React hooks so this
// module can be used outside of component scope (e.g. interceptors).
//
// We import lazily to prevent circular dependencies at module init time.
// The pattern is: if the store is already initialised, use it; otherwise
// fall back (e.g. during module loading before React has mounted).

function getAuthState() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useAuthStore } = require('@/store/authStore') as {
      useAuthStore: { getState: () => { accessToken: string | null; refreshToken: string | null; setTokens: (t: unknown) => void; logout: () => void } };
    };
    return useAuthStore.getState();
  } catch {
    return null;
  }
}

// ─── Live Mode: Request Interceptor ──────────────────────────────────────────
// Attaches the current access token as a Bearer header to every request.
// Skipped automatically in demo mode (demo interceptor short-circuits first).

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (IS_DEMO_MODE) return config; // demo adapter handles the request

    const auth = getAuthState();
    if (auth?.accessToken) {
      config.headers.Authorization = `Bearer ${auth.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Live Mode: Response Interceptor — Silent Token Refresh ──────────────────
// When the server returns 401, we:
//   1. POST /auth/refresh with the stored refresh token
//   2. Update the store with the new token pair
//   3. Retry the original request once with the new access token
//   4. If refresh itself fails → call logout() → reject

// Track whether a refresh is already in progress to prevent parallel refresh storms
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeToRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function notifyRefreshSubscribers(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

// Mark retried requests so we don't loop infinitely
interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (IS_DEMO_MODE) return Promise.reject(error);

    const originalConfig = error.config as RetryableConfig | undefined;

    // Only attempt refresh on 401, and only once per request
    if (
      error.response?.status === 401 &&
      originalConfig &&
      !originalConfig._retry &&
      !originalConfig.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        // If a refresh is already in progress, wait for it to complete
        return new Promise((resolve) => {
          subscribeToRefresh((newToken: string) => {
            if (originalConfig.headers) {
              originalConfig.headers.Authorization = `Bearer ${newToken}`;
            }
            resolve(apiClient(originalConfig));
          });
        });
      }

      originalConfig._retry = true;
      isRefreshing = true;

      try {
        const auth = getAuthState();
        if (!auth?.refreshToken) {
          throw new Error('No refresh token available');
        }

        // Attempt to refresh — use a bare axios call to avoid interceptor loops
        const refreshResp = await axios.post<{
          access_token: string;
          refresh_token: string;
          token_type: 'bearer';
          expires_in: number;
        }>(`${API_ROOT}/auth/refresh`, {
          refresh_token: auth.refreshToken,
        });

        const newTokens = refreshResp.data;

        // Update the store with the new token pair
        auth.setTokens(newTokens);

        // Retry the original request with the new access token
        if (originalConfig.headers) {
          originalConfig.headers.Authorization = `Bearer ${newTokens.access_token}`;
        }

        notifyRefreshSubscribers(newTokens.access_token);

        return apiClient(originalConfig);
      } catch (refreshError) {
        // Refresh failed — force logout
        refreshSubscribers = [];
        getAuthState()?.logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// ─── Demo Mode: Request Adapter ───────────────────────────────────────────────
// Intercepts outbound requests in demo mode and returns static fixture data.
// We insert this as a SECOND request interceptor so it runs after the auth
// interceptor (interceptors run in reverse insertion order for requests).
//
// URL → fixture routing:
//   POST /auth/login           → handled by authStore directly (not here)
//   GET  /auth/me              → handled by authStore directly
//   GET  /incidents            → DEMO_INCIDENTS[]
//   GET  /incidents/:id        → single incident by ID
//   GET  /ambulances           → DEMO_AMBULANCES[]
//   GET  /hospitals            → DEMO_HOSPITALS[]
//   GET  /notifications        → DEMO_NOTIFICATIONS[]
//   GET  /analytics/kpi        → DEMO_KPI
//   GET  /blackspots           → DEMO_BLACKSPOTS[]
//   POST /dispatch/confirm     → echo back a 200 OK
//   everything else            → 200 OK with {}

if (IS_DEMO_MODE) {
  apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // The auth store handles /auth/* directly — let those through
      const url = config.url ?? '';
      if (url.includes('/auth/')) {
        return config; // pass-through; authStore's demo path handles it
      }

      // Simulate network latency
      await new Promise((r) => setTimeout(r, DEMO_DELAY_MS));

      // ── Route to fixture ──────────────────────────────────────────────────
      const data = resolveDemoResponse(config.method ?? 'get', url);

      // Construct a fake AxiosResponse and throw it as a "fulfilled" promise
      // by using the adapter mechanism: we resolve the adapter promise here.
      const fakeResponse: AxiosResponse = {
        data,
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        config,
      };

      // Throw a cancelled-request style resolved promise so Axios treats it
      // as a successfully fulfilled response without hitting the network.
      // We use the adapter trick: override config.adapter to return the fake response.
      config.adapter = () => Promise.resolve(fakeResponse);

      return config;
    },
    (error) => Promise.reject(error),
  );
}

// ─── Demo Response Router ─────────────────────────────────────────────────────
function resolveDemoResponse(method: string, url: string): unknown {
  const m = method.toLowerCase();

  // ── Incidents ─────────────────────────────────────────────────────────────
  if (url.match(/\/incidents\/active/)) return { items: DEMO_INCIDENTS.filter(i => i.status !== 'CLOSED'), total: 3 };
  if (url.match(/\/incidents\/([a-z0-9-]+)$/)) {
    const id = url.split('/').pop()!;
    const incident = DEMO_INCIDENTS.find((i) => i.id === id || i.incident_number === id);
    return incident ?? DEMO_INCIDENTS[0];
  }
  if (url.match(/\/incidents/)) {
    return { items: DEMO_INCIDENTS, total: DEMO_INCIDENTS.length, page: 1, limit: 20 };
  }

  // ── Ambulances ────────────────────────────────────────────────────────────
  if (url.match(/\/ambulances\/available/)) {
    return { items: DEMO_AMBULANCES.filter((a) => a.status === 'AVAILABLE'), total: 2 };
  }
  if (url.match(/\/ambulances\/([a-z0-9-]+)$/)) {
    const id = url.split('/').pop()!;
    return DEMO_AMBULANCES.find((a) => a.id === id) ?? DEMO_AMBULANCES[0];
  }
  if (url.match(/\/ambulances/)) {
    return { items: DEMO_AMBULANCES, total: DEMO_AMBULANCES.length };
  }

  // ── Hospitals ─────────────────────────────────────────────────────────────
  if (url.match(/\/hospitals\/([a-z0-9-]+)$/)) {
    const id = url.split('/').pop()!;
    return DEMO_HOSPITALS.find((h) => h.id === id) ?? DEMO_HOSPITALS[0];
  }
  if (url.match(/\/hospitals\/recommend/)) {
    return DEMO_HOSPITALS[0]; // nearest hospital
  }
  if (url.match(/\/hospitals/)) {
    return { items: DEMO_HOSPITALS, total: DEMO_HOSPITALS.length };
  }

  // ── Dispatch ──────────────────────────────────────────────────────────────
  if (url.match(/\/dispatch\/recommend/)) {
    return {
      recommendations: [
        { ambulance: DEMO_AMBULANCES[3], eta_minutes: 6, distance_km: 4.2 },
        { ambulance: DEMO_AMBULANCES[4], eta_minutes: 9, distance_km: 7.1 },
      ],
      suggested_hospital: DEMO_HOSPITALS[0],
    };
  }
  if (url.match(/\/dispatch/) && m === 'post') {
    return { success: true, dispatch_id: `dp-${Date.now()}` };
  }

  // ── Analytics ─────────────────────────────────────────────────────────────
  if (url.match(/\/analytics\/kpi/)) return DEMO_KPI;
  if (url.match(/\/analytics\/golden-hour/)) {
    return {
      districts: ['Kottayam', 'Ernakulam', 'Kozhikode', 'Thiruvananthapuram', 'Thrissur'],
      compliance: [73, 81, 65, 88, 70],
    };
  }
  if (url.match(/\/analytics\/response-times/)) {
    return { buckets: ['<5m', '5-10m', '10-20m', '>20m'], counts: [12, 34, 28, 8] };
  }
  if (url.match(/\/analytics\/incident-trends/)) {
    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      data: [4, 7, 3, 9, 5, 12, 6],
    };
  }

  // ── Black Spots ───────────────────────────────────────────────────────────
  if (url.match(/\/blackspots/)) {
    return { items: DEMO_BLACKSPOTS, total: DEMO_BLACKSPOTS.length };
  }

  // ── Notifications ─────────────────────────────────────────────────────────
  if (url.match(/\/notifications/) && m === 'get') {
    return { items: DEMO_NOTIFICATIONS, unread_count: 2 };
  }
  if (url.match(/\/notifications\/.*\/read/) && m === 'post') {
    return { success: true };
  }

  // ── Default ───────────────────────────────────────────────────────────────
  return {};
}

// ─── Typed API Helper (wraps apiClient with generics) ─────────────────────────
/**
 * Convenience wrapper that returns the response `data` directly.
 * Usage:
 *   const incidents = await api.get<IncidentListResponse>('/incidents');
 */
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<T>(url, config).then((r) => r.data),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.post<T>(url, data, config).then((r) => r.data),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.put<T>(url, data, config).then((r) => r.data),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.patch<T>(url, data, config).then((r) => r.data),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T>(url, config).then((r) => r.data),
};

export default apiClient;
