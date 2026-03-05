import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity
} from "react-native";

import * as Contacts from "expo-contacts";

import { colors } from "../theme/colors";

export default function ContactPermissionsScreen() {

    const requestPermission = async () => {

        const { status } = await Contacts.requestPermissionsAsync();

        if (status === "granted") {
            alert("Permission Granted");
        } else {
            alert("Permission Denied");
        }

    };

    return (

        <View style={styles.container}>

            <Text style={styles.title}>
                Allow Access To Contacts
            </Text>

            <TouchableOpacity
                style={styles.button}
                onPress={requestPermission}
            >

                <Text style={styles.text}>
                    Allow Contacts
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
        backgroundColor: colors.primary,
        paddingVertical: 18,
        paddingHorizontal: 40,
        borderRadius: 30,
        width: "100%",
        alignItems: "center",
        shadowColor: colors.primary,
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