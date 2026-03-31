# Integrated Trauma Care Platform — Mobile Demo Production Plan
> **Stack:** Expo (React Native) · FastAPI · PostgreSQL · Shared TypeScript Monorepo  
> **Goal:** A fully functional mobile demo that runs on any Android/iOS device and seamlessly shares code, types, and API with the production React web app.

---

## Table of Contents
1. [Monorepo Strategy — How Everything Fits Together](#1-monorepo-strategy)
2. [Full Monorepo Directory Structure](#2-full-monorepo-directory-structure)
3. [Package: `@trauma/shared` — What It Contains](#3-package-traumashared)
4. [Mobile App: Expo + React Native](#4-mobile-app-expo--react-native)
5. [Backend: FastAPI Demo Mode](#5-backend-fastapi-demo-mode)
6. [Screen-by-Screen Feature Map](#6-screen-by-screen-feature-map)
7. [Demo Mode — Running Without Real Infrastructure](#7-demo-mode)
8. [API Communication Contract](#8-api-communication-contract)
9. [How Mobile Demo → Web App Communication Works](#9-how-mobile-demo--web-app-communicate)
10. [Local Dev Setup (One Command)](#10-local-dev-setup)
11. [Demo Presentation Flow](#11-demo-presentation-flow)

---

## 1. Monorepo Strategy

The entire platform lives in a **single monorepo** (using `pnpm workspaces`). This is the key architectural decision that makes the mobile demo and web app "seamless":

```
trauma-platform/              ← root monorepo
├── packages/
│   └── shared/               ← @trauma/shared: types, API client, triage logic
├── apps/
│   ├── mobile/               ← Expo React Native demo app
│   ├── web/                  ← React + Vite command center (from previous plan)
│   └── backend/              ← FastAPI Python server
└── pnpm-workspace.yaml
```

**Why this matters:**
- `@trauma/shared` is imported by BOTH `apps/mobile` and `apps/web`
- TypeScript types for `Incident`, `Patient`, `TriageRecord` are defined ONCE
- The Axios API client is defined ONCE — mobile and web both call the same functions
- A triage color calculated on mobile renders identically on the web dashboard
- No copy-paste bugs between apps

---

## 2. Full Monorepo Directory Structure

```
trauma-platform/
│
├── pnpm-workspace.yaml               # defines packages/* and apps/*
├── package.json                      # root: scripts for running all services
├── turbo.json                        # Turborepo: parallel build orchestration
├── .env.example                      # shared env vars (API URL, WS URL)
│
├── packages/
│   └── shared/                       # @trauma/shared — imported by mobile + web
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts              # re-exports everything
│           ├── types/
│           │   ├── incident.ts       # Incident, IncidentStatus, IncidentSeverity
│           │   ├── ambulance.ts      # Ambulance, AmbulanceStatus
│           │   ├── hospital.ts       # Hospital, HospitalResource, TraumaLevel
│           │   ├── patient.ts        # Patient, VitalSigns, TriageRecord
│           │   ├── dispatch.ts       # DispatchRecord, RecommendationResult
│           │   ├── user.ts           # User, UserRole
│           │   └── analytics.ts     # KPIData, GoldenHourReport
│           ├── api/
│           │   ├── client.ts         # Axios instance factory (accepts baseURL)
│           │   ├── auth.ts           # login(), refreshToken(), logout()
│           │   ├── incidents.ts      # createIncident(), getIncident(), updateStatus()
│           │   ├── ambulances.ts     # getAmbulances(), pushLocation(), getAvailable()
│           │   ├── hospitals.ts      # getHospitals(), recommendHospital(), updateResources()
│           │   ├── patients.ts       # addPatient(), recordVitals(), submitTriage()
│           │   ├── dispatch.ts       # getRecommendation(), confirmDispatch()
│           │   └── analytics.ts     # getKPIs(), getGoldenHour()
│           ├── constants/
│           │   ├── triage.ts         # START protocol logic → returns TriageColor
│           │   ├── gcs.ts            # GCS scoring guide + category labels
│           │   ├── golden-hour.ts    # Timer thresholds + color bands
│           │   └── enums.ts          # All shared enum values
│           └── utils/
│               ├── date.ts           # formatTimestamp(), durationSince()
│               └── geo.ts            # haversineDistance(), formatCoords()
│
├── apps/
│   │
│   ├── mobile/                       # Expo React Native demo app
│   │   ├── app.json                  # Expo config: name, icon, splash, permissions
│   │   ├── babel.config.js
│   │   ├── tsconfig.json             # extends ../../tsconfig.base.json
│   │   ├── package.json              # deps: expo, react-native, @trauma/shared
│   │   ├── .env.example              # EXPO_PUBLIC_API_URL, EXPO_PUBLIC_DEMO_MODE
│   │   │
│   │   └── src/
│   │       │
│   │       ├── app/                  # Expo Router file-based navigation
│   │       │   ├── _layout.tsx       # Root layout: providers, global error boundary
│   │       │   ├── (auth)/
│   │       │   │   └── login.tsx     # Login screen (demo: pre-filled paramedic creds)
│   │       │   └── (app)/
│   │       │       ├── _layout.tsx   # Tab navigator: Home | Active | Profile
│   │       │       ├── index.tsx     # Home screen: New Incident or Active incident card
│   │       │       ├── active.tsx    # Active incident screen (if dispatched)
│   │       │       └── profile.tsx   # User info, ambulance assignment, logout
│   │       │
│   │       ├── screens/              # Full-screen flows (pushed from tabs)
│   │       │   │
│   │       │   ├── NewIncident/
│   │       │   │   ├── NewIncidentScreen.tsx       # Step 1: GPS + accident details
│   │       │   │   ├── NewIncidentViewModel.ts     # State machine for form
│   │       │   │   └── components/
│   │       │   │       ├── GPSCaptureCard.tsx       # Live lat/lon display + accuracy ring
│   │       │   │       ├── AccidentTypeGrid.tsx     # Icon grid: Road / Fall / Cardiac / etc.
│   │       │   │       ├── SeveritySlider.tsx       # MINOR → CRITICAL slider with color
│   │       │   │       └── PatientCountStepper.tsx  # +/– patient counter
│   │       │   │
│   │       │   ├── Triage/
│   │       │   │   ├── TriageScreen.tsx             # Step 2: START protocol wizard per patient
│   │       │   │   ├── TriageViewModel.ts
│   │       │   │   └── components/
│   │       │   │       ├── StartWizardCard.tsx      # Breathing? → Perfusion? → Mental?
│   │       │   │       ├── TriageColorResult.tsx    # Full-screen color splash: RED/YELLOW/GREEN
│   │       │   │       ├── PatientTabRow.tsx        # Multi-patient tabs (Patient 1, 2, 3)
│   │       │   │       └── GCSQuickGuide.tsx        # Expandable GCS reference sheet
│   │       │   │
│   │       │   ├── Vitals/
│   │       │   │   ├── VitalsScreen.tsx             # Step 3: numerical vitals entry
│   │       │   │   ├── VitalsViewModel.ts
│   │       │   │   └── components/
│   │       │   │       ├── VitalInputRow.tsx        # Label + numeric input + unit
│   │       │   │       ├── VitalRangeIndicator.tsx  # Green/amber/red dot for normal range
│   │       │   │       └── VitalsHistory.tsx        # Prior readings in same incident
│   │       │   │
│   │       │   ├── IncidentStatus/
│   │       │   │   ├── IncidentStatusScreen.tsx     # Update status throughout response
│   │       │   │   └── components/
│   │       │   │       ├── StatusStepper.tsx        # Visual: REPORTED→DISPATCHED→ON_SCENE→...
│   │       │   │       ├── HospitalInfoCard.tsx     # Receiving hospital + ETA
│   │       │   │       └── DispatchConfirmCard.tsx  # Show dispatcher's assignment
│   │       │   │
│   │       │   ├── Photo/
│   │       │   │   ├── PhotoCaptureScreen.tsx       # Camera → upload to MinIO
│   │       │   │   └── components/
│   │       │   │       └── PhotoThumbnailGrid.tsx   # Uploaded scene photos
│   │       │   │
│   │       │   └── IncidentSummary/
│   │       │       └── IncidentSummaryScreen.tsx    # Read-only: all data for closed incident
│   │       │
│   │       ├── components/                          # Reusable UI components
│   │       │   ├── GoldenHourBanner.tsx             # Persistent countdown: 00:00 → RED at 60min
│   │       │   ├── OfflineBanner.tsx                # Orange bar: "Offline — data queued (3)"
│   │       │   ├── TriageColorBadge.tsx             # Colored pill: RED / YELLOW / GREEN / BLACK
│   │       │   ├── SeverityBadge.tsx                # CRITICAL / SEVERE / MODERATE / MINOR
│   │       │   ├── LoadingOverlay.tsx               # Full-screen spinner with message
│   │       │   ├── ErrorToast.tsx                   # Bottom-up error notification
│   │       │   └── ConfirmBottomSheet.tsx           # Confirmation sheet (e.g. submit triage)
│   │       │
│   │       ├── hooks/
│   │       │   ├── useAuth.ts                       # Auth state from SecureStore
│   │       │   ├── useGPS.ts                        # Expo Location wrapper: accuracy + watch
│   │       │   ├── useGPSTracking.ts                # Background location push to /ambulances/{id}/location
│   │       │   ├── useIncident.ts                   # Active incident state + polling
│   │       │   ├── useOfflineQueue.ts               # MMKV queue: detect network, flush pending
│   │       │   ├── useGoldenHourTimer.ts            # Elapsed time from incident.created_at
│   │       │   ├── usePushNotifications.ts          # Expo Notifications: dispatch alerts
│   │       │   └── useCamera.ts                     # Expo Camera + ImagePicker wrapper
│   │       │
│   │       ├── store/                               # Zustand (same pattern as web app)
│   │       │   ├── authStore.ts                     # user, tokens, login/logout
│   │       │   ├── incidentStore.ts                 # activeIncident, pendingPatients
│   │       │   └── syncStore.ts                     # offline queue count, sync status
│   │       │
│   │       ├── services/
│   │       │   ├── apiService.ts                    # Creates @trauma/shared API client with mobile baseURL
│   │       │   ├── locationService.ts               # TaskManager background location (Expo)
│   │       │   ├── offlineService.ts                # MMKV-backed queue + sync logic
│   │       │   ├── notificationService.ts           # FCM via Expo Notifications
│   │       │   └── cameraService.ts                 # Capture + compress + upload photo
│   │       │
│   │       ├── demo/                                # DEMO MODE assets (no real infra needed)
│   │       │   ├── demoData.ts                      # Seeded incidents, hospitals, ambulances
│   │       │   ├── demoHandlers.ts                  # MSW request handlers for offline demo
│   │       │   ├── demoGPS.ts                       # Fake GPS route simulation (Kerala coords)
│   │       │   └── demoNotifications.ts             # Trigger fake dispatch push after N seconds
│   │       │
│   │       └── utils/
│   │           ├── permissions.ts                   # Request location + camera + notifications
│   │           ├── storage.ts                       # MMKV + SecureStore wrappers
│   │           └── validation.ts                    # Form field validators
│   │
│   │
│   ├── web/                           # React Vite web app (full plan in prior doc)
│   │   └── src/
│   │       └── api/
│   │           └── client.ts         # ← imports from @trauma/shared (same client!)
│   │
│   │
│   └── backend/                      # FastAPI (full plan in prior doc, additions below)
│       ├── app/
│       │   ├── api/v1/
│       │   │   └── demo.py           # NEW: /demo/seed, /demo/reset, /demo/scenario
│       │   ├── seed/
│       │   │   ├── demo_hospitals.py # 5 Kerala hospitals with realistic data
│       │   │   ├── demo_ambulances.py # 8 ambulances with positions
│       │   │   ├── demo_incidents.py # 3 pre-seeded incidents at different stages
│       │   │   └── demo_users.py     # paramedic@demo, dispatcher@demo, hospital@demo
│       │   └── config.py             # DEMO_MODE env flag: relaxes auth, enables seed endpoints
│       └── ...                       # (all other files from main plan unchanged)
```

---

## 3. Package: `@trauma/shared`

This is the glue between mobile and web. Both apps install it from the monorepo.

### `src/api/client.ts`
```typescript
import axios, { AxiosInstance } from 'axios'

let _client: AxiosInstance | null = null

export function createApiClient(baseURL: string, getToken: () => string | null): AxiosInstance {
  const client = axios.create({ baseURL, timeout: 10000 })

  // Attach JWT on every request
  client.interceptors.request.use(config => {
    const token = getToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  // On 401, attempt token refresh then retry
  client.interceptors.response.use(
    res => res,
    async error => {
      if (error.response?.status === 401) {
        // trigger refresh — handled by each app's auth store
        window.dispatchEvent(new Event('auth:token-expired'))
      }
      return Promise.reject(error)
    }
  )
  _client = client
  return client
}

export function getApiClient(): AxiosInstance {
  if (!_client) throw new Error('API client not initialised — call createApiClient first')
  return _client
}
```

### `src/types/incident.ts` (excerpt)
```typescript
export enum IncidentStatus {
  REPORTED         = 'REPORTED',
  DISPATCH_PENDING = 'DISPATCH_PENDING',
  DISPATCHED       = 'DISPATCHED',
  EN_ROUTE         = 'EN_ROUTE',
  ON_SCENE         = 'ON_SCENE',
  PATIENT_LOADED   = 'PATIENT_LOADED',
  TRANSPORTING     = 'TRANSPORTING',
  HOSPITAL_ARRIVED = 'HOSPITAL_ARRIVED',
  CLOSED           = 'CLOSED',
}

export interface Incident {
  id: string
  incident_number: string
  status: IncidentStatus
  severity: 'MINOR' | 'MODERATE' | 'SEVERE' | 'CRITICAL' | 'MCI'
  accident_type: string
  latitude: number
  longitude: number
  address_text: string
  district: string
  patient_count: number
  is_mci: boolean
  created_at: string
  patients: Patient[]
  timeline: IncidentTimelineEntry[]
}
```

### `src/constants/triage.ts`
```typescript
// START Protocol — same logic used on mobile wizard AND web triage display
export type TriageColor = 'RED' | 'YELLOW' | 'GREEN' | 'BLACK'

export interface StartAssessment {
  is_breathing: boolean
  respirations_ok: boolean     // RR 10–29 = ok
  perfusion_ok: boolean        // cap refill < 2s OR radial pulse present
  mental_status_ok: boolean    // follows simple commands
}

export function calculateStartTriage(a: StartAssessment): TriageColor {
  if (!a.is_breathing) return 'BLACK'
  if (!a.respirations_ok) return 'RED'
  if (!a.perfusion_ok) return 'RED'
  if (!a.mental_status_ok) return 'RED'
  return 'YELLOW'  // Delayed — reassess when resources allow
}

// Can walk and has minor injuries → GREEN (assessed separately at scene)
export const GOLDEN_HOUR_THRESHOLDS = {
  GREEN:  { max: 20, label: 'On track' },
  YELLOW: { max: 45, label: 'Hurry' },
  ORANGE: { max: 60, label: 'Critical window' },
  RED:    { max: Infinity, label: 'Golden hour exceeded' },
}
```

---

## 4. Mobile App: Expo + React Native

### Why Expo (not bare React Native)
- `expo-location` gives background GPS tracking with task manager — no native code
- `expo-camera` and `expo-image-picker` — no native config for photo capture
- `expo-notifications` — FCM and APNs with zero native setup
- `expo-secure-store` — encrypted JWT storage
- `expo-updates` — OTA demo updates without App Store review
- Can demo on real device via **Expo Go** or generate APK in minutes via **EAS Build**

### Key Dependencies (`apps/mobile/package.json`)
```json
{
  "dependencies": {
    "expo": "~51.0.0",
    "expo-router": "~3.5.0",
    "expo-location": "~17.0.0",
    "expo-camera": "~15.0.0",
    "expo-notifications": "~0.28.0",
    "expo-secure-store": "~13.0.0",
    "expo-image-picker": "~15.0.0",
    "expo-task-manager": "~11.8.0",
    "react-native-maps": "1.14.0",
    "zustand": "^4.5.0",
    "react-native-mmkv": "^2.12.0",
    "@trauma/shared": "workspace:*",
    "react-native-reanimated": "~3.10.0",
    "react-native-safe-area-context": "4.10.1",
    "@gorhom/bottom-sheet": "^4.6.0"
  }
}
```

### `src/app/_layout.tsx` — Root Provider Setup
```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { useEffect } from 'react'
import { createApiClient } from '@trauma/shared'
import { useAuthStore } from '../store/authStore'
import { isDemoMode } from '../demo/demoData'
import { setupMockServer } from '../demo/demoHandlers'

export default function RootLayout() {
  const getToken = useAuthStore(s => s.getAccessToken)

  useEffect(() => {
    // If DEMO_MODE env is set, intercept all API calls with MSW
    if (isDemoMode) {
      setupMockServer()
    }
    // Create the shared API client — same one the web app uses
    createApiClient(
      process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1',
      getToken
    )
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
```

### `src/screens/NewIncident/NewIncidentScreen.tsx`
```tsx
import { createIncident } from '@trauma/shared'   // ← same function web app uses
import { useGPS } from '../../hooks/useGPS'
import { GPSCaptureCard, AccidentTypeGrid, SeveritySlider } from './components'

export default function NewIncidentScreen() {
  const { coords, accuracy } = useGPS()
  const [type, setType] = useState<string>('ROAD_ACCIDENT')
  const [severity, setSeverity] = useState('SEVERE')
  const [patientCount, setPatientCount] = useState(1)

  const handleSubmit = async () => {
    const incident = await createIncident({
      latitude: coords.latitude,
      longitude: coords.longitude,
      accident_type: type,
      severity,
      patient_count: patientCount,
    })
    router.push(`/triage?incident_id=${incident.id}`)
    // ↑ This POST also triggers a WebSocket broadcast to the React web command center
    // The dispatcher sees the new incident pin appear on the live map in real time
  }

  return (
    <ScrollView>
      <GPSCaptureCard coords={coords} accuracy={accuracy} />
      <AccidentTypeGrid selected={type} onSelect={setType} />
      <SeveritySlider value={severity} onChange={setSeverity} />
      <PatientCountStepper value={patientCount} onChange={setPatientCount} />
      <Button title="Report Incident" onPress={handleSubmit} />
    </ScrollView>
  )
}
```

### `src/components/GoldenHourBanner.tsx`
```tsx
import { GOLDEN_HOUR_THRESHOLDS } from '@trauma/shared'  // ← shared constant
import { useGoldenHourTimer } from '../hooks/useGoldenHourTimer'

export function GoldenHourBanner({ incidentCreatedAt }: { incidentCreatedAt: string }) {
  const elapsed = useGoldenHourTimer(incidentCreatedAt)
  const minutes = Math.floor(elapsed / 60)

  const band = minutes < 20 ? 'GREEN' : minutes < 45 ? 'YELLOW' : minutes < 60 ? 'ORANGE' : 'RED'
  const colors = { GREEN: '#16a34a', YELLOW: '#ca8a04', ORANGE: '#ea580c', RED: '#dc2626' }

  return (
    <View style={{ backgroundColor: colors[band], padding: 8, alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '600' }}>
        ⏱ {String(minutes).padStart(2,'0')}:{String(elapsed % 60).padStart(2,'0')}
        {'  '}Golden Hour — {GOLDEN_HOUR_THRESHOLDS[band].label}
      </Text>
    </View>
  )
}
```

### `src/hooks/useGPSTracking.ts`
```typescript
// Background GPS push to backend — same /ambulances/{id}/location endpoint
// that the web app's live map subscribes to via WebSocket
import * as TaskManager from 'expo-task-manager'
import * as Location from 'expo-location'
import { pushAmbulanceLocation } from '@trauma/shared'  // ← shared API fn
import { useAuthStore } from '../store/authStore'

const LOCATION_TASK = 'BACKGROUND_LOCATION_TASK'

TaskManager.defineTask(LOCATION_TASK, async ({ data }) => {
  const { locations } = data as any
  const { latitude, longitude } = locations[0].coords
  const ambulanceId = useAuthStore.getState().user?.ambulance_id
  if (ambulanceId) {
    await pushAmbulanceLocation(ambulanceId, { latitude, longitude })
    // ↑ Backend stores to DB + Redis pub/sub → WebSocket → LiveMap.tsx on web
  }
})

export function useGPSTracking() {
  const startTracking = async () => {
    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: 10000,          // push every 10 seconds
      distanceInterval: 20,         // or every 20 metres
      foregroundService: {
        notificationTitle: 'Trauma — Active Response',
        notificationBody: 'Location is being shared with command center',
      },
    })
  }
  const stopTracking = () => Location.stopLocationUpdatesAsync(LOCATION_TASK)
  return { startTracking, stopTracking }
}
```

---

## 5. Backend: FastAPI Demo Mode

### New file: `app/api/v1/demo.py`
```python
from fastapi import APIRouter, Depends
from app.config import settings
from app.db.session import get_db
from app.seed import demo_hospitals, demo_ambulances, demo_incidents, demo_users

router = APIRouter(prefix="/demo", tags=["demo"])

@router.post("/seed")
async def seed_demo_data(db=Depends(get_db)):
    """
    Populates the DB with realistic Kerala district demo data.
    Only available when DEMO_MODE=true in environment.
    """
    if not settings.DEMO_MODE:
        raise HTTPException(403, "Demo mode not enabled")

    await demo_users.seed(db)
    await demo_hospitals.seed(db)     # 5 hospitals: 2x Level-1, 2x Level-2, 1x Community
    await demo_ambulances.seed(db)    # 8 ambulances at realistic Kerala coordinates
    await demo_incidents.seed(db)     # 3 incidents: one active, one en-route, one closed
    return {"status": "seeded"}

@router.post("/reset")
async def reset_demo_data(db=Depends(get_db)):
    """Wipes all non-user demo data — for clean re-demo"""
    if not settings.DEMO_MODE:
        raise HTTPException(403)
    await db.execute("DELETE FROM incidents WHERE metadata->>'demo' = 'true'")
    await db.commit()
    return {"status": "reset"}

@router.post("/scenario/{name}")
async def run_demo_scenario(name: str, db=Depends(get_db)):
    """
    Trigger a scripted demo scenario — useful for live presentations.
    'accident_reported'    → creates incident at black-spot location + dispatches ambulance
    'hospital_full'        → sets one hospital to near-capacity
    'mci_event'            → creates a Mass Casualty Incident with 4 patients
    'golden_hour_breach'   → creates incident with timestamp 55min ago
    """
    ...
```

### `app/seed/demo_hospitals.py`
```python
DEMO_HOSPITALS = [
    {
        "name": "Government Medical College Kottayam",
        "latitude": 9.5916, "longitude": 76.5222,
        "district": "Kottayam", "trauma_level": "LEVEL_1",
        "resources": {
            "icu_beds_total": 20, "icu_beds_available": 8,
            "ed_capacity_total": 40, "ed_capacity_current": 22,
            "ventilators_total": 10, "ventilators_available": 4,
            "ot_available": True, "blood_bank_available": True,
        }
    },
    {
        "name": "KIMS Hospital Trivandrum",
        "latitude": 8.5241, "longitude": 76.9366,
        "district": "Thiruvananthapuram", "trauma_level": "LEVEL_1",
        "resources": {
            "icu_beds_total": 30, "icu_beds_available": 12,
            "ed_capacity_total": 60, "ed_capacity_current": 35,
            "ot_available": True,
        }
    },
    {
        "name": "General Hospital Alappuzha",
        "latitude": 9.4981, "longitude": 76.3388,
        "district": "Alappuzha", "trauma_level": "LEVEL_2",
        "resources": {
            "icu_beds_total": 12, "icu_beds_available": 5,
            "ed_capacity_total": 25, "ed_capacity_current": 14,
        }
    },
    # ... 2 more
]
```

---

## 6. Screen-by-Screen Feature Map

| Screen | What It Demos | Shared Code Used | Backend Endpoint |
|--------|--------------|------------------|-----------------|
| **Login** | Role-based auth (Paramedic vs Dispatcher) | `auth.login()` | `POST /auth/login` |
| **Home** | Active incident card OR "New Incident" CTA | `Incident` type | `GET /incidents/active` |
| **New Incident** | GPS capture, accident type, severity | `createIncident()` | `POST /incidents` |
| **Triage Wizard** | START protocol: 3-question flow → triage color | `calculateStartTriage()` | `POST /patients/{id}/triage` |
| **Vitals Entry** | GCS, BP, SpO2, RR, HR with range indicators | `VitalSigns` type | `POST /patients/{id}/vitals` |
| **Incident Status** | Status stepper + receiving hospital card | `IncidentStatus` enum | `PATCH /incidents/{id}/status` |
| **Photo Capture** | Camera → MinIO upload → scene documentation | `uploadPhoto()` | `POST /incidents/{id}/photos` |
| **Incident Summary** | Read-only closed incident with full timeline | `Incident` + `TriageRecord` | `GET /incidents/{id}` |
| **Profile** | Ambulance assignment, online/offline toggle | `User` type | `GET /users/me` |

---

## 7. Demo Mode

### How It Works
Set `EXPO_PUBLIC_DEMO_MODE=true` in `apps/mobile/.env`.

When demo mode is active, `apps/mobile/src/demo/demoHandlers.ts` intercepts all API calls using **MSW (Mock Service Worker)** adapted for React Native. The demo runs completely offline — no backend needed.

### `src/demo/demoHandlers.ts`
```typescript
import { setupServer } from 'msw/native'
import { http, HttpResponse } from 'msw'
import { DEMO_INCIDENTS, DEMO_HOSPITALS, DEMO_USER_PARAMEDIC } from './demoData'

export function setupMockServer() {
  const server = setupServer(
    http.post('*/auth/login', () =>
      HttpResponse.json({ access_token: 'demo-token', user: DEMO_USER_PARAMEDIC })
    ),
    http.post('*/incidents', async ({ request }) => {
      const body = await request.json()
      const newIncident = {
        id: crypto.randomUUID(),
        incident_number: `TRK-${Date.now()}`,
        status: 'REPORTED',
        ...body,
        created_at: new Date().toISOString(),
      }
      DEMO_INCIDENTS.push(newIncident)
      return HttpResponse.json(newIncident)
    }),
    http.get('*/hospitals/recommend', () =>
      HttpResponse.json(DEMO_HOSPITALS[0])
    ),
    http.post('*/patients/:id/triage', async ({ request }) => {
      const body = await request.json()
      return HttpResponse.json({ triage_color: 'RED', protocol: 'START', ...body })
    }),
    // ... all other endpoints
  )
  server.listen({ onUnhandledRequest: 'bypass' })
}
```

### `src/demo/demoGPS.ts`
```typescript
// Simulates ambulance moving along a Kerala road corridor
const DEMO_ROUTE = [
  { latitude: 9.4981, longitude: 76.3388 },   // Alappuzha start
  { latitude: 9.5100, longitude: 76.3450 },
  { latitude: 9.5250, longitude: 76.3500 },
  { latitude: 9.5400, longitude: 76.3600 },
  { latitude: 9.5916, longitude: 76.5222 },   // Kottayam hospital end
]

export function startDemoGPSSimulation(onLocationUpdate: (coords: Coords) => void) {
  let step = 0
  return setInterval(() => {
    if (step < DEMO_ROUTE.length) {
      onLocationUpdate(DEMO_ROUTE[step++])
    }
  }, 3000)
}
```

---

## 8. API Communication Contract

The mobile app and web app talk to **exactly the same FastAPI endpoints**. This table shows the flow during a demo:

### Live Demo Flow: Mobile Action → Web Reaction

```
Mobile Action                  API Call                      Web App Reaction
─────────────────────────────────────────────────────────────────────────────
Paramedic reports accident  →  POST /incidents           →  New pin on LiveMap
                                                             Alert in IncidentPanel
                                                             Dispatcher notified

Dispatcher confirms dispatch → POST /dispatch/confirm    →  Ambulance pin turns red
(on web app)                   (from web)                    Mobile receives FCM push
                                                             GPS tracking starts

Paramedic updates status    →  PATCH /incidents/{id}/status → Timeline updates on web
to ON_SCENE                                                  Incident detail page live

Paramedic submits triage    →  POST /patients/{id}/triage →  TriageCard on web shows RED
RED patient                                                   Hospital gets pre-alert

Ambulance GPS ping          →  POST /ambulances/{id}/location → LiveMap pin moves in real time

Paramedic sets TRANSPORTING → PATCH /incidents/{id}/status  → Hospital dashboard:
                                                               IncomingAmbulanceCard appears
                                                               ETA countdown starts

Incident closed             →  PATCH /incidents/{id}/status → Golden hour compliance logged
                               status=HOSPITAL_ARRIVED         Analytics KPIs update
```

### WebSocket Frame Examples (real-time bridge)
```json
// Sent by backend → received by web LiveMap when mobile pushes GPS
{ "type": "AMBULANCE_LOCATION", "ambulance_id": "abc123", "lat": 9.52, "lon": 76.35, "status": "EN_ROUTE" }

// Sent by backend → received by both web AND mobile when status changes
{ "type": "INCIDENT_STATUS", "incident_id": "xyz", "status": "ON_SCENE" }

// Sent when mobile submits triage → hospital dashboard shows pre-arrival alert
{ "type": "PRE_ARRIVAL_ALERT", "hospital_id": "...", "triage_color": "RED", "eta_minutes": 8 }
```

---

## 9. How Mobile Demo ↔ Web App Communicate

```
┌─────────────────────────────────────────────────────────────────────┐
│  MOBILE (Expo)                     WEB (React)                      │
│                                                                      │
│  NewIncidentScreen                 LiveMap.tsx                       │
│    └─ createIncident()               └─ useWebSocket() subscribes    │
│         (from @trauma/shared)              to /ws/command            │
│         ↓ POST /incidents                                            │
│                    ↓ FastAPI incident_service.py                     │
│                         ↓ stores in PostgreSQL                       │
│                         ↓ notification_service.py broadcasts         │
│                              ↓ Redis pub/sub                         │
│                                   ↓ WebSocket /ws/command            │
│                                        ↓ { type: "NEW_INCIDENT" }    │
│                                             ↓ incidentStore.add()    │
│                                                  ↓ new pin on map ✓  │
│                                                                      │
│  VitalsScreen                      IncidentDetailPage               │
│    └─ recordVitals()                 └─ useWebSocket() /ws/incident  │
│         ↓ POST /patients/vitals           receives { type: "VITALS" }│
│                    ↓ WebSocket broadcast  ↓ VitalSignsChart updates ✓│
│                                                                      │
│  LocationForegroundService         LiveMap.tsx                       │
│    └─ pushAmbulanceLocation()        └─ ambulanceStore.updatePos()   │
│         ↓ POST /ambulances/loc            pin moves in real time ✓   │
└─────────────────────────────────────────────────────────────────────┘
```

Both apps import the **same** `@trauma/shared` functions. There is zero API contract drift.

---

## 10. Local Dev Setup (One Command)

### Prerequisites
- Node 20+, pnpm 9+, Docker, Python 3.11+, Expo CLI, EAS CLI

### `package.json` (root)
```json
{
  "scripts": {
    "dev": "turbo run dev --parallel",
    "dev:backend": "cd apps/backend && uvicorn app.main:app --reload --port 8000",
    "dev:web": "cd apps/web && vite",
    "dev:mobile": "cd apps/mobile && expo start",
    "demo:seed": "curl -X POST http://localhost:8000/api/v1/demo/seed",
    "demo:reset": "curl -X POST http://localhost:8000/api/v1/demo/reset",
    "infra:up": "docker compose up -d db redis minio",
    "build:apk": "cd apps/mobile && eas build --platform android --profile preview"
  }
}
```

### Start Everything
```bash
# 1. Clone and install
git clone https://github.com/quantumweave/trauma-platform
cd trauma-platform
pnpm install

# 2. Start infrastructure (DB, Redis, MinIO)
pnpm infra:up

# 3. Run migrations and seed demo data
cd apps/backend
alembic upgrade head
cd ../..
pnpm demo:seed

# 4. Start all services in parallel
pnpm dev
#  → FastAPI running on http://localhost:8000
#  → React web on http://localhost:5173
#  → Expo mobile on http://localhost:8081 (scan QR with Expo Go)
```

### Environment Files

`apps/mobile/.env`:
```env
EXPO_PUBLIC_API_URL=http://<YOUR_LAN_IP>:8000/api/v1
EXPO_PUBLIC_WS_URL=ws://<YOUR_LAN_IP>:8000/ws
EXPO_PUBLIC_DEMO_MODE=false
```

`apps/backend/.env`:
```env
DATABASE_URL=postgresql+asyncpg://trauma:trauma@localhost:5432/trauma_db
REDIS_URL=redis://localhost:6379/0
DEMO_MODE=true
SECRET_KEY=demo-secret-change-in-production
```

`apps/web/.env`:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/ws
```

---

## 11. Demo Presentation Flow

This is the scripted sequence for a live stakeholder demo showing both the mobile app and web dashboard simultaneously (two screens side-by-side, or mirrored).

### Act 1 — Accident Reported (2 min)
1. **Mobile**: Log in as `paramedic@demo` / `demo1234`
2. **Mobile**: Tap "Report New Incident" → GPS auto-fills Kerala coordinates
3. **Mobile**: Select "Road Accident" → severity "SEVERE" → 2 patients
4. **Mobile**: Tap Submit
5. **Web**: New red incident pin appears on live map **instantly** (WebSocket)
6. **Web**: Alert banner fires: "New SEVERE incident — 2 patients"

### Act 2 — Dispatch (2 min)
1. **Web**: Dispatcher clicks incident → Dispatch Panel opens
2. **Web**: System recommends nearest ambulance (KL-07-AMBU-003, 4.2 km away, ETA 8 min)
3. **Web**: Dispatcher confirms dispatch
4. **Mobile**: Paramedic/Driver receives push notification: "You have been dispatched — Tap to open"
5. **Mobile**: Status Stepper advances to DISPATCHED → DRIVING TO SCENE

### Act 3 — On Scene + Triage (3 min)
1. **Mobile**: Tap "Arrived at Scene" → status = ON_SCENE
2. **Mobile**: Triage wizard for Patient 1: Not breathing well → Perfusion ok → Cannot follow commands → **RED**
3. **Mobile**: Triage wizard for Patient 2: All ok → **YELLOW**
4. **Mobile**: Record vitals: GCS 8, SpO2 88%, BP 90/60
5. **Web**: Incident detail page shows RED badge for Patient 1
6. **Web → Hospital Dashboard**: Pre-arrival alert fires to General Hospital Alappuzha

### Act 4 — Transport + Hospital Readiness (2 min)
1. **Mobile**: Tap "Patient Loaded" → "Transporting to Hospital"
2. **Web (Hospital)**: IncomingAmbulanceCard shows: ETA 12 min, Patient 1 = RED, GCS 8, SpO2 88%
3. **Web**: Hospital staff updates ICU available = 4 → 3 (reserving slot)
4. **Mobile**: Ambulance GPS moves along route on web map in real time

### Act 5 — Arrival + Analytics (1 min)
1. **Mobile**: Tap "Arrived at Hospital" → incident CLOSED
2. **Web**: Golden Hour compliance: 34 minutes ✓ (under 60 min)
3. **Web → Analytics**: KPI dashboard: response time, golden hour rate, district coverage
4. **Web → Simulation**: Add hypothetical new staging station → coverage improves by 18%

---

## Summary

| Layer | Technology | Role |
|-------|-----------|------|
| `@trauma/shared` | TypeScript package | Single source of truth: types, API fns, triage logic |
| `apps/mobile` | Expo React Native | Field layer: incident reporting, triage, GPS, photos |
| `apps/web` | React + Vite | Command center: live map, dispatch, analytics, admin |
| `apps/backend` | FastAPI + PostgreSQL | Unified API serving both apps |
| Demo mode | MSW + seeded data | Run the mobile demo without real infra (offline-capable) |
| Real mode | Docker Compose stack | Full production: DB + Redis + MinIO + Celery |

The key insight is that **both apps are clients of the same API** and share the same TypeScript types and API client. There is no "mobile API" vs "web API" — there is one API, one source of truth, and one codebase that makes them both work.
