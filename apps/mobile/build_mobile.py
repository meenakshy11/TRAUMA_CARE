import os

os.makedirs("/workspace/apps/mobile/src/app/(app)", exist_ok=True)
os.makedirs("/workspace/apps/mobile/src/app/(auth)", exist_ok=True)
os.makedirs("/workspace/apps/mobile/src/components", exist_ok=True)
os.makedirs("/workspace/apps/mobile/src/store", exist_ok=True)
os.makedirs("/workspace/apps/mobile/src/services", exist_ok=True)
os.makedirs("/workspace/apps/mobile/src/hooks", exist_ok=True)
os.makedirs("/workspace/apps/mobile/src/utils", exist_ok=True)
os.makedirs("/workspace/apps/mobile/src/demo", exist_ok=True)

# app.json
with open("/workspace/apps/mobile/app.json", "w") as f:
    f.write('''{
  "expo": {
    "name": "Trauma Care Kerala",
    "slug": "trauma-care-kerala",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": { "backgroundColor": "#0f2952" },
    "ios": { "supportsTablet": true },
    "android": {
      "adaptiveIcon": { "backgroundColor": "#0f2952" },
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "plugins": [
      "expo-router",
      "expo-location",
      ["expo-notifications", { "icon": "./assets/icon.png", "color": "#0f2952" }]
    ],
    "scheme": "traumacare",
    "extra": { "router": { "origin": false } }
  }
}
''')

# package.json
with open("/workspace/apps/mobile/package.json", "w") as f:
    f.write('''{
  "name": "@trauma/mobile",
  "version": "1.0.0",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~51.0.0",
    "expo-router": "~3.5.0",
    "expo-location": "~17.0.0",
    "expo-camera": "~15.0.0",
    "expo-notifications": "~0.28.0",
    "expo-secure-store": "~13.0.0",
    "expo-image-picker": "~15.0.0",
    "expo-task-manager": "~11.8.0",
    "react": "18.2.0",
    "react-native": "0.74.5",
    "react-native-gesture-handler": "~2.16.0",
    "react-native-reanimated": "~3.10.0",
    "react-native-safe-area-context": "4.10.5",
    "react-native-screens": "3.31.1",
    "zustand": "^4.5.0",
    "axios": "^1.7.0",
    "@tanstack/react-query": "^5.0.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "typescript": "~5.3.0"
  }
}
''')

# babel.config.js
with open("/workspace/apps/mobile/babel.config.js", "w") as f:
    f.write('''module.exports = function(api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: ["react-native-reanimated/plugin"],
  };
};
''')

# tsconfig.json
with open("/workspace/apps/mobile/tsconfig.json", "w") as f:
    f.write('''{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
''')

print("Config files done")

# Store - auth
with open("/workspace/apps/mobile/src/store/authStore.ts", "w") as f:
    f.write('''import { create } from "zustand"

interface AuthStore {
  user: any | null
  token: string | null
  login: (user: any, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  login: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}))
''')

# Store - incident
with open("/workspace/apps/mobile/src/store/incidentStore.ts", "w") as f:
    f.write('''import { create } from "zustand"

interface IncidentStore {
  activeIncident: any | null
  patients: any[]
  setActiveIncident: (incident: any) => void
  addPatient: (patient: any) => void
  clearIncident: () => void
}

export const useIncidentStore = create<IncidentStore>((set) => ({
  activeIncident: null,
  patients: [],
  setActiveIncident: (incident) => set({ activeIncident: incident, patients: [] }),
  addPatient: (patient) => set((s) => ({ patients: [...s.patients, patient] })),
  clearIncident: () => set({ activeIncident: null, patients: [] }),
}))
''')

print("Stores done")

# Demo data
with open("/workspace/apps/mobile/src/demo/demoData.ts", "w") as f:
    f.write('''export const DEMO_MODE = true

export const DEMO_USER = {
  id: "u-paramedic-001",
  email: "paramedic@trauma.demo",
  full_name: "Rajan Pillai",
  role: "PARAMEDIC",
  ambulance_id: "amb-001",
}

export const DEMO_HOSPITALS = [
  { id: "h-001", name: "Medical College Hospital Kottayam", district: "Kottayam", trauma_level: "LEVEL_1", latitude: 9.5916, longitude: 76.5222, icu_available: 6, eta_minutes: 12 },
  { id: "h-002", name: "SAT Hospital Thiruvananthapuram", district: "Thiruvananthapuram", trauma_level: "LEVEL_1", latitude: 8.5241, longitude: 76.9366, icu_available: 18, eta_minutes: 8 },
  { id: "h-003", name: "GMC Kozhikode", district: "Kozhikode", trauma_level: "LEVEL_1", latitude: 11.2500, longitude: 75.7800, icu_available: 2, eta_minutes: 22 },
]

export const DEMO_ACTIVE_INCIDENT = {
  id: "inc-demo-001",
  incident_number: "TRK-20240324-DEMO",
  status: "ON_SCENE",
  severity: "SEVERE",
  accident_type: "ROAD_ACCIDENT",
  latitude: 9.9312,
  longitude: 76.2673,
  address_text: "MC Road, Kottayam",
  district: "Kottayam",
  patient_count: 2,
  created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
  dispatched_ambulance_id: "amb-001",
  receiving_hospital_id: "h-001",
}

export const KERALA_GPS_ROUTE = [
  { latitude: 9.9312, longitude: 76.2673 },
  { latitude: 9.9412, longitude: 76.2773 },
  { latitude: 9.9512, longitude: 76.2873 },
  { latitude: 9.9612, longitude: 76.2973 },
  { latitude: 9.9712, longitude: 76.3073 },
]
''')

print("Demo data done")

