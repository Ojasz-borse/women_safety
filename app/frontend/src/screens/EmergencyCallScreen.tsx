import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Linking
} from "react-native";

import { colors } from "../theme/colors";

export default function EmergencyCallScreen() {

    const callPolice = () => {
        Linking.openURL("tel:112");
    };

    return (

        <View style={styles.container}>

            <Text style={styles.title}>
                Emergency Call
            </Text>

            <TouchableOpacity
                style={styles.callBtn}
                onPress={callPolice}
            >

                <Text style={styles.text}>
                    Call Police (112)
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
    title: {
        fontSize: 32,
        fontWeight: "800",
        color: colors.text,
        marginBottom: 40,
        letterSpacing: 0.5,
    },
    callBtn: {
        backgroundColor: colors.danger,
        paddingVertical: 20,
        borderRadius: 16,
        width: "100%",
        alignItems: "center",
        shadowColor: colors.danger,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    text: {
        color: colors.white,
        fontSize: 20,
        fontWeight: "bold",
        letterSpacing: 0.5,
    },
});