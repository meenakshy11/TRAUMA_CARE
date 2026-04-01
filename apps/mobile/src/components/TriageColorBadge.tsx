import { View, Text, StyleSheet } from "react-native"

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
