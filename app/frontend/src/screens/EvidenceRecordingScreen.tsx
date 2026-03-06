import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar, ScrollView, Animated } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import { colors } from "../theme/colors";
import { uploadEvidence as apiUploadEvidence, getEvidenceList as apiGetEvidenceList, deleteEvidence as apiDeleteEvidence } from "../services/evidenceService";

type EvidenceItem = {
    id: string;
    _id?: string; // Backend ID
    type: string;
    duration: number;
    date: string;
    uri: string;
    uploading?: boolean;
    uploaded?: boolean;
};

// Lazy getter — only evaluates when called, never at module load
const getStorageDir = (): string => {
    const FS = FileSystem as any;
    const base = FS.documentDirectory || FS.cacheDirectory || "";
    return base + "evidence/";
};

export default function EvidenceRecordingScreen({ navigation }: any) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingType, setRecordingType] = useState<"audio" | "video">("audio");
    const [duration, setDuration] = useState(0);
    const [recordings, setRecordings] = useState<EvidenceItem[]>([]);
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [storageReady, setStorageReady] = useState(false);
    const recordingRef = useRef<Audio.Recording | null>(null);
    const soundRef = useRef<Audio.Sound | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const storageDirRef = useRef("");

    useEffect(() => {
        initStorage();
        loadEvidenceFromBackend();
        return () => {
            if (soundRef.current) soundRef.current.unloadAsync();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const loadEvidenceFromBackend = async () => {
        try {
            const response = await apiGetEvidenceList();
            if (response.success && response.data && response.data.length > 0) {
                console.log("Loaded evidence from backend:", response.data.length);
                // Backend evidence is already in state format, no need to merge
            }
        } catch (error: any) {
            console.log("Failed to load evidence from backend:", error.message || error);
        }
    };

    useEffect(() => {
        if (isRecording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isRecording]);

    const initStorage = async () => {
        try {
            const dir = getStorageDir();
            storageDirRef.current = dir;
            console.log("Evidence storage dir:", dir);

            const dirInfo = await FileSystem.getInfoAsync(dir);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
                console.log("Created evidence directory");
            }

            // Load saved metadata
            const metaPath = dir + "evidence_meta.json";
            const metaInfo = await FileSystem.getInfoAsync(metaPath);
            if (metaInfo.exists) {
                const raw = await FileSystem.readAsStringAsync(metaPath);
                const saved: EvidenceItem[] = JSON.parse(raw);

                // Verify each file still exists
                const verified: EvidenceItem[] = [];
                for (const rec of saved) {
                    try {
                        const fInfo = await FileSystem.getInfoAsync(rec.uri);
                        if (fInfo.exists) {
                            verified.push(rec);
                        } else {
                            console.log("Evidence file missing:", rec.uri);
                        }
                    } catch {
                        console.log("Error checking file:", rec.uri);
                    }
                }
                setRecordings(verified);
                console.log(`Loaded ${verified.length} evidence recordings`);

                // Save cleaned list if we removed any
                if (verified.length !== saved.length) {
                    await saveMetadata(verified, dir);
                }
            }
            setStorageReady(true);
        } catch (err) {
            console.log("Evidence init error:", err);
            setStorageReady(true);
        }
    };

    const saveMetadata = async (recs: EvidenceItem[], dir?: string) => {
        const d = dir || storageDirRef.current;
        try {
            const path = d + "evidence_meta.json";
            await FileSystem.writeAsStringAsync(path, JSON.stringify(recs));
            console.log("Saved evidence metadata:", recs.length, "items");
        } catch (err) {
            console.log("Save metadata error:", err);
        }
    };

    const startRecording = async () => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission Required", "Microphone permission is needed to record evidence.");
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const recording = new Audio.Recording();
            await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            await recording.startAsync();

            recordingRef.current = recording;
            setIsRecording(true);
            setDuration(0);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

            timerRef.current = setInterval(() => setDuration((prev) => prev + 1), 1000);
        } catch (err) {
            console.log("Start recording error:", err);
            Alert.alert("Error", "Failed to start recording. Make sure microphone is available.");
        }
    };

    const stopRecording = async () => {
        if (!recordingRef.current) return;

        try {
            await recordingRef.current.stopAndUnloadAsync();
            const tempUri = recordingRef.current.getURI();
            if (timerRef.current) clearInterval(timerRef.current);

            if (tempUri) {
                const dir = storageDirRef.current;

                // Ensure directory exists
                const dirInfo = await FileSystem.getInfoAsync(dir);
                if (!dirInfo.exists) {
                    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
                }

                // Copy to permanent storage
                const fileName = `evidence_${Date.now()}.m4a`;
                const permanentUri = dir + fileName;
                await FileSystem.copyAsync({ from: tempUri, to: permanentUri });

                // Verify the copy worked
                const copyInfo = await FileSystem.getInfoAsync(permanentUri);
                if (!copyInfo.exists) {
                    Alert.alert("Error", "Failed to save recording file.");
                    recordingRef.current = null;
                    setIsRecording(false);
                    return;
                }

                console.log("Evidence saved to:", permanentUri, "size:", (copyInfo as any).size);

                const newRec: EvidenceItem = {
                    id: Date.now().toString(),
                    type: recordingType,
                    duration,
                    date: new Date().toLocaleString(),
                    uri: permanentUri,
                    uploading: true,
                    uploaded: false,
                };

                const updated = [newRec, ...recordings];
                setRecordings(updated);
                await saveMetadata(updated);

                // Upload to backend
                try {
                    console.log("Starting upload to backend...");
                    const uploadResult = await apiUploadEvidence(
                        permanentUri,
                        recordingType,
                        duration
                    );
                    console.log("Upload successful:", uploadResult);

                    // Update recording with backend ID
                    const updatedRec = {
                        ...newRec,
                        _id: uploadResult.data._id,
                        uploading: false,
                        uploaded: true,
                    };

                    const finalUpdated = recordings.map((r) =>
                        r.id === newRec.id ? updatedRec : r
                    );
                    setRecordings(finalUpdated);
                    await saveMetadata(finalUpdated);

                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    Alert.alert(
                        "✅ Evidence Saved & Uploaded!",
                        `Recording saved locally and uploaded to server (${formatTime(duration)}).`
                    );
                } catch (uploadError: any) {
                    console.log("Upload failed, but local save succeeded:", uploadError);
                    // Mark as not uploaded but keep local copy
                    const updatedRec = {
                        ...newRec,
                        uploading: false,
                        uploaded: false,
                    };
                    const finalUpdated = recordings.map((r) =>
                        r.id === newRec.id ? updatedRec : r
                    );
                    setRecordings(finalUpdated);
                    await saveMetadata(finalUpdated);

                    Alert.alert(
                        "⚠️ Saved Locally",
                        "Recording saved on device but upload failed. Will retry later."
                    );
                }
            }

            recordingRef.current = null;
            setIsRecording(false);
        } catch (err) {
            console.log("Stop recording error:", err);
            Alert.alert("Error", "Failed to save recording.");
            setIsRecording(false);
        }
    };

    const playRecording = async (rec: EvidenceItem) => {
        try {
            // Stop any current playback
            if (soundRef.current) {
                try {
                    await soundRef.current.stopAsync();
                    await soundRef.current.unloadAsync();
                } catch { }
                soundRef.current = null;
            }

            // Toggle off if same
            if (playingId === rec.id) {
                setPlayingId(null);
                return;
            }

            // Check file exists
            const fileInfo = await FileSystem.getInfoAsync(rec.uri);
            if (!fileInfo.exists) {
                Alert.alert("File Not Found", "This recording file was deleted. Removing from list.");
                const updated = recordings.filter((r) => r.id !== rec.id);
                setRecordings(updated);
                await saveMetadata(updated);
                return;
            }

            // CRITICAL: Switch audio mode from recording to playback
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
            });

            const { sound } = await Audio.Sound.createAsync(
                { uri: rec.uri },
                { shouldPlay: true, volume: 1.0 }
            );

            soundRef.current = sound;
            setPlayingId(rec.id);

            sound.setOnPlaybackStatusUpdate((status: any) => {
                if (status.didJustFinish) {
                    setPlayingId(null);
                    sound.unloadAsync();
                    soundRef.current = null;
                }
            });
        } catch (err: any) {
            console.log("Playback error:", err);
            Alert.alert("Playback Error", "Cannot play this recording.");
            setPlayingId(null);
        }
    };

    const deleteRecording = (rec: EvidenceItem) => {
        Alert.alert("Delete Evidence", "This will permanently delete this recording from device and server. Continue?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        // Delete from device
                        await FileSystem.deleteAsync(rec.uri, { idempotent: true });
                        
                        // Delete from backend if uploaded
                        if (rec._id) {
                            try {
                                await apiDeleteEvidence(rec._id);
                                console.log("Deleted from backend:", rec._id);
                            } catch (err) {
                                console.log("Backend delete failed:", err);
                            }
                        }
                        
                        const updated = recordings.filter((r) => r.id !== rec.id);
                        setRecordings(updated);
                        await saveMetadata(updated);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    } catch (err) {
                        console.log("Delete error:", err);
                        Alert.alert("Error", "Failed to delete recording.");
                    }
                },
            },
        ]);
    };

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60).toString().padStart(2, "0");
        const s = (sec % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={[colors.background, "#0D161A", colors.backgroundLight]} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Evidence Recorder</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Recording Mode */}
                <View style={styles.modeRow}>
                    <TouchableOpacity
                        style={[styles.modeBtn, recordingType === "audio" && styles.modeBtnActive]}
                        onPress={() => setRecordingType("audio")}
                    >
                        <MaterialIcons name="mic" size={22} color={recordingType === "audio" ? colors.evidence : colors.lightText} />
                        <Text style={[styles.modeText, recordingType === "audio" && styles.modeTextActive]}>Audio</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modeBtn, recordingType === "video" && styles.modeBtnActive]}
                        onPress={() => {
                            setRecordingType("video");
                            Alert.alert("📹 Video", "Audio recording will be used. Video recording coming soon.");
                        }}
                    >
                        <MaterialIcons name="videocam" size={22} color={recordingType === "video" ? colors.evidence : colors.lightText} />
                        <Text style={[styles.modeText, recordingType === "video" && styles.modeTextActive]}>Video</Text>
                    </TouchableOpacity>
                </View>

                {/* Recording Section */}
                <View style={styles.recordSection}>
                    {isRecording && (
                        <View style={styles.timerSection}>
                            <Animated.View style={[styles.recordingDot, { transform: [{ scale: pulseAnim }] }]} />
                            <Text style={styles.timerText}>{formatTime(duration)}</Text>
                            <Text style={styles.recordingLabel}>Recording Evidence...</Text>
                        </View>
                    )}

                    <TouchableOpacity onPress={isRecording ? stopRecording : startRecording} activeOpacity={0.8}>
                        <LinearGradient
                            colors={isRecording ? [colors.danger, "#B91C1C"] : [colors.evidence, "#0891B2"]}
                            style={styles.recordBtn}
                        >
                            <MaterialIcons name={isRecording ? "stop" : "fiber-manual-record"} size={40} color={colors.white} />
                        </LinearGradient>
                    </TouchableOpacity>
                    <Text style={styles.recordHint}>{isRecording ? "Tap to stop & save" : "Tap to start recording"}</Text>
                </View>

                {/* Recordings List */}
                <Text style={styles.sectionLabel}>Saved Evidence ({recordings.length})</Text>
                {recordings.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="folder-open" size={40} color={colors.border} />
                        <Text style={styles.emptyText}>No recordings yet</Text>
                        <Text style={styles.emptySubtext}>Record audio evidence to save it permanently</Text>
                    </View>
                ) : (
                    recordings.map((rec) => (
                        <View key={rec.id} style={styles.recordingCard}>
                            <View style={[styles.recIcon, { backgroundColor: (rec.type === "audio" ? colors.evidence : colors.secondary) + "15" }]}>
                                <MaterialIcons name={rec.type === "audio" ? "mic" : "videocam"} size={20} color={rec.type === "audio" ? colors.evidence : colors.secondary} />
                            </View>
                            <View style={styles.recInfo}>
                                <Text style={styles.recTitle}>{rec.type === "audio" ? "Audio" : "Video"} Evidence</Text>
                                <Text style={styles.recMeta}>{formatTime(rec.duration)} • {rec.date}</Text>
                                {rec.uploading && (
                                    <Text style={styles.uploadStatus}>⏳ Uploading to server...</Text>
                                )}
                                {rec.uploaded && (
                                    <Text style={styles.uploadStatusSuccess}>✅ Uploaded to server</Text>
                                )}
                                {rec.uploaded === false && !rec.uploading && (
                                    <Text style={styles.uploadStatusError}>⚠️ Not uploaded (tap to retry)</Text>
                                )}
                            </View>
                            <TouchableOpacity
                                onPress={() => playRecording(rec)}
                                style={[styles.playBtn, { backgroundColor: playingId === rec.id ? colors.danger + "20" : colors.evidence + "20" }]}
                            >
                                <MaterialIcons
                                    name={playingId === rec.id ? "stop" : "play-arrow"}
                                    size={22}
                                    color={playingId === rec.id ? colors.danger : colors.evidence}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => deleteRecording(rec)} style={[styles.playBtn, { backgroundColor: colors.danger + "10", marginLeft: 6 }]}>
                                <MaterialIcons name="delete" size={18} color={colors.danger} />
                            </TouchableOpacity>
                        </View>
                    ))
                )}

                {/* Info */}
                <View style={styles.infoCard}>
                    <MaterialIcons name="cloud-upload" size={18} color={colors.info} />
                    <Text style={styles.infoText}>
                        Recordings are saved on your device and automatically uploaded to the secure server. They persist across app restarts and can be used as evidence.
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
    scroll: { flex: 1, paddingHorizontal: 24 },

    modeRow: { flexDirection: "row", gap: 12, marginTop: 20 },
    modeBtn: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    modeBtnActive: { borderColor: colors.evidence, backgroundColor: colors.evidence + "12" },
    modeText: { fontSize: 15, fontWeight: "700", color: colors.lightText },
    modeTextActive: { color: colors.evidence },

    recordSection: { alignItems: "center", marginVertical: 30 },
    timerSection: { alignItems: "center", marginBottom: 20 },
    recordingDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.danger, marginBottom: 10 },
    timerText: { fontSize: 42, fontWeight: "900", color: colors.text, fontFamily: "monospace" },
    recordingLabel: { fontSize: 14, color: colors.danger, fontWeight: "700", marginTop: 6 },

    recordBtn: { width: 90, height: 90, borderRadius: 45, justifyContent: "center", alignItems: "center", shadowColor: colors.evidence, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: 10 },
    recordHint: { marginTop: 14, color: colors.lightText, fontSize: 13, fontWeight: "600" },

    sectionLabel: { fontSize: 16, fontWeight: "800", color: colors.text, marginTop: 10, marginBottom: 12 },

    emptyState: { alignItems: "center", paddingVertical: 30 },
    emptyText: { color: colors.lightText, marginTop: 8, fontSize: 15, fontWeight: "600" },
    emptySubtext: { color: colors.border, marginTop: 4, fontSize: 12 },

    recordingCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, padding: 14, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
    recIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
    recInfo: { flex: 1, marginLeft: 12 },
    recTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
    recMeta: { fontSize: 11, color: colors.lightText, marginTop: 2 },
    playBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
    uploadStatus: { fontSize: 10, color: colors.lightText, marginTop: 3, fontStyle: "italic" },
    uploadStatusSuccess: { fontSize: 10, color: colors.success, marginTop: 3, fontWeight: "600" },
    uploadStatusError: { fontSize: 10, color: colors.danger, marginTop: 3, fontWeight: "600" },

    infoCard: { flexDirection: "row", backgroundColor: colors.surface, padding: 14, borderRadius: 12, marginTop: 16, borderWidth: 1, borderColor: colors.border },
    infoText: { flex: 1, marginLeft: 10, fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
});
