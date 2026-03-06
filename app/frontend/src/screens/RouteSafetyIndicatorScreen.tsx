import React from "react";
import {
    View,
    Text,
    StyleSheet
} from "react-native";

import { colors } from "../theme/colors";

export default function RouteSafetyIndicatorScreen() {

    const safetyScore = 80;

    return (

        <View style={styles.container}>

            <Text style={styles.title}>
                Route Safety Score
            </Text>

            <Text style={styles.score}>
                {safetyScore}%
            </Text>

            <Text style={styles.safeText}>
                Safe Route Recommended
            </Text>

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
        color: colors.text,
        marginBottom: 30,
        letterSpacing: 0.5,
    },
    score: {
        fontSize: 90,
        color: colors.success,
        fontWeight: "900",
        textShadowColor: "rgba(16, 185, 129, 0.3)",
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
        marginBottom: 20,
    },
    safeText: {
        fontSize: 20,
        color: colors.lightText,
        fontWeight: "600",
    },
});