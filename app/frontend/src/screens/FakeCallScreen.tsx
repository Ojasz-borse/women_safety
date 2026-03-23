import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, StatusBar } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { colors } from "../theme/colors";
import apiClient from "../services/apiClient";

const CALLERS = [
    { name: "Mom", icon: "favorite" as const, emoji: "👩" },
    { name: "Dad", icon: "person" as const, emoji: "👨" },
    { name: "Boss", icon: "work" as const, emoji: "💼" },
    { name: "Friend", icon: "people" as const, emoji: "👫" },
];

const DELAYS = [
    { label: "5s", value: 5 },
    { label: "10s", value: 10 },
    { label: "30s", value: 30 },
    { label: "60s", value: 60 },
];

export default function FakeCallScreen({ navigation }: any) {
    const [selectedCaller, setSelectedCaller] = useState("Mom");
    const [customCaller, setCustomCaller] = useState("");
    const [selectedDelay, setSelectedDelay] = useState(10);
    const [scheduling, setScheduling] = useState(false);

    const scheduleFakeCall = async () => {
        const callerName = customCaller.trim() || selectedCaller;
        setScheduling(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        try {
            await apiClient.post("/utils/fake-call", {
                callerName,
                delaySeconds: selectedDelay,
            });
        } catch { }

        setTimeout(() => {
            setScheduling(false);
            navigation.navigate("FakeIncomingCall", { callerName });
        }, selectedDelay * 1000);

        Alert.alert(
            "📞 Call Scheduled!",
            `Incoming call from "${callerName}" in ${selectedDelay} seconds. Act naturally.`,
            [{ text: "OK" }]
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={[colors.background, "#0D1A0F", colors.backgroundLight]} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Fake Call</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.iconCircle}>
                    <MaterialIcons name="phone-in-talk" size={40} color={colors.fakeCall} />
                </View>
                <Text style={styles.subtitle}>Schedule a fake incoming call to escape an unsafe situation</Text>

                <Text style={styles.label}>Select Caller</Text>
                <View style={styles.callerGrid}>
                    {CALLERS.map((c) => (
                        <TouchableOpacity
                            key={c.name}
                            style={[styles.callerBtn, selectedCaller === c.name && styles.callerBtnActive]}
                            onPress={() => { setSelectedCaller(c.name); setCustomCaller(""); }}
                        >
                            <Text style={styles.callerEmoji}>{c.emoji}</Text>
                            <Text style={[styles.callerText, selectedCaller === c.name && styles.callerTextActive]}>{c.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TextInput
                    style={styles.customInput}
                    placeholder="Or type custom name..."
                    placeholderTextColor={colors.lightText}
                    value={customCaller}
                    onChangeText={setCustomCaller}
                />

                <Text style={styles.label}>Delay Before Call</Text>
                <View style={styles.delayGrid}>
                    {DELAYS.map((d) => (
                        <TouchableOpacity
                            key={d.value}
                            style={[styles.delayBtn, selectedDelay === d.value && styles.delayBtnActive]}
                            onPress={() => setSelectedDelay(d.value)}
                        >
                            <Text style={[styles.delayText, selectedDelay === d.value && styles.delayTextActive]}>{d.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.scheduleBtn, scheduling && { opacity: 0.6 }]}
                    onPress={scheduleFakeCall}
                    disabled={scheduling}
                    activeOpacity={0.8}
                >
                    <LinearGradient colors={[colors.fakeCall, "#059669"]} style={styles.scheduleBtnGradient}>
                        <MaterialIcons name="phone" size={22} color={colors.white} />
                        <Text style={styles.scheduleBtnText}>{scheduling ? "Call Incoming..." : "Schedule Call"}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 55, paddingBottom: 10 },
    backBtn: { padding: 8, borderRadius: 12, backgroundColor: colors.surface },
    title: { fontSize: 20, fontWeight: "800", color: colors.text },
    content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
    iconCircle: { alignSelf: "center", width: 80, height: 80, borderRadius: 40, backgroundColor: colors.fakeCall + "15", justifyContent: "center", alignItems: "center", marginBottom: 16 },
    subtitle: { textAlign: "center", color: colors.textSecondary, fontSize: 14, lineHeight: 22, marginBottom: 30 },
    label: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 12 },
    callerGrid: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
    callerBtn: { flex: 1, marginHorizontal: 4, paddingVertical: 14, borderRadius: 14, backgroundColor: colors.surface, alignItems: "center", borderWidth: 1, borderColor: colors.border },
    callerBtnActive: { borderColor: colors.fakeCall, backgroundColor: colors.fakeCall + "15" },
    callerEmoji: { fontSize: 24, marginBottom: 4 },
    callerText: { fontSize: 12, fontWeight: "700", color: colors.textSecondary },
    callerTextActive: { color: colors.fakeCall },
    customInput: { backgroundColor: colors.surface, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border, marginBottom: 24 },
    delayGrid: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
    delayBtn: { flex: 1, marginHorizontal: 4, paddingVertical: 14, borderRadius: 14, backgroundColor: colors.surface, alignItems: "center", borderWidth: 1, borderColor: colors.border },
    delayBtnActive: { borderColor: colors.fakeCall, backgroundColor: colors.fakeCall + "15" },
    delayText: { fontSize: 16, fontWeight: "800", color: colors.textSecondary },
    delayTextActive: { color: colors.fakeCall },
    scheduleBtn: { borderRadius: 16, overflow: "hidden" },
    scheduleBtnGradient: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 18, gap: 10 },
    scheduleBtnText: { fontSize: 18, fontWeight: "800", color: colors.white },
});
