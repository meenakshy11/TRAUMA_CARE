import { useState } from "react"
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