# API service
with open("/workspace/apps/mobile/src/services/apiService.ts", "w") as f:
    f.write('''import axios from "axios"
import { DEMO_MODE, DEMO_HOSPITALS, DEMO_ACTIVE_INCIDENT } from "../demo/demoData"

const BASE_URL = "http://localhost:8000/api/v1"

const client = axios.create({ baseURL: BASE_URL, timeout: 10000 })

let authToken = ""
export const setToken = (token: string) => { authToken = token }

client.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`
  return config
})

export const api = {
  login: async (email: string, password: string) => {
    if (DEMO_MODE) {
      return { user: { id: "u-001", email, full_name: "Rajan Pillai", role: "PARAMEDIC", ambulance_id: "amb-001" }, access_token: "demo-token" }
    }
    const res = await client.post("/auth/login", { email, password })
    return res.data
  },

  createIncident: async (data: any) => {
    if (DEMO_MODE) {
      return {
        id: `inc-${Date.now()}`,
        incident_number: `TRK-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${Math.random().toString(36).slice(2,6).toUpperCase()}`,
        status: "REPORTED",
        ...data,
        created_at: new Date().toISOString(),
      }
    }
    const res = await client.post("/incidents", data)
    return res.data
  },

  updateStatus: async (incidentId: string, status: string) => {
    if (DEMO_MODE) return { id: incidentId, status }
    const res = await client.patch(`/incidents/${incidentId}/status`, { status })
    return res.data
  },

  addPatient: async (incidentId: string, data: any) => {
    if (DEMO_MODE) return { id: `pat-${Date.now()}`, incident_id: incidentId, ...data }
    const res = await client.post(`/incidents/${incidentId}/patients`, data)
    return res.data
  },

  recordVitals: async (patientId: string, data: any) => {
    if (DEMO_MODE) return { status: "recorded" }
    const res = await client.post(`/patients/${patientId}/vitals`, data)
    return res.data
  },

  recordTriage: async (patientId: string, data: any) => {
    if (DEMO_MODE) {
      const { is_breathing, respirations_ok, perfusion_ok, mental_status_ok } = data
      let color = "GREEN"
      if (!is_breathing) color = "BLACK"
      else if (!respirations_ok || !perfusion_ok || !mental_status_ok) color = "RED"
      else color = "YELLOW"
      return { triage_color: color, protocol: "START" }
    }
    const res = await client.post(`/patients/${patientId}/triage`, data)
    return res.data
  },

  getHospitals: async () => {
    if (DEMO_MODE) return DEMO_HOSPITALS
    const res = await client.get("/hospitals")
    return res.data
  },

  pushLocation: async (ambulanceId: string, lat: number, lon: number) => {
    if (DEMO_MODE) return { status: "ok" }
    await client.post(`/ambulances/${ambulanceId}/location`, { latitude: lat, longitude: lon })
  },
}
''')

print("API service done")

# GoldenHour component
with open("/workspace/apps/mobile/src/components/GoldenHourBanner.tsx", "w") as f:
    f.write('''import { View, Text, StyleSheet } from "react-native"
import { useEffect, useState } from "react"

interface Props { createdAt: string }

export function GoldenHourBanner({ createdAt }: Props) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = new Date(createdAt).getTime()
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [createdAt])

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  const color = minutes < 20 ? "#10b981" : minutes < 45 ? "#f59e0b" : minutes < 60 ? "#f97316" : "#ef4444"
  const label = minutes < 20 ? "On Track" : minutes < 45 ? "Hurry" : minutes < 60 ? "Critical Window" : "GOLDEN HOUR EXCEEDED"

  return (
    <View style={[styles.banner, { backgroundColor: color }]}>
      <Text style={styles.time}>
        ⏱ {String(minutes).padStart(2,"0")}:{String(seconds).padStart(2,"0")}
      </Text>
      <Text style={styles.label}>Golden Hour — {label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: { padding: 10, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 12 },
  time: { color: "#fff", fontWeight: "700", fontSize: 16 },
  label: { color: "#fff", fontSize: 12, fontWeight: "600" },
})
''')

# TriageColorBadge
with open("/workspace/apps/mobile/src/components/TriageColorBadge.tsx", "w") as f:
    f.write('''import { View, Text, StyleSheet } from "react-native"

const COLORS: Record<string, { bg: string; text: string; label: string }> = {
  RED: { bg: "#ef4444", text: "#fff", label: "IMMEDIATE" },
  YELLOW: { bg: "#f59e0b", text: "#fff", label: "DELAYED" },
  GREEN: { bg: "#10b981", text: "#fff", label: "MINOR" },
  BLACK: { bg: "#374151", text: "#fff", label: "EXPECTANT" },
}

export function TriageColorBadge({ color }: { color: string }) {
  const c = COLORS[color] || { bg: "#6b7280", text: "#fff", label: color }
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.text }]}>{c.label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4 },
  text: { fontWeight: "700", fontSize: 12 },
})
''')

# StatusStepper
with open("/workspace/apps/mobile/src/components/StatusStepper.tsx", "w") as f:
    f.write('''import { View, Text, StyleSheet } from "react-native"

const STEPS = ["REPORTED","DISPATCHED","ON_SCENE","TRANSPORTING","HOSPITAL_ARRIVED"]
const LABELS = ["Reported","Dispatched","On Scene","Transporting","Hospital"]

export function StatusStepper({ currentStatus }: { currentStatus: string }) {
  const currentIndex = STEPS.indexOf(currentStatus)
  return (
    <View style={styles.container}>
      {STEPS.map((step, i) => (
        <View key={step} style={styles.stepRow}>
          <View style={styles.stepLeft}>
            <View style={[styles.dot, { backgroundColor: i <= currentIndex ? "#10b981" : "#d1d5db" }]}>
              <Text style={styles.dotText}>{i + 1}</Text>
            </View>
            {i < STEPS.length - 1 && <View style={[styles.line, { backgroundColor: i < currentIndex ? "#10b981" : "#d1d5db" }]} />}
          </View>
          <Text style={[styles.label, { color: i <= currentIndex ? "#0f2952" : "#9ca3af", fontWeight: i === currentIndex ? "700" : "400" }]}>
            {LABELS[i]}{i === currentIndex ? " ←" : ""}
          </Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 4 },
  stepLeft: { alignItems: "center", marginRight: 12, width: 24 },
  dot: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  dotText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  line: { width: 2, height: 20, marginTop: 2 },
  label: { fontSize: 14, paddingTop: 3 },
})
''')

