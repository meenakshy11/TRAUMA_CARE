import { View, Text, StyleSheet } from "react-native"

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
