import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar, Animated, Vibration } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ExpoLocation from "expo-location";
import * as SMS from "expo-sms";
import * as Haptics from "expo-haptics";
import { colors } from "../theme/colors";
import { updateSOSLocation, resolveSOS, cancelSOS } from "../services/sosService";
import SirenPlayer from "../services/SirenPlayer";
import apiClient from "../services/apiClient";

export default function SOSActivatedScreen({ navigation, route }: any) {
    const { alertId } = route.params || {};
    const [elapsed, setElapsed] = useState(0);
    const [lastAddress, setLastAddress] = useState("Tracking...");
    const [sirenActive, setSirenActive] = useState(true);
    const [smsSent, setSmsSent] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const flashAnim = useRef(new Animated.Value(0)).current;
    const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        ).start();

        // Red flash animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(flashAnim, { toValue: 0.3, duration: 500, useNativeDriver: false }),
                Animated.timing(flashAnim, { toValue: 0, duration: 500, useNativeDriver: false }),
            ])
        ).start();

        // Start siren + vibration
        SirenPlayer.play();
        Vibration.vibrate([0, 800, 200, 800, 200, 800], true); // Repeating pattern

        // Auto-send SMS to emergency contacts
        autoSendSMS();

        // Start location tracking
        startLocationTracking();

        // Elapsed timer
        timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);

        return () => {
            SirenPlayer.stop();
            Vibration.cancel();
            if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const autoSendSMS = async () => {
        try {
            // Get emergency contacts
            let contacts: any[] = [];
            try {
                const res = await apiClient.get("/contacts");
                contacts = Array.isArray(res.data) ? res.data : res.data?.data || [];
            } catch { }

            if (contacts.length === 0) return;

            // Get current location for SMS
            let locationText = "Location unavailable";
            let mapLink = "";
            try {
                const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
                if (status === "granted") {
                    const loc = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.High });
                    mapLink = `https://maps.google.com/?q=${loc.coords.latitude},${loc.coords.longitude}`;
                    locationText = mapLink;
                }
            } catch { }

            const phones = contacts.map((c: any) => c.phone).filter(Boolean);
            const message = `🚨 EMERGENCY SOS! I need immediate help! My location: ${locationText} — Sent from SafeGuard App`;

            // Use expo-sms for auto-compose
            const isAvailable = await SMS.isAvailableAsync();
            if (isAvailable && phones.length > 0) {
                await SMS.sendSMSAsync(phones, message);
                setSmsSent(true);
            }
        } catch (err) {
            console.log("Auto SMS error:", err);
        }
    };

    const startLocationTracking = async () => {
        try {
            const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
            if (status !== "granted") return;

            locationIntervalRef.current = setInterval(async () => {
                try {
                    const location = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.High });
                    let address = "Live Location";
                    try {
                        const geo = await ExpoLocation.reverseGeocodeAsync({
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                        });
                        if (geo.length > 0) {
                            address = `${geo[0].street || ""}, ${geo[0].city || ""}`.trim() || "Live Location";
                        }
                    } catch { }

                    setLastAddress(address);

                    if (alertId && !alertId.startsWith("local-") && !alertId.startsWith("offline-")) {
                        await updateSOSLocation(alertId, location.coords.latitude, location.coords.longitude, address);
                    }
                } catch { }
            }, 10000);
        } catch { }
    };

    const toggleSiren = () => {
        if (sirenActive) {
            SirenPlayer.stop();
            Vibration.cancel();
            setSirenActive(false);
        } else {
            SirenPlayer.play();
            Vibration.vibrate([0, 800, 200, 800, 200, 800], true);
            setSirenActive(true);
        }
    };

    const formatElapsed = (sec: number) => {
        const m = Math.floor(sec / 60).toString().padStart(2, "0");
        const s = (sec % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    const handleSafe = () => {
        Alert.alert("Mark Safe?", "Confirm that you are safe. This will stop the SOS alert and siren.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "I'm Safe",
                onPress: async () => {
                    SirenPlayer.stop();
                    Vibration.cancel();
                    try {
                        if (alertId && !alertId.startsWith("local-") && !alertId.startsWith("offline-")) {
                            await resolveSOS(alertId, "Marked safe by user");
                        }
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        Alert.alert("✅ Marked Safe", "Glad you're safe!");
                        navigation.navigate("HomeDashboard");
                    } catch {
                        navigation.navigate("HomeDashboard");
                    }
                },
            },
        ]);
    };

    const handleCancel = () => {
        Alert.alert("Cancel SOS?", "Your emergency contacts will stop receiving updates.", [
            { text: "No", style: "cancel" },
            {
                text: "Yes, Cancel",
                style: "destructive",
                onPress: async () => {
                    SirenPlayer.stop();
                    Vibration.cancel();
                    try {
                        if (alertId && !alertId.startsWith("local-") && !alertId.startsWith("offline-")) {
                            await cancelSOS(alertId);
                        }
                    } catch { }
                    navigation.navigate("HomeDashboard");
                },
            },
        ]);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Red flash overlay */}
            <Animated.View
                style={[StyleSheet.absoluteFill, { backgroundColor: "#EF4444", opacity: flashAnim, zIndex: 0 }]}
            />

            <LinearGradient colors={["#1A0505", colors.background, "#0D0B1A"]} style={[StyleSheet.absoluteFill, { zIndex: 0 }]} />

            <View style={styles.content}>
                {/* Alert Header */}
                <Animated.View style={[styles.alertCircle, { transform: [{ scale: pulseAnim }] }]}>
                    <LinearGradient colors={[colors.danger, "#B91C1C"]} style={styles.alertGradient}>
                        <MaterialIcons name="sos" size={50} color={colors.white} />
                    </LinearGradient>
                </Animated.View>

                <Text style={styles.alertTitle}>🚨 SOS Alert Active</Text>
                <Text style={styles.alertSubtitle}>Emergency contacts notified. Siren is active.</Text>

                {/* Status Cards */}
                <View style={styles.statusRow}>
                    <View style={styles.statusCard}>
                        <MaterialIcons name="timer" size={20} color={colors.danger} />
                        <Text style={styles.statusValue}>{formatElapsed(elapsed)}</Text>
                        <Text style={styles.statusLabel}>Active</Text>
                    </View>
                    <View style={styles.statusCard}>
                        <MaterialIcons name="gps-fixed" size={20} color={colors.success} />
                        <Text style={styles.statusValue}>LIVE</Text>
                        <Text style={styles.statusLabel}>Tracking</Text>
                    </View>
                    <TouchableOpacity onPress={toggleSiren} style={styles.statusCard}>
                        <MaterialIcons name={sirenActive ? "volume-up" : "volume-off"} size={20} color={sirenActive ? colors.danger : colors.lightText} />
                        <Text style={[styles.statusValue, { color: sirenActive ? colors.danger : colors.lightText }]}>{sirenActive ? "ON" : "OFF"}</Text>
                        <Text style={styles.statusLabel}>Siren</Text>
                    </TouchableOpacity>
                </View>

                {/* Location */}
                <View style={styles.locationCard}>
                    <MaterialIcons name="location-on" size={20} color={colors.danger} />
                    <Text style={styles.locationText}>{lastAddress}</Text>
                </View>

                {/* SMS Status */}
                <View style={[styles.locationCard, { borderColor: smsSent ? colors.success : colors.border }]}>
                    <MaterialIcons name="sms" size={20} color={smsSent ? colors.success : colors.warning} />
                    <Text style={styles.locationText}>{smsSent ? "Emergency SMS sent ✅" : "Sending SMS to contacts..."}</Text>
                </View>

                {/* Actions */}
                <TouchableOpacity onPress={handleSafe} activeOpacity={0.8} style={styles.safeBtnWrapper}>
                    <LinearGradient colors={[colors.success, "#059669"]} style={styles.actionBtn}>
                        <MaterialIcons name="check-circle" size={24} color={colors.white} />
                        <Text style={styles.actionBtnText}>I'm Safe Now</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleCancel} style={styles.cancelBtnWrapper}>
                    <View style={styles.cancelBtn}>
                        <MaterialIcons name="close" size={20} color={colors.danger} />
                        <Text style={styles.cancelBtnText}>Cancel SOS</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24, zIndex: 1 },

    alertCircle: { marginBottom: 20 },
    alertGradient: { width: 100, height: 100, borderRadius: 50, justifyContent: "center", alignItems: "center", shadowColor: colors.danger, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 15 },

    alertTitle: { fontSize: 28, fontWeight: "900", color: colors.text, textAlign: "center" },
    alertSubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: "center", marginTop: 6, lineHeight: 22 },

    statusRow: { flexDirection: "row", gap: 10, marginTop: 20, width: "100%" },
    statusCard: { flex: 1, alignItems: "center", backgroundColor: colors.surface, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
    statusValue: { fontSize: 16, fontWeight: "900", color: colors.text, marginTop: 6 },
    statusLabel: { fontSize: 10, color: colors.lightText, marginTop: 2 },

    locationCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, padding: 14, borderRadius: 14, marginTop: 10, width: "100%", borderWidth: 1, borderColor: colors.border, gap: 10 },
    locationText: { flex: 1, fontSize: 13, color: colors.textSecondary, fontWeight: "600" },

    safeBtnWrapper: { width: "100%", borderRadius: 16, overflow: "hidden", marginTop: 20 },
    actionBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 18, gap: 10 },
    actionBtnText: { fontSize: 18, fontWeight: "800", color: colors.white },

    cancelBtnWrapper: { width: "100%", marginTop: 10 },
    cancelBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 14, gap: 6, borderRadius: 14, borderWidth: 1.5, borderColor: colors.danger },
    cancelBtnText: { fontSize: 15, fontWeight: "700", color: colors.danger },
});
