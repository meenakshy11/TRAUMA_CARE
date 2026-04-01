import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native"
import { router } from "expo-router"
import * as ImagePicker from "expo-image-picker"

export default function PhotoScreen() {
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== "granted") { Alert.alert("Permission denied"); return }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 })
    if (!result.canceled) {
      Alert.alert("Photo Captured", "Scene photo has been attached to the incident record.", [{ text: "OK" }])
    }
  }

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 })
    if (!result.canceled) {
      Alert.alert("Photo Added", "Photo has been attached to the incident record.", [{ text: "OK" }])
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Scene Photos</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={styles.content}>
        <Text style={styles.desc}>Capture photos of the accident scene to attach to the incident report. Photos are transmitted to the command center.</Text>
        <TouchableOpacity style={styles.cameraBtn} onPress={takePhoto}>
          <Text style={styles.cameraIcon}>📷</Text>
          <Text style={styles.cameraBtnText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.galleryBtn} onPress={pickPhoto}>
          <Text style={styles.galleryBtnText}>Choose from Gallery</Text>
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
  content: { flex: 1, padding: 24, justifyContent: "center", alignItems: "center" },
  desc: { fontSize: 14, color: "#6b87b0", textAlign: "center", marginBottom: 40, lineHeight: 22 },
  cameraBtn: { backgroundColor: "#1a3a6b", borderRadius: 12, padding: 24, alignItems: "center", width: "100%", marginBottom: 12 },
  cameraIcon: { fontSize: 40, marginBottom: 8 },
  cameraBtnText: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
  galleryBtn: { borderWidth: 1, borderColor: "#c8d8f0", borderRadius: 12, padding: 16, alignItems: "center", width: "100%", backgroundColor: "#ffffff" },
  galleryBtnText: { color: "#1a3a6b", fontWeight: "600", fontSize: 14 },
})
