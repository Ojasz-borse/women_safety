import React, { useRef, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Keyboard
} from "react-native";

import { colors } from "../theme/colors";

export default function OTPScreen({ navigation }: any) {

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);

    const inputs = useRef<(TextInput | null)[]>([]);

    const handleChange = (text: string, index: number) => {

        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        if (text && index < 5) {
            inputs.current[index + 1]?.focus();
        }

    };

    const handleBackspace = (key: string, index: number) => {

        if (key === "Backspace" && index > 0 && !otp[index]) {
            inputs.current[index - 1]?.focus();
        }

    };

    const verifyOTP = () => {

        const enteredOTP = otp.join("");

        if (enteredOTP.length !== 6) {
            alert("Enter valid OTP");
            return;
        }

        Keyboard.dismiss();

        console.log("OTP:", enteredOTP);

        navigation.replace("HomeDashboard");
    };

    return (

        <View style={styles.container}>

            <Text style={styles.title}>OTP Verification</Text>

            <Text style={styles.subtitle}>
                Enter the 6 digit code sent to your email
            </Text>

            <View style={styles.otpContainer}>

                {otp.map((digit, index) => (
                    <TextInput
                        key={index}
                        style={styles.otpInput}
                        keyboardType="number-pad"
                        maxLength={1}
                        value={digit}

                        ref={(ref) => {
                            inputs.current[index] = ref;
                        }}

                        onChangeText={(text) => handleChange(text, index)}

                        onKeyPress={({ nativeEvent }) => {
                            handleBackspace(nativeEvent.key, index)
                        }}

                    />
                ))}

            </View>

            <TouchableOpacity
                style={styles.button}
                onPress={verifyOTP}
            >

                <Text style={styles.buttonText}>
                    Verify OTP
                </Text>

            </TouchableOpacity>

            <TouchableOpacity>

                <Text style={styles.resend}>
                    Resend OTP
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
        letterSpacing: 0.5,
    },
    subtitle: {
        textAlign: "center",
        marginTop: 12,
        marginBottom: 40,
        color: colors.lightText,
        fontSize: 16,
        lineHeight: 24,
    },
    otpContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 40,
        paddingHorizontal: 10,
    },
    otpInput: {
        width: 50,
        height: 60,
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        textAlign: "center",
        fontSize: 24,
        color: colors.primary,
        fontWeight: "700",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
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
    resend: {
        marginTop: 24,
        textAlign: "center",
        color: colors.secondary,
        fontSize: 15,
        fontWeight: "600",
    },
});