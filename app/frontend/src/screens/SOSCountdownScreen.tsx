import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity
} from "react-native";

import { colors } from "../theme/colors";

export default function SOSCountdownScreen({ navigation }: any) {

    const [count, setCount] = useState(5);

    useEffect(() => {

        if (count === 0) {
            navigation.replace("SOSActivated");
            return;
        }

        const timer = setTimeout(() => {
            setCount(count - 1);
        }, 1000);

        return () => clearTimeout(timer);

    }, [count]);


    return (

        <View style={styles.container}>

            <Text style={styles.text}>
                SOS Triggering In
            </Text>

            <Text style={styles.count}>
                {count}
            </Text>

            <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => navigation.goBack()}
            >

                <Text style={styles.cancelText}>
                    Cancel
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
    },
    text: {
        fontSize: 24,
        fontWeight: "700",
        color: colors.text,
        marginBottom: 20,
        letterSpacing: 0.5,
    },
    count: {
        fontSize: 120,
        color: colors.danger,
        fontWeight: "900",
        textShadowColor: "rgba(239, 68, 68, 0.4)",
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
    },
    cancelBtn: {
        marginTop: 60,
        paddingVertical: 18,
        paddingHorizontal: 40,
        backgroundColor: colors.surface,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
    },
    cancelText: {
        color: colors.text,
        fontSize: 18,
        fontWeight: "bold",
        letterSpacing: 0.5,
    },
});