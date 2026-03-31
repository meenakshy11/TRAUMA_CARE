import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
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
