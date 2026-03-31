/**
 * authStore.ts
 *
 * Global Zustand store for user authentication.
 *
 * Responsibilities:
 *  • Holds the current user object, access token, and refresh token
 *  • Provides login() — works in both LIVE and DEMO mode
 *  • Provides logout() — clears all auth state + localStorage
 *  • Rehydrates session from localStorage on app boot (rehydrate())
 *  • Exposes token setters used by the Axios response interceptor
 *    when it silently refreshes an expired access token
 *
 * Demo mode (VITE_DEMO_MODE=true):
 *  login() validates credentials against DEMO_USERS fixtures instead
 *  of hitting the backend. This allows full UI exploration without
 *  a running FastAPI server.
 *
 * Live mode:
 *  login() calls apiClient which POST /api/v1/auth/login, stores the
 *  returned JWT pair, then calls GET /api/v1/auth/me to fetch the
 *  full user profile.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { AuthStore, AuthUser, LoginCredentials, TokenPair } from '@/types/user.types';
import { DEMO_USERS } from '@/api/demo-fixtures';

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'trauma_auth';
const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Simulates network latency in demo mode so the UI loading states are visible */
const fakeDemoDelay = (ms = 800) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Lazily import apiClient to avoid circular dependency:
 *   client.ts → useAuthStore (for token access)
 *   authStore.ts → client.ts (for login/me calls)
 *
 * We use a dynamic require pattern here; the actual network calls
 * are never executed in demo mode.
 */
let _apiClient: import('axios').AxiosInstance | null = null;
async function getApiClient() {
  if (!_apiClient) {
    const mod = await import('@/api/client');
    _apiClient = mod.apiClient;
  }
  return _apiClient;
}

