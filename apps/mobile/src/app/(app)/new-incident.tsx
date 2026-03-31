import { useState, useEffect } from "react"
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
