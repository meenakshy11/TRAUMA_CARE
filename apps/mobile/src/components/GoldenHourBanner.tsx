import { View, Text, StyleSheet } from "react-native"
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