print("Components done")

# Root layout
with open("/workspace/apps/mobile/src/app/_layout.tsx", "w") as f:
    f.write('''import { Stack } from "expo-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { GestureHandlerRootView } from "react-native-gesture-handler"

const queryClient = new QueryClient()

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
''')

# Auth layout
with open("/workspace/apps/mobile/src/app/(auth)/login.tsx", "w") as f:
    f.write('''import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native"
import { router } from "expo-router"
import { useAuthStore } from "../../store/authStore"
import { api } from "../../services/apiService"

const DEMO_ACCOUNTS = [
  { email: "paramedic@trauma.demo", password: "Demo@1234", role: "Paramedic" },
  { email: "dispatcher@trauma.demo", password: "Demo@1234", role: "Dispatcher" },
]

export default function LoginScreen() {
  const [email, setEmail] = useState("paramedic@trauma.demo")
  const [password, setPassword] = useState("Demo@1234")
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)

  const handleLogin = async () => {
    setLoading(true)
    try {
      const data = await api.login(email, password)
      login(data.user, data.access_token)
      router.replace("/(app)")
    } catch {
      Alert.alert("Login Failed", "Invalid credentials")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.ambulance}>🚑</Text>
        <Text style={styles.title}>Government of Kerala</Text>
        <Text style={styles.subtitle}>Trauma Response & Emergency Management</Text>
        <View style={styles.versionBadge}><Text style={styles.versionText}>Field Operations v1.0</Text></View>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
          style={styles.input} placeholderTextColor="#9ca3af" />
        <Text style={styles.label}>Password</Text>
        <TextInput value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Signing in..." : "Sign In →"}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.demoBox}>
        <Text style={styles.demoTitle}>DEMO CREDENTIALS</Text>
        {DEMO_ACCOUNTS.map(a => (
          <TouchableOpacity key={a.role} onPress={() => { setEmail(a.email); setPassword(a.password) }}
            style={[styles.demoRow, email === a.email && styles.demoRowActive]}>
            <Text style={styles.demoRole}>{a.role}</Text>
            <Text style={styles.demoEmail}>{a.email}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#0f2952", padding: 24, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 32 },
  ambulance: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "700", color: "#ffffff", textAlign: "center" },
  subtitle: { fontSize: 13, color: "#93c5fd", marginTop: 4, textAlign: "center" },
  versionBadge: { marginTop: 8, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  versionText: { fontSize: 11, color: "#7dd3fc", fontWeight: "600" },
  form: { backgroundColor: "#ffffff", borderRadius: 12, padding: 20, marginBottom: 16 },
  label: { fontSize: 13, color: "#2d5086", fontWeight: "600", marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: "#c8d8f0", borderRadius: 8, padding: 12, fontSize: 14, color: "#0f2952", backgroundColor: "#f8faff" },
  button: { backgroundColor: "#1a3a6b", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 20 },
  buttonDisabled: { backgroundColor: "#6b87b0" },
  buttonText: { color: "#ffffff", fontWeight: "700", fontSize: 15 },
  demoBox: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 10, padding: 14 },
  demoTitle: { fontSize: 11, color: "#93c5fd", fontWeight: "700", marginBottom: 8 },
  demoRow: { flexDirection: "row", justifyContent: "space-between", padding: 8, borderRadius: 6 },
  demoRowActive: { backgroundColor: "rgba(255,255,255,0.15)" },
  demoRole: { fontSize: 13, color: "#7dd3fc", fontWeight: "600" },
  demoEmail: { fontSize: 12, color: "#93c5fd" },
})
''')

