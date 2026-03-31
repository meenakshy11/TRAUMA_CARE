import { useEffect, useState } from "react"
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
