/**
 * packages/shared/src/index.ts
 *
 * Barrel export for the @trauma/shared package.
 * All consumer packages (apps/web, apps/mobile, backend) import from here.
 */

// ── Types ─────────────────────────────────────────────────────────────────────
export type {
  AmbulanceType,
  AmbulanceStatus,
  Ambulance,
  AmbulanceMapMarker,
  AmbulanceEquipment,
  CrewMember,
  FleetSummary,
} from './types/ambulance';

export type { } from './types/analytics';
export type { } from './types/dispatch';
export type { } from './types/hospital';
export type { } from './types/incident';
export type { } from './types/patient';
export type { } from './types/user';