# App index - Home
with open("/workspace/apps/mobile/src/app/(app)/index.tsx", "w") as f:
    f.write('''import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native"
import { router } from "expo-router"
import { useAuthStore } from "../../store/authStore"
import { useIncidentStore } from "../../store/incidentStore"
import { GoldenHourBanner } from "../../components/GoldenHourBanner"
import { StatusStepper } from "../../components/StatusStepper"
import { api } from "../../services/apiService"
import { useState } from "react"

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const activeIncident = useIncidentStore((s) => s.activeIncident)
  const [updating, setUpdating] = useState(false)

  const updateStatus = async (newStatus: string) => {
    if (!activeIncident) return
    setUpdating(true)
    try {
      await api.updateStatus(activeIncident.id, newStatus)
      useIncidentStore.getState().setActiveIncident({ ...activeIncident, status: newStatus })
    } catch { Alert.alert("Error", "Failed to update status") }
    finally { setUpdating(false) }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>GOVT OF KERALA</Text>
          <Text style={styles.headerSub}>Trauma Response Platform</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.userName}>{user?.full_name || "Paramedic"}</Text>
          <TouchableOpacity onPress={logout}><Text style={styles.logout}>Sign out</Text></TouchableOpacity>
        </View>
      </View>

      {activeIncident && <GoldenHourBanner createdAt={activeIncident.created_at} />}

      <ScrollView style={styles.content}>
        {!activeIncident ? (
          <View style={styles.noIncident}>
            <Text style={styles.noIncidentIcon}>📍</Text>
            <Text style={styles.noIncidentTitle}>No Active Incident</Text>
            <Text style={styles.noIncidentSub}>Report a new incident to begin your response</Text>
            <TouchableOpacity style={styles.reportBtn} onPress={() => router.push("/(app)/new-incident")}>
              <Text style={styles.reportBtnText}>+ Report New Incident</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push("/(app)/profile")}>
              <Text style={styles.secondaryBtnText}>View Profile & Ambulance</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.incidentCard}>
            <View style={styles.incidentHeader}>
              <Text style={styles.incidentNumber}>{activeIncident.incident_number}</Text>
              <View style={[styles.statusBadge, { backgroundColor: activeIncident.status === "ON_SCENE" ? "#dcfce7" : "#dbeafe" }]}>
                <Text style={[styles.statusText, { color: activeIncident.status === "ON_SCENE" ? "#16a34a" : "#1d4ed8" }]}>
                  {activeIncident.status?.replace(/_/g, " ")}
                </Text>
              </View>
            </View>
            <Text style={styles.incidentDetail}>📍 {activeIncident.address_text || `${activeIncident.latitude?.toFixed(4)}, ${activeIncident.longitude?.toFixed(4)}`}</Text>
            <Text style={styles.incidentDetail}>⚠️ {activeIncident.severity} · {activeIncident.accident_type?.replace(/_/g, " ")}</Text>
            <Text style={styles.incidentDetail}>👥 {activeIncident.patient_count} patient(s)</Text>

            <Text style={styles.sectionTitle}>INCIDENT PROGRESS</Text>
            <StatusStepper currentStatus={activeIncident.status} />

            <Text style={styles.sectionTitle}>ACTIONS</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/(app)/triage")}>
                <Text style={styles.actionIcon}>🩺</Text>
                <Text style={styles.actionLabel}>Triage Patient</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/(app)/vitals")}>
                <Text style={styles.actionIcon}>❤️</Text>
                <Text style={styles.actionLabel}>Record Vitals</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/(app)/photo")}>
                <Text style={styles.actionIcon}>📷</Text>
                <Text style={styles.actionLabel}>Scene Photos</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/(app)/hospital")}>
                <Text style={styles.actionIcon}>🏥</Text>
                <Text style={styles.actionLabel}>Hospital Info</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statusButtons}>
              {activeIncident.status === "DISPATCHED" && (
                <TouchableOpacity style={[styles.statusBtn, { backgroundColor: "#1a3a6b" }]} onPress={() => updateStatus("ON_SCENE")} disabled={updating}>
                  <Text style={styles.statusBtnText}>✓ Arrived On Scene</Text>
                </TouchableOpacity>
              )}
              {activeIncident.status === "ON_SCENE" && (
                <TouchableOpacity style={[styles.statusBtn, { backgroundColor: "#059669" }]} onPress={() => updateStatus("TRANSPORTING")} disabled={updating}>
                  <Text style={styles.statusBtnText}>🚑 Start Transport</Text>
                </TouchableOpacity>
              )}
              {activeIncident.status === "TRANSPORTING" && (
                <TouchableOpacity style={[styles.statusBtn, { backgroundColor: "#7c3aed" }]} onPress={() => updateStatus("HOSPITAL_ARRIVED")} disabled={updating}>
                  <Text style={styles.statusBtnText}>🏥 Arrived at Hospital</Text>
                </TouchableOpacity>
              )}
              {activeIncident.status === "HOSPITAL_ARRIVED" && (
                <TouchableOpacity style={[styles.statusBtn, { backgroundColor: "#6b7280" }]} onPress={() => { useIncidentStore.getState().clearIncident() }} disabled={updating}>
                  <Text style={styles.statusBtnText}>✓ Close Incident</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4ff" },
  header: { backgroundColor: "#1a3a6b", padding: 16, paddingTop: 48, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  headerTitle: { fontSize: 13, fontWeight: "700", color: "#7dd3fc", letterSpacing: 1 },
  headerSub: { fontSize: 10, color: "#93c5fd", marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  userName: { fontSize: 12, color: "#ffffff", fontWeight: "600" },
  logout: { fontSize: 11, color: "#fca5a5", marginTop: 2 },
  content: { flex: 1, padding: 16 },
  noIncident: { alignItems: "center", paddingTop: 60, paddingBottom: 40 },
  noIncidentIcon: { fontSize: 64, marginBottom: 16 },
  noIncidentTitle: { fontSize: 20, fontWeight: "700", color: "#0f2952", marginBottom: 8 },
  noIncidentSub: { fontSize: 14, color: "#6b87b0", textAlign: "center", marginBottom: 32 },
  reportBtn: { backgroundColor: "#ef4444", borderRadius: 10, padding: 16, width: "100%", alignItems: "center", marginBottom: 12 },
  reportBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  secondaryBtn: { borderWidth: 1, borderColor: "#c8d8f0", borderRadius: 10, padding: 14, width: "100%", alignItems: "center" },
  secondaryBtnText: { color: "#1a3a6b", fontWeight: "600", fontSize: 14 },
  incidentCard: { backgroundColor: "#ffffff", borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  incidentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  incidentNumber: { fontSize: 15, fontWeight: "700", color: "#1a3a6b" },
  statusBadge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: "700" },
  incidentDetail: { fontSize: 13, color: "#6b87b0", marginBottom: 4 },
  sectionTitle: { fontSize: 11, fontWeight: "700", color: "#9ca3af", marginTop: 16, marginBottom: 8, letterSpacing: 1 },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actionBtn: { width: "47%", backgroundColor: "#f0f4ff", borderRadius: 8, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "#c8d8f0" },
  actionIcon: { fontSize: 24, marginBottom: 6 },
  actionLabel: { fontSize: 12, color: "#1a3a6b", fontWeight: "600", textAlign: "center" },
  statusButtons: { marginTop: 16 },
  statusBtn: { borderRadius: 10, padding: 14, alignItems: "center", marginBottom: 8 },
  statusBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
})
''')

