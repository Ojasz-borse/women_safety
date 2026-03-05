import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator
} from "react-native";

import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

import { colors } from "../theme/colors";
import { startLocationSharing, updateLocation } from "../services/locationService";

export default function LiveLocationMapScreen({ navigation }: any) {

    const [location, setLocation] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {

        (async () => {

            let { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== "granted") {
                alert("Permission denied");
                return;
            }

            let loc = await Location.getCurrentPositionAsync({});

            setLocation(loc.coords);

        })();

    }, []);

    const handleShareLocation = async () => {
        if (!location) {
            Alert.alert("Error", "Location not available");
            return;
        }

        setLoading(true);
        try {
            // Start location sharing
            await startLocationSharing();
            
            // Update current location
            await updateLocation(location.latitude, location.longitude);
            
            Alert.alert("Success", "Live location sharing started");
            navigation.navigate("LocationSharingStatus");
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to start sharing");
        } finally {
            setLoading(false);
        }
    };

    if (!location) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 10, color: colors.lightText }}>Fetching Location...</Text>
            </View>
        );
    }

    return (

        <View style={styles.container}>

            <MapView
                style={styles.map}
                region={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01
                }}
            >

                <Marker
                    coordinate={{
                        latitude: location.latitude,
                        longitude: location.longitude
                    }}
                    title="Your Location"
                />

            </MapView>

            <TouchableOpacity
                style={styles.shareBtn}
                onPress={handleShareLocation}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color={colors.white} />
                ) : (
                    <Text style={styles.shareText}>
                        Share Live Location
                    </Text>
                )}
            </TouchableOpacity>

        </View>

    );

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    map: {
        flex: 1,
    },
    shareBtn: {
        position: "absolute",
        bottom: 40,
        alignSelf: "center",
        backgroundColor: colors.primary,
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 30,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
        flexDirection: "row",
        alignItems: "center",
    },
    shareText: {
        color: colors.white,
        fontWeight: "bold",
        fontSize: 18,
        letterSpacing: 0.5,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
    },
});