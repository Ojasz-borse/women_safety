import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar, Animated, Vibration } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ExpoLocation from "expo-location";
import * as Haptics from "expo-haptics";
import { colors } from "../theme/colors";
import { updateSOSLocation, resolveSOS, cancelSOS } from "../services/sosService";

export default function SOSActivatedScreen({ navigation, route }: any) {
    const { alertId } = route.params || {};
    const [elapsed, setElapsed] = useState(0);
    const [lastAddress, setLastAddress] = useState("Tracking...");
    const pulseAnim = useRef(new Animated.Value(1)).current;
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

        // Vibration
        Vibration.vibrate([0, 500, 200, 500]);

        // Start location tracking
        startLocationTracking();

        // Elapsed timer
        timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);

        return () => {
            if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const startLocationTracking = async () => {
        try {
            const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
            if (status !== "granted") return;

            // Update location every 10 seconds
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

                    if (alertId) {
                        await updateSOSLocation(alertId, location.coords.latitude, location.coords.longitude, address);
                    }
                } catch { }
            }, 10000);
        } catch { }
    };

    const formatElapsed = (sec: number) => {
        const m = Math.floor(sec / 60).toString().padStart(2, "0");
        const s = (sec % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    const handleSafe = () => {
        Alert.alert("Mark Safe?", "Confirm that you are safe. This will stop the SOS alert.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "I'm Safe",
                onPress: async () => {
                    try {
                        if (alertId) await resolveSOS(alertId, "Marked safe by user");
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        Alert.alert("✅ Marked Safe", "Glad you're safe!");
                        navigation.navigate("HomeDashboard");
                    } catch {
                        Alert.alert("Error", "Failed to resolve SOS");
                    }
                },
            },
        ]);
    };

    const handleCancel = () => {
        Alert.alert("Cancel SOS?", "Are you sure? Your emergency contacts will stop receiving updates.", [
            { text: "No", style: "cancel" },
            {
                text: "Yes, Cancel",
                style: "destructive",
                onPress: async () => {
                    try {
                        if (alertId) await cancelSOS(alertId);
                        navigation.navigate("HomeDashboard");
                    } catch {
                        Alert.alert("Error", "Failed to cancel SOS");
                    }
                },
            },
        ]);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={["#1A0505", colors.background, "#0D0B1A"]} style={StyleSheet.absoluteFill} />

            <View style={styles.content}>
                {/* Alert Header */}
                <Animated.View style={[styles.alertCircle, { transform: [{ scale: pulseAnim }] }]}>
                    <LinearGradient colors={[colors.danger, "#B91C1C"]} style={styles.alertGradient}>
                        <MaterialIcons name="sos" size={50} color={colors.white} />
                    </LinearGradient>
                </Animated.View>

                <Text style={styles.alertTitle}>🚨 SOS Alert Active</Text>
                <Text style={styles.alertSubtitle}>Your emergency contacts have been notified and can track your location</Text>

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
                    <View style={styles.statusCard}>
                        <MaterialIcons name="sms" size={20} color={colors.info} />
                        <Text style={styles.statusValue}>Sent</Text>
                        <Text style={styles.statusLabel}>SMS</Text>
                    </View>
                </View>

                {/* Location */}
                <View style={styles.locationCard}>
                    <MaterialIcons name="location-on" size={20} color={colors.danger} />
                    <Text style={styles.locationText}>{lastAddress}</Text>
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

                {/* Help text */}
                <View style={styles.helpCard}>
                    <MaterialIcons name="info-outline" size={16} color={colors.info} />
                    <Text style={styles.helpText}>Your location is being shared every 10 seconds. Emergency services have been notified via SMS.</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },

    alertCircle: { marginBottom: 20 },
    alertGradient: { width: 100, height: 100, borderRadius: 50, justifyContent: "center", alignItems: "center", shadowColor: colors.danger, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 15 },

    alertTitle: { fontSize: 28, fontWeight: "900", color: colors.text, textAlign: "center" },
    alertSubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 22, paddingHorizontal: 20 },

    statusRow: { flexDirection: "row", gap: 10, marginTop: 24, width: "100%" },
    statusCard: { flex: 1, alignItems: "center", backgroundColor: colors.surface, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
    statusValue: { fontSize: 16, fontWeight: "900", color: colors.text, marginTop: 6 },
    statusLabel: { fontSize: 10, color: colors.lightText, marginTop: 2 },

    locationCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, padding: 14, borderRadius: 14, marginTop: 16, width: "100%", borderWidth: 1, borderColor: colors.border, gap: 10 },
    locationText: { flex: 1, fontSize: 13, color: colors.textSecondary, fontWeight: "600" },

    safeBtnWrapper: { width: "100%", borderRadius: 16, overflow: "hidden", marginTop: 24 },
    actionBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 18, gap: 10 },
    actionBtnText: { fontSize: 18, fontWeight: "800", color: colors.white },

    cancelBtnWrapper: { width: "100%", marginTop: 10 },
    cancelBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 14, gap: 6, borderRadius: 14, borderWidth: 1.5, borderColor: colors.danger },
    cancelBtnText: { fontSize: 15, fontWeight: "700", color: colors.danger },

    helpCard: { flexDirection: "row", backgroundColor: colors.surface, padding: 12, borderRadius: 12, marginTop: 20, borderWidth: 1, borderColor: colors.border, gap: 8 },
    helpText: { flex: 1, fontSize: 11, color: colors.lightText, lineHeight: 16 },
});
