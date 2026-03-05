import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar, ScrollView, TextInput, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ExpoLocation from "expo-location";
import * as Haptics from "expo-haptics";
import { colors } from "../theme/colors";
import apiClient from "../services/apiClient";
import { triggerSOS } from "../services/sosService";

export default function OfflineSOSScreen({ navigation }: any) {
    const [contacts, setContacts] = useState<{ name: string; phone: string }[]>([]);
    const [newName, setNewName] = useState("");
    const [newPhone, setNewPhone] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [sendStatus, setSendStatus] = useState<string | null>(null);

    useEffect(() => {
        loadContacts();
    }, []);

    const loadContacts = async () => {
        try {
            const res = await apiClient.get("/contacts");
            if (res.data) {
                const mapped = (Array.isArray(res.data) ? res.data : res.data.data || []).map((c: any) => ({
                    name: c.name,
                    phone: c.phone,
                }));
                setContacts(mapped);
            }
        } catch {
            // Offline - use any locally stored contacts
        }
    };

    const addLocalContact = () => {
        if (!newName.trim() || !newPhone.trim()) {
            Alert.alert("Error", "Name and phone number are required");
            return;
        }
        setContacts([...contacts, { name: newName.trim(), phone: newPhone.trim() }]);
        setNewName("");
        setNewPhone("");
    };

    const removeContact = (index: number) => {
        setContacts(contacts.filter((_, i) => i !== index));
    };

    const sendEmergencySOS = async () => {
        if (contacts.length === 0) {
            Alert.alert("Error", "Add at least one emergency contact first");
            return;
        }

        setIsSending(true);
        setSendStatus("Getting your location...");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

        let latitude = 0, longitude = 0;
        let locationText = "Location unavailable";

        try {
            const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
            if (status === "granted") {
                const loc = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.High });
                latitude = loc.coords.latitude;
                longitude = loc.coords.longitude;
                locationText = `https://maps.google.com/?q=${latitude},${longitude}`;
            }
        } catch { }

        setSendStatus("Sending SOS via server...");

        try {
            // Method 1: Use backend API (Twilio auto-SMS) — fully automatic
            const response = await triggerSOS(latitude, longitude, `Emergency SOS - ${locationText}`);
            if (response.success) {
                setSendStatus(null);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert(
                    "✅ Emergency SOS Sent!",
                    "SMS sent automatically to all emergency contacts via Twilio. No manual action needed.",
                    [{ text: "OK", onPress: () => navigation.navigate("SOSActivated", { alertId: response.alertId }) }]
                );
                setIsSending(false);
                return;
            }
        } catch {
            // Backend unavailable - fall through to direct SMS
        }

        setSendStatus("Server unavailable. Trying direct SMS...");

        try {
            // Method 2: Fallback - Use native SMS intent (requires user to press send)
            const SMS = require("expo-sms");
            const smsAvailable = await SMS.isAvailableAsync();
            if (smsAvailable) {
                const phones = contacts.map((c) => c.phone);
                const message = `🚨 EMERGENCY SOS 🚨\n\nI need help! This is an emergency alert from SafeGuard app.\n\nMy location: ${locationText}\n\nPlease call me or send help immediately!`;
                await SMS.sendSMSAsync(phones, message);
                Alert.alert("✅ SMS Opened", "Please press send to complete the SMS.");
            } else {
                Alert.alert("Error", "SMS not available and server is offline.");
            }
        } catch {
            Alert.alert("Error", "Could not send emergency messages. Please try calling emergency services directly.");
        }

        setSendStatus(null);
        setIsSending(false);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={[colors.background, "#1A1508", colors.backgroundLight]} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Emergency SOS</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.iconSection}>
                    <LinearGradient colors={[colors.danger + "20", colors.danger + "05"]} style={styles.iconCircle}>
                        <MaterialIcons name="sos" size={44} color={colors.danger} />
                    </LinearGradient>
                    <Text style={styles.subtitle}>Send emergency SMS alerts automatically to all contacts — no manual sending required</Text>
                </View>

                {/* How it works */}
                <View style={styles.howItWorks}>
                    <Text style={styles.howTitle}>How it works</Text>
                    <View style={styles.howRow}>
                        <View style={[styles.howStep, { backgroundColor: colors.info + "15" }]}>
                            <Text style={styles.howNum}>1</Text>
                        </View>
                        <Text style={styles.howText}>Your GPS location is captured</Text>
                    </View>
                    <View style={styles.howRow}>
                        <View style={[styles.howStep, { backgroundColor: colors.success + "15" }]}>
                            <Text style={styles.howNum}>2</Text>
                        </View>
                        <Text style={styles.howText}>SMS sent automatically via Twilio (no need to press send)</Text>
                    </View>
                    <View style={styles.howRow}>
                        <View style={[styles.howStep, { backgroundColor: colors.warning + "15" }]}>
                            <Text style={styles.howNum}>3</Text>
                        </View>
                        <Text style={styles.howText}>Contacts receive your location + Google Maps link</Text>
                    </View>
                </View>

                {/* Contacts */}
                <Text style={styles.sectionLabel}>Emergency Contacts ({contacts.length})</Text>
                {contacts.map((c, i) => (
                    <View key={i} style={styles.contactCard}>
                        <View style={styles.contactAvatar}>
                            <Text style={styles.contactInitial}>{c.name[0]}</Text>
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactName}>{c.name}</Text>
                            <Text style={styles.contactPhone}>{c.phone}</Text>
                        </View>
                        <TouchableOpacity onPress={() => removeContact(i)}>
                            <MaterialIcons name="close" size={20} color={colors.danger} />
                        </TouchableOpacity>
                    </View>
                ))}

                {/* Add Contact */}
                <View style={styles.addSection}>
                    <TextInput style={styles.input} placeholder="Name" placeholderTextColor={colors.lightText} value={newName} onChangeText={setNewName} />
                    <TextInput style={styles.input} placeholder="Phone (+91...)" placeholderTextColor={colors.lightText} value={newPhone} onChangeText={setNewPhone} keyboardType="phone-pad" />
                    <TouchableOpacity onPress={addLocalContact} style={styles.addBtn}>
                        <MaterialIcons name="add" size={20} color={colors.offlineSOS} />
                        <Text style={styles.addBtnText}>Add Contact</Text>
                    </TouchableOpacity>
                </View>

                {/* SOS Button */}
                <TouchableOpacity
                    onPress={sendEmergencySOS}
                    activeOpacity={0.8}
                    disabled={isSending}
                    style={[styles.sosBtnWrapper, isSending && { opacity: 0.7 }]}
                >
                    <LinearGradient colors={[colors.danger, "#B91C1C"]} style={styles.sosBtn}>
                        {isSending ? (
                            <View style={styles.sendingRow}>
                                <ActivityIndicator color={colors.white} />
                                <Text style={styles.sosBtnText}>{sendStatus || "Sending..."}</Text>
                            </View>
                        ) : (
                            <>
                                <MaterialIcons name="sos" size={28} color={colors.white} />
                                <Text style={styles.sosBtnText}>Send Emergency SOS</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

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

    iconSection: { alignItems: "center", marginVertical: 20 },
    iconCircle: { width: 90, height: 90, borderRadius: 45, justifyContent: "center", alignItems: "center", marginBottom: 12 },
    subtitle: {
        textAlign: "center", color: colors.textSecondary, fontSize: 14, lineHeight: 22
    },

    howItWorks: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
    howTitle: { fontSize: 14, fontWeight: "800", color: colors.text, marginBottom: 12 },
    howRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
    howStep: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center" },
    howNum: { fontSize: 12, fontWeight: "800", color: colors.text },
    howText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 18 },

    sectionLabel: { fontSize: 16, fontWeight: "800", color: colors.text, marginTop: 8, marginBottom: 12 },

    contactCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, padding: 14, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
    contactAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.danger + "20", justifyContent: "center", alignItems: "center" },
    contactInitial: { fontSize: 18, fontWeight: "800", color: colors.danger },
    contactInfo: { flex: 1, marginLeft: 12 },
    contactName: { fontSize: 14, fontWeight: "700", color: colors.text },
    contactPhone: { fontSize: 12, color: colors.lightText, marginTop: 2 },

    addSection: { marginTop: 8 },
    input: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
    addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: colors.offlineSOS, borderStyle: "dashed" },
    addBtnText: { fontSize: 14, fontWeight: "700", color: colors.offlineSOS },

    sosBtnWrapper: { borderRadius: 16, overflow: "hidden", marginTop: 24 },
    sosBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 18, gap: 10 },
    sosBtnText: { fontSize: 18, fontWeight: "800", color: colors.white },
    sendingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
});
