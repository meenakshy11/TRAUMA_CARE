import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native"
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
