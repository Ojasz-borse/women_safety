import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar, Animated } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import * as ExpoLocation from "expo-location";
import { colors } from "../theme/colors";
import { triggerSOS } from "../services/sosService";

export default function VoiceDistressScreen({ navigation }: any) {
    const [isListening, setIsListening] = useState(false);
    const [sensitivity, setSensitivity] = useState<"Low" | "Medium" | "High">("Medium");
    const [audioLevel, setAudioLevel] = useState(0);
    const [peakLevel, setPeakLevel] = useState(0);
    const [distressCount, setDistressCount] = useState(0);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const barAnims = useRef(Array.from({ length: 20 }, () => new Animated.Value(0.1))).current;
    const recordingRef = useRef<Audio.Recording | null>(null);
    const meteringRef = useRef<NodeJS.Timeout | null>(null);

    const THRESHOLDS = { Low: -20, Medium: -30, High: -40 }; // dB levels

    useEffect(() => {
        if (isListening) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isListening]);

    useEffect(() => {
        return () => { stopListening(); };
    }, []);

    const startListening = async () => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission Required", "Microphone access is needed for voice distress detection.");
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const recording = new Audio.Recording();
            await recording.prepareToRecordAsync({
                ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
                isMeteringEnabled: true,
            });
            await recording.startAsync();
            recordingRef.current = recording;
            setIsListening(true);
            setDistressCount(0);
            setPeakLevel(0);

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            // Poll metering data
            meteringRef.current = setInterval(async () => {
                try {
                    if (!recordingRef.current) return;
                    const status = await recordingRef.current.getStatusAsync();
                    if (status.isRecording && status.metering !== undefined) {
                        const dbLevel = status.metering; // Typically -160 to 0 dB
                        const normalizedLevel = Math.max(0, Math.min(1, (dbLevel + 60) / 60)); // Normalize -60..0 to 0..1

                        setAudioLevel(normalizedLevel);
                        setPeakLevel((prev) => Math.max(prev, normalizedLevel));

                        // Animate bars
                        barAnims.forEach((anim, i) => {
                            const spread = Math.abs(i - 10) / 10;
                            const barVal = Math.max(0.05, normalizedLevel * (1 - spread * 0.5) + Math.random() * 0.1);
                            Animated.timing(anim, { toValue: Math.min(barVal, 1), duration: 150, useNativeDriver: false }).start();
                        });

                        // Check for distress
                        const threshold = THRESHOLDS[sensitivity];
                        if (dbLevel > threshold) {
                            setDistressCount((prev) => {
                                const newCount = prev + 1;
                                if (newCount >= 3) {
                                    // 3 consecutive loud detections
                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                                    showDistressAlert();
                                    return 0;
                                }
                                return newCount;
                            });
                        } else {
                            // Reset count if below threshold
                            setDistressCount((prev) => Math.max(0, prev - 1));
                        }
                    }
                } catch { }
            }, 300);

        } catch (err) {
            Alert.alert("Error", "Failed to start microphone. Please try again.");
        }
    };

    const stopListening = async () => {
        if (meteringRef.current) { clearInterval(meteringRef.current); meteringRef.current = null; }
        if (recordingRef.current) {
            try {
                await recordingRef.current.stopAndUnloadAsync();
            } catch { }
            recordingRef.current = null;
        }
        setIsListening(false);
        setAudioLevel(0);
        barAnims.forEach((anim) => Animated.timing(anim, { toValue: 0.1, duration: 300, useNativeDriver: false }).start());
    };

    const showDistressAlert = () => {
        Alert.alert(
            "🚨 Distress Detected!",
            "Loud voice / scream detected. Would you like to send SOS?",
            [
                { text: "False Alarm", style: "cancel" },
                { text: "SEND SOS", style: "destructive", onPress: sendAutoSOS },
            ]
        );
    };

    const sendAutoSOS = async () => {
        await stopListening();
        try {
            const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
            if (status === "granted") {
                const loc = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.High });
                await triggerSOS(loc.coords.latitude, loc.coords.longitude, "Voice distress detected - auto SOS");
                Alert.alert("🚨 SOS Sent!", "Emergency contacts have been notified.");
            }
        } catch {
            Alert.alert("Error", "Failed to send SOS");
        }
    };

    const toggleListening = () => {
        if (!isListening) {
            Alert.alert(
                "🎙️ Voice Monitor",
                "This will use your microphone to detect screams or loud distress sounds. Auto-SOS will trigger on detection.\n\nStart monitoring?",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Start", onPress: startListening },
                ]
            );
        } else {
            stopListening();
        }
    };

    const getDbText = () => {
        if (!isListening) return "—";
        const db = Math.round(audioLevel * 80 - 20);
        return `${db} dB`;
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={[colors.background, "#1A0D22", colors.backgroundLight]} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => { stopListening(); navigation.goBack(); }} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Voice Distress</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                {/* Status */}
                <View style={[styles.statusBadge, { backgroundColor: isListening ? colors.danger + "20" : colors.surface }]}>
                    <View style={[styles.statusDot, { backgroundColor: isListening ? colors.danger : colors.lightText }]} />
                    <Text style={[styles.statusText, { color: isListening ? colors.danger : colors.lightText }]}>
                        {isListening ? "MONITORING" : "INACTIVE"}
                    </Text>
                </View>

                {/* Level Display */}
                {isListening && (
                    <View style={styles.levelDisplay}>
                        <Text style={styles.dbText}>{getDbText()}</Text>
                        <Text style={styles.peakText}>Peak: {Math.round(peakLevel * 80 - 20)} dB</Text>
                    </View>
                )}

                {/* Audio Visualizer */}
                <View style={styles.visualizer}>
                    {barAnims.map((anim, i) => (
                        <Animated.View
                            key={i}
                            style={[
                                styles.bar,
                                {
                                    height: anim.interpolate({ inputRange: [0, 1], outputRange: [8, 100] }),
                                    backgroundColor: anim.interpolate({
                                        inputRange: [0, 0.3, 0.6, 1],
                                        outputRange: [colors.border, colors.voiceDetect, colors.warning, colors.danger],
                                    }),
                                },
                            ]}
                        />
                    ))}
                </View>

                {/* Mic Button */}
                <Animated.View style={{ transform: [{ scale: isListening ? pulseAnim : 1 }] }}>
                    <TouchableOpacity onPress={toggleListening} activeOpacity={0.8}>
                        <LinearGradient
                            colors={isListening ? [colors.danger, "#B91C1C"] : [colors.voiceDetect, "#BE185D"]}
                            style={styles.micButton}
                        >
                            <MaterialIcons name={isListening ? "mic" : "mic-none"} size={50} color={colors.white} />
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
                <Text style={styles.micLabel}>{isListening ? "Tap to stop" : "Tap to start monitoring"}</Text>

                {/* Sensitivity */}
                <Text style={styles.settingLabel}>Detection Sensitivity</Text>
                <View style={styles.sensitivityRow}>
                    {(["Low", "Medium", "High"] as const).map((level) => (
                        <TouchableOpacity
                            key={level}
                            style={[styles.sensitivityBtn, sensitivity === level && styles.sensitivityBtnActive]}
                            onPress={() => setSensitivity(level)}
                        >
                            <Text style={[styles.sensitivityText, sensitivity === level && styles.sensitivityTextActive]}>{level}</Text>
                            <Text style={styles.sensitivityDb}>
                                {level === "Low" ? ">-20dB" : level === "Medium" ? ">-30dB" : ">-40dB"}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Info */}
                <View style={styles.infoCard}>
                    <MaterialIcons name="info-outline" size={18} color={colors.info} />
                    <Text style={styles.infoText}>
                        Uses your microphone to detect screams or loud distress sounds. When 3 consecutive loud detections occur, SOS confirmation is triggered.
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 55, paddingBottom: 10 },
    backBtn: { padding: 8, borderRadius: 12, backgroundColor: colors.surface },
    title: { fontSize: 20, fontWeight: "800", color: colors.text },
    content: { flex: 1, alignItems: "center", paddingHorizontal: 24, paddingTop: 20 },

    statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 16 },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    statusText: { fontSize: 12, fontWeight: "800", letterSpacing: 1.5 },

    levelDisplay: { alignItems: "center", marginBottom: 10 },
    dbText: { fontSize: 28, fontWeight: "900", color: colors.text, fontFamily: "monospace" },
    peakText: { fontSize: 12, color: colors.lightText, marginTop: 2 },

    visualizer: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 120, gap: 3, marginBottom: 24 },
    bar: { width: 7, borderRadius: 4, minHeight: 8 },

    micButton: { width: 120, height: 120, borderRadius: 60, justifyContent: "center", alignItems: "center", shadowColor: colors.voiceDetect, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 15 },
    micLabel: { marginTop: 16, color: colors.lightText, fontSize: 14, fontWeight: "600" },

    settingLabel: { fontSize: 14, fontWeight: "700", color: colors.text, marginTop: 24, marginBottom: 10 },
    sensitivityRow: { flexDirection: "row", gap: 10 },
    sensitivityBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.surface, alignItems: "center", borderWidth: 1, borderColor: colors.border },
    sensitivityBtnActive: { borderColor: colors.voiceDetect, backgroundColor: colors.voiceDetect + "15" },
    sensitivityText: { fontSize: 14, fontWeight: "700", color: colors.textSecondary },
    sensitivityTextActive: { color: colors.voiceDetect },
    sensitivityDb: { fontSize: 9, color: colors.lightText, marginTop: 2 },

    infoCard: { flexDirection: "row", backgroundColor: colors.surface, padding: 14, borderRadius: 12, marginTop: 20, borderWidth: 1, borderColor: colors.border },
    infoText: { flex: 1, marginLeft: 10, fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
});
