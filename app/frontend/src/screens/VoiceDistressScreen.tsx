import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar, Animated, Vibration } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import * as ExpoLocation from "expo-location";
import { colors } from "../theme/colors";
import { triggerSOS } from "../services/sosService";

/**
 * Voice Distress Detection
 * 
 * Detection modes:
 * 1. SCREAM detection: 3 consecutive loud bursts (>threshold) → shows SOS prompt
 * 2. "HELP HELP" pattern: 2 quick loud-quiet-loud bursts within 3s → AUTO sends SOS
 * 
 * The "help help" pattern works by detecting two sharp audio spikes
 * separated by a brief quiet gap (like saying "HELP" then "HELP").
 */
export default function VoiceDistressScreen({ navigation }: any) {
    const [isListening, setIsListening] = useState(false);
    const [sensitivity, setSensitivity] = useState<"Low" | "Medium" | "High">("Medium");
    const [audioLevel, setAudioLevel] = useState(0);
    const [peakLevel, setPeakLevel] = useState(0);
    const [distressCount, setDistressCount] = useState(0);
    const [helpPattern, setHelpPattern] = useState<number[]>([]); // timestamps of "help" detections
    const [detectionLog, setDetectionLog] = useState<string[]>([]);
    const [sosSent, setSosSent] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const barAnims = useRef(Array.from({ length: 20 }, () => new Animated.Value(0.1))).current;
    const recordingRef = useRef<Audio.Recording | null>(null);
    const meteringRef = useRef<NodeJS.Timeout | null>(null);
    const helpPatternRef = useRef<number[]>([]);
    const wasQuietRef = useRef(true);
    const sosSentRef = useRef(false);

    const THRESHOLDS = { Low: -20, Medium: -30, High: -40 };
    const HELP_THRESHOLD_DB = -25; // dB threshold for "help" word detection
    const HELP_WINDOW_MS = 3000; // Must say "help" twice within 3 seconds
    const QUIET_GAP_DB = -45; // Level must drop below this between "help"s

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

    const addLog = (msg: string) => {
        setDetectionLog((prev) => [msg, ...prev.slice(0, 4)]);
    };

    const startListening = async () => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission Required", "Microphone access is needed for voice distress detection.");
                return;
            }

            await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

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
            setSosSent(false);
            sosSentRef.current = false;
            helpPatternRef.current = [];
            wasQuietRef.current = true;
            setHelpPattern([]);
            setDetectionLog([]);

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            addLog("🎙️ Monitoring started");

            // Poll metering data every 200ms for fast detection
            meteringRef.current = setInterval(async () => {
                try {
                    if (!recordingRef.current || sosSentRef.current) return;
                    const status = await recordingRef.current.getStatusAsync();
                    if (status.isRecording && status.metering !== undefined) {
                        const dbLevel = status.metering;
                        const normalizedLevel = Math.max(0, Math.min(1, (dbLevel + 60) / 60));

                        setAudioLevel(normalizedLevel);
                        setPeakLevel((prev) => Math.max(prev, normalizedLevel));

                        // Animate bars
                        barAnims.forEach((anim, i) => {
                            const spread = Math.abs(i - 10) / 10;
                            const barVal = Math.max(0.05, normalizedLevel * (1 - spread * 0.5) + Math.random() * 0.1);
                            Animated.timing(anim, { toValue: Math.min(barVal, 1), duration: 150, useNativeDriver: false }).start();
                        });

                        // ===== "HELP HELP" Pattern Detection =====
                        // Detects 2 loud bursts separated by a quiet gap within HELP_WINDOW_MS
                        if (dbLevel > HELP_THRESHOLD_DB) {
                            // Loud detected — only count if there was a quiet gap before
                            if (wasQuietRef.current) {
                                const now = Date.now();
                                helpPatternRef.current.push(now);
                                wasQuietRef.current = false;

                                // Clean up old entries outside window
                                helpPatternRef.current = helpPatternRef.current.filter((t) => now - t < HELP_WINDOW_MS);
                                setHelpPattern([...helpPatternRef.current]);

                                addLog(`🔊 Voice burst detected (#${helpPatternRef.current.length})`);

                                // 2 bursts within window = "HELP HELP" pattern
                                if (helpPatternRef.current.length >= 2) {
                                    addLog("🚨 HELP HELP detected! Sending auto-SOS...");
                                    sosSentRef.current = true;
                                    setSosSent(true);
                                    sendAutoSOS();
                                    return;
                                }
                            }
                        } else if (dbLevel < QUIET_GAP_DB) {
                            // Quiet — mark that next loud burst is a new word
                            wasQuietRef.current = true;
                        }

                        // ===== Standard Scream/Distress Detection =====
                        const threshold = THRESHOLDS[sensitivity];
                        if (dbLevel > threshold) {
                            setDistressCount((prev) => {
                                const newCount = prev + 1;
                                if (newCount >= 3) {
                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                                    addLog("⚠️ Scream detected! Showing SOS prompt...");
                                    showDistressAlert();
                                    return 0;
                                }
                                return newCount;
                            });
                        } else {
                            setDistressCount((prev) => Math.max(0, prev - 1));
                        }
                    }
                } catch { }
            }, 200);
        } catch {
            Alert.alert("Error", "Failed to start microphone. Please try again.");
        }
    };

    const stopListening = async () => {
        if (meteringRef.current) { clearInterval(meteringRef.current); meteringRef.current = null; }
        if (recordingRef.current) {
            try { await recordingRef.current.stopAndUnloadAsync(); } catch { }
            recordingRef.current = null;
        }
        setIsListening(false);
        setAudioLevel(0);
        barAnims.forEach((anim) => Animated.timing(anim, { toValue: 0.1, duration: 300, useNativeDriver: false }).start());
    };

    const showDistressAlert = () => {
        Alert.alert(
            "🚨 Distress Detected!",
            "Loud voice / scream detected. Send SOS to emergency contacts?",
            [
                { text: "False Alarm", style: "cancel" },
                { text: "SEND SOS", style: "destructive", onPress: sendAutoSOS },
            ]
        );
    };

    const sendAutoSOS = async () => {
        await stopListening();
        Vibration.vibrate([0, 500, 200, 500, 200, 500]);
        try {
            const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
            if (status === "granted") {
                const loc = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.High });
                const result = await triggerSOS(
                    loc.coords.latitude,
                    loc.coords.longitude,
                    "Voice distress detected - Auto SOS"
                );
                Alert.alert(
                    "🚨 SOS Sent!",
                    "Emergency contacts have been notified with your location via SMS.",
                    [{ text: "OK", onPress: () => navigation.navigate("SOSActivated", { alertId: result?.alertId || "voice-" + Date.now() }) }]
                );
            } else {
                // Send without location if permission denied
                const result = await triggerSOS(0, 0, "Voice distress - location unavailable");
                Alert.alert("🚨 SOS Sent!", "Emergency contacts notified. Location was unavailable.");
            }
        } catch (err) {
            Alert.alert("SOS Sent", "SOS was triggered. SMS may have been sent via your phone.");
        }
    };

    const toggleListening = () => {
        if (!isListening) {
            Alert.alert(
                "🎙️ Voice Monitor",
                'This monitors your microphone for distress.\n\n• Say "HELP HELP" → Auto-SOS instantly (no confirmation)\n• Scream/loud voice → SOS confirmation prompt\n\nStart monitoring?',
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
                        {sosSent ? "SOS SENT" : isListening ? "MONITORING" : "INACTIVE"}
                    </Text>
                </View>

                {/* Level Display */}
                {isListening && (
                    <View style={styles.levelDisplay}>
                        <Text style={styles.dbText}>{getDbText()}</Text>
                        <View style={styles.helpPatternRow}>
                            <Text style={styles.helpPatternLabel}>HELP pattern:</Text>
                            {[0, 1].map((i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.helpDot,
                                        { backgroundColor: helpPattern.length > i ? colors.danger : colors.border },
                                    ]}
                                />
                            ))}
                            <Text style={styles.helpPatternCount}>{helpPattern.length}/2</Text>
                        </View>
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

                {/* Detection Log */}
                {detectionLog.length > 0 && (
                    <View style={styles.logCard}>
                        <Text style={styles.logTitle}>Detection Log</Text>
                        {detectionLog.map((log, i) => (
                            <Text key={i} style={styles.logItem}>{log}</Text>
                        ))}
                    </View>
                )}

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
                        Say "HELP HELP" (two loud calls) → Automatic SOS sent immediately{"\n"}
                        Scream/loud noise (3x) → SOS confirmation prompt
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
    content: { flex: 1, alignItems: "center", paddingHorizontal: 24, paddingTop: 16 },

    statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 12 },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    statusText: { fontSize: 12, fontWeight: "800", letterSpacing: 1.5 },

    levelDisplay: { alignItems: "center", marginBottom: 8 },
    dbText: { fontSize: 28, fontWeight: "900", color: colors.text, fontFamily: "monospace" },
    helpPatternRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
    helpPatternLabel: { fontSize: 11, color: colors.lightText, fontWeight: "600" },
    helpDot: { width: 14, height: 14, borderRadius: 7 },
    helpPatternCount: { fontSize: 11, fontWeight: "800", color: colors.text, marginLeft: 4 },

    visualizer: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 110, gap: 3, marginBottom: 20 },
    bar: { width: 7, borderRadius: 4, minHeight: 8 },

    micButton: { width: 110, height: 110, borderRadius: 55, justifyContent: "center", alignItems: "center", shadowColor: colors.voiceDetect, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 15 },
    micLabel: { marginTop: 12, color: colors.lightText, fontSize: 14, fontWeight: "600" },

    logCard: { width: "100%", backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginTop: 12, borderWidth: 1, borderColor: colors.border },
    logTitle: { fontSize: 11, fontWeight: "800", color: colors.lightText, letterSpacing: 1, marginBottom: 6 },
    logItem: { fontSize: 11, color: colors.textSecondary, lineHeight: 18 },

    settingLabel: { fontSize: 14, fontWeight: "700", color: colors.text, marginTop: 16, marginBottom: 8 },
    sensitivityRow: { flexDirection: "row", gap: 10, width: "100%" },
    sensitivityBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.surface, alignItems: "center", borderWidth: 1, borderColor: colors.border },
    sensitivityBtnActive: { borderColor: colors.voiceDetect, backgroundColor: colors.voiceDetect + "15" },
    sensitivityText: { fontSize: 13, fontWeight: "700", color: colors.textSecondary },
    sensitivityTextActive: { color: colors.voiceDetect },
    sensitivityDb: { fontSize: 9, color: colors.lightText, marginTop: 2 },

    infoCard: { flexDirection: "row", backgroundColor: colors.surface, padding: 12, borderRadius: 12, marginTop: 14, borderWidth: 1, borderColor: colors.border },
    infoText: { flex: 1, marginLeft: 10, fontSize: 11, color: colors.textSecondary, lineHeight: 18 },
});
