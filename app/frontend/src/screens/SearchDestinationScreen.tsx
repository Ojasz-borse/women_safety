import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity
} from "react-native";

import { colors } from "../theme/colors";

export default function SearchDestinationScreen({ navigation }: any) {

    const [destination, setDestination] = useState("");

    const searchRoute = () => {

        if (!destination) return;

        navigation.navigate("SafeRouteMap", { destination });

    };

    return (

        <View style={styles.container}>

            <Text style={styles.title}>
                Search Destination
            </Text>

            <TextInput
                placeholder="Enter destination"
                style={styles.input}
                value={destination}
                onChangeText={setDestination}
            />

            <TouchableOpacity
                style={styles.button}
                onPress={searchRoute}
            >

                <Text style={styles.buttonText}>
                    Find Safe Route
                </Text>

            </TouchableOpacity>

        </View>

    );

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 25,
        backgroundColor: colors.background,
    },
    title: {
        fontSize: 32,
        fontWeight: "800",
        color: colors.primary,
        marginBottom: 24,
        textAlign: "center",
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: colors.surface,
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 24,
        fontSize: 16,
        color: colors.text,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    button: {
        backgroundColor: colors.primary,
        padding: 18,
        borderRadius: 14,
        alignItems: "center",
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        color: colors.white,
        fontWeight: "bold",
        fontSize: 18,
        letterSpacing: 0.5,
    },
});