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

import { verifyOtp, resetPassword } from "../services/authService";
import { ActivityIndicator } from "react-native";

export default function ResetPasswordScreen({ navigation, route }: any) {

    const { email } = route.params || {};

    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleResetPassword = async () => {

        if (!otp || !password || !confirmPassword) {
            Alert.alert("Error", "Please fill all fields");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            // Step 1: Verify OTP
            await verifyOtp(email, otp);

            // Step 2: Reset Password
            await resetPassword(password);

            Alert.alert("Success", "Password reset successful");
            navigation.navigate("Login");

        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }

    };


    return (

        <View style={styles.container}>

            <Text style={styles.title}>
                Reset Password
            </Text>

            <Text style={styles.subtitle}>
                Enter the OTP sent to your email and create a new password
            </Text>


            <TextInput
                placeholder="Enter OTP"
                keyboardType="number-pad"
                style={styles.input}
                value={otp}
                onChangeText={setOtp}
            />


            <TextInput
                placeholder="New Password"
                secureTextEntry
                style={styles.input}
                value={password}
                onChangeText={setPassword}
            />


            <TextInput
                placeholder="Confirm Password"
                secureTextEntry
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
            />


            <TouchableOpacity
                style={[styles.button, (loading || !otp || !password || !confirmPassword) && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color={colors.white} />
                ) : (
                    <Text style={styles.buttonText}>
                        Reset Password
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
        marginBottom: 16,
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
        marginTop: 8,
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