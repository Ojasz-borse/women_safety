import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator
} from "react-native";

import { colors } from "../theme/colors";
import { stopLocationSharing } from "../services/locationService";

export default function LocationSharingStatusScreen({ navigation }: any) {
    const [loading, setLoading] = useState(false);

    const handleStopSharing = async () => {
        Alert.alert(
            "Stop Location Sharing",
            "Are you sure you want to stop sharing your location?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Stop Sharing",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await stopLocationSharing();
                            Alert.alert("Success", "Location sharing stopped");
                            navigation.goBack();
                        } catch (error: any) {
                            Alert.alert("Error", error.message || "Failed to stop sharing");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    return (

        <View style={styles.container}>

            <Text style={styles.title}>
                📍 Location Sharing Active
            </Text>

            <Text style={styles.subtitle}>
                Your emergency contacts can track your location.
            </Text>

            <TouchableOpacity
                style={[styles.stopBtn, loading && styles.stopBtnDisabled]}
                onPress={handleStopSharing}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color={colors.white} />
                ) : (
                    <Text style={styles.stopText}>
                        Stop Sharing
                    </Text>
                )}
            </TouchableOpacity>

        </View>

    );

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 30,
        backgroundColor: colors.background,
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: colors.success,
        marginBottom: 16,
        textAlign: "center",
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 16,
        color: colors.text,
        textAlign: "center",
        marginBottom: 40,
        lineHeight: 24,
        fontWeight: "500",
    },
    stopBtn: {
        backgroundColor: colors.danger,
        paddingVertical: 18,
        paddingHorizontal: 40,
        borderRadius: 30,
        shadowColor: colors.danger,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
        width: "100%",
        alignItems: "center",
    },
    stopBtnDisabled: {
        opacity: 0.7,
    },
    stopText: {
        color: colors.white,
        fontWeight: "bold",
        fontSize: 18,
        letterSpacing: 0.5,
    },
});