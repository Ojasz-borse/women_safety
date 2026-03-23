import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar, Modal, Vibration } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import * as ExpoLocation from "expo-location";
import { colors } from "../theme/colors";
import { startTimer, stopTimer } from "../services/timerService";
import { triggerSOS } from "../services/sosService";

export default function SafetyTimerScreen({ navigation }: any) {
  const [duration, setDuration] = useState(30);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSafetyCheck, setShowSafetyCheck] = useState(false);
  const [checkCountdown, setCheckCountdown] = useState(30);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoSOSRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      if (autoSOSRef.current) clearTimeout(autoSOSRef.current);
    };
  }, []);

  const startTimerHandler = async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        Alert.alert("Error", "Please login first");
        navigation.replace("Login");
        return;
      }
      const response = await startTimer(duration);
      if (response.success) {
        setIsActive(true);
        setTimeLeft(duration * 60);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        intervalRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(intervalRef.current!);
              showSafetyPopup();
              return 0;
            }
            // Show periodic check-in at 50% and 25% time
            if (prev === Math.floor(duration * 60 * 0.5) || prev === Math.floor(duration * 60 * 0.25)) {
              showSafetyPopup();
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to start timer");
    } finally {
      setLoading(false);
    }
  };

  const showSafetyPopup = () => {
    Vibration.vibrate([500, 500, 500, 500, 500]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setShowSafetyCheck(true);
    setCheckCountdown(30);

    // 30-second countdown for response
    checkIntervalRef.current = setInterval(() => {
      setCheckCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(checkIntervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-SOS after 30 seconds if no response
    autoSOSRef.current = setTimeout(() => {
      setShowSafetyCheck(false);
      clearInterval(checkIntervalRef.current!);
      handleAutoSOS();
    }, 30000);
  };

  const handleImSafe = async () => {
    setShowSafetyCheck(false);
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    if (autoSOSRef.current) clearTimeout(autoSOSRef.current);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // If timer was fully expired, restart or stop
    if (timeLeft <= 0) {
      setIsActive(false);
      try { await stopTimer(); } catch { }
      Alert.alert("✅ Marked Safe!", "You've confirmed you're safe. Timer stopped.");
    }
    // Otherwise, just continue the existing timer
  };

  const handleAutoSOS = async () => {
    setIsActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.High });
        let address = "Safety timer expired - no response";
        try {
          const geo = await ExpoLocation.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          if (geo.length > 0) address = `${geo[0].street || ""}, ${geo[0].city || ""}`.trim() || address;
        } catch { }
        await triggerSOS(loc.coords.latitude, loc.coords.longitude, address);
      }
    } catch { }
    Alert.alert("🚨 Auto-SOS Triggered!", "You did not respond to the safety check. Emergency contacts have been notified.");
  };

  const stopTimerHandler = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false);
    setTimeLeft(0);
    try { await stopTimer(); } catch { }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const durations = [15, 30, 60, 120];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[colors.background, "#1A0D22", colors.backgroundLight]} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Safety Timer</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {!isActive ? (
          <>
            <View style={styles.iconSection}>
              <LinearGradient colors={[colors.safetyTimer + "20", colors.safetyTimer + "05"]} style={styles.iconCircle}>
                <MaterialIcons name="timer" size={50} color={colors.safetyTimer} />
              </LinearGradient>
              <Text style={styles.subtitle}>Set a timer. If you don't respond to the safety check, SOS is auto-triggered.</Text>
            </View>

            <Text style={styles.label}>Duration (minutes)</Text>
            <View style={styles.durationRow}>
              {durations.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.durationBtn, duration === d && styles.durationBtnActive]}
                  onPress={() => setDuration(d)}
                >
                  <Text style={[styles.durationText, duration === d && styles.durationTextActive]}>{d}</Text>
                  <Text style={[styles.durationUnit, duration === d && styles.durationTextActive]}>min</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={startTimerHandler} disabled={loading} activeOpacity={0.8} style={styles.startWrapper}>
              <LinearGradient colors={[colors.safetyTimer, "#BE185D"]} style={styles.startBtn}>
                <MaterialIcons name="play-arrow" size={24} color={colors.white} />
                <Text style={styles.startBtnText}>{loading ? "Starting..." : "Start Timer"}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.infoCard}>
              <MaterialIcons name="security" size={18} color={colors.info} />
              <Text style={styles.infoText}>
                You'll receive safety check popups during and at the end of the timer. If you don't respond within 30 seconds, SOS is automatically sent.
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.timerCircle}>
              <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
              <Text style={styles.timerLabel}>remaining</Text>
            </View>

            <View style={styles.activeInfo}>
              <View style={styles.activeRow}>
                <View style={[styles.activeDot, { backgroundColor: colors.success }]} />
                <Text style={styles.activeText}>Timer Active</Text>
              </View>
              <View style={styles.activeRow}>
                <View style={[styles.activeDot, { backgroundColor: colors.safetyTimer }]} />
                <Text style={styles.activeText}>Auto-SOS Enabled</Text>
              </View>
            </View>

            <TouchableOpacity onPress={() => showSafetyPopup()} activeOpacity={0.8} style={styles.checkWrapper}>
              <LinearGradient colors={[colors.success, "#059669"]} style={styles.checkBtn}>
                <MaterialIcons name="check-circle" size={22} color={colors.white} />
                <Text style={styles.checkBtnText}>I'm Safe</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={stopTimerHandler} style={styles.stopBtn}>
              <Text style={styles.stopBtnText}>Stop Timer</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Safety Check Modal */}
      <Modal visible={showSafetyCheck} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <MaterialIcons name="warning" size={50} color={colors.warning} />
            </View>
            <Text style={styles.modalTitle}>Are You Safe?</Text>
            <Text style={styles.modalSubtext}>
              If you don't respond in <Text style={{ color: colors.danger, fontWeight: "900" }}>{checkCountdown}s</Text>, SOS will be sent automatically.
            </Text>

            <TouchableOpacity onPress={handleImSafe} activeOpacity={0.8} style={styles.safeWrapper}>
              <LinearGradient colors={[colors.success, "#059669"]} style={styles.safeBtn}>
                <MaterialIcons name="check" size={28} color={colors.white} />
                <Text style={styles.safeBtnText}>Yes, I'm Safe!</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setShowSafetyCheck(false); if (autoSOSRef.current) clearTimeout(autoSOSRef.current); if (checkIntervalRef.current) clearInterval(checkIntervalRef.current); handleAutoSOS(); }} style={styles.notSafeBtn}>
              <Text style={styles.notSafeBtnText}>I Need Help - Send SOS Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 55, paddingBottom: 10 },
  backBtn: { padding: 8, borderRadius: 12, backgroundColor: colors.surface },
  title: { fontSize: 20, fontWeight: "800", color: colors.text },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },

  iconSection: { alignItems: "center", marginBottom: 30 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  subtitle: { textAlign: "center", color: colors.textSecondary, fontSize: 14, lineHeight: 22 },

  label: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 12 },
  durationRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  durationBtn: { flex: 1, marginHorizontal: 4, paddingVertical: 16, borderRadius: 14, backgroundColor: colors.surface, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  durationBtnActive: { borderColor: colors.safetyTimer, backgroundColor: colors.safetyTimer + "15" },
  durationText: { fontSize: 22, fontWeight: "900", color: colors.textSecondary },
  durationUnit: { fontSize: 10, color: colors.lightText, marginTop: 2 },
  durationTextActive: { color: colors.safetyTimer },

  startWrapper: { borderRadius: 16, overflow: "hidden", marginBottom: 20 },
  startBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 18, gap: 10 },
  startBtnText: { fontSize: 18, fontWeight: "800", color: colors.white },

  infoCard: { flexDirection: "row", backgroundColor: colors.surface, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  infoText: { flex: 1, marginLeft: 10, fontSize: 12, color: colors.textSecondary, lineHeight: 18 },

  // Active Timer
  timerCircle: { width: 200, height: 200, borderRadius: 100, borderWidth: 4, borderColor: colors.safetyTimer, justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 30 },
  timerText: { fontSize: 48, fontWeight: "900", color: colors.text, fontFamily: "monospace" },
  timerLabel: { fontSize: 13, color: colors.lightText, marginTop: 4 },

  activeInfo: { alignItems: "center", gap: 8, marginBottom: 30 },
  activeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
  activeText: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },

  checkWrapper: { borderRadius: 16, overflow: "hidden", marginBottom: 12 },
  checkBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 18, gap: 10 },
  checkBtnText: { fontSize: 18, fontWeight: "800", color: colors.white },
  stopBtn: { alignItems: "center", paddingVertical: 14 },
  stopBtnText: { color: colors.danger, fontSize: 15, fontWeight: "700" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "85%", backgroundColor: colors.surface, borderRadius: 24, padding: 30, alignItems: "center", borderWidth: 2, borderColor: colors.warning },
  modalIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.warning + "15", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 24, fontWeight: "900", color: colors.text, marginBottom: 10 },
  modalSubtext: { fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 22, marginBottom: 24 },
  safeWrapper: { borderRadius: 16, overflow: "hidden", width: "100%", marginBottom: 12 },
  safeBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 16, gap: 10 },
  safeBtnText: { fontSize: 18, fontWeight: "800", color: colors.white },
  notSafeBtn: { paddingVertical: 12 },
  notSafeBtnText: { color: colors.danger, fontSize: 14, fontWeight: "700" },
});
