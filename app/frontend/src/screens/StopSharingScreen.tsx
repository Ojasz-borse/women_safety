import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity
} from "react-native";

import { colors } from "../theme/colors";

export default function StopSharingScreen({ navigation }: any) {

    return (

        <View style={styles.container}>

            <Text style={styles.title}>
                Location Sharing Stopped
            </Text>

            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate("HomeDashboard")}
            >

                <Text style={styles.text}>
                    Back To Dashboard
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
        padding: 30,
        backgroundColor: colors.background,
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: colors.text,
        marginBottom: 40,
        textAlign: "center",
        letterSpacing: 0.5,
    },
    button: {
        backgroundColor: colors.success,
        paddingVertical: 18,
        paddingHorizontal: 40,
        borderRadius: 30,
        width: "100%",
        alignItems: "center",
        shadowColor: colors.success,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    text: {
        color: colors.white,
        fontWeight: "bold",
        fontSize: 18,
        letterSpacing: 0.5,
    },
});