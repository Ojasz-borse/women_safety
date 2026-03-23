import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Alert, StatusBar, ActivityIndicator, Platform } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import apiClient from "../services/apiClient";

// Decode Google Maps encoded polyline
function decodePolyline(encoded: string) {
    const points: { latitude: number; longitude: number }[] = [];
    let index = 0, lat = 0, lng = 0;
    while (index < encoded.length) {
        let b, shift = 0, result = 0;
        do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
        lat += (result & 1) ? ~(result >> 1) : (result >> 1);
        shift = 0; result = 0;
        do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
        lng += (result & 1) ? ~(result >> 1) : (result >> 1);
        points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
}

export default function SafeRouteMapScreen({ route, navigation }: any) {
    const { destination } = route.params;
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [destLocation, setDestLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
    const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSafe, setIsSafe] = useState<boolean | null>(null);

    useEffect(() => {
        initRoute();
    }, []);

    const initRoute = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") { Alert.alert("Error", "Location permission required"); navigation.goBack(); return; }

            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const origin = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
            setUserLocation(origin);

            // Geocode destination
            const geocode = await Location.geocodeAsync(destination);
            if (!geocode.length) {
                Alert.alert("Not Found", `Could not find "${destination}". Try a more specific address.`);
                setLoading(false);
                return;
            }
            const dest = { latitude: geocode[0].latitude, longitude: geocode[0].longitude };
            setDestLocation(dest);

            // Get directions from Google Directions API via backend or direct
            await fetchRoute(origin, dest);

            // Check route safety against risk zones
            try {
                const safetyRes = await apiClient.post("/routes/safe", { origin: `${origin.latitude},${origin.longitude}`, destination: `${dest.latitude},${dest.longitude}` });
                if (safetyRes.data) setIsSafe(safetyRes.data.isSafe);
            } catch { setIsSafe(null); }

        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to load route");
        } finally {
            setLoading(false);
        }
    };

    const fetchRoute = async (origin: { latitude: number; longitude: number }, dest: { latitude: number; longitude: number }) => {
        try {
            // Try using backend proxy first
            const response = await apiClient.get("/routes/directions", {
                params: {
                    origin: `${origin.latitude},${origin.longitude}`,
                    destination: `${dest.latitude},${dest.longitude}`,
                },
            });
            if (response.data?.routes?.length > 0) {
                const route = response.data.routes[0];
                const points = decodePolyline(route.overview_polyline.points);
                setRouteCoords(points);
                const leg = route.legs[0];
                setRouteInfo({ distance: leg.distance.text, duration: leg.duration.text });
                return;
            }
        } catch { }

        // Fallback: create a straight line
        setRouteCoords([origin, dest]);
        // Calculate rough distance
        const R = 6371;
        const dLat = (dest.latitude - origin.latitude) * Math.PI / 180;
        const dLng = (dest.longitude - origin.longitude) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(origin.latitude * Math.PI / 180) * Math.cos(dest.latitude * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        setRouteInfo({ distance: `${d.toFixed(1)} km`, duration: `~${Math.ceil(d * 12)} min` });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="light-content" />
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Finding safe route to {destination}...</Text>
            </View>
        );
    }

    if (!userLocation) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="light-content" />
                <Text style={styles.loadingText}>Unable to get location</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retryBtn}>
                    <Text style={styles.retryText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const region = destLocation ? {
        latitude: (userLocation.latitude + destLocation.latitude) / 2,
        longitude: (userLocation.longitude + destLocation.longitude) / 2,
        latitudeDelta: Math.abs(userLocation.latitude - destLocation.latitude) * 1.5 + 0.01,
        longitudeDelta: Math.abs(userLocation.longitude - destLocation.longitude) * 1.5 + 0.01,
    } : {
        latitude: userLocation.latitude, longitude: userLocation.longitude,
        latitudeDelta: 0.02, longitudeDelta: 0.02,
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <MapView style={styles.map} initialRegion={region} provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}>
                {/* Current Location */}
                <Marker coordinate={userLocation} title="Your Location" pinColor="#10B981">
                    <View style={styles.markerPin}>
                        <MaterialIcons name="my-location" size={18} color={colors.white} />
                    </View>
                </Marker>

                {/* Destination */}
                {destLocation && (
                    <Marker coordinate={destLocation} title={destination} pinColor="#EF4444">
                        <View style={[styles.markerPin, { backgroundColor: colors.danger }]}>
                            <MaterialIcons name="place" size={18} color={colors.white} />
                        </View>
                    </Marker>
                )}

                {/* Route Line */}
                {routeCoords.length > 0 && (
                    <Polyline
                        coordinates={routeCoords}
                        strokeWidth={5}
                        strokeColor={isSafe === false ? "#EF4444" : "#3B82F6"}
                        lineCap="round"
                        lineJoin="round"
                    />
                )}
            </MapView>

            {/* Header Overlay */}
            <View style={styles.headerOverlay}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.destBadge}>
                    <MaterialIcons name="place" size={16} color={colors.danger} />
                    <Text style={styles.destText} numberOfLines={1}>{destination}</Text>
                </View>
            </View>

            {/* Route Info */}
            {routeInfo && (
                <View style={styles.infoOverlay}>
                    {isSafe !== null && (
                        <View style={[styles.safetyBadge, { backgroundColor: isSafe ? colors.success + "20" : colors.danger + "20" }]}>
                            <MaterialIcons name={isSafe ? "check-circle" : "warning"} size={18} color={isSafe ? colors.success : colors.danger} />
                            <Text style={[styles.safetyText, { color: isSafe ? colors.success : colors.danger }]}>
                                {isSafe ? "Safe Route" : "Passes through risky areas"}
                            </Text>
                        </View>
                    )}
                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <MaterialIcons name="straighten" size={18} color={colors.info} />
                            <Text style={styles.infoValue}>{routeInfo.distance}</Text>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoItem}>
                            <MaterialIcons name="schedule" size={18} color={colors.warning} />
                            <Text style={styles.infoValue}>{routeInfo.duration}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => navigation.navigate("WalkWithMe")}
                        style={styles.walkBtn}
                    >
                        <MaterialIcons name="directions-walk" size={18} color={colors.walkWithMe} />
                        <Text style={styles.walkBtnText}>Start Walk With Me</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
    loadingText: { color: colors.textSecondary, fontSize: 15, marginTop: 16, fontWeight: "600" },
    retryBtn: { marginTop: 16, paddingVertical: 10, paddingHorizontal: 24, backgroundColor: colors.primary, borderRadius: 12 },
    retryText: { color: colors.white, fontWeight: "700" },

    headerOverlay: { position: "absolute", top: 50, left: 16, right: 16, flexDirection: "row", alignItems: "center", gap: 10 },
    backBtn: { padding: 10, borderRadius: 14, backgroundColor: colors.surface, elevation: 5, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8 },
    destBadge: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.surface, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, elevation: 5, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8 },
    destText: { fontSize: 14, fontWeight: "700", color: colors.text, flex: 1 },

    markerPin: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.success, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: colors.white },

    infoOverlay: { position: "absolute", bottom: 30, left: 16, right: 16, backgroundColor: colors.surface, borderRadius: 20, padding: 18, elevation: 10, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 15, borderWidth: 1, borderColor: colors.border },
    safetyBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, alignSelf: "flex-start", marginBottom: 12 },
    safetyText: { fontSize: 12, fontWeight: "700" },
    infoRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16 },
    infoItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    infoValue: { fontSize: 18, fontWeight: "800", color: colors.text },
    infoDivider: { width: 1, height: 24, backgroundColor: colors.border },

    walkBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.walkWithMe + "15" },
    walkBtnText: { fontSize: 14, fontWeight: "700", color: colors.walkWithMe },
});