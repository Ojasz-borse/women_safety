import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import { colors } from "../theme/colors";

type Recording = {
    id: string;
    name: string;
    label: string;
    uri: string;
    duration: number;
    isPreset: boolean;
    icon: keyof typeof MaterialIcons.glyphMap;
    color: string;
};

// Use a guaranteed-safe path
const getStorageDir = () => {
    const FS = FileSystem as any;
    const docDir = FS.documentDirectory;
    if (!docDir) return FS.cacheDirectory + "recordings/";
    return docDir + "recordings/";
};

const PRESET_SLOTS: Omit<Recording, "uri" | "duration" | "id">[] = [
    { name: "Police", label: "Act like you're on call with police", isPreset: true, icon: "local-police", color: "#3B82F6" },
    { name: "Ambulance", label: "Act like you're calling an ambulance", isPreset: true, icon: "local-hospital", color: "#EF4444" },
    { name: "Mom", label: "Act like you're talking to mom", isPreset: true, icon: "favorite", color: "#EC4899" },
    { name: "Brother", label: "Act like you're talking to brother", isPreset: true, icon: "person", color: "#8B5CF6" },
];

export default function PresetRecordingsScreen({ navigation }: any) {
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingFor, setRecordingFor] = useState<string | null>(null);
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [recordDuration, setRecordDuration] = useState(0);
    const [storageDir, setStorageDir] = useState("");
    const recordingRef = useRef<Audio.Recording | null>(null);
    const soundRef = useRef<Audio.Sound | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const dir = getStorageDir();
        setStorageDir(dir);
        initStorage(dir);
        return () => {
            if (soundRef.current) soundRef.current.unloadAsync();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const initStorage = async (dir: string) => {
        try {
            const dirInfo = await FileSystem.getInfoAsync(dir);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
            }
            // Load saved recordings
            const metaPath = dir + "metadata.json";
            const metaInfo = await FileSystem.getInfoAsync(metaPath);
            if (metaInfo.exists) {
                const raw = await FileSystem.readAsStringAsync(metaPath);
                const saved: Recording[] = JSON.parse(raw);
                // Verify each recording file still exists
                const verified: Recording[] = [];
                for (const rec of saved) {
                    const fileInfo = await FileSystem.getInfoAsync(rec.uri);
                    if (fileInfo.exists) {
                        verified.push(rec);
                    }
                }
                setRecordings(verified);
                if (verified.length !== saved.length) {
                    await saveMetadata(verified, dir);
                }
            }
        } catch (err) {
            console.log("Storage init error:", err);
        }
    };

    const saveMetadata = async (recs: Recording[], dir?: string) => {
        const d = dir || storageDir;
        try {
            await FileSystem.writeAsStringAsync(d + "metadata.json", JSON.stringify(recs));
        } catch (err) {
            console.log("Save metadata error:", err);
        }
    };

    const startRecordingFor = async (slotName: string) => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission Required", "Microphone permission is needed to record audio.");
                return;
            }

            // Set audio mode for recording
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const recording = new Audio.Recording();
            await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            await recording.startAsync();

            recordingRef.current = recording;
            setIsRecording(true);
            setRecordingFor(slotName);
            setRecordDuration(0);
            timerRef.current = setInterval(() => setRecordDuration((p) => p + 1), 1000);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } catch (err) {
            console.log("Recording start error:", err);
            Alert.alert("Error", "Failed to start recording. Make sure microphone is available.");
        }
    };

    const stopRecordingFor = async () => {
        if (!recordingRef.current || !recordingFor) return;

        try {
            await recordingRef.current.stopAndUnloadAsync();
            const tempUri = recordingRef.current.getURI();
            if (timerRef.current) clearInterval(timerRef.current);

            if (tempUri) {
                // Copy to permanent storage
                const fileName = `${recordingFor.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}.m4a`;
                const dest = storageDir + fileName;

                // Ensure directory exists
                const dirInfo = await FileSystem.getInfoAsync(storageDir);
                if (!dirInfo.exists) {
                    await FileSystem.makeDirectoryAsync(storageDir, { intermediates: true });
                }

                await FileSystem.copyAsync({ from: tempUri, to: dest });

                // Verify the copy worked
                const copyInfo = await FileSystem.getInfoAsync(dest);
                if (!copyInfo.exists) {
                    Alert.alert("Error", "Recording file could not be saved.");
                    return;
                }

                const slot = PRESET_SLOTS.find((s) => s.name === recordingFor);
                const newRec: Recording = {
                    id: Date.now().toString(),
                    name: recordingFor,
                    label: slot?.label || "Custom recording",
                    uri: dest,
                    duration: recordDuration,
                    isPreset: !!slot,
                    icon: slot?.icon || "mic",
                    color: slot?.color || "#10B981",
                };

                // Replace existing recording for same slot, or add new
                const updated = [...recordings.filter((r) => r.name !== recordingFor), newRec];
                setRecordings(updated);
                await saveMetadata(updated);

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("✅ Saved!", `Recording for "${recordingFor}" saved permanently.`);
            }

            recordingRef.current = null;
            setIsRecording(false);
            setRecordingFor(null);
        } catch (err) {
            console.log("Stop recording error:", err);
            Alert.alert("Error", "Failed to save recording.");
            setIsRecording(false);
            setRecordingFor(null);
        }
    };

    const importFromDevice = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: "audio/*",
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) {
                return;
            }

            const file = result.assets[0];
            if (!file.uri) {
                Alert.alert("Error", "No file selected.");
                return;
            }

            const fileName = `imported_${Date.now()}_${file.name || "audio"}.m4a`;
            const dest = storageDir + fileName;

            // Ensure directory exists
            const dirInfo = await FileSystem.getInfoAsync(storageDir);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(storageDir, { intermediates: true });
            }

            await FileSystem.copyAsync({ from: file.uri, to: dest });

            // Verify copy
            const copyInfo = await FileSystem.getInfoAsync(dest);
            if (!copyInfo.exists) {
                Alert.alert("Error", "Failed to copy audio file.");
                return;
            }

            const newRec: Recording = {
                id: Date.now().toString(),
                name: file.name || "Imported Audio",
                label: "Imported from device",
                uri: dest,
                duration: 0,
                isPreset: false,
                icon: "audiotrack",
                color: "#10B981",
            };

            const updated = [...recordings, newRec];
            setRecordings(updated);
            await saveMetadata(updated);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("✅ Imported!", `"${file.name}" has been imported and saved permanently.`);
        } catch (err) {
            console.log("Import error:", err);
            Alert.alert("Import Failed", "Could not import the audio file. Try a different file format (.mp3, .m4a, .wav).");
        }
    };

    const playRecording = async (rec: Recording) => {
        try {
            // Stop any current playback
            if (soundRef.current) {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
                soundRef.current = null;
            }

            // If tapping the same recording, just stop
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
        } catch (err) {
            console.log("Playback error:", err);
            Alert.alert("Playback Error", "Cannot play this recording. The file may be corrupted.");
            setPlayingId(null);
        }
    };

    const deleteRecording = (rec: Recording) => {
        Alert.alert("Delete Recording", `Delete "${rec.name}" recording? This cannot be undone.`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await FileSystem.deleteAsync(rec.uri, { idempotent: true });
                    } catch { }
                    const updated = recordings.filter((r) => r.id !== rec.id);
                    setRecordings(updated);
                    await saveMetadata(updated);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                },
            },
        ]);
    };

    const formatTime = (sec: number) =>
        `${Math.floor(sec / 60).toString().padStart(2, "0")}:${(sec % 60).toString().padStart(2, "0")}`;

    const getSlotRecording = (name: string) => recordings.find((r) => r.name === name);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={[colors.background, "#0D1A15", colors.backgroundLight]} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Safety Recordings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.subtitle}>
                    Record or import audio to play anytime — act like you're on a call for safety.
                </Text>

                {/* Preset Slots */}
                <Text style={styles.sectionLabel}>PRESET CONTACTS</Text>
                {PRESET_SLOTS.map((slot) => {
                    const rec = getSlotRecording(slot.name);
                    const isCurrentlyRecording = isRecording && recordingFor === slot.name;

                    return (
                        <View key={slot.name} style={styles.slotCard}>
                            <View style={[styles.slotIcon, { backgroundColor: slot.color + "15" }]}>
                                <MaterialIcons name={slot.icon} size={24} color={slot.color} />
                            </View>
                            <View style={styles.slotInfo}>
                                <Text style={styles.slotName}>{slot.name}</Text>
                                <Text style={styles.slotLabel}>
                                    {rec ? `✅ Recorded (${formatTime(rec.duration)})` : "No recording yet"}
                                </Text>
                            </View>
                            <View style={styles.slotActions}>
                                {rec && (
                                    <TouchableOpacity
                                        onPress={() => playRecording(rec)}
                                        style={[styles.miniBtn, { backgroundColor: playingId === rec.id ? colors.danger + "20" : colors.success + "20" }]}
                                    >
                                        <MaterialIcons name={playingId === rec.id ? "stop" : "play-arrow"} size={20} color={playingId === rec.id ? colors.danger : colors.success} />
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    onPress={isCurrentlyRecording ? stopRecordingFor : () => startRecordingFor(slot.name)}
                                    style={[styles.miniBtn, { backgroundColor: isCurrentlyRecording ? colors.danger + "20" : slot.color + "20" }]}
                                >
                                    <MaterialIcons
                                        name={isCurrentlyRecording ? "stop" : "fiber-manual-record"}
                                        size={18}
                                        color={isCurrentlyRecording ? colors.danger : slot.color}
                                    />
                                </TouchableOpacity>
                                {rec && (
                                    <TouchableOpacity
                                        onPress={() => deleteRecording(rec)}
                                        style={[styles.miniBtn, { backgroundColor: colors.danger + "10" }]}
                                    >
                                        <MaterialIcons name="delete" size={16} color={colors.danger} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    );
                })}

                {isRecording && (
                    <View style={styles.recordingBanner}>
                        <View style={styles.recDot} />
                        <Text style={styles.recText}>Recording for {recordingFor}... {formatTime(recordDuration)}</Text>
                    </View>
                )}

                {/* Import */}
                <TouchableOpacity onPress={importFromDevice} style={styles.importBtn} activeOpacity={0.7}>
                    <MaterialIcons name="file-upload" size={22} color={colors.info} />
                    <Text style={styles.importBtnText}>Import Audio from Device</Text>
                </TouchableOpacity>

                {/* Custom Recordings */}
                {recordings.filter((r) => !r.isPreset).length > 0 && (
                    <>
                        <Text style={styles.sectionLabel}>IMPORTED / CUSTOM</Text>
                        {recordings
                            .filter((r) => !r.isPreset)
                            .map((rec) => (
                                <View key={rec.id} style={styles.slotCard}>
                                    <View style={[styles.slotIcon, { backgroundColor: rec.color + "15" }]}>
                                        <MaterialIcons name={rec.icon} size={22} color={rec.color} />
                                    </View>
                                    <View style={styles.slotInfo}>
                                        <Text style={styles.slotName}>{rec.name}</Text>
                                        <Text style={styles.slotLabel}>{rec.label}</Text>
                                    </View>
                                    <View style={styles.slotActions}>
                                        <TouchableOpacity
                                            onPress={() => playRecording(rec)}
                                            style={[styles.miniBtn, { backgroundColor: playingId === rec.id ? colors.danger + "20" : colors.success + "20" }]}
                                        >
                                            <MaterialIcons name={playingId === rec.id ? "stop" : "play-arrow"} size={20} color={playingId === rec.id ? colors.danger : colors.success} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => deleteRecording(rec)}
                                            style={[styles.miniBtn, { backgroundColor: colors.danger + "15" }]}
                                        >
                                            <MaterialIcons name="delete" size={18} color={colors.danger} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                    </>
                )}

                {/* Storage info */}
                <View style={styles.infoCard}>
                    <MaterialIcons name="info-outline" size={16} color={colors.info} />
                    <Text style={styles.infoText}>
                        Recordings are saved permanently on your device. They survive app restarts. Tap ● to record, ▶ to play, 🗑 to delete.
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
    subtitle: { textAlign: "center", color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginVertical: 16 },

    sectionLabel: { fontSize: 11, fontWeight: "800", color: colors.lightText, letterSpacing: 1.5, marginTop: 20, marginBottom: 12 },

    slotCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, padding: 14, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
    slotIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center" },
    slotInfo: { flex: 1, marginLeft: 14 },
    slotName: { fontSize: 15, fontWeight: "700", color: colors.text },
    slotLabel: { fontSize: 11, color: colors.lightText, marginTop: 2 },
    slotActions: { flexDirection: "row", gap: 6 },
    miniBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },

    recordingBanner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10, backgroundColor: colors.danger + "10", borderRadius: 10, marginBottom: 12 },
    recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger },
    recText: { fontSize: 13, fontWeight: "700", color: colors.danger },

    importBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 14, borderWidth: 1.5, borderColor: colors.info, borderStyle: "dashed", marginTop: 12 },
    importBtnText: { fontSize: 15, fontWeight: "700", color: colors.info },

    infoCard: { flexDirection: "row", backgroundColor: colors.surface, padding: 12, borderRadius: 12, marginTop: 16, borderWidth: 1, borderColor: colors.border, gap: 8 },
    infoText: { flex: 1, fontSize: 11, color: colors.lightText, lineHeight: 16 },
});
