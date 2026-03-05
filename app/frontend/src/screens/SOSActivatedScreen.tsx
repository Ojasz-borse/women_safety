import React, { useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert
} from "react-native";
import { updateSOSLocation, resolveSOS, cancelSOS } from "../services/sosService";
import * as ExpoLocation from "expo-location";

import { colors } from "../theme/colors";

export default function SOSActivatedScreen({ navigation, route }: any) {

    const { alertId } = route.params || {};

    useEffect(() => {
        startLocationTracking();
        return () => {
            // Cleanup
        };
    }, []);

    const startLocationTracking = async () => {
        try {
            const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission required", "Location permission required for tracking");
                return;
            }

            // Update location every 10 seconds
            const interval = setInterval(async () => {
                try {
                    const location = await ExpoLocation.getCurrentPositionAsync({
                        accuracy: ExpoLocation.Accuracy.High
                    });

                    // Get address from coordinates
                    let address = "Live Location";
                    try {
                        const geo = await ExpoLocation.reverseGeocodeAsync({
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude
                        });
                        if (geo.length > 0) {
                            address = `${geo[0].street || ""}, ${geo[0].city || ""}`.trim() || "Live Location";
                        }
                    } catch (err) {
                        console.log("Reverse geocoding error:", err);
                    }

                    if (alertId) {
                        await updateSOSLocation(
                            alertId,
                            location.coords.latitude,
                            location.coords.longitude,
                            address
                        );
                        console.log("Location updated:", address);
                    }
                } catch (err) {
                    console.log("Location update error:", err);
                }
            }, 10000); // 10 seconds

            return () => clearInterval(interval);
        } catch (error) {
            console.log("Location tracking error:", error);
        }
    };

    const handleSafe = async () => {
        try {
            if (alertId) {
                await resolveSOS(alertId, "Reached safely");
            }
            Alert.alert("Safe", "You have marked yourself as safe");
            navigation.navigate("HomeDashboard");
        } catch (error) {
            console.log("Error resolving SOS:", error);
            Alert.alert("Error", "Failed to resolve SOS");
        }
    };

    const handleCancel = async () => {
        Alert.alert(
            "Cancel SOS",
            "Are you sure you want to cancel the SOS?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            if (alertId) {
                                await cancelSOS(alertId);
                            }
                            navigation.navigate("HomeDashboard");
                        } catch (error) {
                            console.log("Error cancelling SOS:", error);
                            Alert.alert("Error", "Failed to cancel SOS");
                        }
                    }
                }
            ]
        );
    };

    return (

        <View style={styles.container}>

            <Text style={styles.alert}>
                🚨 SOS Alert Sent
            </Text>

            <Text style={styles.info}>
                Your emergency contacts can now track your location
            </Text>

            <TouchableOpacity
                style={styles.callBtn}
                onPress={() => navigation.navigate("EmergencyCall")}
            >
                <Text style={styles.callText}>
                    Call Emergency
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.safeBtn}
                onPress={handleSafe}
            >
                <Text style={styles.safeText}>
                    I am Safe
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleCancel}
            >
                <Text style={styles.cancelText}>
                    Cancel SOS
                </Text>
            </TouchableOpacity>

        </View>

    );

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
        padding: 30,
    },
    alert: {
        fontSize: 32,
        color: colors.danger,
        fontWeight: "900",
        marginBottom: 16,
        textAlign: "center",
        letterSpacing: 0.5,
    },
    info: {
        fontSize: 18,
        color: colors.text,
        marginBottom: 50,
        textAlign: "center",
        lineHeight: 26,
        fontWeight: "500",
    },
    callBtn: {
        backgroundColor: colors.danger,
        paddingVertical: 18,
        paddingHorizontal: 40,
        borderRadius: 30,
        width: "100%",
        alignItems: "center",
        marginBottom: 15,
    },
    callText: {
        color: colors.white,
        fontWeight: "bold",
        fontSize: 20,
    },
    safeBtn: {
        backgroundColor: colors.success,
        paddingVertical: 18,
        paddingHorizontal: 40,
        borderRadius: 30,
        width: "100%",
        alignItems: "center",
        marginBottom: 15,
    },
    safeText: {
        color: colors.white,
        fontWeight: "bold",
        fontSize: 20,
    },
    cancelBtn: {
        backgroundColor: colors.lightText,
        paddingVertical: 18,
        paddingHorizontal: 40,
        borderRadius: 30,
        width: "100%",
        alignItems: "center",
    },
    cancelText: {
        color: colors.white,
        fontWeight: "bold",
        fontSize: 20,
    },
});

