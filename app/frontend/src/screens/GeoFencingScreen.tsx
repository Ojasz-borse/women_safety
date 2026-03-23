import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar, ScrollView, TextInput, Vibration } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ExpoLocation from "expo-location";
import * as SMS from "expo-sms";
import * as Haptics from "expo-haptics";
import { colors } from "../theme/colors";
import { triggerSOS } from "../services/sosService";
import apiClient from "../services/apiClient";

type SafeZone = {
    latitude: number;
    longitude: number;
    radius: number; // meters
    name: string;
};

export default function GeoFencingScreen({ navigation }: any) {
    const [isActive, setIsActive] = useState(false);
    const [safeZone, setSafeZone] = useState<SafeZone | null>(null);
    const [currentDistance, setCurrentDistance] = useState(0);
    const [radiusInput, setRadiusInput] = useState("200");
    const [zoneName, setZoneName] = useState("My Safe Zone");
    const [locationName, setLocationName] = useState("");
    const [alertSent, setAlertSent] = useState(false);
    const watchRef = useRef<ExpoLocation.LocationSubscription | null>(null);
    const alertSentRef = useRef(false);

    useEffect(() => {
        getCurrentLocation();
        return () => {
            stopMonitoring();
        };
    }, []);

    const getCurrentLocation = async () => {
        try {
            const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
            if (status !== "granted") return;
            const loc = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.High });
            try {
                const geo = await ExpoLocation.reverseGeocodeAsync({
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                });
                if (geo.length > 0) {
                    setLocationName(`${geo[0].street || ""}, ${geo[0].city || ""}`.trim() || "Current Location");
                }
            } catch { }
        } catch { }
    };

    const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371000; // Earth radius in meters
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const startMonitoring = async () => {
        try {
            const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission Required", "Location permission is needed for geo-fencing.");
                return;
            }

            const loc = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.High });
            const radius = parseInt(radiusInput) || 200;

            const zone: SafeZone = {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                radius,
                name: zoneName,
            };

            setSafeZone(zone);
            setIsActive(true);
            setAlertSent(false);
            alertSentRef.current = false;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Watch position every 5 seconds
            const subscription = await ExpoLocation.watchPositionAsync(
                {
                    accuracy: ExpoLocation.Accuracy.High,
                    distanceInterval: 10,
                    timeInterval: 5000,
                },
                (position) => {
                    const dist = getDistanceMeters(
                        zone.latitude,
                        zone.longitude,
                        position.coords.latitude,
                        position.coords.longitude
                    );
                    setCurrentDistance(Math.round(dist));

                    // Check if crossed boundary
                    if (dist > zone.radius && !alertSentRef.current) {
                        alertSentRef.current = true;
                        setAlertSent(true);
                        triggerGeoFenceAlert(position.coords.latitude, position.coords.longitude);
                    }
                }
            );

            watchRef.current = subscription;
        } catch (err) {
            Alert.alert("Error", "Failed to start geo-fencing.");
        }
    };

    const stopMonitoring = () => {
        if (watchRef.current) {
            watchRef.current.remove();
            watchRef.current = null;
        }
        setIsActive(false);
    };

    const triggerGeoFenceAlert = async (lat: number, lng: number) => {
        Vibration.vibrate([0, 1000, 200, 1000, 200, 1000]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        // Auto-send SMS
        try {
            let contacts: any[] = [];
            try {
                const res = await apiClient.get("/contacts");
                contacts = Array.isArray(res.data) ? res.data : res.data?.data || [];
            } catch { }

            const phones = contacts.map((c: any) => c.phone).filter(Boolean);
            const mapLink = `https://maps.google.com/?q=${lat},${lng}`;
            const message = `🚨 GEO-FENCE ALERT! I have left my safe zone "${safeZone?.name}". Current location: ${mapLink} — SafeGuard App`;

            const isAvailable = await SMS.isAvailableAsync();
            if (isAvailable && phones.length > 0) {
                await SMS.sendSMSAsync(phones, message);
            }
        } catch { }

        // Also trigger backend SOS
        try {
            await triggerSOS(lat, lng, `Left safe zone: ${safeZone?.name}`);
        } catch { }

        Alert.alert(
            "🚨 Geo-Fence Breached!",
            `You've left your safe zone "${safeZone?.name}" (${safeZone?.radius}m radius). Emergency contacts have been alerted.`,
            [
                { text: "I'm OK", onPress: () => { alertSentRef.current = false; setAlertSent(false); } },
                { text: "View SOS", onPress: () => navigation.navigate("SOSActivated", { alertId: "geofence-" + Date.now() }) },
            ]
        );
    };

    const getDistanceColor = () => {
        if (!safeZone) return colors.lightText;
        const ratio = currentDistance / safeZone.radius;
        if (ratio < 0.5) return colors.success;
        if (ratio < 0.8) return colors.warning;
        return colors.danger;
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={[colors.background, "#0D1A0F", colors.backgroundLight]} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => { stopMonitoring(); navigation.goBack(); }} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Geo-Fencing</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.subtitle}>
                    Set a safe zone around your current location. If you cross the boundary, an automatic emergency SMS is sent to your contacts.
                </Text>

                {/* Status Badge */}
                <View style={[styles.statusBadge, { backgroundColor: isActive ? (alertSent ? colors.danger : colors.success) + "15" : colors.surface }]}>
                    <View style={[styles.statusDot, { backgroundColor: isActive ? (alertSent ? colors.danger : colors.success) : colors.lightText }]} />
                    <Text style={[styles.statusText, { color: isActive ? (alertSent ? colors.danger : colors.success) : colors.lightText }]}>
                        {alertSent ? "⚠️ BOUNDARY CROSSED" : isActive ? "🛡️ MONITORING ACTIVE" : "INACTIVE"}
                    </Text>
                </View>

                {!isActive ? (
                    <>
                        {/* Setup */}
                        <Text style={styles.sectionLabel}>SAFE ZONE SETUP</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Zone Name</Text>
                            <TextInput
                                style={styles.input}
                                value={zoneName}
                                onChangeText={setZoneName}
                                placeholder="e.g. Home, Office, Friend's house"
                                placeholderTextColor={colors.lightText}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Radius (meters)</Text>
                            <View style={styles.radiusRow}>
                                {["100", "200", "500", "1000"].map((r) => (
                                    <TouchableOpacity
                                        key={r}
                                        style={[styles.radiusBtn, radiusInput === r && styles.radiusBtnActive]}
                                        onPress={() => setRadiusInput(r)}
                                    >
                                        <Text style={[styles.radiusBtnText, radiusInput === r && styles.radiusBtnTextActive]}>{r}m</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TextInput
                                style={[styles.input, { marginTop: 8 }]}
                                value={radiusInput}
                                onChangeText={setRadiusInput}
                                keyboardType="numeric"
                                placeholder="Custom radius in meters"
                                placeholderTextColor={colors.lightText}
                            />
                        </View>

                        {locationName ? (
                            <View style={styles.locationCard}>
                                <MaterialIcons name="my-location" size={18} color={colors.success} />
                                <Text style={styles.locationText}>Center: {locationName}</Text>
                            </View>
                        ) : null}

                        <TouchableOpacity onPress={startMonitoring} activeOpacity={0.8} style={styles.startBtnWrapper}>
                            <LinearGradient colors={[colors.success, "#059669"]} style={styles.startBtn}>
                                <MaterialIcons name="shield" size={24} color={colors.white} />
                                <Text style={styles.startBtnText}>Activate Geo-Fence</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        {/* Active Monitoring */}
                        <View style={styles.monitorCard}>
                            <Text style={styles.monitorTitle}>{safeZone?.name}</Text>
                            <Text style={styles.monitorSubtitle}>Radius: {safeZone?.radius}m</Text>

                            <View style={styles.distanceDisplay}>
                                <Text style={[styles.distanceValue, { color: getDistanceColor() }]}>{currentDistance}m</Text>
                                <Text style={styles.distanceLabel}>from center</Text>
                            </View>

                            {/* Progress bar */}
                            <View style={styles.progressTrack}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        {
                                            width: `${Math.min(100, (currentDistance / (safeZone?.radius || 200)) * 100)}%`,
                                            backgroundColor: getDistanceColor(),
                                        },
                                    ]}
                                />
                            </View>
                            <View style={styles.progressLabels}>
                                <Text style={styles.progressLabel}>Center</Text>
                                <Text style={[styles.progressLabel, { color: colors.danger }]}>Boundary ({safeZone?.radius}m)</Text>
                            </View>
                        </View>

                        {/* Status cards */}
                        <View style={styles.infoRow}>
                            <View style={styles.infoCard}>
                                <MaterialIcons name="gps-fixed" size={18} color={colors.success} />
                                <Text style={styles.infoValue}>Live</Text>
                                <Text style={styles.infoLabel}>Tracking</Text>
                            </View>
                            <View style={styles.infoCard}>
                                <MaterialIcons name="notifications" size={18} color={alertSent ? colors.danger : colors.info} />
                                <Text style={styles.infoValue}>{alertSent ? "Sent" : "Ready"}</Text>
                                <Text style={styles.infoLabel}>Alert</Text>
                            </View>
                            <View style={styles.infoCard}>
                                <MaterialIcons name="sms" size={18} color={alertSent ? colors.success : colors.lightText} />
                                <Text style={styles.infoValue}>{alertSent ? "Yes" : "No"}</Text>
                                <Text style={styles.infoLabel}>SMS</Text>
                            </View>
                        </View>

                        <TouchableOpacity onPress={stopMonitoring} activeOpacity={0.8} style={styles.stopBtnWrapper}>
                            <View style={styles.stopBtn}>
                                <MaterialIcons name="stop" size={22} color={colors.danger} />
                                <Text style={styles.stopBtnText}>Stop Monitoring</Text>
                            </View>
                        </TouchableOpacity>
                    </>
                )}

                {/* How it works */}
                <View style={styles.howItWorks}>
                    <MaterialIcons name="info-outline" size={16} color={colors.info} />
                    <Text style={styles.howText}>
                        When you cross the set boundary, an emergency SMS with your location is automatically sent to all your emergency contacts.
                    </Text>
                </View>

                <View style={{ height: 30 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 55, paddingBottom: 10 },
    backBtn: { padding: 8, borderRadius: 12, backgroundColor: colors.surface },
    title: { fontSize: 20, fontWeight: "800", color: colors.text },
    scroll: { flex: 1, paddingHorizontal: 20 },
    subtitle: { textAlign: "center", color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginVertical: 12 },

    statusBadge: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginBottom: 16, alignSelf: "center" },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    statusText: { fontSize: 12, fontWeight: "800", letterSpacing: 1 },

    sectionLabel: { fontSize: 11, fontWeight: "800", color: colors.lightText, letterSpacing: 1.5, marginTop: 12, marginBottom: 10 },

    inputGroup: { marginBottom: 16 },
    inputLabel: { fontSize: 13, fontWeight: "700", color: colors.text, marginBottom: 8 },
    input: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border },

    radiusRow: { flexDirection: "row", gap: 8 },
    radiusBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.surface, alignItems: "center", borderWidth: 1, borderColor: colors.border },
    radiusBtnActive: { borderColor: colors.success, backgroundColor: colors.success + "15" },
    radiusBtnText: { fontSize: 13, fontWeight: "700", color: colors.lightText },
    radiusBtnTextActive: { color: colors.success },

    locationCard: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.surface, padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
    locationText: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },

    startBtnWrapper: { borderRadius: 16, overflow: "hidden", marginTop: 8 },
    startBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 18, gap: 10 },
    startBtnText: { fontSize: 18, fontWeight: "800", color: colors.white },

    monitorCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
    monitorTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
    monitorSubtitle: { fontSize: 12, color: colors.lightText, marginTop: 4 },

    distanceDisplay: { alignItems: "center", marginVertical: 16 },
    distanceValue: { fontSize: 48, fontWeight: "900", fontFamily: "monospace" },
    distanceLabel: { fontSize: 12, color: colors.lightText, marginTop: 4 },

    progressTrack: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: "hidden" },
    progressFill: { height: "100%", borderRadius: 4 },
    progressLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
    progressLabel: { fontSize: 10, color: colors.lightText, fontWeight: "600" },

    infoRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
    infoCard: { flex: 1, alignItems: "center", backgroundColor: colors.surface, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    infoValue: { fontSize: 14, fontWeight: "800", color: colors.text, marginTop: 4 },
    infoLabel: { fontSize: 10, color: colors.lightText, marginTop: 2 },

    stopBtnWrapper: { marginTop: 4 },
    stopBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 14, gap: 6, borderRadius: 14, borderWidth: 1.5, borderColor: colors.danger },
    stopBtnText: { fontSize: 15, fontWeight: "700", color: colors.danger },

    howItWorks: { flexDirection: "row", backgroundColor: colors.surface, padding: 12, borderRadius: 12, marginTop: 16, borderWidth: 1, borderColor: colors.border, gap: 8 },
    howText: { flex: 1, fontSize: 11, color: colors.lightText, lineHeight: 16 },
});
