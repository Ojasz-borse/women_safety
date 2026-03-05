import React, { useEffect, useState } from "react";
import {
    View,
    StyleSheet,
    Text
} from "react-native";

import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";

import { colors } from "../theme/colors";

export default function SafeRouteMapScreen({ route, navigation }: any) {

    const { destination } = route.params;

    const [location, setLocation] = useState<any>(null);

    useEffect(() => {

        (async () => {

            let { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== "granted") {
                return;
            }

            let loc = await Location.getCurrentPositionAsync({});

            setLocation(loc.coords);

        })();

    }, []);

    if (!location) {

        return (
            <View style={styles.center}>
                <Text>Loading Map...</Text>
            </View>
        );

    }

    return (

        <View style={styles.container}>

            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02
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
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
    },
});