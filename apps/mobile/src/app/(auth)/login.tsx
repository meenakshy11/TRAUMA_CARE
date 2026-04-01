import { useState } from "react"
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
