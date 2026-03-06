import React, { useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Alert,
    Animated,
    Easing,
    ScrollView,
    Dimensions,
    StatusBar,
    Platform,
} from "react-native";

import { Accelerometer } from "expo-sensors";
import * as ExpoLocation from "expo-location";
import * as SecureStore from "expo-secure-store";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/colors";
import { triggerSOS } from "../services/sosService";
import SidebarDrawer from "../components/SidebarDrawer";
import { shakeDetectorService } from "../services/ShakeDetectorService";
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const { width } = Dimensions.get("window");

const QUICK_ACTIONS = [
    { icon: "phone-in-talk" as const, label: "Fake Call", screen: "FakeCall", color: colors.fakeCall },
    { icon: "location-on" as const, label: "Share Location", screen: "LiveLocationMap", color: colors.walkWithMe },
    { icon: "directions" as const, label: "Safe Route", screen: "SearchDestination", color: colors.info },
    { icon: "people" as const, label: "Contacts", screen: "ContactsList", color: colors.smartWatch },
    { icon: "videocam" as const, label: "Record", screen: "EvidenceRecording", color: colors.evidence },
    { icon: "timer" as const, label: "Timer", screen: "SafetyTimer", color: colors.safetyTimer },
];

export default function HomeDashboardScreen({ navigation }: any) {
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [userName, setUserName] = useState("User");
    const lastShake = useRef(0);
    const shakeCount = useRef(0);
    const shakeTimer = useRef<NodeJS.Timeout | null>(null);

    // SOS Button Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const ringAnim = useRef(new Animated.Value(0.8)).current;
    const ringOpacity = useRef(new Animated.Value(0.6)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Pulsing SOS button
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();

        // Expanding ring
        Animated.loop(
            Animated.parallel([
                Animated.timing(ringAnim, { toValue: 1.6, duration: 2000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                Animated.timing(ringOpacity, { toValue: 0, duration: 2000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            ])
        ).start();

        // Glow rotation
        Animated.loop(
            Animated.timing(glowAnim, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })
        ).start();

        return () => {
            // Cleanup handled by shakeDetectorService
        };
    }, []);

    // Initialize shake detection after component mounts
    useEffect(() => {
        console.log('🎯 Setting up shake detection...');
        
        const setupShakeDetection = async () => {
            try {
                // Small delay to ensure component is fully mounted
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Request background fetch permissions (iOS)
                if (Platform.OS === 'ios') {
                    try {
                        const status = await BackgroundFetch.getStatusAsync();
                        if (status === BackgroundFetch.Status.Available) {
                            await shakeDetectorService.initBackgroundTask();
                            console.log('✅ iOS background task registered');
                        } else {
                            console.log('⚠️ iOS background fetch status:', status);
                        }
                    } catch (iosError) {
                        console.log('⚠️ iOS background setup error:', iosError);
                    }
                }

                // Start shake detection
                shakeDetectorService.start(() => {
                    console.log('🚨 SHAKE TRIGGER CALLBACK FIRED!');
                    handleSOSFromShake();
                });

                console.log('✅ Shake detection ACTIVE - shake your phone 3 times!');
                
                // Log status after 2 seconds
                setTimeout(() => {
                    console.log('📊 Shake detector status:', shakeDetectorService.isRunning());
                }, 2000);
            } catch (error) {
                console.error('❌ Shake detection setup failed:', error);
            }
        };

        setupShakeDetection();

        // Cleanup on unmount
        return () => {
            console.log('🛑 Stopping shake detection');
            shakeDetectorService.stop();
        };
    }, []);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const token = await SecureStore.getItemAsync("token");
                if (!token) {
                    setUserName("Guest");
                }
            } catch { }
        };
        loadUser();
    }, []);

    // Handle SOS triggered from shake (simplified, no confirmation dialog)
    const handleSOSFromShake = async () => {
        try {
            // Vibrate to confirm shake detected
            if (Platform.OS === 'android') {
                const { Vibration } = require('react-native');
                Vibration.vibrate([200, 100, 200]);
            }

            const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Error", "Location permission required for SOS");
                return;
            }

            const location = await ExpoLocation.getCurrentPositionAsync({ 
                accuracy: ExpoLocation.Accuracy.High,
                timeout: 10000
            });

            let address = "User Location";
            try {
                const geo = await ExpoLocation.reverseGeocodeAsync({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });
                if (geo.length > 0) {
                    address = `${geo[0].street || ""}, ${geo[0].city || ""}, ${geo[0].region || ""}`.trim() || "User Location";
                }
            } catch { }

            const data = await triggerSOS(location.coords.latitude, location.coords.longitude, address);
            const alertId = data?.alertId || data?._id || "local-" + Date.now();

            // Navigate to SOS screen
            navigation.navigate("SOSActivated", { alertId });

            Alert.alert(
                "🚨 SOS SENT!",
                "Emergency alerts have been sent to your contacts. Help is on the way!",
                [{ text: "OK" }]
            );
        } catch (error: any) {
            console.log('SOS from shake failed:', error);
            Alert.alert("SOS Error", "Failed to send SOS. Please try manually.");
        }
    };

    const handleSOS = async () => {
        Alert.alert(
            "🚨 Trigger SOS",
            "This will alert your emergency contacts with your live location. Continue?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "SEND SOS",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
                            if (status !== "granted") {
                                Alert.alert("Error", "Location permission required");
                                return;
                            }
                            const location = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.High });
                            let address = "User Location";
                            try {
                                const geo = await ExpoLocation.reverseGeocodeAsync({
                                    latitude: location.coords.latitude,
                                    longitude: location.coords.longitude,
                                });
                                if (geo.length > 0) {
                                    address = `${geo[0].street || ""}, ${geo[0].city || ""}, ${geo[0].region || ""}`.trim() || "User Location";
                                }
                            } catch { }

                            try {
                                const data = await triggerSOS(location.coords.latitude, location.coords.longitude, address);
                                const alertId = data?.alertId || data?._id || "local-" + Date.now();
                                navigation.navigate("SOSActivated", { alertId });
                            } catch (apiError) {
                                // Even if backend fails, still show SOS screen for user feedback
                                navigation.navigate("SOSActivated", { alertId: "offline-" + Date.now() });
                                Alert.alert("⚠️ Partial SOS", "SOS screen activated. Backend may be offline - SMS may not have been sent.");
                            }
                        } catch (error: any) {
                            Alert.alert("SOS Error", error.message || "Failed to get location. Please try again.");
                        }
                    },
                },
            ]
        );
    };

    const glowRotation = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background} />
            <LinearGradient
                colors={[colors.background, "#150D28", colors.backgroundLight]}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.menuBtn} onPress={() => setSidebarVisible(true)}>
                            <MaterialIcons name="menu" size={26} color={colors.text} />
                        </TouchableOpacity>
                        <View style={styles.headerCenter}>
                            <MaterialIcons name="shield" size={20} color={colors.primary} />
                            <Text style={styles.appTitle}>SafeGuard</Text>
                        </View>
                        <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate("Profile")}>
                            <LinearGradient colors={["#6C3CE1", "#EC4899"]} style={styles.profileGradient}>
                                <MaterialIcons name="person" size={20} color={colors.white} />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Greeting */}
                    <View style={styles.greetingSection}>
                        <Text style={styles.greetingText}>Hello, <Text style={styles.greetingName}>{userName}</Text></Text>
                        <Text style={styles.greetingSubtext}>Your safety is our priority</Text>
                    </View>

                    {/* SOS Button */}
                    <View style={styles.sosSection}>
                        {/* Outer Ring Animation */}
                        <Animated.View style={[styles.sosRing, { transform: [{ scale: ringAnim }], opacity: ringOpacity }]} />

                        {/* Glow Ring */}
                        <Animated.View style={[styles.sosGlow, { transform: [{ rotate: glowRotation }] }]}>
                            <LinearGradient
                                colors={["#EF4444", "#EC4899", "#EF4444", "transparent"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.sosGlowGradient}
                            />
                        </Animated.View>

                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                            <TouchableOpacity onPress={handleSOS} activeOpacity={0.8}>
                                <LinearGradient
                                    colors={["#EF4444", "#DC2626", "#B91C1C"]}
                                    style={styles.sosButton}
                                >
                                    <Text style={styles.sosText}>SOS</Text>
                                    <Text style={styles.sosSubtext}>TAP FOR HELP</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>

                        <Text style={styles.shakeHint}>
                            <MaterialIcons name="vibration" size={14} color={colors.lightText} /> Shake 3x for instant SOS
                        </Text>
                    </View>

                    {/* Quick Actions */}
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionsGrid}>
                        {QUICK_ACTIONS.map((action, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.actionCard}
                                onPress={() => navigation.navigate(action.screen)}
                                activeOpacity={0.75}
                            >
                                <View style={[styles.actionIconBg, { backgroundColor: action.color + "15" }]}>
                                    <MaterialIcons name={action.icon} size={26} color={action.color} />
                                </View>
                                <Text style={styles.actionLabel}>{action.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Safety Features */}
                    <Text style={styles.sectionTitle}>Safety Features</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuresScroll}>
                        <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate("VoiceDistress")}>
                            <LinearGradient colors={["#EC489920", "#EC489505"]} style={styles.featureGradient}>
                                <MaterialIcons name="mic" size={28} color={colors.voiceDetect} />
                                <Text style={styles.featureLabel}>Voice{"\n"}Distress</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate("UnsafeArea")}>
                            <LinearGradient colors={["#EF444420", "#EF444405"]} style={styles.featureGradient}>
                                <MaterialIcons name="warning" size={28} color={colors.unsafeArea} />
                                <Text style={styles.featureLabel}>Unsafe{"\n"}Areas</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate("WalkWithMe")}>
                            <LinearGradient colors={["#3B82F620", "#3B82F605"]} style={styles.featureGradient}>
                                <MaterialIcons name="directions-walk" size={28} color={colors.walkWithMe} />
                                <Text style={styles.featureLabel}>Walk{"\n"}With Me</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate("OfflineSOS")}>
                            <LinearGradient colors={["#F59E0B20", "#F59E0B05"]} style={styles.featureGradient}>
                                <MaterialIcons name="signal-wifi-off" size={28} color={colors.offlineSOS} />
                                <Text style={styles.featureLabel}>Offline{"\n"}SOS</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate("SmartWatch")}>
                            <LinearGradient colors={["#8B5CF620", "#8B5CF605"]} style={styles.featureGradient}>
                                <MaterialIcons name="watch" size={28} color={colors.smartWatch} />
                                <Text style={styles.featureLabel}>Smart{"\n"}Watch</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </ScrollView>

                    {/* Safety Tip */}
                    <View style={styles.tipCard}>
                        <LinearGradient colors={[colors.surfaceLight, colors.surface]} style={styles.tipGradient}>
                            <MaterialIcons name="lightbulb" size={22} color={colors.warning} />
                            <Text style={styles.tipText}>
                                Always share your live location with trusted contacts when traveling alone at night.
                            </Text>
                        </LinearGradient>
                    </View>

                    <View style={{ height: 30 }} />
                </ScrollView>
            </SafeAreaView>

            {/* Sidebar */}
            <SidebarDrawer
                visible={sidebarVisible}
                onClose={() => setSidebarVisible(false)}
                navigation={navigation}
                userName={userName}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingHorizontal: 20, paddingTop: 10 },

    // Header
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, marginBottom: 5 },
    menuBtn: { padding: 8, borderRadius: 12, backgroundColor: colors.surface },
    headerCenter: { flexDirection: "row", alignItems: "center", gap: 6 },
    appTitle: { fontSize: 18, fontWeight: "800", color: colors.text, letterSpacing: 0.5 },
    profileBtn: {},
    profileGradient: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },

    // Greeting
    greetingSection: { marginTop: 20, marginBottom: 10 },
    greetingText: { fontSize: 16, color: colors.textSecondary },
    greetingName: { fontSize: 22, fontWeight: "800", color: colors.text },
    greetingSubtext: { fontSize: 13, color: colors.lightText, marginTop: 4 },

    // SOS
    sosSection: { alignItems: "center", marginVertical: 30, position: "relative" },
    sosRing: {
        position: "absolute",
        width: 180,
        height: 180,
        borderRadius: 90,
        borderWidth: 2,
        borderColor: colors.danger,
    },
    sosGlow: {
        position: "absolute",
        width: 200,
        height: 200,
        borderRadius: 100,
        overflow: "hidden",
    },
    sosGlowGradient: {
        flex: 1,
        borderRadius: 100,
        opacity: 0.15,
    },
    sosButton: {
        width: 160,
        height: 160,
        borderRadius: 80,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#EF4444",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 25,
        elevation: 20,
    },
    sosText: { color: colors.white, fontSize: 44, fontWeight: "900", letterSpacing: 3 },
    sosSubtext: { color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: "700", letterSpacing: 2, marginTop: 4 },
    shakeHint: { marginTop: 18, color: colors.lightText, fontSize: 13, fontWeight: "500" },

    // Quick Actions
    sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.text, marginBottom: 16, marginTop: 10 },
    actionsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
    actionCard: {
        backgroundColor: colors.surface,
        width: (width - 64) / 3,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.border,
    },
    actionIconBg: { width: 46, height: 46, borderRadius: 14, justifyContent: "center", alignItems: "center" },
    actionLabel: { marginTop: 8, fontSize: 11, fontWeight: "700", color: colors.textSecondary, textAlign: "center" },

    // Features horizontal
    featuresScroll: { marginBottom: 20 },
    featureCard: { marginRight: 12, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
    featureGradient: { width: 110, height: 110, justifyContent: "center", alignItems: "center", padding: 12 },
    featureLabel: { fontSize: 12, fontWeight: "700", color: colors.text, textAlign: "center", marginTop: 8 },

    // Tip
    tipCard: { borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
    tipGradient: { flexDirection: "row", padding: 16, alignItems: "center" },
    tipText: { marginLeft: 12, flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 20, fontWeight: "500" },
});