# New Incident Screen
with open("/workspace/apps/mobile/src/app/(app)/new-incident.tsx", "w") as f:
    f.write('''import { useState, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native"
import { router } from "expo-router"
import * as Location from "expo-location"
import { useIncidentStore } from "../../store/incidentStore"
import { api } from "../../services/apiService"

const ACCIDENT_TYPES = ["ROAD_ACCIDENT","FALL","CARDIAC","BURNS","DROWNING","INDUSTRIAL","OTHER"]
const SEVERITIES = ["MINOR","MODERATE","SEVERE","CRITICAL"]
const SEV_COLORS: Record<string, string> = { MINOR: "#10b981", MODERATE: "#f59e0b", SEVERE: "#f97316", CRITICAL: "#ef4444" }

export default function NewIncidentScreen() {
  const [lat, setLat] = useState("")
  const [lon, setLon] = useState("")
  const [type, setType] = useState("ROAD_ACCIDENT")
  const [severity, setSeverity] = useState("SEVERE")
  const [patientCount, setPatientCount] = useState(1)
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [locLoading, setLocLoading] = useState(false)
  const setActiveIncident = useIncidentStore((s) => s.setActiveIncident)

  const captureLocation = async () => {
    setLocLoading(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") { Alert.alert("Permission denied"); return }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      setLat(String(loc.coords.latitude.toFixed(6)))
      setLon(String(loc.coords.longitude.toFixed(6)))
    } catch {
      setLat("9.9312"); setLon("76.2673")
      Alert.alert("Demo Mode", "Using demo location: Kottayam, Kerala")
    } finally { setLocLoading(false) }
  }

  useEffect(() => { captureLocation() }, [])

  const handleSubmit = async () => {
    if (!lat || !lon) { Alert.alert("Location required", "Please capture your location"); return }
    setLoading(true)
    try {
      const incident = await api.createIncident({
        latitude: parseFloat(lat), longitude: parseFloat(lon),
        accident_type: type, severity, patient_count: patientCount,
        description, district: "Kottayam",
      })
      setActiveIncident(incident)
      Alert.alert("Incident Created", `Incident ${incident.incident_number} has been reported to command center.`, [{ text: "OK", onPress: () => router.back() }])
    } catch { Alert.alert("Error", "Failed to create incident") }
    finally { setLoading(false) }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Report New Incident</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>GPS LOCATION</Text>
          <TouchableOpacity style={styles.locationBtn} onPress={captureLocation} disabled={locLoading}>
            <Text style={styles.locationBtnText}>{locLoading ? "📡 Getting location..." : "📍 Capture Current Location"}</Text>
          </TouchableOpacity>
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Latitude</Text>
              <TextInput value={lat} onChangeText={setLat} style={styles.input} keyboardType="numeric" />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Longitude</Text>
              <TextInput value={lon} onChangeText={setLon} style={styles.input} keyboardType="numeric" />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCIDENT TYPE</Text>
          <View style={styles.chipGrid}>
            {ACCIDENT_TYPES.map(t => (
              <TouchableOpacity key={t} onPress={() => setType(t)}
                style={[styles.chip, type === t && styles.chipActive]}>
                <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{t.replace(/_/g," ")}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SEVERITY</Text>
          <View style={styles.row}>
            {SEVERITIES.map(s => (
              <TouchableOpacity key={s} onPress={() => setSeverity(s)}
                style={[styles.sevBtn, { borderColor: SEV_COLORS[s] }, severity === s && { backgroundColor: SEV_COLORS[s] }]}>
                <Text style={[styles.sevText, { color: severity === s ? "#fff" : SEV_COLORS[s] }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PATIENT COUNT</Text>
          <View style={styles.counter}>
            <TouchableOpacity style={styles.counterBtn} onPress={() => setPatientCount(Math.max(1, patientCount-1))}>
              <Text style={styles.counterBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.counterValue}>{patientCount}</Text>
            <TouchableOpacity style={styles.counterBtn} onPress={() => setPatientCount(patientCount+1)}>
              <Text style={styles.counterBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DESCRIPTION (optional)</Text>
          <TextInput value={description} onChangeText={setDescription} multiline numberOfLines={3}
            placeholder="Describe the accident..." placeholderTextColor="#9ca3af"
            style={[styles.input, { height: 80, textAlignVertical: "top" }]} />
        </View>

        <TouchableOpacity style={[styles.submitBtn, loading && styles.submitDisabled]} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.submitText}>{loading ? "Creating Incident..." : "🚨 Create Incident & Alert Command Center"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4ff" },
  header: { backgroundColor: "#1a3a6b", padding: 16, paddingTop: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { color: "#93c5fd", fontSize: 14 },
  headerTitle: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
  content: { flex: 1, padding: 16 },
  section: { backgroundColor: "#ffffff", borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#c8d8f0" },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: "#9ca3af", marginBottom: 10, letterSpacing: 1 },
  locationBtn: { backgroundColor: "#1a3a6b", borderRadius: 8, padding: 12, alignItems: "center", marginBottom: 10 },
  locationBtnText: { color: "#ffffff", fontWeight: "600", fontSize: 14 },
  row: { flexDirection: "row", gap: 10 },
  halfInput: { flex: 1 },
  inputLabel: { fontSize: 12, color: "#6b87b0", marginBottom: 4, fontWeight: "500" },
  input: { borderWidth: 1, borderColor: "#c8d8f0", borderRadius: 8, padding: 10, fontSize: 14, color: "#0f2952", backgroundColor: "#f8faff" },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: "#c8d8f0", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  chipActive: { backgroundColor: "#1a3a6b", borderColor: "#1a3a6b" },
  chipText: { fontSize: 12, color: "#6b87b0" },
  chipTextActive: { color: "#ffffff", fontWeight: "600" },
  sevBtn: { flex: 1, borderWidth: 2, borderRadius: 8, padding: 10, alignItems: "center" },
  sevText: { fontWeight: "700", fontSize: 12 },
  counter: { flexDirection: "row", alignItems: "center", gap: 20 },
  counterBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1a3a6b", alignItems: "center", justifyContent: "center" },
  counterBtnText: { color: "#ffffff", fontSize: 20, fontWeight: "700" },
  counterValue: { fontSize: 28, fontWeight: "700", color: "#0f2952", minWidth: 40, textAlign: "center" },
  submitBtn: { backgroundColor: "#ef4444", borderRadius: 10, padding: 16, alignItems: "center", marginBottom: 32 },
  submitDisabled: { backgroundColor: "#9ca3af" },
  submitText: { color: "#ffffff", fontWeight: "700", fontSize: 15 },
})
''')

