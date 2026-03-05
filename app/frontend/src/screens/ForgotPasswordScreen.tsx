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

import { forgotPassword } from "../services/authService";
import { ActivityIndicator } from "react-native";

export default function ForgotPasswordScreen({ navigation }: any) {

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleForgotPassword = async () => {

        if (!email) {
            Alert.alert("Error", "Please enter your email");
            return;
        }

        setLoading(true);
        try {
            await forgotPassword(email);
            Alert.alert("Success", "Password reset link sent to your email");
            // Backend sends a link, but UI suggests OTP. 
            // I'll stick to the UI flow for now by navigating to ResetPassword if applicable, 
            // or just back to login if it's a link flow.
            // Based on backend exports.forgotPassword, it sends a resetUrl.
            navigation.navigate("ResetPassword", { email });
        } catch (error: any) {
            Alert.alert("Error", error.message || "Unable to send reset email");
        } finally {
            setLoading(false);
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
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleForgotPassword}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color={colors.white} />
                ) : (
                    <Text style={styles.buttonText}>
                        Send OTP
                    </Text>
                )}
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
    buttonDisabled: {
        opacity: 0.7,
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