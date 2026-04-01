import { useState } from "react"
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
