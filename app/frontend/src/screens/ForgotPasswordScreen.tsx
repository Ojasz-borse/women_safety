import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert
} from "react-native";

import { colors } from "../theme/colors";

export default function ForgotPasswordScreen({ navigation }: any) {

    const [email, setEmail] = useState("");

    const sendResetOTP = async () => {

        if (!email) {
            Alert.alert("Error", "Please enter your email");
            return;
        }

        try {

            // Later connect to backend
            console.log("Send reset OTP to:", email);

            // Example API call
            // await axios.post("/api/auth/forgot-password",{email})

            Alert.alert("Success", "OTP sent to your email");

            navigation.navigate("ResetPassword", { email });

        } catch (error) {

            Alert.alert("Error", "Unable to send reset email");

        }

    };


    return (

        <View style={styles.container}>

            <Text style={styles.title}>
                Forgot Password
            </Text>

            <Text style={styles.subtitle}>
                Enter your registered email to receive an OTP to reset your password
            </Text>


            <TextInput
                placeholder="Enter your email"
                keyboardType="email-address"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
            />


            <TouchableOpacity
                style={styles.button}
                onPress={sendResetOTP}
            >

                <Text style={styles.buttonText}>
                    Send OTP
                </Text>

            </TouchableOpacity>


            <TouchableOpacity
                onPress={() => navigation.navigate("Login")}
            >

                <Text style={styles.back}>
                    Back to Login
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
        textAlign: "center",
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    subtitle: {
        textAlign: "center",
        color: colors.lightText,
        marginBottom: 40,
        fontSize: 16,
        lineHeight: 24,
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
    back: {
        marginTop: 24,
        textAlign: "center",
        color: colors.secondary,
        fontSize: 15,
        fontWeight: "600",
    },
});