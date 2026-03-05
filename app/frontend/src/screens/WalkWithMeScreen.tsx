import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, StatusBar, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ExpoLocation from "expo-location";
import { colors } from "../theme/colors";
import { triggerSOS } from "../services/sosService";

export default function WalkWithMeScreen({ navigation }: any) {
    const [destination, setDestination] = useState("");
    const [etaMinutes, setEtaMinutes] = useState(30);
    const [isActive, setIsActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const locationRef = useRef<ExpoLocation.LocationSubscription | null>(null);

    const ETA_OPTIONS = [10, 15, 30, 45, 60];

    const startTracking = async () => {
        if (!destination.trim()) {
            Alert.alert("Error", "Please enter your destination");
            return;
        }
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Error", "Location permission is required");
            return;
        }

        const loc = await ExpoLocation.getCurrentPositionAsync({});
        setCurrentLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        setIsActive(true);
        setTimeLeft(etaMinutes * 60);

        // Start countdown
        intervalRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current!);
                    handleTimeExpired();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Track location updates
        locationRef.current = await ExpoLocation.watchPositionAsync(
            { accuracy: ExpoLocation.Accuracy.High, timeInterval: 10000 },
            (loc) => setCurrentLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude })
        );
    };

    const handleTimeExpired = () => {
        Alert.alert(
            "⏰ Time's Up!",
            "You haven't confirmed arrival. Would you like to extend or trigger SOS?",
            [
                { text: "I'm Safe (+15min)", onPress: () => extendTimer(15) },
                { text: "SEND SOS", style: "destructive", onPress: handleAutoSOS },
            ]
        );
    };

    const extendTimer = (minutes: number) => {
        setTimeLeft(minutes * 60);
        intervalRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current!);
                    handleTimeExpired();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleAutoSOS = async () => {
        try {
            if (currentLocation) {
                await triggerSOS(currentLocation.lat, currentLocation.lng, `Walking to: ${destination}`);
                Alert.alert("🚨 SOS Sent!", "Emergency contacts notified.");
            }
        } catch { }
        stopTracking();
    };

    const stopTracking = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (locationRef.current) locationRef.current.remove();
        setIsActive(false);
        setTimeLeft(0);
    };

    const confirmArrival = () => {
        stopTracking();
        Alert.alert("🎉 Arrived Safely!", "Glad you reached safely!");
        navigation.goBack();
    };

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (locationRef.current) locationRef.current.remove();
        };
    }, []);

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60).toString().padStart(2, "0");
        const s = (sec % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={[colors.background, "#0F1520", colors.backgroundLight]} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => { stopTracking(); navigation.goBack(); }} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Walk With Me</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {!isActive ? (
                    <>
                        <View style={styles.iconSection}>
                            <LinearGradient colors={[colors.walkWithMe + "20", colors.walkWithMe + "05"]} style={styles.iconCircle}>
                                <MaterialIcons name="directions-walk" size={50} color={colors.walkWithMe} />
                            </LinearGradient>
                            <Text style={styles.subtitle}>Share your journey with emergency contacts. Auto-SOS if you don't arrive on time.</Text>
                        </View>

                        <Text style={styles.label}>Where are you going?</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter destination..."
                            placeholderTextColor={colors.lightText}
                            value={destination}
                            onChangeText={setDestination}
                        />

                        <Text style={styles.label}>Expected Arrival Time</Text>
                        <View style={styles.etaRow}>
                            {ETA_OPTIONS.map((mins) => (
                                <TouchableOpacity
                                    key={mins}
                                    style={[styles.etaBtn, etaMinutes === mins && styles.etaBtnActive]}
                                    onPress={() => setEtaMinutes(mins)}
                                >
                                    <Text style={[styles.etaText, etaMinutes === mins && styles.etaTextActive]}>{mins}</Text>
                                    <Text style={[styles.etaUnit, etaMinutes === mins && styles.etaTextActive]}>min</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity onPress={startTracking} activeOpacity={0.8} style={styles.startBtnWrapper}>
                            <LinearGradient colors={[colors.walkWithMe, "#2563EB"]} style={styles.startBtn}>
                                <MaterialIcons name="play-arrow" size={24} color={colors.white} />
                                <Text style={styles.startBtnText}>Start Journey</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <View style={styles.activeSection}>
                            <View style={styles.timerCircle}>
                                <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                                <Text style={styles.timerLabel}>remaining</Text>
                            </View>

                            <View style={styles.journeyInfo}>
                                <MaterialIcons name="place" size={20} color={colors.walkWithMe} />
                                <Text style={styles.journeyDest}>{destination}</Text>
                            </View>

                            <View style={styles.statusRow}>
                                <View style={styles.statusItem}>
                                    <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
                                    <Text style={styles.statusItemText}>Location Sharing</Text>
                                </View>
                                <View style={styles.statusItem}>
                                    <View style={[styles.liveDot, { backgroundColor: colors.walkWithMe }]} />
                                    <Text style={styles.statusItemText}>Contacts Notified</Text>
                                </View>
                            </View>

                            <TouchableOpacity onPress={confirmArrival} activeOpacity={0.8} style={styles.arriveWrapper}>
                                <LinearGradient colors={[colors.success, "#059669"]} style={styles.arriveBtn}>
                                    <MaterialIcons name="check-circle" size={24} color={colors.white} />
                                    <Text style={styles.arriveBtnText}>I've Arrived Safely</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={stopTracking} style={styles.cancelBtn}>
                                <Text style={styles.cancelBtnText}>Cancel Journey</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
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
    scroll: { flex: 1, paddingHorizontal: 24 },

    iconSection: { alignItems: "center", marginVertical: 24 },
    iconCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: "center", alignItems: "center", marginBottom: 16 },
    subtitle: { textAlign: "center", color: colors.textSecondary, fontSize: 14, lineHeight: 22 },

    label: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 10, marginTop: 20 },
    input: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border },

    etaRow: { flexDirection: "row", justifyContent: "space-between" },
    etaBtn: { flex: 1, marginHorizontal: 3, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.surface, alignItems: "center", borderWidth: 1, borderColor: colors.border },
    etaBtnActive: { borderColor: colors.walkWithMe, backgroundColor: colors.walkWithMe + "15" },
    etaText: { fontSize: 20, fontWeight: "800", color: colors.textSecondary },
    etaUnit: { fontSize: 10, color: colors.lightText, marginTop: 2 },
    etaTextActive: { color: colors.walkWithMe },

    startBtnWrapper: { marginTop: 30, borderRadius: 16, overflow: "hidden" },
    startBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 18, gap: 8 },
    startBtnText: { fontSize: 18, fontWeight: "800", color: colors.white },

    // Active state
    activeSection: { alignItems: "center", paddingTop: 30 },
    timerCircle: { width: 180, height: 180, borderRadius: 90, borderWidth: 4, borderColor: colors.walkWithMe, justifyContent: "center", alignItems: "center", marginBottom: 30 },
    timerText: { fontSize: 42, fontWeight: "900", color: colors.text, fontFamily: "monospace" },
    timerLabel: { fontSize: 13, color: colors.lightText, marginTop: 4 },

    journeyInfo: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 },
    journeyDest: { fontSize: 16, fontWeight: "700", color: colors.text },

    statusRow: { flexDirection: "row", gap: 20, marginBottom: 40 },
    statusItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    liveDot: { width: 8, height: 8, borderRadius: 4 },
    statusItemText: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },

    arriveWrapper: { width: "100%", borderRadius: 16, overflow: "hidden", marginBottom: 12 },
    arriveBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 18, gap: 10 },
    arriveBtnText: { fontSize: 18, fontWeight: "800", color: colors.white },
    cancelBtn: { paddingVertical: 12 },
    cancelBtnText: { color: colors.danger, fontSize: 15, fontWeight: "700" },
});