// ─── Store Definition ─────────────────────────────────────────────────────────
export const useAuthStore = create<AuthStore>()(
  persist(
    immer((set, get) => ({
      // ── Initial State ──────────────────────────────────────────────────────
      user: null,
      accessToken: null,
      refreshToken: null,
      isHydrated: false,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // ── Actions ────────────────────────────────────────────────────────────

      /**
       * login()
       *
       * DEMO MODE:
       *   Matches email+password against DEMO_USERS.
       *   On success: populates store with fixture user + fake tokens.
       *   On failure: sets error message.
       *
       * LIVE MODE:
       *   POST /api/v1/auth/login  →  { access_token, refresh_token, ... }
       *   GET  /api/v1/auth/me    →  { id, email, full_name, role, ... }
       *   On failure: sets error from server response.
       */
      login: async (credentials: LoginCredentials) => {
        // Clear any previous error and set loading
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          if (IS_DEMO_MODE) {
            // ── Demo Login ───────────────────────────────────────────────────
            await fakeDemoDelay();

            const entry = DEMO_USERS[credentials.email.toLowerCase().trim()];

            if (!entry || entry.password !== credentials.password) {
              throw new Error(
                'Invalid credentials. Try:\n' +
                  '  dispatcher@trauma.demo / Demo@1234\n' +
                  '  admin@trauma.demo / Admin@1234\n' +
                  '  hospital@trauma.demo / Hosp@1234\n' +
                  '  gov@trauma.demo / Gov@1234',
              );
            }

            set((state) => {
              state.user = entry.user;
              state.accessToken = entry.tokens.access_token;
              state.refreshToken = entry.tokens.refresh_token;
              state.isAuthenticated = true;
              state.isLoading = false;
              state.error = null;
            });
          } else {
            // ── Live Login ───────────────────────────────────────────────────
            const client = await getApiClient();

            // 1. Obtain token pair
            const { data: tokenData } = await client.post<TokenPair>(
              '/auth/login',
              {
                email: credentials.email.toLowerCase().trim(),
                password: credentials.password,
              },
            );

            // Optimistically store the tokens so the /me call has auth headers
            set((state) => {
              state.accessToken = tokenData.access_token;
              state.refreshToken = tokenData.refresh_token;
            });

            // 2. Fetch full user profile
            const { data: userData } = await client.get<AuthUser>('/auth/me');

            set((state) => {
              state.user = userData;
              state.isAuthenticated = true;
              state.isLoading = false;
              state.error = null;
            });
          }
        } catch (err: unknown) {
          const message = extractErrorMessage(err);
          set((state) => {
            state.isLoading = false;
            state.isAuthenticated = false;
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.error = message;
          });
          // Re-throw so callers (LoginPage) can react if needed
          throw new Error(message);
        }
      },

      /**
       * logout()
       *
       * Clears all auth state. The Zustand `persist` middleware will
       * also wipe the localStorage entry via the clearStorage option below.
       *
       * In live mode we also fire a best-effort POST /auth/logout to
       * blacklist the refresh token on the server — we don't await it
       * since the local state is already cleared.
       */
      logout: () => {
        const { accessToken } = get();

        // Fire-and-forget server-side token blacklist (live mode only)
        if (!IS_DEMO_MODE && accessToken) {
          getApiClient()
            .then((client) => client.post('/auth/logout').catch(() => {}))
            .catch(() => {});
        }

        set((state) => {
          state.user = null;
          state.accessToken = null;
          state.refreshToken = null;
          state.isAuthenticated = false;
          state.isLoading = false;
          state.error = null;
        });
      },

      /**
       * setTokens()
       *
       * Called by the Axios response interceptor after a silent token
       * refresh (401 → POST /auth/refresh → retry original request).
       * Keeps the store in sync with the new token pair.
       */
      setTokens: (tokens: TokenPair) => {
        set((state) => {
          state.accessToken = tokens.access_token;
          state.refreshToken = tokens.refresh_token;
        });
      },

      /**
       * setUser()
       *
       * Allows the profile page or admin panel to push an updated user
       * object into the store without a full re-login.
       */
      setUser: (user: AuthUser) => {
        set((state) => {
          state.user = user;
        });
      },

      /** Clears the login / token-refresh error message. */
      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      /**
       * rehydrate()
       *
       * Called once in main.tsx (or a top-level useEffect) after the
       * Zustand persist middleware has loaded state from localStorage.
       * We use it to:
       *   1. Mark hydration as complete (so the app doesn't flash the
       *      login page while localStorage is being read).
       *   2. Optionally validate the stored token is still live
       *      by calling GET /auth/me.
       */
      rehydrate: () => {
        set((state) => {
          state.isHydrated = true;
          // Restore isAuthenticated from persisted data
          if (state.user && state.accessToken) {
            state.isAuthenticated = true;
          }
        });
      },
    })),

    // ── Persist Configuration ────────────────────────────────────────────────
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),

      // Only persist the minimal set needed to restore session on reload.
      // Transient state (isLoading, error) is NOT persisted.
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),

      // After rehydration from localStorage, mark hydration complete
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true;
          if (state.user && state.accessToken) {
            state.isAuthenticated = true;
          }
        }
      },
    },
  ),
);

// ─── Selector Helpers (avoids re-render on unrelated changes) ─────────────────

/** Returns the current authenticated user (or null) */
export const selectUser = (s: AuthStore) => s.user;

/** True if the user is authenticated */
export const selectIsAuthenticated = (s: AuthStore) => s.isAuthenticated;

/** Current access token — used by apiClient interceptor */
export const selectAccessToken = (s: AuthStore) => s.accessToken;

/** Current refresh token — used for silent token refresh */
export const selectRefreshToken = (s: AuthStore) => s.refreshToken;

/** The user's role string (or null if not logged in) */
export const selectUserRole = (s: AuthStore) => s.user?.role ?? null;

/** True while a login or token-refresh is in flight */
export const selectIsLoading = (s: AuthStore) => s.isLoading;

/** Last auth error message */
export const selectAuthError = (s: AuthStore) => s.error;

// ─── Utility ──────────────────────────────────────────────────────────────────

/**
 * Extracts a human-readable message from any thrown error shape:
 *  • Axios error with FastAPI detail string / array
 *  • Standard JS Error
 *  • Unknown primitive
 */
function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    // Axios errors expose err.response
    const axiosErr = err as unknown as {
      response?: { data?: { detail?: string | { msg: string }[] } };
    };
    const detail = axiosErr?.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.map((d) => d.msg).join(', ');
    return err.message;
  }
  if (typeof err === 'string') return err;
  return 'An unexpected error occurred. Please try again.';
}
