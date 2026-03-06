import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar, ScrollView, Dimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ExpoLocation from "expo-location";
import { colors } from "../theme/colors";
import apiClient from "../services/apiClient";

const { width } = Dimensions.get("window");

const CATEGORIES = [
    { label: "Harassment", icon: "report-problem" as const, color: "#EF4444" },
    { label: "Stalking", icon: "visibility" as const, color: "#F59E0B" },
    { label: "Unsafe Area", icon: "warning" as const, color: "#F97316" },
    { label: "Assault", icon: "dangerous" as const, color: "#DC2626" },
];

export default function UnsafeAreaScreen({ navigation }: any) {
    const [incidents, setIncidents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [reporting, setReporting] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
            if (status === "granted") {
                const loc = await ExpoLocation.getCurrentPositionAsync({});
                setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
            }

            const response = await apiClient.get("/incidents/heatmap");
            if (response.data.success) {
                setIncidents(response.data.data || []);
            }
        } catch (error) {
            console.log("Error loading incidents:", error);
        } finally {
            setLoading(false);
        }
    };

    const reportIncident = async (category: string) => {
        if (!userLocation) {
            Alert.alert("Error", "Location is required to report an incident");
            return;
        }

        setReporting(true);
        try {
            const response = await apiClient.post("/incidents/report", {
                category,
                description: `${category} reported at this location`,
                latitude: userLocation.lat,
                longitude: userLocation.lng,
            });
            if (response.data.success) {
                Alert.alert("✅ Report Submitted", "Thank you for helping keep others safe!");
                setSelectedCategory("");
                loadData();
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to report incident");
        } finally {
            setReporting(false);
        }
    };

    const getCategoryStats = (cat: string) => incidents.filter((i) => i.category === cat).length;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={[colors.background, "#1A0F0F", colors.backgroundLight]} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Unsafe Areas</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Alert Banner */}
                <View style={styles.alertBanner}>
                    <LinearGradient colors={[colors.danger + "20", colors.danger + "05"]} style={styles.alertGradient}>
                        <MaterialIcons name="location-on" size={24} color={colors.danger} />
                        <View style={styles.alertTextContainer}>
                            <Text style={styles.alertTitle}>Area Safety Status</Text>
                            <Text style={styles.alertSubtext}>
                                {incidents.length === 0 ? "No incidents reported nearby" : `${incidents.length} incidents reported in your area`}
                            </Text>
                        </View>
                    </LinearGradient>
                </View>

                {/* Stats Cards */}
                <Text style={styles.sectionLabel}>Incident Reports</Text>
                <View style={styles.statsGrid}>
                    {CATEGORIES.map((cat) => (
                        <View key={cat.label} style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: cat.color + "15" }]}>
                                <MaterialIcons name={cat.icon} size={24} color={cat.color} />
                            </View>
                            <Text style={styles.statCount}>{getCategoryStats(cat.label)}</Text>
                            <Text style={styles.statLabel}>{cat.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Report Section */}
                <Text style={styles.sectionLabel}>Report Incident</Text>
                <Text style={styles.reportSubtext}>Help others by reporting unsafe situations</Text>

                <View style={styles.reportGrid}>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat.label}
                            style={[styles.reportBtn, selectedCategory === cat.label && { borderColor: cat.color }]}
                            onPress={() => {
                                Alert.alert(
                                    `Report ${cat.label}`,
                                    `Report a ${cat.label.toLowerCase()} incident at your current location?`,
                                    [
                                        { text: "Cancel", style: "cancel" },
                                        { text: "Report", onPress: () => reportIncident(cat.label) },
                                    ]
                                );
                            }}
                            disabled={reporting}
                        >
                            <MaterialIcons name={cat.icon} size={28} color={cat.color} />
                            <Text style={styles.reportBtnLabel}>{cat.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Recent Incidents */}
                {incidents.length > 0 && (
                    <>
                        <Text style={styles.sectionLabel}>Recent Reports</Text>
                        {incidents.slice(0, 5).map((incident, i) => (
                            <View key={i} style={styles.incidentCard}>
                                <MaterialIcons
                                    name="warning"
                                    size={20}
                                    color={CATEGORIES.find((c) => c.label === incident.category)?.color || colors.danger}
                                />
                                <View style={styles.incidentInfo}>
                                    <Text style={styles.incidentCategory}>{incident.category}</Text>
                                    <Text style={styles.incidentDate}>
                                        {incident.reportedAt ? new Date(incident.reportedAt).toLocaleDateString() : "Recent"}
                                    </Text>
                                </View>
                            </View>
                        ))}
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
    scroll: { flex: 1, paddingHorizontal: 20 },

    alertBanner: { borderRadius: 16, overflow: "hidden", marginTop: 16, borderWidth: 1, borderColor: colors.danger + "20" },
    alertGradient: { flexDirection: "row", padding: 16, alignItems: "center" },
    alertTextContainer: { marginLeft: 14 },
    alertTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
    alertSubtext: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

    sectionLabel: { fontSize: 16, fontWeight: "800", color: colors.text, marginTop: 24, marginBottom: 12 },
    statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10 },
    statCard: { width: (width - 60) / 2, backgroundColor: colors.surface, borderRadius: 16, padding: 16, alignItems: "center", borderWidth: 1, borderColor: colors.border },
    statIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 8 },
    statCount: { fontSize: 28, fontWeight: "900", color: colors.text },
    statLabel: { fontSize: 12, fontWeight: "600", color: colors.lightText, marginTop: 2 },

    reportSubtext: { fontSize: 13, color: colors.lightText, marginBottom: 12, marginTop: -8 },
    reportGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10 },
    reportBtn: { width: (width - 60) / 2, backgroundColor: colors.surface, borderRadius: 16, padding: 18, alignItems: "center", borderWidth: 1.5, borderColor: colors.border },
    reportBtnLabel: { fontSize: 13, fontWeight: "700", color: colors.textSecondary, marginTop: 8 },

    incidentCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
    incidentInfo: { marginLeft: 12, flex: 1 },
    incidentCategory: { fontSize: 14, fontWeight: "700", color: colors.text },
    incidentDate: { fontSize: 11, color: colors.lightText, marginTop: 2 },
});
