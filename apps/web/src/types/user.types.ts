// ─── User & Auth Types ────────────────────────────────────────────────────────
// Mirrors the Python `UserRole` enum and backend Pydantic schemas.

export type UserRole =
  | 'PARAMEDIC'
  | 'DRIVER'
  | 'DISPATCHER'
  | 'HOSPITAL_STAFF'
  | 'ADMIN'
  | 'GOVERNMENT'
  | 'PUBLIC';

// ─── Domain User (as returned by GET /auth/me or embedded in JWT) ─────────────
export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  hospital_id?: string | null;
  ambulance_id?: string | null;
  is_active: boolean;
  created_at: string;
}

// ─── Token Pair returned by POST /auth/login ──────────────────────────────────
export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  /** Seconds until the access token expires */
  expires_in: number;
}

// ─── Login Request ─────────────────────────────────────────────────────────────
export interface LoginCredentials {
  email: string;
  password: string;
}

// ─── Auth Store State ─────────────────────────────────────────────────────────
export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  /** True once the initial session rehydration from localStorage is complete */
  isHydrated: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  setTokens: (tokens: TokenPair) => void;
  setUser: (user: AuthUser) => void;
  clearError: () => void;
  /** Called on app boot to rehydrate session from localStorage */
  rehydrate: () => void;
}

export type AuthStore = AuthState & AuthActions;
