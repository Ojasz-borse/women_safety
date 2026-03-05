import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity
} from "react-native";

import { colors } from "../theme/colors";

export default function SOSActivatedScreen({ navigation }: any) {

    return (

        <View style={styles.container}>

            <Text style={styles.alert}>
                🚨 SOS Alert Sent
            </Text>

            <Text style={styles.info}>
                Your emergency contacts have been notified
            </Text>

            <TouchableOpacity
                style={styles.callBtn}
                onPress={() => navigation.navigate("EmergencyCall")}
            >

                <Text style={styles.callText}>
                    Call Emergency
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
        shadowColor: colors.danger,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
        width: "100%",
        alignItems: "center",
    },
    callText: {
        color: colors.white,
        fontWeight: "bold",
        fontSize: 20,
        letterSpacing: 0.5,
    },
});