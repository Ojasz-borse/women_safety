import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar, ScrollView, TextInput } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { colors } from "../theme/colors";
import {
    getCollaborationStatus,
    sendCollaborationInvite,
    acceptCollaborationInvite,
    declineCollaborationInvite,
    removeCollaborator,
    getMergedContacts
} from "../services/collaborationService";

type CollaboratorStatus = {
    hasCollaborator: boolean;
    collaborator?: {
        _id: string;
        name: string;
        email: string;
        phoneNumber?: string;
    };
    hasPendingInvite: boolean;
    inviteFrom?: {
        _id: string;
        name: string;
        email: string;
    };
};

type MergedContactsData = {
    myContacts: any[];
    collaboratorContacts: any[];
    mergedContacts: any[];
};

export default function CollaborationScreen({ navigation }: any) {
    const [inviteEmail, setInviteEmail] = useState("");
    const [status, setStatus] = useState<CollaboratorStatus | null>(null);
    const [mergedContacts, setMergedContacts] = useState<MergedContactsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStatus();
    }, []);

    const loadStatus = async () => {
        try {
            setLoading(true);
            const statusData = await getCollaborationStatus();
            setStatus(statusData.data);

            if (statusData.data.hasCollaborator) {
                const contactsData = await getMergedContacts();
                setMergedContacts(contactsData.data);
            }
        } catch (error: any) {
            console.log("Failed to load collaboration status:", error.message);
            Alert.alert("Error", "Failed to load collaboration status");
        } finally {
            setLoading(false);
        }
    };

    const handleSendInvite = async () => {
        if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
            Alert.alert("Invalid Email", "Please enter a valid email address");
            return;
        }

        try {
            await sendCollaborationInvite(inviteEmail.trim());
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
                "✅ Invite Sent!",
                `Collaboration invite sent to ${inviteEmail}. They will receive an email notification.`
            );
            setInviteEmail("");
            loadStatus();
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Invite Failed", error.message || "Failed to send invite");
        }
    };

    const handleAcceptInvite = async () => {
        try {
            await acceptCollaborationInvite();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("✅ Collaboration Started!", "You and your partner are now connected. Emergency contacts are synced!");
            loadStatus();
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Error", error.message || "Failed to accept invite");
        }
    };

    const handleDeclineInvite = async () => {
        try {
            await declineCollaborationInvite();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Invite Declined", "Collaboration invite has been declined");
            loadStatus();
        } catch (error: any) {
            Alert.alert("Error", "Failed to decline invite");
        }
    };

    const handleRemoveCollaborator = () => {
        Alert.alert(
            "Remove Collaborator",
            "Are you sure? This will unlink your emergency contacts. SOS alerts will no longer be sent to both sets of contacts.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await removeCollaborator();
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            Alert.alert("Collaborator Removed", "You are no longer linked with your partner");
                            setStatus(null);
                            setMergedContacts(null);
                            loadStatus();
                        } catch (error: any) {
                            Alert.alert("Error", "Failed to remove collaborator");
                        }
                    }
                }
            ]
        );
    };

    const renderCollaboratorSection = () => {
        if (!status?.hasCollaborator || !status.collaborator) return null;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <MaterialIcons name="people" size={24} color={colors.success} />
                    <Text style={styles.cardTitle}>Your Collaborator</Text>
                </View>

                <View style={styles.collaboratorInfo}>
                    <View style={styles.collaboratorAvatar}>
                        <MaterialIcons name="person" size={32} color={colors.white} />
                    </View>
                    <View style={styles.collaboratorDetails}>
                        <Text style={styles.collaboratorName}>{status.collaborator.name}</Text>
                        <Text style={styles.collaboratorEmail}>{status.collaborator.email}</Text>
                        {status.collaborator.phoneNumber && (
                            <Text style={styles.collaboratorPhone}>{status.collaborator.phoneNumber}</Text>
                        )}
                    </View>
                </View>

                <View style={styles.infoBox}>
                    <MaterialIcons name="info-outline" size={18} color={colors.info} />
                    <Text style={styles.infoText}>
                        When either of you triggers SOS, alerts are sent to BOTH sets of emergency contacts.
                    </Text>
                </View>

                <TouchableOpacity onPress={handleRemoveCollaborator} style={styles.removeBtn}>
                    <MaterialIcons name="person-remove" size={20} color={colors.danger} />
                    <Text style={styles.removeText}>Remove Collaborator</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderPendingInviteSection = () => {
        if (!status?.hasPendingInvite || !status.inviteFrom) return null;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <MaterialIcons name="mail-outline" size={24} color={colors.warning} />
                    <Text style={styles.cardTitle}>Pending Invite</Text>
                </View>

                <Text style={styles.inviteText}>
                    <Text style={styles.inviteName}>{status.inviteFrom.name}</Text> has invited you to collaborate
                </Text>

                <View style={styles.inviteActions}>
                    <TouchableOpacity onPress={handleAcceptInvite} style={[styles.inviteBtn, styles.acceptBtn]}>
                        <MaterialIcons name="check" size={22} color={colors.white} />
                        <Text style={styles.inviteBtnText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDeclineInvite} style={[styles.inviteBtn, styles.declineBtn]}>
                        <MaterialIcons name="close" size={22} color={colors.white} />
                        <Text style={styles.inviteBtnText}>Decline</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderInviteSection = () => {
        if (status?.hasCollaborator || status?.hasPendingInvite) return null;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <MaterialIcons name="person-add" size={24} color={colors.primary} />
                    <Text style={styles.cardTitle}>Invite a Partner</Text>
                </View>

                <Text style={styles.description}>
                    Connect with a trusted person (friend, family, partner). When either of you triggers SOS, 
                    alerts go to BOTH sets of emergency contacts.
                </Text>

                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter their email"
                        placeholderTextColor={colors.lightText}
                        value={inviteEmail}
                        onChangeText={setInviteEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={handleSendInvite} style={styles.sendBtn}>
                        <MaterialIcons name="send" size={22} color={colors.white} />
                    </TouchableOpacity>
                </View>

                <View style={styles.howItWorks}>
                    <Text style={styles.howItWorksTitle}>How it works:</Text>
                    <View style={styles.step}>
                        <MaterialIcons name="check-circle" size={16} color={colors.success} />
                        <Text style={styles.stepText}>Send invite to their email</Text>
                    </View>
                    <View style={styles.step}>
                        <MaterialIcons name="check-circle" size={16} color={colors.success} />
                        <Text style={styles.stepText}>They accept the invite</Text>
                    </View>
                    <View style={styles.step}>
                        <MaterialIcons name="check-circle" size={16} color={colors.success} />
                        <Text style={styles.stepText}>Emergency contacts sync automatically</Text>
                    </View>
                    <View style={styles.step}>
                        <MaterialIcons name="check-circle" size={16} color={colors.success} />
                        <Text style={styles.stepText}>SOS from either person → alerts to ALL contacts</Text>
                    </View>
                </View>
            </View>
        );
    };

    const renderMergedContactsSection = () => {
        if (!mergedContacts || !status?.hasCollaborator) return null;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <MaterialIcons name="contacts" size={24} color={colors.evidence} />
                    <Text style={styles.cardTitle}>Synced Emergency Contacts</Text>
                </View>

                <Text style={styles.sectionLabel}>Your Contacts ({mergedContacts.myContacts.length})</Text>
                {mergedContacts.myContacts.length === 0 ? (
                    <Text style={styles.emptyText}>No emergency contacts yet</Text>
                ) : (
                    mergedContacts.myContacts.map((contact, index) => (
                        <View key={index} style={styles.contactItem}>
                            <MaterialIcons name="person" size={20} color={colors.primary} />
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactName}>{contact.name}</Text>
                                <Text style={styles.contactPhone}>{contact.phone}</Text>
                            </View>
                        </View>
                    ))
                )}

                <Text style={[styles.sectionLabel, { marginTop: 16 }]}>
                    Collaborator's Contacts ({mergedContacts.collaboratorContacts.length})
                </Text>
                {mergedContacts.collaboratorContacts.length === 0 ? (
                    <Text style={styles.emptyText}>No contacts from collaborator</Text>
                ) : (
                    mergedContacts.collaboratorContacts.map((contact, index) => (
                        <View key={index} style={styles.contactItem}>
                            <MaterialIcons name="person-outline" size={20} color={colors.success} />
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactName}>{contact.name}</Text>
                                <Text style={styles.contactPhone}>{contact.phone}</Text>
                            </View>
                        </View>
                    ))
                )}

                <View style={styles.totalBox}>
                    <MaterialIcons name="people-outline" size={20} color={colors.warning} />
                    <Text style={styles.totalText}>
                        Total alerts will be sent to {mergedContacts.mergedContacts.length} contacts when SOS is triggered
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={[colors.background, "#0D1A15", colors.backgroundLight]} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Safety Collaboration</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.subtitle}>
                    Partner with someone for enhanced safety. SOS alerts will be sent to both sets of emergency contacts.
                </Text>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <MaterialIcons name="hourglass-empty" size={40} color={colors.lightText} />
                        <Text style={styles.loadingText}>Loading...</Text>
                    </View>
                ) : (
                    <>
                        {renderCollaboratorSection()}
                        {renderPendingInviteSection()}
                        {renderInviteSection()}
                        {renderMergedContactsSection()}

                        <View style={styles.infoCard}>
                            <MaterialIcons name="security" size={18} color={colors.info} />
                            <Text style={styles.infoText}>
                                Collaboration ensures maximum safety. When either person is in danger and triggers SOS, 
                                all emergency contacts from both users are notified immediately with the location.
                            </Text>
                        </View>

                        <View style={{ height: 30 }} />
                    </>
                )}
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

    loadingContainer: { alignItems: "center", paddingVertical: 60 },
    loadingText: { color: colors.lightText, marginTop: 12, fontSize: 15 },

    card: { backgroundColor: colors.surface, borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
    cardTitle: { fontSize: 18, fontWeight: "800", color: colors.text },

    description: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: 16 },

    inputRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
    input: { flex: 1, backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border },
    sendBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 18, justifyContent: "center", alignItems: "center" },

    howItWorks: { backgroundColor: colors.background, borderRadius: 12, padding: 14, marginTop: 8 },
    howItWorksTitle: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 10 },
    step: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
    stepText: { fontSize: 12, color: colors.textSecondary, flex: 1 },

    collaboratorInfo: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
    collaboratorAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.success, justifyContent: "center", alignItems: "center" },
    collaboratorDetails: { flex: 1 },
    collaboratorName: { fontSize: 18, fontWeight: "700", color: colors.text },
    collaboratorEmail: { fontSize: 13, color: colors.lightText, marginTop: 2 },
    collaboratorPhone: { fontSize: 13, color: colors.lightText },

    infoBox: { flexDirection: "row", backgroundColor: colors.info + "15", borderRadius: 12, padding: 12, marginBottom: 16, gap: 10 },
    infoText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 18 },

    removeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, backgroundColor: colors.danger + "15", borderRadius: 12, borderWidth: 1, borderColor: colors.danger },
    removeText: { fontSize: 15, fontWeight: "700", color: colors.danger },

    inviteText: { fontSize: 14, color: colors.textSecondary, marginBottom: 16, textAlign: "center" },
    inviteName: { fontWeight: "700", color: colors.text },
    inviteActions: { flexDirection: "row", gap: 10 },
    inviteBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12 },
    acceptBtn: { backgroundColor: colors.success },
    declineBtn: { backgroundColor: colors.danger },
    inviteBtnText: { fontSize: 15, fontWeight: "700", color: colors.white },

    sectionLabel: { fontSize: 13, fontWeight: "700", color: colors.lightText, marginBottom: 10, marginTop: 8 },
    contactItem: { flexDirection: "row", alignItems: "center", backgroundColor: colors.background, padding: 12, borderRadius: 10, marginBottom: 6 },
    contactInfo: { flex: 1, marginLeft: 10 },
    contactName: { fontSize: 14, fontWeight: "600", color: colors.text },
    contactPhone: { fontSize: 12, color: colors.lightText, marginTop: 2 },
    emptyText: { fontSize: 13, color: colors.lightText, fontStyle: "italic", paddingVertical: 8 },

    totalBox: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.warning + "15", borderRadius: 12, padding: 12, marginTop: 16 },
    totalText: { flex: 1, fontSize: 13, fontWeight: "600", color: colors.textSecondary },

    infoCard: { flexDirection: "row", backgroundColor: colors.surface, padding: 14, borderRadius: 12, marginTop: 16, borderWidth: 1, borderColor: colors.border, gap: 10 },
    infoText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
});
