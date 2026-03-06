import React, { useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    ScrollView,
    Image,
    TouchableWithoutFeedback,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = SCREEN_WIDTH * 0.78;

type FeatureItem = {
    icon: keyof typeof MaterialIcons.glyphMap;
    label: string;
    screen: string;
    color: string;
    description: string;
};

const FEATURES: FeatureItem[] = [
    { icon: "phone-in-talk", label: "Fake Call", screen: "FakeCall", color: colors.fakeCall, description: "Escape unsafe situations" },
    { icon: "mic", label: "Voice Distress", screen: "VoiceDistress", color: colors.voiceDetect, description: "Auto-detect distress" },
    { icon: "warning", label: "Unsafe Areas", screen: "UnsafeArea", color: colors.unsafeArea, description: "Avoid risky zones" },
    { icon: "directions-walk", label: "Walk With Me", screen: "WalkWithMe", color: colors.walkWithMe, description: "Safe journey tracking" },
    { icon: "watch", label: "Smart Watch", screen: "SmartWatch", color: colors.smartWatch, description: "Gesture triggers" },
    { icon: "signal-wifi-off", label: "Offline SOS", screen: "OfflineSOS", color: colors.offlineSOS, description: "SMS-based alerts" },
    { icon: "videocam", label: "Evidence Recorder", screen: "EvidenceRecording", color: colors.evidence, description: "Auto-record evidence" },
    { icon: "timer", label: "Safety Timer", screen: "SafetyTimer", color: colors.safetyTimer, description: "Timed check-ins" },
    { icon: "audiotrack", label: "Safety Recordings", screen: "PresetRecordings", color: colors.accent, description: "Pre-set call recordings" },
    { icon: "lightbulb", label: "Safety Tips", screen: "SafetyTips", color: "#F59E0B", description: "Essential safety advice" },
    { icon: "fence", label: "Geo-Fencing", screen: "GeoFencing", color: "#06B6D4", description: "Safe zone boundary alerts" },
];

const QUICK_LINKS: FeatureItem[] = [
    { icon: "history", label: "SOS History", screen: "SOSHistory", color: colors.textSecondary, description: "" },
    { icon: "people", label: "Contacts", screen: "ContactsList", color: colors.textSecondary, description: "" },
    { icon: "location-on", label: "Live Location", screen: "LiveLocationMap", color: colors.textSecondary, description: "" },
    { icon: "person", label: "Profile", screen: "Profile", color: colors.textSecondary, description: "" },
];

type Props = {
    visible: boolean;
    onClose: () => void;
    navigation: any;
    userName?: string;
    userEmail?: string;
};

export default function SidebarDrawer({ visible, onClose, navigation, userName, userEmail }: Props) {
    const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
                Animated.timing(overlayOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.spring(translateX, { toValue: -DRAWER_WIDTH, useNativeDriver: true, tension: 65, friction: 11 }),
                Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    const navigateTo = (screen: string) => {
        onClose();
        setTimeout(() => navigation.navigate(screen), 300);
    };

    if (!visible) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {/* Overlay */}
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
            </TouchableWithoutFeedback>

            {/* Drawer */}
            <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
                {/* Header */}
                <LinearGradient
                    colors={["#6C3CE1", "#4C1D95"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <View style={styles.avatarContainer}>
                        <LinearGradient
                            colors={["#EC4899", "#8B5CF6"]}
                            style={styles.avatar}
                        >
                            <MaterialIcons name="shield" size={32} color={colors.white} />
                        </LinearGradient>
                    </View>
                    <Text style={styles.userName}>{userName || "Stay Safe"}</Text>
                    <Text style={styles.userEmail}>{userEmail || "Women Safety App"}</Text>
                    <View style={styles.safeIndicator}>
                        <View style={styles.safeDot} />
                        <Text style={styles.safeText}>Protected</Text>
                    </View>
                </LinearGradient>

                {/* Features List */}
                <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
                    <Text style={styles.sectionLabel}>SAFETY FEATURES</Text>
                    {FEATURES.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.menuItem}
                            onPress={() => navigateTo(item.screen)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconBg, { backgroundColor: item.color + "20" }]}>
                                <MaterialIcons name={item.icon} size={22} color={item.color} />
                            </View>
                            <View style={styles.menuTextContainer}>
                                <Text style={styles.menuLabel}>{item.label}</Text>
                                <Text style={styles.menuDesc}>{item.description}</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={20} color={colors.lightText} />
                        </TouchableOpacity>
                    ))}

                    <View style={styles.divider} />
                    <Text style={styles.sectionLabel}>QUICK ACCESS</Text>
                    {QUICK_LINKS.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.quickItem}
                            onPress={() => navigateTo(item.screen)}
                            activeOpacity={0.7}
                        >
                            <MaterialIcons name={item.icon} size={20} color={colors.lightText} />
                            <Text style={styles.quickLabel}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}

                    {/* Logout */}
                    <View style={styles.divider} />
                    <TouchableOpacity
                        style={styles.logoutBtn}
                        onPress={() => navigateTo("Login")}
                    >
                        <MaterialIcons name="logout" size={20} color={colors.danger} />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.6)",
    },
    drawer: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: DRAWER_WIDTH,
        backgroundColor: colors.sidebarBg,
        zIndex: 100,
        elevation: 20,
        shadowColor: "#6C3CE1",
        shadowOffset: { width: 5, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 30,
    },
    avatarContainer: {
        marginBottom: 16,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
    },
    userName: {
        fontSize: 22,
        fontWeight: "800",
        color: colors.white,
        letterSpacing: 0.5,
    },
    userEmail: {
        fontSize: 13,
        color: "rgba(255,255,255,0.7)",
        marginTop: 4,
    },
    safeIndicator: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 12,
        backgroundColor: "rgba(16,185,129,0.2)",
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        alignSelf: "flex-start",
    },
    safeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.success,
        marginRight: 6,
    },
    safeText: {
        color: colors.success,
        fontSize: 12,
        fontWeight: "700",
    },
    menuList: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 20,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: "800",
        color: colors.lightText,
        letterSpacing: 1.5,
        marginBottom: 12,
        marginLeft: 4,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 12,
        marginBottom: 4,
    },
    iconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    menuTextContainer: {
        flex: 1,
        marginLeft: 14,
    },
    menuLabel: {
        fontSize: 15,
        fontWeight: "700",
        color: colors.text,
    },
    menuDesc: {
        fontSize: 11,
        color: colors.lightText,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 16,
        marginHorizontal: 8,
    },
    quickItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    quickLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        marginLeft: 14,
        fontWeight: "600",
    },
    logoutBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    logoutText: {
        fontSize: 14,
        color: colors.danger,
        marginLeft: 14,
        fontWeight: "700",
    },
});