# Triage Screen
with open("/workspace/apps/mobile/src/app/(app)/triage.tsx", "w") as f:
    f.write('''import { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native"
import { router } from "expo-router"
import { useIncidentStore } from "../../store/incidentStore"
import { TriageColorBadge } from "../../components/TriageColorBadge"
import { api } from "../../services/apiService"

interface TriageStep { question: string; yes: string; no: string; field: string }

const STEPS: TriageStep[] = [
  { question: "Is the patient breathing?", yes: "Continue", no: "BLACK — Not breathing", field: "is_breathing" },
  { question: "Are respirations normal? (10–29 breaths/min)", yes: "Continue", no: "RED — Abnormal respirations", field: "respirations_ok" },
  { question: "Is perfusion adequate? (capillary refill < 2 sec or radial pulse present)", yes: "Continue", no: "RED — Poor perfusion", field: "perfusion_ok" },
  { question: "Can the patient follow simple commands?", yes: "YELLOW — Delayed", no: "RED — Altered mental status", field: "mental_status_ok" },
]

export default function TriageScreen() {
  const incident = useIncidentStore((s) => s.activeIncident)
  const addPatient = useIncidentStore((s) => s.addPatient)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  const [result, setResult] = useState<string | null>(null)
  const [patientId, setPatientId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleAnswer = async (answer: boolean) => {
    const field = STEPS[step].field
    const newAnswers = { ...answers, [field]: answer }
    setAnswers(newAnswers)

    if (field === "is_breathing" && !answer) { finalizeTriage(newAnswers, "BLACK"); return }
    if ((field === "respirations_ok" || field === "perfusion_ok" || field === "mental_status_ok") && !answer) { finalizeTriage(newAnswers, "RED"); return }
    if (step === STEPS.length - 1 && answer) { finalizeTriage(newAnswers, "YELLOW"); return }
    if (step < STEPS.length - 1) setStep(step + 1)
  }

  const finalizeTriage = async (finalAnswers: Record<string, boolean>, color: string) => {
    setLoading(true)
    try {
      if (!incident) return
      const patient = await api.addPatient(incident.id, { sequence_no: 1, gender: "UNKNOWN" })
      setPatientId(patient.id)
      await api.recordTriage(patient.id, {
        is_breathing: finalAnswers.is_breathing ?? true,
        respirations_ok: finalAnswers.respirations_ok ?? true,
        perfusion_ok: finalAnswers.perfusion_ok ?? true,
        mental_status_ok: finalAnswers.mental_status_ok ?? color !== "BLACK",
      })
      addPatient({ ...patient, triage_color: color })
      setResult(color)
    } catch { Alert.alert("Error", "Failed to record triage") }
    finally { setLoading(false) }
  }

  if (result) return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Triage Result</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>START Protocol Complete</Text>
        <TriageColorBadge color={result} />
        <Text style={styles.resultDesc}>
          {result === "RED" ? "Immediate intervention required. Transport immediately." :
           result === "YELLOW" ? "Delayed — monitor and reassess when resources allow." :
           result === "GREEN" ? "Minor injuries. Can walk." :
           "Expectant — not breathing. Prioritize other patients."}
        </Text>
        <TouchableOpacity style={styles.nextBtn} onPress={() => router.push("/(app)/vitals")}>
          <Text style={styles.nextBtnText}>Record Vitals →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.back()}>
          <Text style={styles.backHomeBtnText}>Back to Incident</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const currentStep = STEPS[step]
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>START Triage</Text>
        <Text style={styles.stepCounter}>{step + 1}/{STEPS.length}</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((step) / STEPS.length) * 100}%` }]} />
      </View>
      <View style={styles.stepContainer}>
        <Text style={styles.protocol}>START PROTOCOL — STEP {step + 1}</Text>
        <Text style={styles.question}>{currentStep.question}</Text>
        <TouchableOpacity style={styles.yesBtn} onPress={() => handleAnswer(true)} disabled={loading}>
          <Text style={styles.yesBtnText}>✓ YES — {currentStep.yes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.noBtn} onPress={() => handleAnswer(false)} disabled={loading}>
          <Text style={styles.noBtnText}>✗ NO — {currentStep.no}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4ff" },
  header: { backgroundColor: "#1a3a6b", padding: 16, paddingTop: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { color: "#93c5fd", fontSize: 14 },
  headerTitle: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
  stepCounter: { color: "#93c5fd", fontSize: 13 },
  progressBar: { height: 4, backgroundColor: "#e8eef8" },
  progressFill: { height: 4, backgroundColor: "#10b981" },
  stepContainer: { flex: 1, padding: 24, justifyContent: "center" },
  protocol: { fontSize: 11, fontWeight: "700", color: "#9ca3af", marginBottom: 16, letterSpacing: 1 },
  question: { fontSize: 22, fontWeight: "700", color: "#0f2952", marginBottom: 40, lineHeight: 30 },
  yesBtn: { backgroundColor: "#10b981", borderRadius: 12, padding: 18, alignItems: "center", marginBottom: 12 },
  yesBtnText: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
  noBtn: { backgroundColor: "#ef4444", borderRadius: 12, padding: 18, alignItems: "center" },
  noBtnText: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
  resultContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  resultTitle: { fontSize: 18, fontWeight: "700", color: "#0f2952", marginBottom: 20 },
  resultDesc: { fontSize: 15, color: "#6b87b0", textAlign: "center", marginTop: 20, marginBottom: 32, lineHeight: 22 },
  nextBtn: { backgroundColor: "#1a3a6b", borderRadius: 10, padding: 14, width: "100%", alignItems: "center", marginBottom: 10 },
  nextBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  backHomeBtn: { borderWidth: 1, borderColor: "#c8d8f0", borderRadius: 10, padding: 14, width: "100%", alignItems: "center" },
  backHomeBtnText: { color: "#1a3a6b", fontWeight: "600", fontSize: 14 },
})
''')

