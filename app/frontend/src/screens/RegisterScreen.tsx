import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { MaterialIcons } from "@expo/vector-icons";

import { colors } from "../theme/colors";
import { register, sendOtp } from "../services/authService";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator } from "react-native";

export default function RegisterScreen({ navigation }: any) {

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [bloodGroup, setBloodGroup] = useState("");
    const [address, setAddress] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);


    // Upload Profile Image
    const pickImage = async () => {

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }

    };


    // Search Address Suggestions (FREE API)
    const searchAddress = async (text: string) => {

        setAddress(text);

        if (text.length < 3) {
            setSuggestions([]);
            return;
        }

        try {

            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${text}&format=json&addressdetails=1`
            );

            const data = await response.json();

            setSuggestions(data);

        } catch (error) {

            console.log("Location search error");

        }

    };


    // Get Live Location
    const getLocation = async () => {

        try {

            let { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== "granted") {
                Alert.alert("Permission denied", "Allow location permission");
                return;
            }

            let location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High
            });

            let geo = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });

            if (geo.length > 0) {

                const addr = `${geo[0].name || ""}, ${geo[0].street || ""}, ${geo[0].city || ""}, ${geo[0].region || ""}, ${geo[0].country || ""}`;

                setAddress(addr);
                setSuggestions([]);

            }

        } catch (error) {

            Alert.alert("Error", "Unable to fetch location");

        }

    };


    // Register Button
    const registerUser = async () => {

        if (!name || !phone || !email || !password || !address) {
            Alert.alert("Error", "Please fill all required fields");
            return;
        }

        setLoading(true);
        try {
            const userData = {
                name,
                phoneNumber: phone,
                email,
                password,
                bloodGroup,
                address,
                profilePhoto: image || undefined
            };

            const data = await register(userData);
            await SecureStore.setItemAsync("token", data.token);
            await AsyncStorage.setItem("user", JSON.stringify(data));

            await sendOtp(email);
            Alert.alert("Success", "OTP sent to your email");
            navigation.navigate("OTP", { email });

        } catch (error: any) {
            Alert.alert("Registration Failed", error.message || "An error occurred during registration");
        } finally {
            setLoading(false);
        }

    };



    return (

        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

            <Text style={styles.title}>Create Account</Text>


            {/* Profile Image */}
            <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>

                {image ? (
                    <Image source={{ uri: image }} style={styles.profileImage} />
                ) : (
                    <Text style={styles.imageText}>Upload Photo</Text>
                )}

            </TouchableOpacity>


            {/* Name */}
            <TextInput
                placeholder="Full Name"
                style={styles.input}
                value={name}
                onChangeText={setName}
            />


            {/* Phone */}
            <TextInput
                placeholder="Phone Number"
                keyboardType="phone-pad"
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
            />


            {/* Email */}
            <TextInput
                placeholder="Email"
                keyboardType="email-address"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
            />


            {/* Password */}
            <TextInput
                placeholder="Password"
                secureTextEntry
                style={styles.input}
                value={password}
                onChangeText={setPassword}
            />


            {/* Blood Group */}
            <TextInput
                placeholder="Blood Group (optional)"
                style={styles.input}
                value={bloodGroup}
                onChangeText={setBloodGroup}
            />



            {/* Address Input */}

            <View>

                <View style={styles.locationContainer}>

                    <TextInput
                        placeholder="Enter Address"
                        style={styles.locationInput}
                        value={address}
                        onChangeText={searchAddress}
                    />

                    <TouchableOpacity onPress={getLocation}>

                        <MaterialIcons
                            name="location-on"
                            size={26}
                            color={colors.primary}
                        />

                    </TouchableOpacity>

                </View>


                {/* Address Suggestions */}

                {suggestions.length > 0 && (

                    <View style={styles.suggestionBox}>

                        {suggestions.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => {
                                    setAddress(item.display_name);
                                    setSuggestions([]);
                                }}
                            >

                                <Text style={styles.suggestionText}>
                                    {item.display_name}
                                </Text>

                            </TouchableOpacity>
                        ))}

                    </View>

                )}

            </View>



            {/* Register Button */}
            <TouchableOpacity
                style={styles.button}
                onPress={registerUser}
            >

                <Text style={styles.buttonText}>Register</Text>

            </TouchableOpacity>



            {/* Login Link */}
            <TouchableOpacity
                onPress={() => navigation.navigate("Login")}
            >

                <Text style={styles.loginText}>
                    Already have an account? Login
                </Text>

            </TouchableOpacity>


        </ScrollView>

    );

}



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: 25,
    },
    title: {
        fontSize: 32,
        fontWeight: "800",
        marginTop: 20,
        marginBottom: 30,
        color: colors.primary,
        textAlign: "center",
        letterSpacing: 0.5,
    },
    imageContainer: {
        alignSelf: "center",
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.border,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    imageText: {
        color: colors.lightText,
        fontWeight: "600",
    },
    input: {
        backgroundColor: colors.surface,
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
        fontSize: 16,
        color: colors.text,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    locationContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 15,
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    locationInput: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: colors.text,
    },
    suggestionBox: {
        backgroundColor: colors.surface,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        overflow: "hidden",
    },
    suggestionText: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        fontSize: 15,
        color: colors.text,
    },
    button: {
        backgroundColor: colors.primary,
        padding: 18,
        borderRadius: 14,
        alignItems: "center",
        marginTop: 10,
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
    loginText: {
        textAlign: "center",
        marginTop: 24,
        marginBottom: 40,
        color: colors.lightText,
        fontSize: 15,
        fontWeight: "500",
    },
});