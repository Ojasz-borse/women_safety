import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    RefreshControl
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getProfile } from "../services/userService";
import { useFocusEffect } from "@react-navigation/native";

export default function ProfileScreen({ navigation }: any) {

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchProfile = async () => {
        try {
            const token = await SecureStore.getItemAsync("token");
            if (!token) {
                navigation.replace("Login");
                return;
            }
            const profile = await getProfile();
            setUser(profile);
        } catch (error: any) {
            if (error.status === 401) {
                Alert.alert("Session Expired", "Please login again");
                await SecureStore.deleteItemAsync("token");
                navigation.replace("Login");
            } else {
                Alert.alert("Error", error.message || "Failed to fetch profile");
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchProfile();
    };

    const handleLogout = async () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout",
                style: "destructive",
                onPress: async () => {
                    await SecureStore.deleteItemAsync("token");
                    await AsyncStorage.removeItem("user");
                    navigation.replace("Login");
                },
            },
        ]);
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!user) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Unable to load profile</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (

        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
            }
        >

            <View style={styles.header}>

                <Image
                    source={{ uri: user.profilePhoto ? `http://10.79.206.236:3000${user.profilePhoto}` : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }}
                    style={styles.profileImage}
                />

                <Text style={styles.name}>{user.name}</Text>

            </View>


            <View style={styles.card}>

                <View style={styles.row}>
                    <MaterialIcons name="email" size={22} color={colors.primary} />
                    <Text style={styles.text}>{user.email}</Text>
                </View>

                <View style={styles.row}>
                    <MaterialIcons name="phone" size={22} color={colors.primary} />
                    <Text style={styles.text}>{user.phoneNumber || user.phone || "Not added"}</Text>
                </View>

                {user.bloodGroup && (
                    <View style={styles.row}>
                        <MaterialIcons name="favorite" size={22} color={colors.primary} />
                        <Text style={styles.text}>Blood Group: {user.bloodGroup}</Text>
                    </View>
                )}

                {user.address && (
                    <View style={styles.row}>
                        <MaterialIcons name="location-on" size={22} color={colors.primary} />
                        <Text style={styles.text}>{user.address}</Text>
                    </View>
                )}

            </View>


            <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate("EditProfile", { user })}
            >

                <Text style={styles.editText}>
                    Edit Profile
                </Text>

            </TouchableOpacity>


            <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
            >

                <Text style={styles.logoutText}>
                    Logout
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
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
    },
    header: {
        alignItems: "center",
        marginBottom: 35,
        marginTop: 10,
    },
    profileImage: {
        width: 140,
        height: 140,
        borderRadius: 70,
        marginBottom: 16,
        borderWidth: 4,
        borderColor: colors.white,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    name: {
        fontSize: 26,
        fontWeight: "800",
        color: colors.primary,
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 24,
        marginBottom: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 4,
        borderWidth: 1,
        borderColor: colors.border,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    text: {
        marginLeft: 15,
        fontSize: 16,
        color: colors.text,
        fontWeight: "500",
    },
    editButton: {
        backgroundColor: colors.primary,
        padding: 18,
        borderRadius: 16,
        alignItems: "center",
        marginBottom: 16,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    editText: {
        color: colors.white,
        fontWeight: "bold",
        fontSize: 18,
        letterSpacing: 0.5,
    },
    logoutButton: {
        backgroundColor: colors.surface,
        padding: 18,
        borderRadius: 16,
        alignItems: "center",
        borderWidth: 2,
        borderColor: colors.border,
        marginBottom: 40,
    },
    logoutText: {
        color: colors.danger,
        fontWeight: "bold",
        fontSize: 18,
        letterSpacing: 0.5,
    },
    errorText: {
        fontSize: 18,
        color: colors.lightText,
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 10,
    },
    retryText: {
        color: colors.white,
        fontWeight: "bold",
    }
});