# Vitals Screen
with open("/workspace/apps/mobile/src/app/(app)/vitals.tsx", "w") as f:
    f.write('''import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native"
import { router } from "expo-router"
import { useIncidentStore } from "../../store/incidentStore"
import { api } from "../../services/apiService"

const VITALS = [
  { key: "gcs_score", label: "GCS Score", unit: "3–15", placeholder: "e.g. 13", numeric: true },
  { key: "spo2", label: "SpO2", unit: "%", placeholder: "e.g. 95", numeric: true },
  { key: "pulse_rate", label: "Pulse Rate", unit: "bpm", placeholder: "e.g. 88", numeric: true },
  { key: "systolic_bp", label: "BP Systolic", unit: "mmHg", placeholder: "e.g. 120", numeric: true },
  { key: "diastolic_bp", label: "BP Diastolic", unit: "mmHg", placeholder: "e.g. 80", numeric: true },
  { key: "respiratory_rate", label: "Respiratory Rate", unit: "/min", placeholder: "e.g. 16", numeric: true },
]

export default function VitalsScreen() {
  const patients = useIncidentStore((s) => s.patients)
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const patient = patients[0]

  const handleSave = async () => {
    if (!patient) { Alert.alert("No patient", "Please complete triage first"); return }
    setLoading(true)
    try {
      await api.recordVitals(patient.id, {
        gcs_score: values.gcs_score ? parseInt(values.gcs_score) : null,
        spo2: values.spo2 ? parseFloat(values.spo2) : null,
        pulse_rate: values.pulse_rate ? parseInt(values.pulse_rate) : null,
        systolic_bp: values.systolic_bp ? parseInt(values.systolic_bp) : null,
        diastolic_bp: values.diastolic_bp ? parseInt(values.diastolic_bp) : null,
        respiratory_rate: values.respiratory_rate ? parseInt(values.respiratory_rate) : null,
      })
      Alert.alert("Vitals Recorded", "Vitals have been transmitted to the hospital.", [{ text: "OK", onPress: () => router.back() }])
    } catch { Alert.alert("Error", "Failed to record vitals") }
    finally { setLoading(false) }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Record Vitals</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.patientCard}>
          <Text style={styles.patientLabel}>PATIENT</Text>
          <Text style={styles.patientName}>{patient ? `Patient 1 · ${patient.triage_color || "Not triaged"}` : "No patient — complete triage first"}</Text>
        </View>
        {VITALS.map(v => (
          <View key={v.key} style={styles.vitalRow}>
            <View style={styles.vitalLabel}>
              <Text style={styles.vitalName}>{v.label}</Text>
              <Text style={styles.vitalUnit}>{v.unit}</Text>
            </View>
            <TextInput
              value={values[v.key] || ""}
              onChangeText={text => setValues(prev => ({ ...prev, [v.key]: text }))}
              placeholder={v.placeholder}
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              style={styles.vitalInput}
            />
          </View>
        ))}
        <TouchableOpacity style={[styles.saveBtn, loading && styles.saveBtnDisabled]} onPress={handleSave} disabled={loading}>
          <Text style={styles.saveBtnText}>{loading ? "Transmitting..." : "📡 Transmit Vitals to Hospital"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4ff" },
  header: { backgroundColor: "#1a3a6b", padding: 16, paddingTop: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { color: "#93c5fd", fontSize: 14 },
  headerTitle: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
  content: { flex: 1, padding: 16 },
  patientCard: { backgroundColor: "#dbeafe", borderRadius: 10, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: "#bfdbfe" },
  patientLabel: { fontSize: 10, fontWeight: "700", color: "#1d4ed8", marginBottom: 4, letterSpacing: 1 },
  patientName: { fontSize: 15, fontWeight: "700", color: "#1e40af" },
  vitalRow: { backgroundColor: "#ffffff", borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "#c8d8f0" },
  vitalLabel: { flex: 1 },
  vitalName: { fontSize: 14, fontWeight: "600", color: "#0f2952" },
  vitalUnit: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  vitalInput: { width: 100, borderWidth: 1, borderColor: "#c8d8f0", borderRadius: 8, padding: 10, fontSize: 16, color: "#0f2952", textAlign: "center", backgroundColor: "#f8faff", fontWeight: "700" },
  saveBtn: { backgroundColor: "#1a3a6b", borderRadius: 10, padding: 16, alignItems: "center", marginBottom: 32 },
  saveBtnDisabled: { backgroundColor: "#9ca3af" },
  saveBtnText: { color: "#ffffff", fontWeight: "700", fontSize: 15 },
})
''')

# Hospital info screen
with open("/workspace/apps/mobile/src/app/(app)/hospital.tsx", "w") as f:
    f.write('''import { useEffect, useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native"
import { router } from "expo-router"
import { api } from "../../services/apiService"
import { useIncidentStore } from "../../store/incidentStore"

export default function HospitalScreen() {
  const [hospitals, setHospitals] = useState<any[]>([])
  const incident = useIncidentStore((s) => s.activeIncident)

  useEffect(() => { api.getHospitals().then(setHospitals) }, [])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Receiving Hospital</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView style={styles.content}>
        <Text style={styles.sectionLabel}>RECOMMENDED HOSPITALS</Text>
        {hospitals.map((h, i) => (
          <View key={h.id} style={[styles.hospitalCard, i === 0 && styles.hospitalCardPrimary]}>
            {i === 0 && <View style={styles.recommendedBadge}><Text style={styles.recommendedText}>RECOMMENDED</Text></View>}
            <Text style={styles.hospitalName}>{h.name}</Text>
            <Text style={styles.hospitalDistrict}>{h.district} · {h.trauma_level?.replace("_"," ")}</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{h.icu_available}</Text>
                <Text style={styles.statLabel}>ICU Beds</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{h.eta_minutes} min</Text>
                <Text style={styles.statLabel}>ETA</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4ff" },
  header: { backgroundColor: "#1a3a6b", padding: 16, paddingTop: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { color: "#93c5fd", fontSize: 14 },
  headerTitle: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
  content: { flex: 1, padding: 16 },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: "#9ca3af", marginBottom: 12, letterSpacing: 1 },
  hospitalCard: { backgroundColor: "#ffffff", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#c8d8f0" },
  hospitalCardPrimary: { borderColor: "#1a3a6b", borderWidth: 2 },
  recommendedBadge: { backgroundColor: "#1a3a6b", borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start", marginBottom: 8 },
  recommendedText: { color: "#ffffff", fontSize: 10, fontWeight: "700" },
  hospitalName: { fontSize: 15, fontWeight: "700", color: "#0f2952", marginBottom: 4 },
  hospitalDistrict: { fontSize: 13, color: "#6b87b0", marginBottom: 12 },
  statsRow: { flexDirection: "row", gap: 20 },
  stat: { alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "700", color: "#1a3a6b" },
  statLabel: { fontSize: 11, color: "#9ca3af" },
})
''')

