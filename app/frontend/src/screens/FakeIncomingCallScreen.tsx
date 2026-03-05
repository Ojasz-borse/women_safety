import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Vibration, StatusBar, Dimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { colors } from "../theme/colors";

const { width } = Dimensions.get("window");

export default function FakeIncomingCallScreen({ navigation, route }: any) {
    const { callerName } = route.params || { callerName: "Mom" };
    const [answered, setAnswered] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const ringAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Start vibration pattern
        const vibrationPattern = [500, 1000, 500, 1000, 500, 1000, 500, 1000, 500, 1000];
        Vibration.vibrate(vibrationPattern, true);

        // Ring animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(ringAnim, { toValue: 1, duration: 800, easing: Easing.ease, useNativeDriver: true }),
                Animated.timing(ringAnim, { toValue: 0, duration: 800, easing: Easing.ease, useNativeDriver: true }),
            ])
        ).start();

        // Slide animation for answer hint
        Animated.loop(
            Animated.sequence([
                Animated.timing(slideAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();

        return () => Vibration.cancel();
    }, []);

    const handleAnswer = () => {
        Vibration.cancel();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setAnswered(true);
        intervalRef.current = setInterval(() => {
            setCallDuration((prev) => prev + 1);
        }, 1000);
    };

    const handleDecline = () => {
        Vibration.cancel();
        if (intervalRef.current) clearInterval(intervalRef.current);
        navigation.goBack();
    };

    const handleEndCall = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.goBack();
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, "0");
        const s = (secs % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    const ringScale = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
    const slideX = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 20] });

    if (answered) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={StyleSheet.absoluteFill} />
                <View style={styles.callActiveContainer}>
                    <View style={styles.callerAvatarLarge}>
                        <Text style={styles.callerInitial}>{callerName[0]}</Text>
                    </View>
                    <Text style={styles.callerNameLarge}>{callerName}</Text>
                    <Text style={styles.callTimer}>{formatTime(callDuration)}</Text>
                    <Text style={styles.callStatus}>Call in progress</Text>

                    <View style={styles.callActions}>
                        <TouchableOpacity style={styles.callActionBtn}>
                            <MaterialIcons name="mic-off" size={24} color={colors.white} />
                            <Text style={styles.callActionLabel}>Mute</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.callActionBtn}>
                            <MaterialIcons name="volume-up" size={24} color={colors.white} />
                            <Text style={styles.callActionLabel}>Speaker</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.callActionBtn}>
                            <MaterialIcons name="dialpad" size={24} color={colors.white} />
                            <Text style={styles.callActionLabel}>Keypad</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.endCallBtn} onPress={handleEndCall}>
                        <MaterialIcons name="call-end" size={32} color={colors.white} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={["#0D0D1A", "#1a1a2e", "#16213e"]} style={StyleSheet.absoluteFill} />

            <View style={styles.incomingContainer}>
                <Text style={styles.incomingLabel}>Incoming Call</Text>

                <Animated.View style={[styles.avatarRing, { transform: [{ scale: ringScale }] }]}>
                    <LinearGradient colors={["#6C3CE1", "#EC4899"]} style={styles.callerAvatar}>
                        <Text style={styles.callerInitialLarge}>{callerName[0]}</Text>
                    </LinearGradient>
                </Animated.View>

                <Text style={styles.callerNameIncoming}>{callerName}</Text>
                <Text style={styles.callerNumberIncoming}>Mobile</Text>

                <Animated.View style={[styles.slideHint, { transform: [{ translateX: slideX }] }]}>
                    <MaterialIcons name="swap-horiz" size={20} color={colors.lightText} />
                </Animated.View>

                <View style={styles.answerActions}>
                    <TouchableOpacity style={styles.declineBtn} onPress={handleDecline}>
                        <MaterialIcons name="call-end" size={30} color={colors.white} />
                        <Text style={styles.actionLabelSmall}>Decline</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.answerBtn} onPress={handleAnswer}>
                        <MaterialIcons name="call" size={30} color={colors.white} />
                        <Text style={styles.actionLabelSmall}>Answer</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0D0D1A" },

    // Incoming Call
    incomingContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 30 },
    incomingLabel: { fontSize: 16, color: colors.lightText, fontWeight: "600", letterSpacing: 1, marginBottom: 30 },
    avatarRing: { width: 140, height: 140, borderRadius: 70, borderWidth: 3, borderColor: "rgba(108,60,225,0.4)", justifyContent: "center", alignItems: "center", marginBottom: 20 },
    callerAvatar: { width: 120, height: 120, borderRadius: 60, justifyContent: "center", alignItems: "center" },
    callerInitialLarge: { fontSize: 48, fontWeight: "900", color: colors.white },
    callerNameIncoming: { fontSize: 32, fontWeight: "800", color: colors.white, marginBottom: 6 },
    callerNumberIncoming: { fontSize: 16, color: colors.lightText, marginBottom: 60 },
    slideHint: { marginBottom: 30 },

    answerActions: { flexDirection: "row", justifyContent: "space-around", width: "80%" },
    declineBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: colors.danger, justifyContent: "center", alignItems: "center" },
    answerBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: colors.success, justifyContent: "center", alignItems: "center" },
    actionLabelSmall: { fontSize: 11, color: colors.white, fontWeight: "600", marginTop: 2 },

    // Active Call
    callActiveContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    callerAvatarLarge: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#6C3CE1", justifyContent: "center", alignItems: "center", marginBottom: 20 },
    callerInitial: { fontSize: 40, fontWeight: "900", color: colors.white },
    callerNameLarge: { fontSize: 28, fontWeight: "800", color: colors.white },
    callTimer: { fontSize: 18, color: colors.textSecondary, marginTop: 8, fontFamily: "monospace" },
    callStatus: { fontSize: 14, color: colors.lightText, marginTop: 4, marginBottom: 50 },
    callActions: { flexDirection: "row", gap: 30, marginBottom: 50 },
    callActionBtn: { alignItems: "center", gap: 6 },
    callActionLabel: { fontSize: 11, color: colors.lightText, fontWeight: "600" },
    endCallBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: colors.danger, justifyContent: "center", alignItems: "center" },
});
