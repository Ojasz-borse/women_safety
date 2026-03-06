import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { colors } from "../theme/colors";

type TipCategory = {
    id: string;
    title: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    color: string;
    tips: string[];
};

const SAFETY_TIPS: TipCategory[] = [
    {
        id: "travel",
        title: "Travel Safety",
        icon: "directions-car",
        color: "#3B82F6",
        tips: [
            "Always share your live location with a trusted contact when traveling alone.",
            "Use verified ride-sharing services and share trip details with someone.",
            "Sit behind the driver in cabs and note the vehicle number.",
            "Avoid empty or poorly lit streets, especially at night.",
            "Keep your phone fully charged before heading out.",
            "Use the Walk With Me feature in this app for safe journey tracking.",
        ],
    },
    {
        id: "public",
        title: "Public Places",
        icon: "people",
        color: "#8B5CF6",
        tips: [
            "Stay aware of your surroundings — avoid distractions like headphones.",
            "Trust your instincts — if something feels wrong, leave immediately.",
            "Identify nearest exits when entering any building or venue.",
            "Keep valuables out of sight and hold your bag close.",
            "Avoid accepting drinks from strangers; watch your drink at all times.",
            "Stay in well-lit, populated areas when possible.",
        ],
    },
    {
        id: "digital",
        title: "Digital Safety",
        icon: "security",
        color: "#10B981",
        tips: [
            "Don't share your real-time location on social media.",
            "Use strong, unique passwords for all accounts.",
            "Turn off location services for social media apps.",
            "Be cautious sharing personal details with online acquaintances.",
            "Enable two-factor authentication on all important accounts.",
            "Review app permissions regularly — revoke unnecessary access.",
        ],
    },
    {
        id: "night",
        title: "Night Safety",
        icon: "nights-stay",
        color: "#EC4899",
        tips: [
            "Carry a personal safety alarm or whistle.",
            "Walk facing traffic so you can see approaching vehicles.",
            "Keep your phone accessible (not buried in a bag).",
            "Use the Safety Timer feature before entering risky situations.",
            "Have your keys ready before reaching your door.",
            "If you feel followed, head to a busy, well-lit area immediately.",
        ],
    },
    {
        id: "self_defense",
        title: "Self Defense",
        icon: "fitness-center",
        color: "#EF4444",
        tips: [
            "Learn basic self-defense moves — elbow strikes, knee kicks, palm strikes.",
            "Go for vulnerable areas if attacked: eyes, nose, throat, groin.",
            "Use everyday objects as defense: keys, umbrella, water bottle.",
            "Scream as loudly as possible to attract attention.",
            "Your goal is to create distance to escape, not to fight.",
            'Say "HELP HELP" loudly — this app detects it and auto-sends SOS.',
        ],
    },
    {
        id: "home",
        title: "Home Safety",
        icon: "home",
        color: "#F59E0B",
        tips: [
            "Keep doors and windows locked, even when you're home.",
            "Don't open the door to unexpected visitors.",
            "Have a trusted neighbor you can call in emergencies.",
            "Keep emergency numbers saved and easily accessible.",
            "Install good lighting around your home entrance.",
            "Use a peephole or camera before opening the door.",
        ],
    },
    {
        id: "workplace",
        title: "Workplace Safety",
        icon: "work",
        color: "#06B6D4",
        tips: [
            "Document any incidents of harassment immediately.",
            "Know your company's harassment reporting procedure.",
            "Keep recordings as evidence using this app's Evidence Recorder.",
            "Never stay alone in the office with someone you feel unsafe around.",
            "Trust your gut — report uncomfortable situations to HR.",
            "Know emergency exits and security contact numbers.",
        ],
    },
    {
        id: "emergency",
        title: "Emergency Numbers",
        icon: "call",
        color: "#DC2626",
        tips: [
            "Women Helpline (India): 181",
            "Police: 100 / 112 (Emergency)",
            "Ambulance: 108",
            "National Commission for Women: 7827-170-170",
            "Domestic Violence Helpline: 1091",
            "Cyber Crime: 1930",
            "Child Helpline: 1098",
            "Anti-Stalking Helpline: 1091",
        ],
    },
];

export default function SafetyTipsScreen({ navigation }: any) {
    const [expandedId, setExpandedId] = useState<string | null>("travel");

    const toggleCategory = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={[colors.background, "#0D1117", colors.backgroundLight]} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Safety Tips</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.subtitle}>Essential safety tips every woman should know 💪</Text>

                {SAFETY_TIPS.map((cat) => {
                    const isExpanded = expandedId === cat.id;
                    return (
                        <View key={cat.id} style={styles.categoryCard}>
                            <TouchableOpacity
                                onPress={() => toggleCategory(cat.id)}
                                style={styles.categoryHeader}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.catIcon, { backgroundColor: cat.color + "15" }]}>
                                    <MaterialIcons name={cat.icon} size={22} color={cat.color} />
                                </View>
                                <Text style={styles.catTitle}>{cat.title}</Text>
                                <View style={[styles.tipCount, { backgroundColor: cat.color + "15" }]}>
                                    <Text style={[styles.tipCountText, { color: cat.color }]}>{cat.tips.length}</Text>
                                </View>
                                <MaterialIcons
                                    name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                                    size={24}
                                    color={colors.lightText}
                                />
                            </TouchableOpacity>

                            {isExpanded && (
                                <View style={styles.tipsContainer}>
                                    {cat.tips.map((tip, idx) => (
                                        <View key={idx} style={styles.tipRow}>
                                            <View style={[styles.tipBullet, { backgroundColor: cat.color }]} />
                                            <Text style={styles.tipText}>{tip}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    );
                })}

                {/* Quick Reminder */}
                <View style={styles.reminderCard}>
                    <LinearGradient colors={[colors.primary + "15", colors.secondary + "10"]} style={styles.reminderGradient}>
                        <MaterialIcons name="shield" size={28} color={colors.primary} />
                        <Text style={styles.reminderTitle}>Your Safety Matters</Text>
                        <Text style={styles.reminderText}>
                            Use this app's features — SOS, Voice Distress, Safety Timer, Walk With Me — to stay protected at all times.
                        </Text>
                    </LinearGradient>
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
    subtitle: { textAlign: "center", color: colors.textSecondary, fontSize: 14, marginVertical: 16, fontWeight: "600" },

    categoryCard: { backgroundColor: colors.surface, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
    categoryHeader: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
    catIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
    catTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: colors.text },
    tipCount: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    tipCountText: { fontSize: 11, fontWeight: "800" },

    tipsContainer: { paddingHorizontal: 16, paddingBottom: 16 },
    tipRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10, gap: 10 },
    tipBullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
    tipText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 20 },

    reminderCard: { marginTop: 12, borderRadius: 16, overflow: "hidden" },
    reminderGradient: { padding: 20, alignItems: "center", borderRadius: 16, borderWidth: 1, borderColor: colors.border },
    reminderTitle: { fontSize: 17, fontWeight: "800", color: colors.text, marginTop: 10 },
    reminderText: { fontSize: 12, color: colors.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 18 },
});