# Photo screen
with open("/workspace/apps/mobile/src/app/(app)/photo.tsx", "w") as f:
    f.write('''import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native"
import { router } from "expo-router"
import * as ImagePicker from "expo-image-picker"

export default function PhotoScreen() {
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== "granted") { Alert.alert("Permission denied"); return }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 })
    if (!result.canceled) {
      Alert.alert("Photo Captured", "Scene photo has been attached to the incident record.", [{ text: "OK" }])
    }
  }

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 })
    if (!result.canceled) {
      Alert.alert("Photo Added", "Photo has been attached to the incident record.", [{ text: "OK" }])
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Scene Photos</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={styles.content}>
        <Text style={styles.desc}>Capture photos of the accident scene to attach to the incident report. Photos are transmitted to the command center.</Text>
        <TouchableOpacity style={styles.cameraBtn} onPress={takePhoto}>
          <Text style={styles.cameraIcon}>📷</Text>
          <Text style={styles.cameraBtnText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.galleryBtn} onPress={pickPhoto}>
          <Text style={styles.galleryBtnText}>Choose from Gallery</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4ff" },
  header: { backgroundColor: "#1a3a6b", padding: 16, paddingTop: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { color: "#93c5fd", fontSize: 14 },
  headerTitle: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
  content: { flex: 1, padding: 24, justifyContent: "center", alignItems: "center" },
  desc: { fontSize: 14, color: "#6b87b0", textAlign: "center", marginBottom: 40, lineHeight: 22 },
  cameraBtn: { backgroundColor: "#1a3a6b", borderRadius: 12, padding: 24, alignItems: "center", width: "100%", marginBottom: 12 },
  cameraIcon: { fontSize: 40, marginBottom: 8 },
  cameraBtnText: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
  galleryBtn: { borderWidth: 1, borderColor: "#c8d8f0", borderRadius: 12, padding: 16, alignItems: "center", width: "100%", backgroundColor: "#ffffff" },
  galleryBtnText: { color: "#1a3a6b", fontWeight: "600", fontSize: 14 },
})
''')

# Profile screen
with open("/workspace/apps/mobile/src/app/(app)/profile.tsx", "w") as f:
    f.write('''import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { router } from "expo-router"
import { useAuthStore } from "../../store/authStore"

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.full_name?.charAt(0) || "P"}</Text>
        </View>
        <Text style={styles.name}>{user?.full_name || "Paramedic"}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}><Text style={styles.roleText}>{user?.role}</Text></View>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ambulance ID</Text>
            <Text style={styles.infoValue}>{user?.ambulance_id || "KL-08-001"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={[styles.infoValue, { color: "#10b981" }]}>Active</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform</Text>
            <Text style={styles.infoValue}>Trauma Care Kerala v1.0</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => { logout(); router.replace("/(auth)/login") }}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4ff" },
  header: { backgroundColor: "#1a3a6b", padding: 16, paddingTop: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { color: "#93c5fd", fontSize: 14 },
  headerTitle: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
  content: { flex: 1, padding: 24, alignItems: "center" },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#1a3a6b", alignItems: "center", justifyContent: "center", marginTop: 20, marginBottom: 12 },
  avatarText: { fontSize: 32, color: "#ffffff", fontWeight: "700" },
  name: { fontSize: 22, fontWeight: "700", color: "#0f2952", marginBottom: 4 },
  email: { fontSize: 14, color: "#6b87b0", marginBottom: 10 },
  roleBadge: { backgroundColor: "#dbeafe", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 24 },
  roleText: { fontSize: 12, color: "#1d4ed8", fontWeight: "700" },
  infoCard: { backgroundColor: "#ffffff", borderRadius: 12, padding: 16, width: "100%", borderWidth: 1, borderColor: "#c8d8f0", marginBottom: 24 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#e8eef8" },
  infoLabel: { fontSize: 13, color: "#6b87b0" },
  infoValue: { fontSize: 13, color: "#0f2952", fontWeight: "600" },
  logoutBtn: { backgroundColor: "#fef2f2", borderRadius: 10, padding: 14, width: "100%", alignItems: "center", borderWidth: 1, borderColor: "#fecaca" },
  logoutText: { color: "#dc2626", fontWeight: "700", fontSize: 15 },
})
''')

# App layout
with open("/workspace/apps/mobile/src/app/(app)/_layout.tsx", "w") as f:
    f.write('''import { Stack } from "expo-router"
import { useAuthStore } from "../../store/authStore"
import { Redirect } from "expo-router"

export default function AppLayout() {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Redirect href="/(auth)/login" />
  return <Stack screenOptions={{ headerShown: false }} />
}
''')

# Auth layout
with open("/workspace/apps/mobile/src/app/(auth)/_layout.tsx", "w") as f:
    f.write('''import { Stack } from "expo-router"

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
''')

print("\n✅ All mobile app files created successfully!")
print("\nTo run the mobile app:")
print("1. Install Expo Go on your Android phone")
print("2. Run: cd apps/mobile && npx expo start")
print("3. Scan the QR code with Expo Go")