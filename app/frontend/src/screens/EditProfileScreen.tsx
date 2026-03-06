import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Image,
    ScrollView,
    Alert,
    ActivityIndicator
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { MaterialIcons } from "@expo/vector-icons";

import { colors } from "../theme/colors";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { updateProfile } from "../services/userService";

export default function EditProfileScreen({ navigation, route }: any) {

    const { user } = route.params || {};
    const [name, setName] = useState(user?.name || "");
    const [phone, setPhone] = useState(user?.phoneNumber || user?.phone || "");
    const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || "");
    const [address, setAddress] = useState(user?.address || "");
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);


    // Upload new profile photo
    const pickImage = async () => {

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
            allowsEditing: true
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }

    };


    // Fetch live location
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

            }

        } catch (error) {

            Alert.alert("Error", "Unable to fetch location");

        }

    };


    // Save profile changes
    const saveProfile = async () => {

        if (!name.trim()) {
            Alert.alert("Error", "Name is required");
            return;
        }

        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync("token");
            if (!token) {
                navigation.replace("Login");
                return;
            }

            const userData = {
                name: name.trim(),
                phoneNumber: phone.trim(),
                bloodGroup: bloodGroup.trim(),
                address: address.trim(),
                profilePhoto: image
            };

            console.log("Updating profile with:", userData);
            const response = await updateProfile(userData);
            console.log("Profile update response:", response);

            Alert.alert("Success", "Profile updated successfully");
            navigation.goBack();

        } catch (error: any) {
            console.log("Profile update error:", error);
            Alert.alert("Error", error.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }

    };


    return (

        <ScrollView style={styles.container}>

            <Text style={styles.title}>Edit Profile</Text>


            {/* Profile Photo */}
            <TouchableOpacity
                style={styles.imageContainer}
                onPress={pickImage}
            >

                {image || user?.profilePhoto ? (

                    <Image
                        source={{ uri: image || `http://10.79.206.236:3000${user.profilePhoto}` }}
                        style={styles.profileImage}
                    />

                ) : (

                    <View style={styles.placeholder}>
                        <MaterialIcons name="person" size={40} color="#aaa" />
                    </View>

                )}

                <View style={styles.cameraIcon}>
                    <MaterialIcons name="camera-alt" size={20} color="white" />
                </View>

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


            {/* Blood Group */}
            <TextInput
                placeholder="Blood Group"
                style={styles.input}
                value={bloodGroup}
                onChangeText={setBloodGroup}
            />


            {/* Address */}
            <View style={styles.locationContainer}>

                <TextInput
                    placeholder="Address"
                    style={styles.locationInput}
                    value={address}
                    onChangeText={setAddress}
                />

                <TouchableOpacity onPress={getLocation}>

                    <MaterialIcons
                        name="location-on"
                        size={26}
                        color={colors.primary}
                    />

                </TouchableOpacity>

            </View>



            {/* Save Button */}
            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={saveProfile}
                disabled={loading}
            >

                {loading ? (
                    <ActivityIndicator color={colors.white} />
                ) : (
                    <Text style={styles.buttonText}>
                        Save Changes
                    </Text>
                )}

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
        marginBottom: 30,
        marginTop: 10,
        color: colors.primary,
        textAlign: "center",
        letterSpacing: 0.5,
    },
    imageContainer: {
        alignSelf: "center",
        marginBottom: 35,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        position: "relative",
    },
    profileImage: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 4,
        borderColor: colors.white,
    },
    placeholder: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: colors.surface,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 4,
        borderColor: colors.border,
    },
    cameraIcon: {
        position: "absolute",
        bottom: 5,
        right: 5,
        backgroundColor: colors.primary,
        padding: 8,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: colors.white,
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
        marginBottom: 30,
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
    button: {
        backgroundColor: colors.primary,
        padding: 18,
        borderRadius: 16,
        alignItems: "center",
        marginBottom: 40,
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
});