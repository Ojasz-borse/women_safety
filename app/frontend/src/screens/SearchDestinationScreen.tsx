import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, StatusBar, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/colors";

export default function SearchDestinationScreen({ navigation }: any) {
    const [destination, setDestination] = useState("");

    const searchRoute = () => {
        if (!destination.trim()) {
            Alert.alert("Error", "Please enter a destination");
            return;
        }
        navigation.navigate("SafeRouteMap", { destination: destination.trim() });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={[colors.background, "#0F1520", colors.backgroundLight]} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Safe Route</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.iconSection}>
                    <LinearGradient colors={[colors.info + "20", colors.info + "05"]} style={styles.iconCircle}>
                        <MaterialIcons name="directions" size={50} color={colors.info} />
                    </LinearGradient>
                    <Text style={styles.subtitle}>Enter your destination to find the safest route from your current location</Text>
                </View>

                <View style={styles.inputContainer}>
                    <MaterialIcons name="my-location" size={20} color={colors.success} style={{ marginRight: 12 }} />
                    <Text style={styles.currentLoc}>Current Location</Text>
                    <View style={[styles.locDot, { backgroundColor: colors.success }]} />
                </View>

                <View style={styles.dotLine}>
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                </View>

                <View style={styles.inputContainer}>
                    <MaterialIcons name="place" size={20} color={colors.danger} style={{ marginRight: 12 }} />
                    <TextInput
                        placeholder="Enter destination"
                        placeholderTextColor={colors.lightText}
                        style={styles.input}
                        value={destination}
                        onChangeText={setDestination}
                        onSubmitEditing={searchRoute}
                        returnKeyType="search"
                    />
                </View>

                <TouchableOpacity onPress={searchRoute} activeOpacity={0.8} style={styles.searchWrapper}>
                    <LinearGradient colors={[colors.info, "#2563EB"]} style={styles.searchBtn}>
                        <MaterialIcons name="navigation" size={22} color={colors.white} />
                        <Text style={styles.searchBtnText}>Find Safe Route</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.infoCard}>
                    <MaterialIcons name="shield" size={18} color={colors.success} />
                    <Text style={styles.infoText}>Routes are analyzed against reported incidents to suggest the safest path.</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 55, paddingBottom: 10 },
    backBtn: { padding: 8, borderRadius: 12, backgroundColor: colors.surface },
    title: { fontSize: 20, fontWeight: "800", color: colors.text },
    content: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },

    iconSection: { alignItems: "center", marginBottom: 30 },
    iconCircle: { width: 90, height: 90, borderRadius: 45, justifyContent: "center", alignItems: "center", marginBottom: 14 },
    subtitle: { textAlign: "center", color: colors.textSecondary, fontSize: 14, lineHeight: 22 },

    inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: colors.border },
    currentLoc: { flex: 1, fontSize: 15, color: colors.success, fontWeight: "600" },
    locDot: { width: 8, height: 8, borderRadius: 4 },
    input: { flex: 1, fontSize: 15, color: colors.text },

    dotLine: { alignItems: "center", gap: 4, paddingVertical: 6 },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.border },

    searchWrapper: { borderRadius: 16, overflow: "hidden", marginTop: 24 },
    searchBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 18, gap: 10 },
    searchBtnText: { fontSize: 18, fontWeight: "800", color: colors.white },

    infoCard: { flexDirection: "row", backgroundColor: colors.surface, padding: 14, borderRadius: 12, marginTop: 20, borderWidth: 1, borderColor: colors.border },
    infoText: { flex: 1, marginLeft: 10, fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
});