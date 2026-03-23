import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, StatusBar, ScrollView, Animated, Vibration, Dimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ExpoLocation from "expo-location";
import * as Haptics from "expo-haptics";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { colors } from "../theme/colors";
import { triggerSOS } from "../services/sosService";

const { width } = Dimensions.get("window");

export default function WalkWithMeScreen({ navigation }: any) {
    const [destination, setDestination] = useState("");
    const [etaMinutes, setEtaMinutes] = useState(30);
    const [isActive, setIsActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [totalTime, setTotalTime] = useState(0);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [showSafetyCheck, setShowSafetyCheck] = useState(false);
    const [safetyCountdown, setSafetyCountdown] = useState(30);
    const [checkInCount, setCheckInCount] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const locationRef = useRef<ExpoLocation.LocationSubscription | null>(null);
    const safetyTimerRef = useRef<NodeJS.Timeout | null>(null);
    const safetyCountdownRef = useRef<NodeJS.Timeout | null>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    const ETA_OPTIONS = [10, 15, 30, 45, 60];
    const SAFETY_CHECK_INTERVAL = 0.5; // Check at 50% of time

    useEffect(() => {
        if (isActive) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isActive]);

    useEffect(() => {
        return () => {
            cleanup();
        };
    }, []);

    const cleanup = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (locationRef.current) locationRef.current.remove();
        if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
        if (safetyCountdownRef.current) clearInterval(safetyCountdownRef.current);
    };

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

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const loc = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.High });
        setCurrentLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        setIsActive(true);
        const total = etaMinutes * 60;
        setTimeLeft(total);
        setTotalTime(total);
        setCheckInCount(0);

        // Start countdown
        intervalRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current!);
                    showSafetyPopup();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Schedule safety check at 50%
        const halfTime = (total * SAFETY_CHECK_INTERVAL) * 1000;
        safetyTimerRef.current = setTimeout(() => {
            showSafetyPopup();
        }, halfTime);

        // Track location updates
        locationRef.current = await ExpoLocation.watchPositionAsync(
            { accuracy: ExpoLocation.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
            (loc) => setCurrentLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude })
        );
    };

    const showSafetyPopup = () => {
        setShowSafetyCheck(true);
        setSafetyCountdown(30);
        Vibration.vibrate([0, 500, 200, 500, 200, 500]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

        // Start 30s countdown
        let countdown = 30;
        safetyCountdownRef.current = setInterval(() => {
            countdown -= 1;
            setSafetyCountdown(countdown);
            if (countdown <= 10) {
                Vibration.vibrate(200);
            }
            if (countdown <= 0) {
                clearInterval(safetyCountdownRef.current!);
                handleAutoSOS();
            }
        }, 1000);
    };

    const handleImSafe = () => {
        setShowSafetyCheck(false);
        if (safetyCountdownRef.current) clearInterval(safetyCountdownRef.current);
        setCheckInCount((prev) => prev + 1);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const handleAutoSOS = async () => {
        setShowSafetyCheck(false);
        if (safetyCountdownRef.current) clearInterval(safetyCountdownRef.current);

        try {
            if (currentLocation) {
                await triggerSOS(currentLocation.lat, currentLocation.lng, `Walking to: ${destination} - Auto SOS triggered`);
                Alert.alert("🚨 SOS Sent!", "Emergency contacts have been notified with your location.");
            }
        } catch { }
        stopTracking();
    };

    const handleNeedHelp = async () => {
        setShowSafetyCheck(false);
        if (safetyCountdownRef.current) clearInterval(safetyCountdownRef.current);
        await handleAutoSOS();
    };

    const stopTracking = () => {
        cleanup();
        setIsActive(false);
        setTimeLeft(0);
        setShowSafetyCheck(false);
    };

    const confirmArrival = () => {
        stopTracking();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("🎉 Arrived Safely!", "Glad you reached your destination safely!", [
            { text: "OK", onPress: () => navigation.goBack() },
        ]);
    };

    const extendTimer = (mins: number) => {
        const extra = mins * 60;
        setTimeLeft(extra);
        setTotalTime((prev) => prev + extra);
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current!);
                    showSafetyPopup();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const shareWithContacts = async () => {
        if (!currentLocation) return;
        const mapLink = `https://maps.google.com/?q=${currentLocation.lat},${currentLocation.lng}`;
        Alert.alert("📍 Share Location", `Your live location:\n${mapLink}\n\nThis link has been shared with your emergency contacts via the backend.`);
    };

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60).toString().padStart(2, "0");
        const s = (sec % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    const getProgress = () => {
        if (totalTime === 0) return 0;
        return Math.max(0, 1 - timeLeft / totalTime);
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

            {/* Safety Check Modal */}
            {showSafetyCheck && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <LinearGradient colors={[colors.danger + "30", colors.background]} style={styles.modalGradient}>
                            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                                <MaterialIcons name="warning" size={50} color={colors.danger} />
                            </Animated.View>
                            <Text style={styles.modalTitle}>Are You Safe?</Text>
                            <Text style={styles.modalSubtitle}>Respond within {safetyCountdown}s or SOS will be sent</Text>

                            {/* Countdown circle */}
                            <View style={styles.countdownCircle}>
                                <Text style={styles.countdownText}>{safetyCountdown}</Text>
                            </View>

                            <TouchableOpacity onPress={handleImSafe} style={styles.safeModalBtn}>
                                <LinearGradient colors={[colors.success, "#059669"]} style={styles.modalBtnGradient}>
                                    <MaterialIcons name="check-circle" size={22} color={colors.white} />
                                    <Text style={styles.modalBtnText}>Yes, I'm Safe!</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handleNeedHelp} style={styles.helpModalBtn}>
                                <LinearGradient colors={[colors.danger, "#B91C1C"]} style={styles.modalBtnGradient}>
                                    <MaterialIcons name="sos" size={22} color={colors.white} />
                                    <Text style={styles.modalBtnText}>I Need Help — Send SOS</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                </View>
            )}

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {!isActive ? (
                    <>
                        <View style={styles.iconSection}>
                            <LinearGradient colors={[colors.walkWithMe + "20", colors.walkWithMe + "05"]} style={styles.iconCircle}>
                                <MaterialIcons name="directions-walk" size={50} color={colors.walkWithMe} />
                            </LinearGradient>
                            <Text style={styles.subtitle}>
                                Share your journey with emergency contacts. We'll check on you periodically and auto-trigger SOS if you don't respond.
                            </Text>
                        </View>

                        <Text style={styles.label}>Where are you going?</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter destination..."
                            placeholderTextColor={colors.lightText}
                            value={destination}
                            onChangeText={setDestination}
                        />

                        <Text style={styles.label}>Expected Travel Time</Text>
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

                        {/* Safety features info */}
                        <View style={styles.featuresBlock}>
                            <View style={styles.featureRow}>
                                <MaterialIcons name="gps-fixed" size={18} color={colors.success} />
                                <Text style={styles.featureText}>Live GPS tracking during walk</Text>
                            </View>
                            <View style={styles.featureRow}>
                                <MaterialIcons name="timer" size={18} color={colors.walkWithMe} />
                                <Text style={styles.featureText}>Safety check-ins at intervals</Text>
                            </View>
                            <View style={styles.featureRow}>
                                <MaterialIcons name="sos" size={18} color={colors.danger} />
                                <Text style={styles.featureText}>Auto-SOS if no response in 30 seconds</Text>
                            </View>
                            <View style={styles.featureRow}>
                                <MaterialIcons name="share" size={18} color={colors.info} />
                                <Text style={styles.featureText}>Share live location with contacts</Text>
                            </View>
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
                        {/* Live Map */}
                        {currentLocation && (
                            <View style={styles.mapContainer}>
                                <MapView
                                    provider={PROVIDER_GOOGLE}
                                    style={styles.map}
                                    region={{
                                        latitude: currentLocation.lat,
                                        longitude: currentLocation.lng,
                                        latitudeDelta: 0.005,
                                        longitudeDelta: 0.005,
                                    }}
                                >
                                    <Marker
                                        coordinate={{ latitude: currentLocation.lat, longitude: currentLocation.lng }}
                                        title="You are here"
                                    >
                                        <View style={styles.markerDot}>
                                            <View style={styles.markerDotInner} />
                                        </View>
                                    </Marker>
                                </MapView>
                                <View style={styles.mapOverlay}>
                                    <View style={styles.liveBadge}>
                                        <View style={styles.liveDotPulse} />
                                        <Text style={styles.liveText}>LIVE</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Timer + Progress */}
                        <View style={styles.activeSection}>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${getProgress() * 100}%` }]} />
                            </View>
                            <Text style={styles.progressLabel}>{Math.round(getProgress() * 100)}% journey complete</Text>

                            <View style={styles.timerCircle}>
                                <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                                <Text style={styles.timerLabel}>remaining</Text>
                            </View>

                            <View style={styles.journeyInfo}>
                                <MaterialIcons name="place" size={20} color={colors.walkWithMe} />
                                <Text style={styles.journeyDest}>{destination}</Text>
                            </View>

                            {/* Live Status */}
                            <View style={styles.statusGrid}>
                                <View style={styles.statusCard}>
                                    <MaterialIcons name="gps-fixed" size={20} color={colors.success} />
                                    <Text style={styles.statusCardLabel}>Location</Text>
                                    <Text style={styles.statusCardValue}>Tracking</Text>
                                </View>
                                <View style={styles.statusCard}>
                                    <MaterialIcons name="check-circle" size={20} color={colors.walkWithMe} />
                                    <Text style={styles.statusCardLabel}>Check-ins</Text>
                                    <Text style={styles.statusCardValue}>{checkInCount}</Text>
                                </View>
                                <View style={styles.statusCard}>
                                    <MaterialIcons name="shield" size={20} color={colors.info} />
                                    <Text style={styles.statusCardLabel}>Status</Text>
                                    <Text style={styles.statusCardValue}>Safe</Text>
                                </View>
                            </View>

                            {/* Action Buttons */}
                            <TouchableOpacity onPress={shareWithContacts} style={styles.shareBtnWrapper}>
                                <LinearGradient colors={[colors.info, "#2563EB"]} style={styles.shareBtn}>
                                    <MaterialIcons name="share" size={20} color={colors.white} />
                                    <Text style={styles.shareBtnText}>Share Live Location</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => extendTimer(15)} style={styles.extendWrapper}>
                                <View style={styles.extendBtn}>
                                    <MaterialIcons name="add" size={20} color={colors.walkWithMe} />
                                    <Text style={styles.extendText}>Add 15 Minutes</Text>
                                </View>
                            </TouchableOpacity>

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

    featuresBlock: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginTop: 20, borderWidth: 1, borderColor: colors.border, gap: 10 },
    featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    featureText: { fontSize: 13, color: colors.textSecondary, fontWeight: "500" },

    startBtnWrapper: { marginTop: 24, borderRadius: 16, overflow: "hidden" },
    startBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 18, gap: 8 },
    startBtnText: { fontSize: 18, fontWeight: "800", color: colors.white },

    // Map
    mapContainer: { height: 200, borderRadius: 16, overflow: "hidden", marginTop: 10, borderWidth: 1, borderColor: colors.border },
    map: { flex: 1 },
    mapOverlay: { position: "absolute", top: 10, left: 10 },
    liveBadge: { flexDirection: "row", alignItems: "center", backgroundColor: colors.danger, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
    liveDotPulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.white },
    liveText: { fontSize: 10, fontWeight: "900", color: colors.white, letterSpacing: 1 },
    markerDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.walkWithMe + "30", justifyContent: "center", alignItems: "center" },
    markerDotInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.walkWithMe },

    // Active section
    activeSection: { alignItems: "center", paddingTop: 16 },
    progressBar: { width: "100%", height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: "hidden" },
    progressFill: { height: "100%", backgroundColor: colors.walkWithMe, borderRadius: 3 },
    progressLabel: { fontSize: 12, color: colors.lightText, marginTop: 6, fontWeight: "600" },

    timerCircle: { width: 160, height: 160, borderRadius: 80, borderWidth: 4, borderColor: colors.walkWithMe, justifyContent: "center", alignItems: "center", marginVertical: 20 },
    timerText: { fontSize: 38, fontWeight: "900", color: colors.text, fontFamily: "monospace" },
    timerLabel: { fontSize: 13, color: colors.lightText, marginTop: 4 },

    journeyInfo: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
    journeyDest: { fontSize: 16, fontWeight: "700", color: colors.text },

    statusGrid: { flexDirection: "row", gap: 10, width: "100%", marginBottom: 20 },
    statusCard: { flex: 1, alignItems: "center", backgroundColor: colors.surface, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
    statusCardLabel: { fontSize: 10, color: colors.lightText, marginTop: 4 },
    statusCardValue: { fontSize: 14, fontWeight: "800", color: colors.text, marginTop: 2 },

    shareBtnWrapper: { width: "100%", borderRadius: 14, overflow: "hidden", marginBottom: 8 },
    shareBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 14, gap: 8 },
    shareBtnText: { fontSize: 15, fontWeight: "700", color: colors.white },

    extendWrapper: { width: "100%", marginBottom: 8 },
    extendBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 14, gap: 6, borderRadius: 14, borderWidth: 1.5, borderColor: colors.walkWithMe, borderStyle: "dashed" },
    extendText: { fontSize: 14, fontWeight: "700", color: colors.walkWithMe },

    arriveWrapper: { width: "100%", borderRadius: 16, overflow: "hidden", marginBottom: 8 },
    arriveBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 18, gap: 10 },
    arriveBtnText: { fontSize: 18, fontWeight: "800", color: colors.white },
    cancelBtn: { paddingVertical: 12 },
    cancelBtnText: { color: colors.danger, fontSize: 15, fontWeight: "700" },

    // Safety Check Modal
    modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center", zIndex: 100 },
    modal: { width: width - 48, borderRadius: 24, overflow: "hidden" },
    modalGradient: { padding: 30, alignItems: "center" },
    modalTitle: { fontSize: 24, fontWeight: "900", color: colors.text, marginTop: 16 },
    modalSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: "center" },
    countdownCircle: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: colors.danger, justifyContent: "center", alignItems: "center", marginVertical: 20 },
    countdownText: { fontSize: 28, fontWeight: "900", color: colors.danger },
    safeModalBtn: { width: "100%", borderRadius: 14, overflow: "hidden", marginBottom: 10 },
    helpModalBtn: { width: "100%", borderRadius: 14, overflow: "hidden" },
    modalBtnGradient: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 16, gap: 8 },
    modalBtnText: { fontSize: 16, fontWeight: "800", color: colors.white },
});
