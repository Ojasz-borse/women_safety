import React from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export default function ProfileScreen({ navigation }: any) {

    const user = {
        name: "Ojaswini Borse",
        email: "ojas@gmail.com",
        phone: "9876543210",
        bloodGroup: "B+",
        address: "Virar, Maharashtra",
        image: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
    };

    return (

        <ScrollView style={styles.container}>

            <View style={styles.header}>

                <Image
                    source={{ uri: user.image }}
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
                    <Text style={styles.text}>{user.phone}</Text>
                </View>

                <View style={styles.row}>
                    <MaterialIcons name="favorite" size={22} color={colors.primary} />
                    <Text style={styles.text}>Blood Group: {user.bloodGroup}</Text>
                </View>

                <View style={styles.row}>
                    <MaterialIcons name="location-on" size={22} color={colors.primary} />
                    <Text style={styles.text}>{user.address}</Text>
                </View>

            </View>


            <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate("EditProfile")}
            >

                <Text style={styles.editText}>
                    Edit Profile
                </Text>

            </TouchableOpacity>


            <TouchableOpacity
                style={styles.logoutButton}
                onPress={() => navigation.navigate("Login")}
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
});