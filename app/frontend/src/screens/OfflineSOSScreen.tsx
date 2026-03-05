import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar, ScrollView, TextInput } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ExpoLocation from "expo-location";
import * as SMS from "expo-sms";
import * as Haptics from "expo-haptics";
import { colors } from "../theme/colors";
import apiClient from "../services/apiClient";

export default function OfflineSOSScreen({ navigation }: any) {
    const [contacts, setContacts] = useState<{ name: string; phone: string }[]>([]);
    const [newName, setNewName] = useState("");
    const [newPhone, setNewPhone] = useState("");
    const [smsAvailable, setSmsAvailable] = useState(false);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        checkSMS();
        loadContacts();
    }, []);

    const checkSMS = async () => {
        const available = await SMS.isAvailableAsync();
        setSmsAvailable(available);
    };

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
            // Offline - use stored contacts
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

    const sendOfflineSOS = async () => {
        if (contacts.length === 0) {
            Alert.alert("Error", "Add at least one emergency contact first");
            return;
        }
        if (!smsAvailable) {
            Alert.alert("Error", "SMS is not available on this device");
            return;
        }

        setIsSending(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

        let locationText = "Location unavailable";
        try {
            const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
            if (status === "granted") {
                const loc = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.High });
                locationText = `https://maps.google.com/?q=${loc.coords.latitude},${loc.coords.longitude}`;
            }
        } catch { }

        const message = `🚨 EMERGENCY SOS 🚨\n\nI need help! This is an emergency alert from SafeGuard app.\n\nMy location: ${locationText}\n\nPlease call me or send help immediately!`;

        try {
            const phones = contacts.map((c) => c.phone);
            await SMS.sendSMSAsync(phones, message);
            Alert.alert("✅ SOS Sent!", "Emergency SMS sent to all contacts.");
        } catch (err) {
            Alert.alert("Error", "Failed to send SMS");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={[colors.background, "#1A1508", colors.backgroundLight]} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Offline SOS</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.iconSection}>
                    <LinearGradient colors={[colors.offlineSOS + "20", colors.offlineSOS + "05"]} style={styles.iconCircle}>
                        <MaterialIcons name="signal-wifi-off" size={44} color={colors.offlineSOS} />
                    </LinearGradient>
                    <Text style={styles.subtitle}>Send emergency SMS alerts even without internet connection</Text>
                </View>

                {/* Status */}
                <View style={styles.statusCard}>
                    <View style={styles.statusRow}>
                        <MaterialIcons name="sms" size={20} color={smsAvailable ? colors.success : colors.danger} />
                        <Text style={styles.statusText}>SMS: {smsAvailable ? "Available" : "Not Available"}</Text>
                    </View>
                    <View style={styles.statusRow}>
                        <MaterialIcons name="people" size={20} color={contacts.length > 0 ? colors.success : colors.warning} />
                        <Text style={styles.statusText}>{contacts.length} Emergency Contact{contacts.length !== 1 ? "s" : ""}</Text>
                    </View>
                </View>

                {/* Contacts */}
                <Text style={styles.sectionLabel}>Emergency Contacts</Text>
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
                    <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor={colors.lightText} value={newPhone} onChangeText={setNewPhone} keyboardType="phone-pad" />
                    <TouchableOpacity onPress={addLocalContact} style={styles.addBtn}>
                        <MaterialIcons name="add" size={20} color={colors.offlineSOS} />
                        <Text style={styles.addBtnText}>Add Contact</Text>
                    </TouchableOpacity>
                </View>

                {/* SOS Button */}
                <TouchableOpacity
                    onPress={sendOfflineSOS}
                    activeOpacity={0.8}
                    disabled={isSending}
                    style={[styles.sosBtnWrapper, isSending && { opacity: 0.6 }]}
                >
                    <LinearGradient colors={[colors.danger, "#B91C1C"]} style={styles.sosBtn}>
                        <MaterialIcons name="sos" size={28} color={colors.white} />
                        <Text style={styles.sosBtnText}>{isSending ? "Sending..." : "Send Offline SOS"}</Text>
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
    subtitle: { textAlign: "center", color: colors.textSecondary, fontSize: 14, lineHeight: 22 },

    statusCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 10 },
    statusRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    statusText: { fontSize: 14, color: colors.text, fontWeight: "600" },

    sectionLabel: { fontSize: 16, fontWeight: "800", color: colors.text, marginTop: 24, marginBottom: 12 },

    contactCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, padding: 14, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
    contactAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.offlineSOS + "20", justifyContent: "center", alignItems: "center" },
    contactInitial: { fontSize: 18, fontWeight: "800", color: colors.offlineSOS },
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
});
