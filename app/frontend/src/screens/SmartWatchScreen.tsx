import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar, ScrollView, Switch, PermissionsAndroid, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as ExpoLocation from "expo-location";
import { colors } from "../theme/colors";
import { triggerSOS } from "../services/sosService";

// BLE is available via react-native-ble-plx but requires native build
// We provide a practical BLE scanning + connection interface

type WatchDevice = {
    id: string;
    name: string;
    rssi: number;
};

const GESTURES = [
    { id: "triple_tap", name: "Triple Tap", icon: "touch-app" as const, desc: "Tap watch screen 3 times quickly" },
    { id: "wrist_shake", name: "Wrist Shake", icon: "vibration" as const, desc: "Shake your wrist 3 times" },
    { id: "crown_press", name: "Long Press Crown", icon: "radio-button-checked" as const, desc: "Hold crown for 3 seconds" },
    { id: "double_clench", name: "Double Clench", icon: "pan-tool" as const, desc: "Clench fist twice quickly" },
];

export default function SmartWatchScreen({ navigation }: any) {
    const [scanning, setScanning] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [connectedDevice, setConnectedDevice] = useState<WatchDevice | null>(null);
    const [devices, setDevices] = useState<WatchDevice[]>([]);
    const [selectedGesture, setSelectedGesture] = useState("wrist_shake");
    const [autoSOS, setAutoSOS] = useState(true);
    const [heartMonitor, setHeartMonitor] = useState(false);
    const [lastHeartRate, setLastHeartRate] = useState<number | null>(null);
    const bleManagerRef = useRef<any>(null);
    const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        initBLE();
        return () => {
            if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
            disconnectDevice();
        };
    }, []);

    const initBLE = async () => {
        try {
            const { BleManager } = require("react-native-ble-plx");
            bleManagerRef.current = new BleManager();
            // Auto-start scan once BLE is ready
            setTimeout(() => startScan(), 500);
        } catch {
            console.log("BLE not available");
        }
    };

    const startScan = async () => {
        if (Platform.OS === "android") {
            try {
                const granted = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                ]);
            } catch { }
        }

        setScanning(true);
        setDevices([]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (bleManagerRef.current) {
            try {
                // Scan with no service UUID filter for fastest discovery
                bleManagerRef.current.startDeviceScan(null, { allowDuplicates: false }, (error: any, device: any) => {
                    if (error) return;
                    if (device) {
                        const deviceName = device.name || device.localName || null;
                        // Show all devices, including unnamed ones with IDs
                        setDevices((prev) => {
                            const exists = prev.find((d) => d.id === device.id);
                            if (exists) return prev;
                            return [...prev, { id: device.id, name: deviceName || `Device ${device.id.substring(0, 8)}`, rssi: device.rssi || -80 }];
                        });
                    }
                });

                // Stop after 4 seconds — devices appear instantly as found
                scanTimeoutRef.current = setTimeout(() => {
                    if (bleManagerRef.current) bleManagerRef.current.stopDeviceScan();
                    setScanning(false);
                }, 4000);
            } catch {
                setScanning(false);
            }
        } else {
            // BLE not available
            Alert.alert("BLE Unavailable", "Bluetooth Low Energy is not available. Make sure you're running a development build (not Expo Go) with react-native-ble-plx configured.");
            setScanning(false);
        }
    };

    const connectToDevice = async (device: WatchDevice) => {
        setScanning(false);
        if (bleManagerRef.current) {
            try {
                bleManagerRef.current.stopDeviceScan();
                const connected = await bleManagerRef.current.connectToDevice(device.id);
                await connected.discoverAllServicesAndCharacteristics();
                setIsConnected(true);
                setConnectedDevice(device);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("⌚ Connected!", `Paired with ${device.name}`);

                // Listen for SOS trigger from watch (Heart Rate Service characteristic)
                if (autoSOS) {
                    monitorWatchNotifications(connected);
                }
                return;
            } catch (err) {
                Alert.alert("Connection Failed", "Could not connect to this device. Make sure it's in pairing mode.");
                return;
            }
        }

        // Simulation
        setIsConnected(true);
        setConnectedDevice(device);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("⌚ Connected!", `Paired with ${device.name} (simulated)`);
    };

    const monitorWatchNotifications = async (device: any) => {
        try {
            // Monitor Heart Rate Measurement characteristic (0x2A37)
            device.monitorCharacteristicForService(
                "0000180d-0000-1000-8000-00805f9b34fb", // Heart Rate Service
                "00002a37-0000-1000-8000-00805f9b34fb", // Heart Rate Measurement
                (error: any, characteristic: any) => {
                    if (error) return;
                    if (characteristic?.value) {
                        // Parse heart rate from BLE data
                        const data = Buffer.from(characteristic.value, "base64");
                        const heartRate = data[1];
                        setLastHeartRate(heartRate);

                        // If heart rate spikes abnormally (possible distress)
                        if (heartRate > 150) {
                            handleWatchSOS();
                        }
                    }
                }
            );
        } catch { }
    };

    const disconnectDevice = async () => {
        if (bleManagerRef.current && connectedDevice) {
            try {
                await bleManagerRef.current.cancelDeviceConnection(connectedDevice.id);
            } catch { }
        }
        setIsConnected(false);
        setConnectedDevice(null);
    };

    const handleWatchSOS = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
            "🚨 Watch SOS Triggered!",
            "Your watch detected a distress gesture. Send SOS to emergency contacts?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "SEND SOS", style: "destructive", onPress: async () => {
                        try {
                            const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
                            if (status === "granted") {
                                const loc = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.High });
                                await triggerSOS(loc.coords.latitude, loc.coords.longitude, "SOS triggered from smart watch");
                                Alert.alert("🚨 SOS Sent!", "Emergency contacts notified.");
                            }
                        } catch { Alert.alert("Error", "Failed to send SOS"); }
                    }
                },
            ]
        );
    };

    const handleTestGesture = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert("✅ Gesture Test", `${selectedGesture.replace("_", " ")} detected! (Test mode - no alert sent)`);
    };

    const getSignalBars = (rssi: number) => {
        if (rssi > -50) return 4;
        if (rssi > -60) return 3;
        if (rssi > -70) return 2;
        return 1;
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={[colors.background, "#150D28", colors.backgroundLight]} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Smart Watch</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Watch Status */}
                <View style={styles.watchSection}>
                    <LinearGradient colors={[colors.smartWatch + "20", colors.smartWatch + "05"]} style={styles.watchCircle}>
                        <MaterialIcons name="watch" size={50} color={colors.smartWatch} />
                    </LinearGradient>
                    <Text style={styles.watchStatus}>
                        {isConnected ? connectedDevice?.name : "Not Connected"}
                    </Text>
                    <View style={[styles.statusDot, { backgroundColor: isConnected ? colors.success : colors.lightText }]} />
                    {isConnected && lastHeartRate && (
                        <View style={styles.heartRateRow}>
                            <MaterialIcons name="favorite" size={16} color={colors.secondary} />
                            <Text style={styles.heartRateText}>{lastHeartRate} BPM</Text>
                        </View>
                    )}
                </View>

                {!isConnected ? (
                    <>
                        {/* Scan Button */}
                        <TouchableOpacity onPress={startScan} disabled={scanning} activeOpacity={0.8} style={styles.connectWrapper}>
                            <LinearGradient colors={[colors.smartWatch, "#6D28D9"]} style={styles.connectBtn}>
                                <MaterialIcons name={scanning ? "bluetooth-searching" : "bluetooth"} size={22} color={colors.white} />
                                <Text style={styles.connectBtnText}>{scanning ? "Scanning..." : "Scan for Watches"}</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Discovered Devices */}
                        {devices.length > 0 && (
                            <>
                                <Text style={styles.sectionLabel}>Available Devices</Text>
                                {devices.map((device) => (
                                    <TouchableOpacity key={device.id} style={styles.deviceCard} onPress={() => connectToDevice(device)}>
                                        <MaterialIcons name="watch" size={24} color={colors.smartWatch} />
                                        <View style={styles.deviceInfo}>
                                            <Text style={styles.deviceName}>{device.name}</Text>
                                            <View style={styles.signalRow}>
                                                {[1, 2, 3, 4].map((bar) => (
                                                    <View key={bar} style={[styles.signalBar, { height: 6 + bar * 3, backgroundColor: bar <= getSignalBars(device.rssi) ? colors.success : colors.border }]} />
                                                ))}
                                                <Text style={styles.rssiText}>{device.rssi} dBm</Text>
                                            </View>
                                        </View>
                                        <MaterialIcons name="link" size={20} color={colors.smartWatch} />
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}
                    </>
                ) : (
                    <>
                        {/* Gesture Selection */}
                        <Text style={styles.sectionLabel}>SOS Gesture</Text>
                        {GESTURES.map((g) => (
                            <TouchableOpacity
                                key={g.id}
                                style={[styles.gestureCard, selectedGesture === g.id && styles.gestureCardActive]}
                                onPress={() => setSelectedGesture(g.id)}
                            >
                                <View style={[styles.gestureIcon, selectedGesture === g.id && { backgroundColor: colors.smartWatch + "20" }]}>
                                    <MaterialIcons name={g.icon} size={22} color={selectedGesture === g.id ? colors.smartWatch : colors.lightText} />
                                </View>
                                <View style={styles.gestureInfo}>
                                    <Text style={[styles.gestureName, selectedGesture === g.id && { color: colors.smartWatch }]}>{g.name}</Text>
                                    <Text style={styles.gestureDesc}>{g.desc}</Text>
                                </View>
                                {selectedGesture === g.id && <MaterialIcons name="check-circle" size={22} color={colors.smartWatch} />}
                            </TouchableOpacity>
                        ))}

                        {/* Settings */}
                        <Text style={styles.sectionLabel}>Settings</Text>
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <MaterialIcons name="warning" size={20} color={colors.danger} />
                                <Text style={styles.settingLabel}>Auto-trigger SOS</Text>
                            </View>
                            <Switch value={autoSOS} onValueChange={setAutoSOS} trackColor={{ false: colors.border, true: colors.smartWatch + "40" }} thumbColor={autoSOS ? colors.smartWatch : colors.lightText} />
                        </View>
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <MaterialIcons name="favorite" size={20} color={colors.secondary} />
                                <Text style={styles.settingLabel}>Heart Rate Monitor</Text>
                            </View>
                            <Switch value={heartMonitor} onValueChange={setHeartMonitor} trackColor={{ false: colors.border, true: colors.secondary + "40" }} thumbColor={heartMonitor ? colors.secondary : colors.lightText} />
                        </View>

                        {/* Actions */}
                        <View style={styles.actionRow}>
                            <TouchableOpacity onPress={handleTestGesture} activeOpacity={0.8} style={[styles.actionWrapper, { flex: 1 }]}>
                                <LinearGradient colors={[colors.warning, "#D97706"]} style={styles.actionBtn}>
                                    <MaterialIcons name="science" size={20} color={colors.white} />
                                    <Text style={styles.actionBtnText}>Test</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleWatchSOS} activeOpacity={0.8} style={[styles.actionWrapper, { flex: 1 }]}>
                                <LinearGradient colors={[colors.danger, "#B91C1C"]} style={styles.actionBtn}>
                                    <MaterialIcons name="sos" size={20} color={colors.white} />
                                    <Text style={styles.actionBtnText}>Send SOS</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity onPress={disconnectDevice} style={styles.disconnectBtn}>
                            <Text style={styles.disconnectText}>Disconnect Watch</Text>
                        </TouchableOpacity>
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

    watchSection: { alignItems: "center", marginVertical: 24 },
    watchCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: "center", alignItems: "center", marginBottom: 12 },
    watchStatus: { fontSize: 16, fontWeight: "700", color: colors.text },
    statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 8 },
    heartRateRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
    heartRateText: { fontSize: 14, fontWeight: "700", color: colors.secondary },

    connectWrapper: { borderRadius: 16, overflow: "hidden", marginTop: 12 },
    connectBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 18, gap: 10 },
    connectBtnText: { fontSize: 18, fontWeight: "800", color: colors.white },

    sectionLabel: { fontSize: 16, fontWeight: "800", color: colors.text, marginTop: 24, marginBottom: 12 },

    deviceCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, padding: 14, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
    deviceInfo: { flex: 1, marginLeft: 14 },
    deviceName: { fontSize: 15, fontWeight: "700", color: colors.text },
    signalRow: { flexDirection: "row", alignItems: "flex-end", gap: 2, marginTop: 4 },
    signalBar: { width: 4, borderRadius: 2 },
    rssiText: { fontSize: 10, color: colors.lightText, marginLeft: 6 },

    gestureCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, padding: 14, borderRadius: 14, marginBottom: 8, borderWidth: 1.5, borderColor: colors.border },
    gestureCardActive: { borderColor: colors.smartWatch },
    gestureIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.surfaceLight, justifyContent: "center", alignItems: "center" },
    gestureInfo: { flex: 1, marginLeft: 14 },
    gestureName: { fontSize: 14, fontWeight: "700", color: colors.text },
    gestureDesc: { fontSize: 11, color: colors.lightText, marginTop: 2 },

    settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.surface, padding: 14, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
    settingInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
    settingLabel: { fontSize: 14, fontWeight: "600", color: colors.text },

    actionRow: { flexDirection: "row", gap: 12, marginTop: 20 },
    actionWrapper: { borderRadius: 16, overflow: "hidden" },
    actionBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 16, gap: 8 },
    actionBtnText: { fontSize: 16, fontWeight: "800", color: colors.white },

    disconnectBtn: { alignItems: "center", paddingVertical: 16, marginTop: 8 },
    disconnectText: { color: colors.danger, fontSize: 14, fontWeight: "700" },
});
